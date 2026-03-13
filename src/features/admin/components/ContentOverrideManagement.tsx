import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Pencil, RotateCcw, ChevronDown, ChevronRight, AlertTriangle, Trash2, History, Clock } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, getDocs, collection, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import type { ContentOverride } from '../../../lib/content/mergeOverrides';
import type { RequirementCategory, QuestionImportance } from '../../../types';
import { inferImportance } from '../../../utils/quickMode';
import { AdminPageHeader, BusyOverlay } from '../shared';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { ContentEditForm } from './content/ContentEditForm';
import { ChangeHistoryModal } from './content/ChangeHistoryModal';
import { splitRef, joinRef, type EditingState } from './content/types';

const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  SETUP: '시험 준비',
  EXECUTION: '시험 수행',
  COMPLETION: '시험 종료',
};

const CATEGORY_ORDER: RequirementCategory[] = ['SETUP', 'EXECUTION', 'COMPLETION'];

const formatOverrideTime = (val: unknown): string => {
  if (!val) return '';
  if (val instanceof Timestamp) {
    const d = val.toDate();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${min}`;
  }
  return '';
};

export function ContentOverrideManagement() {
  const [overrides, setOverrides] = useState<Record<string, ContentOverride>>({});
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetAllConfirm, setResetAllConfirm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<RequirementCategory>>(
    new Set(CATEGORY_ORDER),
  );
  const [docMaterialsList, setDocMaterialsList] = useState<Array<{ label: string; linkedSteps: string[] }>>([]);
  const [historyTarget, setHistoryTarget] = useState<{ reqId: string; title: string } | null>(null);
  const [refDropdownIdx, setRefDropdownIdx] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to Firestore contentOverrides
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'contentOverrides'), (snap) => {
      const result: Record<string, ContentOverride> = {};
      snap.forEach((d) => {
        result[d.id] = d.data() as ContentOverride;
      });
      setOverrides(result);
    });
    return () => unsub();
  }, []);

  // Subscribe to Firestore docMaterials (full objects for grouping)
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'docMaterials'), (snap) => {
      const items: Array<{ label: string; linkedSteps: string[] }> = [];
      snap.forEach((d) => {
        const data = d.data() as { label?: string; linkedSteps?: string[] };
        if (data.label) items.push({ label: data.label, linkedSteps: data.linkedSteps ?? [] });
      });
      setDocMaterialsList(items);
    });
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (refDropdownIdx === null) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRefDropdownIdx(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [refDropdownIdx]);

  /** Group materials by category (markdown + Firestore merged) */
  const groupedMaterials = useMemo(() => {
    const labelSteps = new Map<string, Set<string>>();
    for (const req of REQUIREMENTS_DB) {
      for (const d of req.requiredDocs ?? []) {
        if (!labelSteps.has(d.label)) labelSteps.set(d.label, new Set());
        labelSteps.get(d.label)!.add(req.id);
      }
    }
    for (const mat of docMaterialsList) {
      if (!labelSteps.has(mat.label)) labelSteps.set(mat.label, new Set());
      for (const step of mat.linkedSteps) labelSteps.get(mat.label)!.add(step);
    }

    const groupOrder = ['시험 준비', '시험 수행', '시험 종료', '기타'] as const;
    const groups: Record<string, string[]> = {};
    for (const g of groupOrder) groups[g] = [];

    for (const [label, steps] of labelSteps) {
      let category = '기타';
      for (const step of steps) {
        if (step.startsWith('SETUP')) { category = '시험 준비'; break; }
        if (step.startsWith('EXEC')) { category = '시험 수행'; break; }
        if (step.startsWith('COMP')) { category = '시험 종료'; break; }
      }
      groups[category].push(label);
    }

    for (const g of groupOrder) groups[g].sort();
    return groupOrder.map((name) => ({ name, labels: groups[name] })).filter((g) => g.labels.length > 0);
  }, [docMaterialsList]);

  const addBranchingRule = useCallback(() => {
    setEditing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        branchingRules: [
          ...prev.branchingRules,
          { sourceIndex: 0, triggerAnswer: 'NO' as const, skipIndices: [] },
        ],
      };
    });
  }, []);

  const removeBranchingRule = useCallback((ruleIdx: number) => {
    setEditing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        branchingRules: prev.branchingRules.filter((_, i) => i !== ruleIdx),
      };
    });
  }, []);

  const updateBranchingSource = useCallback((ruleIdx: number, sourceIndex: number) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const rules = [...prev.branchingRules];
      rules[ruleIdx] = {
        ...rules[ruleIdx],
        sourceIndex,
        skipIndices: rules[ruleIdx].skipIndices.filter((i) => i > sourceIndex),
      };
      return { ...prev, branchingRules: rules };
    });
  }, []);

  const toggleSkipIndex = useCallback((ruleIdx: number, targetIdx: number) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const rules = [...prev.branchingRules];
      const current = rules[ruleIdx].skipIndices;
      rules[ruleIdx] = {
        ...rules[ruleIdx],
        skipIndices: current.includes(targetIdx)
          ? current.filter((i) => i !== targetIdx)
          : [...current, targetIdx].sort((a, b) => a - b),
      };
      return { ...prev, branchingRules: rules };
    });
  }, []);

  const toggleRef = useCallback((cpIdx: number, label: string) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const current = prev.checkpointRefs[cpIdx] ?? [];
      const next = current.includes(label)
        ? current.filter((r) => r !== label)
        : [...current, label];
      return { ...prev, checkpointRefs: { ...prev.checkpointRefs, [cpIdx]: next } };
    });
  }, []);

  const grouped = useMemo(() => {
    const map: Record<RequirementCategory, typeof REQUIREMENTS_DB> = {
      SETUP: [],
      EXECUTION: [],
      COMPLETION: [],
    };
    for (const req of REQUIREMENTS_DB) {
      map[req.category as RequirementCategory].push(req);
    }
    return map;
  }, []);

  const overrideCount = Object.keys(overrides).length;

  const toggleCategory = (cat: RequirementCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleEditStart = (reqId: string) => {
    const req = REQUIREMENTS_DB.find((r) => r.id === reqId);
    if (!req) return;
    const ov = overrides[reqId];
    const cpEntries = (req.checkPoints ?? []).map((cp: string, i: number) => {
      const full = ov?.checkpoints?.[i] ?? cp;
      const { body, refs } = splitRef(full);
      return { i, body, refs };
    });
    const cpImportances: Record<number, QuestionImportance> = {};
    (req.checkPoints ?? []).forEach((cp: string, i: number) => {
      const ovText = ov?.checkpoints?.[i] ?? cp;
      cpImportances[i] = ov?.checkpointImportances?.[i] ?? inferImportance(ovText);
    });

    setEditing({
      reqId,
      title: ov?.title ?? req.title,
      description: ov?.description ?? req.description,
      checkpoints: Object.fromEntries(cpEntries.map(({ i, body }: { i: number; body: string; refs: string[] }) => [i, body])),
      checkpointRefs: Object.fromEntries(cpEntries.map(({ i, refs }: { i: number; body: string; refs: string[] }) => [i, refs])),
      checkpointImportances: cpImportances,
      checkpointDetails: ov?.checkpointDetails ?? {},
      evidenceExamples: ov?.evidenceExamples ?? req.evidenceExamples ?? [],
      testSuggestions: ov?.testSuggestions ?? req.testSuggestions ?? [],
      passCriteria: ov?.passCriteria ?? req.passCriteria ?? '',
      branchingRules: ov?.branchingRules ?? [],
    });
  };

  const handleSave = async () => {
    if (!editing || !db) return;
    const req = REQUIREMENTS_DB.find((r) => r.id === editing.reqId);
    if (!req) return;

    const patch: ContentOverride = { updatedAt: serverTimestamp(), updatedBy: 'admin' };
    if (editing.title !== req.title) patch.title = editing.title;
    if (editing.description !== req.description) patch.description = editing.description;

    const cpDiffs: Record<number, string> = {};
    for (const [iStr, editedBody] of Object.entries(editing.checkpoints)) {
      const i = Number(iStr);
      const origFull = req.checkPoints?.[i] ?? '';
      const { body: origBody, refs: origRefs } = splitRef(origFull);
      const editedRefs = editing.checkpointRefs[i] ?? [];
      const bodyChanged = editedBody !== origBody;
      const refsChanged = JSON.stringify(editedRefs) !== JSON.stringify(origRefs);
      if (bodyChanged || refsChanged) {
        cpDiffs[i] = joinRef(editedBody, editedRefs);
      }
    }
    if (Object.keys(cpDiffs).length > 0) patch.checkpoints = cpDiffs;

    const impDiffs: Record<number, QuestionImportance> = {};
    for (const [iStr, importance] of Object.entries(editing.checkpointImportances)) {
      const i = Number(iStr);
      const origCp = req.checkPoints?.[i] ?? '';
      const inferred = inferImportance(origCp);
      if (importance !== inferred) {
        impDiffs[i] = importance;
      }
    }
    if (Object.keys(impDiffs).length > 0) patch.checkpointImportances = impDiffs;

    const detailDiffs: Record<number, string> = {};
    for (const [iStr, detail] of Object.entries(editing.checkpointDetails)) {
      const trimmed = detail.trim();
      if (trimmed) detailDiffs[Number(iStr)] = trimmed;
    }
    if (Object.keys(detailDiffs).length > 0) patch.checkpointDetails = detailDiffs;

    const origEvidence = req.evidenceExamples ?? [];
    const editedEvidence = editing.evidenceExamples;
    if (JSON.stringify(editedEvidence) !== JSON.stringify(origEvidence)) {
      patch.evidenceExamples = editedEvidence;
    }

    const origSuggestions = req.testSuggestions ?? [];
    const editedSuggestions = editing.testSuggestions;
    if (JSON.stringify(editedSuggestions) !== JSON.stringify(origSuggestions)) {
      patch.testSuggestions = editedSuggestions;
    }

    const origCriteria = req.passCriteria ?? '';
    if (editing.passCriteria !== origCriteria) {
      patch.passCriteria = editing.passCriteria;
    }

    if (editing.branchingRules.length > 0) {
      patch.branchingRules = editing.branchingRules;
    }

    // Compute change entries for history
    const ov = overrides[editing.reqId];
    const changes: Array<{ field: string; before: string; after: string }> = [];
    const prevTitle = ov?.title ?? req.title;
    const newTitle = patch.title ?? req.title;
    if (prevTitle !== newTitle) changes.push({ field: 'title', before: prevTitle, after: newTitle });
    const prevDesc = ov?.description ?? req.description;
    const newDesc = patch.description ?? req.description;
    if (prevDesc !== newDesc) changes.push({ field: 'description', before: prevDesc, after: newDesc });
    if (patch.checkpoints) {
      for (const [iStr, val] of Object.entries(patch.checkpoints)) {
        const i = Number(iStr);
        const prev = ov?.checkpoints?.[i] ?? req.checkPoints?.[i] ?? '';
        if (prev !== val) changes.push({ field: `checkpoint:${i}`, before: prev, after: val });
      }
    }
    if (patch.checkpointImportances) {
      for (const [iStr, val] of Object.entries(patch.checkpointImportances)) {
        const i = Number(iStr);
        const prev = ov?.checkpointImportances?.[i] ?? inferImportance(req.checkPoints?.[i] ?? '');
        if (prev !== val) changes.push({ field: `importance:${i}`, before: prev, after: val });
      }
    }
    if (patch.passCriteria !== undefined) {
      const prev = ov?.passCriteria ?? req.passCriteria ?? '';
      if (prev !== patch.passCriteria) changes.push({ field: 'passCriteria', before: prev, after: patch.passCriteria ?? '' });
    }
    if (patch.evidenceExamples) {
      const prev = (ov?.evidenceExamples ?? req.evidenceExamples ?? []).join('\n');
      const next = patch.evidenceExamples.join('\n');
      if (prev !== next) changes.push({ field: 'evidenceExamples', before: prev, after: next });
    }
    if (patch.testSuggestions) {
      const prev = (ov?.testSuggestions ?? req.testSuggestions ?? []).join('\n');
      const next = patch.testSuggestions.join('\n');
      if (prev !== next) changes.push({ field: 'testSuggestions', before: prev, after: next });
    }

    setBusy(true);
    try {
      const isEmpty = !patch.title && !patch.description && !patch.checkpoints && !patch.checkpointImportances && !patch.checkpointDetails && !patch.evidenceExamples && !patch.testSuggestions && !patch.passCriteria && !patch.branchingRules;
      if (isEmpty) {
        await deleteDoc(doc(db, 'contentOverrides', editing.reqId));
      } else {
        await setDoc(doc(db, 'contentOverrides', editing.reqId), patch);
      }
      // Record history if there were changes
      if (changes.length > 0) {
        await addDoc(collection(db, 'contentOverrides', editing.reqId, 'history'), {
          changedAt: serverTimestamp(),
          changedBy: 'admin',
          action: isEmpty ? 'reset' : 'edit',
          changes,
        });
      }
    } finally {
      setBusy(false);
    }
    setEditing(null);
  };

  const handleReset = async (reqId: string) => {
    if (!db || busy) return;
    const ov = overrides[reqId];
    const req = REQUIREMENTS_DB.find((r) => r.id === reqId);
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'contentOverrides', reqId));
      // Record reset in history
      if (ov && req) {
        const changes: Array<{ field: string; before: string; after: string }> = [];
        if (ov.title) changes.push({ field: 'title', before: ov.title, after: req.title });
        if (ov.description) changes.push({ field: 'description', before: ov.description, after: req.description });
        if (ov.checkpoints) {
          for (const [iStr, val] of Object.entries(ov.checkpoints)) {
            changes.push({ field: `checkpoint:${iStr}`, before: val, after: req.checkPoints?.[Number(iStr)] ?? '' });
          }
        }
        if (changes.length > 0) {
          await addDoc(collection(db, 'contentOverrides', reqId, 'history'), {
            changedAt: serverTimestamp(),
            changedBy: 'admin',
            action: 'reset',
            changes,
          });
        }
      }
      if (editing?.reqId === reqId) setEditing(null);
    } finally {
      setBusy(false);
      setResetTarget(null);
    }
  };

  const handleResetAll = async () => {
    if (!db || busy) return;
    setBusy(true);
    try {
      const snap = await getDocs(collection(db, 'contentOverrides'));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      setEditing(null);
    } finally {
      setBusy(false);
      setResetAllConfirm(false);
    }
  };

  const hasOverride = (reqId: string) => reqId in overrides;

  const getDisplayValue = (reqId: string, field: 'title' | 'description') => {
    const req = REQUIREMENTS_DB.find((r) => r.id === reqId);
    if (!req) return '';
    const ov = overrides[reqId];
    if (field === 'title') return ov?.title ?? req.title;
    return ov?.description ?? req.description;
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="콘텐츠 관리"
        description={`점검항목의 제목, 설명, 체크포인트, 상세 정보(증빙 예시·테스트 제안·판정 기준)를 수정합니다. 원본과 다른 항목은 뱃지로 표시됩니다. (${overrideCount}건 수정됨)`}
        action={overrideCount > 0 ? (
          <button
            type="button"
            onClick={() => setResetAllConfirm(true)}
            disabled={busy}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-danger bg-danger-subtle px-3 py-1.5 text-xs font-semibold text-danger-text hover:opacity-80 disabled:opacity-40 transition-colors"
          >
            <Trash2 size={13} />
            전체 초기화
          </button>
        ) : undefined}
      />

      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          const expanded = expandedCategories.has(cat);
          return (
            <div key={cat} className="rounded-xl border border-ln bg-surface-base overflow-hidden">
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="flex w-full items-center gap-2 px-4 py-3 bg-surface-raised hover:bg-interactive-hover transition-colors"
              >
                {expanded
                  ? <ChevronDown size={16} className="text-tx-muted" />
                  : <ChevronRight size={16} className="text-tx-muted" />
                }
                <span className="text-sm font-bold text-tx-primary">{CATEGORY_LABELS[cat]}</span>
                <span className="text-[10px] font-semibold text-tx-tertiary">({items.length}개 항목)</span>
              </button>

              {expanded && (
                <div className="divide-y divide-ln">
                  {items.map((req) => {
                    const isEditing = editing?.reqId === req.id;
                    const modified = hasOverride(req.id);

                    if (isEditing && editing) {
                      return (
                        <ContentEditForm
                          key={req.id}
                          req={req}
                          editing={editing}
                          setEditing={(s) => setEditing(s)}
                          onSave={handleSave}
                          onCancel={() => setEditing(null)}
                          busy={busy}
                          groupedMaterials={groupedMaterials}
                          toggleRef={toggleRef}
                          refDropdownIdx={refDropdownIdx}
                          setRefDropdownIdx={setRefDropdownIdx}
                          dropdownRef={dropdownRef}
                          addBranchingRule={addBranchingRule}
                          removeBranchingRule={removeBranchingRule}
                          updateBranchingSource={updateBranchingSource}
                          toggleSkipIndex={toggleSkipIndex}
                        />
                      );
                    }

                    return (
                      <div key={req.id} className="flex items-center justify-between px-4 py-3 hover:bg-interactive-hover transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="shrink-0 text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{req.id}</span>
                          <span className="text-sm font-semibold text-tx-primary truncate">
                            {getDisplayValue(req.id, 'title')}
                          </span>
                          {modified && (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold text-status-hold-text bg-status-hold-bg px-1.5 py-0.5 rounded">
                              수정됨
                              {(() => {
                                const ts = formatOverrideTime(overrides[req.id]?.updatedAt);
                                return ts ? <span className="font-medium opacity-70" title={`마지막 수정: ${ts}`}><History size={9} className="inline -mt-px" /> {ts}</span> : null;
                              })()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => handleEditStart(req.id)}
                            disabled={busy}
                            className="rounded p-1.5 text-tx-muted hover:text-accent-text hover:bg-accent-subtle disabled:opacity-40"
                            title="수정" aria-label="수정"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setHistoryTarget({ reqId: req.id, title: getDisplayValue(req.id, 'title') })}
                            className="rounded p-1.5 text-tx-muted hover:text-tx-secondary hover:bg-surface-sunken"
                            title="변경 이력" aria-label="변경 이력"
                          >
                            <Clock size={14} />
                          </button>
                          {modified && (
                            <button
                              onClick={() => setResetTarget(req.id)}
                              disabled={busy}
                              className="rounded p-1.5 text-tx-muted hover:text-status-hold-text hover:bg-status-hold-bg disabled:opacity-40"
                              title="원본으로 되돌리기" aria-label="원본으로 되돌리기"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset single item confirm modal */}
      <ConfirmModal
        open={!!resetTarget}
        title="원본으로 되돌리기" aria-label="원본으로 되돌리기"
        description={
          <p className="text-xs text-tx-tertiary">
            <strong className="text-tx-secondary">{resetTarget}</strong> 항목의 수정 내용을 삭제하고 원본으로 복원하시겠습니까?
          </p>
        }
        confirmLabel={busy ? '처리 중...' : '되돌리기'}
        confirmVariant="warning"
        onConfirm={() => resetTarget && handleReset(resetTarget)}
        onCancel={() => setResetTarget(null)}
        busy={busy}
        icon={
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-status-hold-bg shrink-0">
            <AlertTriangle size={20} className="text-status-hold-text" />
          </div>
        }
      />

      {/* Reset all confirm modal */}
      <ConfirmModal
        open={resetAllConfirm}
        title="전체 초기화"
        description={
          <p className="text-xs text-tx-tertiary">
            수정된 <strong className="text-tx-secondary">{overrideCount}건</strong>의 오버라이드를 모두 삭제하고 원본으로 복원하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
        }
        confirmLabel={busy ? '처리 중...' : '전체 초기화'}
        confirmVariant="danger"
        onConfirm={handleResetAll}
        onCancel={() => setResetAllConfirm(false)}
        busy={busy}
        icon={
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-danger-subtle shrink-0">
            <AlertTriangle size={20} className="text-danger" />
          </div>
        }
      />

      {/* Change history modal */}
      {historyTarget && (
        <ChangeHistoryModal
          reqId={historyTarget.reqId}
          reqTitle={historyTarget.title}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {/* Busy overlay for save operations */}
      <BusyOverlay visible={busy && !resetTarget && !resetAllConfirm} />
    </div>
  );
}
