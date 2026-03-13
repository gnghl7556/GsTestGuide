import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Trash2, Search } from 'lucide-react';
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

  // Search & filter state
  const [search, setSearch] = useState('');
  const [filterModified, setFilterModified] = useState(false);

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

  // Filtered items per category
  const filteredGrouped = useMemo(() => {
    const lowerSearch = search.toLowerCase().trim();
    const result: Record<RequirementCategory, typeof REQUIREMENTS_DB> = {
      SETUP: [],
      EXECUTION: [],
      COMPLETION: [],
    };
    for (const cat of CATEGORY_ORDER) {
      result[cat] = grouped[cat].filter((req) => {
        if (filterModified && !(req.id in overrides)) return false;
        if (lowerSearch) {
          const ov = overrides[req.id];
          const title = (ov?.title ?? req.title).toLowerCase();
          const id = req.id.toLowerCase();
          if (!title.includes(lowerSearch) && !id.includes(lowerSearch)) return false;
        }
        return true;
      });
    }
    return result;
  }, [grouped, search, filterModified, overrides]);

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
      checkpointEvidences: ov?.checkpointEvidences ?? {},
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
    const editedEvidence = editing.evidenceExamples.filter(s => s.trim());
    if (JSON.stringify(editedEvidence) !== JSON.stringify(origEvidence)) {
      patch.evidenceExamples = editedEvidence;
    }

    // 빈 증빙이 필터링되면 인덱스 시프트 발생 → checkpointEvidences 리매핑
    const origCpEvidences = req.checkpointEvidences ?? {};
    const editedCpEvidences: Record<number, number[]> = {};
    const evidenceIndexMap = new Map<number, number>();
    let newIdx = 0;
    for (let oldIdx = 0; oldIdx < editing.evidenceExamples.length; oldIdx++) {
      if (editing.evidenceExamples[oldIdx].trim()) {
        evidenceIndexMap.set(oldIdx, newIdx++);
      }
    }
    for (const [iStr, indices] of Object.entries(editing.checkpointEvidences)) {
      const remapped = indices
        .map(ei => evidenceIndexMap.get(ei))
        .filter((ei): ei is number => ei !== undefined);
      if (remapped.length > 0) editedCpEvidences[Number(iStr)] = remapped;
    }
    if (JSON.stringify(editedCpEvidences) !== JSON.stringify(origCpEvidences)) {
      patch.checkpointEvidences = editedCpEvidences;
    }

    const origSuggestions = req.testSuggestions ?? [];
    const editedSuggestions = editing.testSuggestions.filter(s => s.trim());
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
      const isEmpty = !patch.title && !patch.description && !patch.checkpoints && !patch.checkpointImportances && !patch.checkpointDetails && !patch.checkpointEvidences && !patch.evidenceExamples && !patch.testSuggestions && !patch.passCriteria && !patch.branchingRules;
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

  // Get the current editing requirement
  const editingReq = editing ? REQUIREMENTS_DB.find((r) => r.id === editing.reqId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header — fixed top */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <AdminPageHeader
          title="콘텐츠 관리"
          description={`점검항목의 제목, 설명, 체크포인트, 상세 정보를 수정합니다. (${overrideCount}건 수정됨)`}
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
      </div>

      {/* Body — left/right split */}
      <div className="flex flex-1 min-h-0 px-6 pb-6 gap-0">
        {/* Left panel — item list */}
        <div className="w-72 shrink-0 flex flex-col border border-ln rounded-l-xl bg-surface-base overflow-hidden">
          {/* Search + filter */}
          <div className="shrink-0 p-3 space-y-2 border-b border-ln bg-surface-raised">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tx-muted" />
              <input
                type="text"
                placeholder="ID 또는 제목 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-ln bg-surface-base pl-8 pr-3 py-1.5 text-xs text-tx-primary placeholder:text-tx-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setFilterModified(false)}
                className={`flex-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                  !filterModified
                    ? 'bg-accent text-white'
                    : 'bg-surface-sunken text-tx-muted hover:text-tx-secondary'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setFilterModified(true)}
                className={`flex-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                  filterModified
                    ? 'bg-status-hold-bg text-status-hold-text'
                    : 'bg-surface-sunken text-tx-muted hover:text-tx-secondary'
                }`}
              >
                수정됨 {overrideCount > 0 && `(${overrideCount})`}
              </button>
            </div>
          </div>

          {/* Category accordion + items */}
          <div className="flex-1 overflow-y-auto">
            {CATEGORY_ORDER.map((cat) => {
              const items = filteredGrouped[cat];
              const expanded = expandedCategories.has(cat);
              if (items.length === 0 && (search || filterModified)) return null;
              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="flex w-full items-center gap-1.5 px-3 py-2 bg-surface-raised hover:bg-interactive-hover transition-colors border-b border-ln"
                  >
                    {expanded
                      ? <ChevronDown size={12} className="text-tx-muted shrink-0" />
                      : <ChevronRight size={12} className="text-tx-muted shrink-0" />
                    }
                    <span className="text-[11px] font-bold text-tx-primary">{CATEGORY_LABELS[cat]}</span>
                    <span className="text-[9px] text-tx-tertiary">({items.length})</span>
                  </button>
                  {expanded && items.map((req) => {
                    const isSelected = editing?.reqId === req.id;
                    const modified = hasOverride(req.id);
                    return (
                      <button
                        key={req.id}
                        type="button"
                        onClick={() => handleEditStart(req.id)}
                        disabled={busy}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors border-b border-ln/50 ${
                          isSelected
                            ? 'bg-accent-subtle'
                            : 'hover:bg-interactive-hover'
                        }`}
                      >
                        <span className="shrink-0 text-[9px] font-bold text-tx-tertiary bg-surface-sunken px-1 py-0.5 rounded">
                          {req.id}
                        </span>
                        <span className="text-xs text-tx-primary truncate flex-1">
                          {getDisplayValue(req.id, 'title')}
                        </span>
                        {modified && (
                          <span className="shrink-0 text-[8px] font-bold text-status-hold-text bg-status-hold-bg px-1 py-0.5 rounded">
                            수정됨
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — edit form or placeholder */}
        <div className="flex-1 flex flex-col border border-l-0 border-ln rounded-r-xl bg-surface-base overflow-hidden">
          {editing && editingReq ? (
            <ContentEditForm
              key={editing.reqId}
              req={editingReq}
              editing={editing}
              setEditing={(s) => setEditing(s)}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
              busy={busy}
              isModified={hasOverride(editing.reqId)}
              onHistory={() => setHistoryTarget({ reqId: editing.reqId, title: getDisplayValue(editing.reqId, 'title') })}
              onReset={() => setResetTarget(editing.reqId)}
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
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm text-tx-muted">좌측 목록에서 항목을 선택하세요</p>
                <p className="text-xs text-tx-tertiary">점검항목의 콘텐츠를 편집할 수 있습니다</p>
              </div>
            </div>
          )}
        </div>
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
