import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Pencil, Check, X, RotateCcw, ChevronDown, ChevronRight, FileDown, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, getDocs, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import type { ContentOverride, BranchingRule } from '../../../lib/content/mergeOverrides';
import type { RequirementCategory, QuestionImportance } from '../../../types';
import { inferImportance } from '../../../utils/quickMode';

const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  SETUP: '시험 준비',
  EXECUTION: '시험 수행',
  COMPLETION: '시험 종료',
};

const CATEGORY_ORDER: RequirementCategory[] = ['SETUP', 'EXECUTION', 'COMPLETION'];

const REF_PATTERN = /\s*\[ref:\s*(.+?)\]\s*$/;

/** 체크포인트 텍스트에서 본문과 [ref:~] 부분을 분리 */
const splitRef = (text: string): { body: string; refSuffix: string; refs: string[] } => {
  const match = text.match(REF_PATTERN);
  if (!match) return { body: text, refSuffix: '', refs: [] };
  const refs = match[1].split(',').map((r) => r.trim()).filter(Boolean);
  return {
    body: text.replace(REF_PATTERN, '').trim(),
    refSuffix: match[0],
    refs,
  };
};

/** refs 배열로부터 [ref:~] 접미사를 생성 */
const buildRefSuffix = (refs: string[]): string =>
  refs.length > 0 ? ` [ref: ${refs.join(', ')}]` : '';

/** 편집된 본문 + refs 배열을 합침 */
const joinRef = (body: string, refs: string[]): string =>
  `${body.trim()}${buildRefSuffix(refs)}`;

type EditingState = {
  reqId: string;
  title: string;
  description: string;
  checkpoints: Record<number, string>; // body only (without [ref:~])
  checkpointRefs: Record<number, string[]>; // refs per checkpoint
  checkpointImportances: Record<number, QuestionImportance>;
  evidenceExamples: string[];
  testSuggestions: string[];
  passCriteria: string;
  branchingRules: BranchingRule[];
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

  /** 자료를 카테고리별로 그룹화 (마크다운 + Firestore 병합) */
  const groupedMaterials = useMemo(() => {
    // label → 연관된 step IDs (마크다운 requiredDocs + Firestore linkedSteps 합산)
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

    // 그룹 내 정렬
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
    // 중요도: 오버라이드 → 추론값 순으로 초기화
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

    // Only save fields that differ from markdown original
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

    // 체크포인트 중요도 (추론값과 다른 것만 저장)
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

    // 증빙 예시
    const origEvidence = req.evidenceExamples ?? [];
    const editedEvidence = editing.evidenceExamples;
    if (JSON.stringify(editedEvidence) !== JSON.stringify(origEvidence)) {
      patch.evidenceExamples = editedEvidence;
    }

    // 테스트 제안
    const origSuggestions = req.testSuggestions ?? [];
    const editedSuggestions = editing.testSuggestions;
    if (JSON.stringify(editedSuggestions) !== JSON.stringify(origSuggestions)) {
      patch.testSuggestions = editedSuggestions;
    }

    // 판정 기준
    const origCriteria = req.passCriteria ?? '';
    if (editing.passCriteria !== origCriteria) {
      patch.passCriteria = editing.passCriteria;
    }

    // 분기 규칙
    if (editing.branchingRules.length > 0) {
      patch.branchingRules = editing.branchingRules;
    }

    // If nothing changed, delete override
    setBusy(true);
    try {
      if (!patch.title && !patch.description && !patch.checkpoints && !patch.checkpointImportances && !patch.evidenceExamples && !patch.testSuggestions && !patch.passCriteria && !patch.branchingRules) {
        await deleteDoc(doc(db, 'contentOverrides', editing.reqId));
      } else {
        await setDoc(doc(db, 'contentOverrides', editing.reqId), patch);
      }
    } finally {
      setBusy(false);
    }
    setEditing(null);
  };

  const handleReset = async (reqId: string) => {
    if (!db || busy) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'contentOverrides', reqId));
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-tx-primary">콘텐츠 관리</h1>
          <p className="text-xs text-tx-tertiary mt-1">
            점검항목의 제목, 설명, 체크포인트, 상세 정보(증빙 예시·테스트 제안·판정 기준)를 수정합니다. 원본과 다른 항목은 뱃지로 표시됩니다. ({overrideCount}건 수정됨)
          </p>
        </div>
        {overrideCount > 0 && (
          <button
            type="button"
            onClick={() => setResetAllConfirm(true)}
            disabled={busy}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-40 transition-colors"
          >
            <Trash2 size={13} />
            전체 초기화
          </button>
        )}
      </div>

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
                        <div key={req.id} className="p-4 bg-accent-subtle space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{req.id}</span>
                              <span className="text-xs font-semibold text-accent-text">편집 중</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={handleSave} disabled={busy} className="rounded p-1.5 text-status-pass-text hover:bg-status-pass-bg disabled:opacity-40" title="저장">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setEditing(null)} disabled={busy} className="rounded p-1.5 text-tx-muted hover:bg-interactive-hover disabled:opacity-40" title="취소">
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Title field */}
                          <div>
                            <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">제목</label>
                            <input
                              className="mt-1 w-full rounded border border-ln bg-surface-base px-3 py-2 text-sm text-tx-primary"
                              value={editing.title}
                              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                            />
                            {editing.title !== req.title && (
                              <p className="mt-0.5 text-[10px] text-tx-muted">원본: {req.title}</p>
                            )}
                          </div>

                          {/* Description field */}
                          <div>
                            <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">설명</label>
                            <textarea
                              className="mt-1 w-full rounded border border-ln bg-surface-base px-3 py-2 text-sm text-tx-primary resize-y min-h-[60px]"
                              value={editing.description}
                              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                              rows={3}
                            />
                            {editing.description !== req.description && (
                              <p className="mt-0.5 text-[10px] text-tx-muted line-clamp-2">원본: {req.description}</p>
                            )}
                          </div>

                          {/* Checkpoints */}
                          {req.checkPoints && req.checkPoints.length > 0 && (
                            <div>
                              <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">체크포인트</label>
                              <div className="mt-1 space-y-2.5">
                                {req.checkPoints.map((origCp: string, i: number) => {
                                  const { body: origBody, refs: origRefs } = splitRef(origCp);
                                  const editedBody = editing.checkpoints[i] ?? origBody;
                                  const editedRefs = editing.checkpointRefs[i] ?? [];
                                  const refsChanged = JSON.stringify(editedRefs) !== JSON.stringify(origRefs);
                                  const isDropdownOpen = refDropdownIdx === i;
                                  const currentImportance = editing.checkpointImportances[i] ?? inferImportance(origCp);
                                  const inferredImportance = inferImportance(origCp);
                                  const importanceChanged = currentImportance !== inferredImportance;
                                  return (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="shrink-0 mt-2 text-[10px] font-bold text-tx-tertiary w-5 text-right">{i + 1}</span>
                                      <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            className="flex-1 rounded border border-ln bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary"
                                            value={editedBody}
                                            onChange={(e) => setEditing({
                                              ...editing,
                                              checkpoints: { ...editing.checkpoints, [i]: e.target.value },
                                            })}
                                          />
                                          {/* MUST/SHOULD 토글 */}
                                          <button
                                            type="button"
                                            onClick={() => setEditing({
                                              ...editing,
                                              checkpointImportances: {
                                                ...editing.checkpointImportances,
                                                [i]: currentImportance === 'MUST' ? 'SHOULD' : 'MUST',
                                              },
                                            })}
                                            className={`shrink-0 px-2 py-1.5 rounded text-[10px] font-bold transition-colors ${
                                              currentImportance === 'MUST'
                                                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                                : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                                            } ${importanceChanged ? 'ring-1 ring-amber-400' : ''}`}
                                            title={`클릭하여 ${currentImportance === 'MUST' ? 'SHOULD' : 'MUST'}로 변경`}
                                          >
                                            {currentImportance}
                                          </button>
                                        </div>
                                        {/* Ref dropdown */}
                                        <div className="relative" ref={isDropdownOpen ? dropdownRef : undefined}>
                                          <button
                                            type="button"
                                            onClick={() => setRefDropdownIdx(isDropdownOpen ? null : i)}
                                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border transition-colors ${
                                              editedRefs.length > 0
                                                ? 'bg-accent/10 text-accent-text border-accent/30'
                                                : 'bg-surface-sunken text-tx-muted border-ln hover:border-ln-strong'
                                            }`}
                                          >
                                            <FileDown size={10} />
                                            {editedRefs.length > 0
                                              ? `참고 자료 ${editedRefs.length}건`
                                              : '참고 자료 선택'}
                                            <ChevronDown size={10} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                          </button>
                                          {/* Selected ref labels (inline preview) */}
                                          {editedRefs.length > 0 && !isDropdownOpen && (
                                            <span className="ml-1.5 text-[9px] text-tx-tertiary">
                                              {editedRefs.join(', ')}
                                            </span>
                                          )}
                                          {isDropdownOpen && (
                                            <div className="absolute z-30 left-0 top-full mt-1 w-72 max-h-64 overflow-y-auto rounded-lg border border-ln bg-surface-overlay shadow-lg">
                                              {groupedMaterials.map((group) => (
                                                <div key={group.name}>
                                                  <div className="sticky top-0 px-3 py-1.5 text-[9px] font-bold text-tx-muted uppercase tracking-wider bg-surface-raised border-b border-ln">
                                                    {group.name}
                                                  </div>
                                                  {group.labels.map((label) => {
                                                    const selected = editedRefs.includes(label);
                                                    return (
                                                      <button
                                                        key={label}
                                                        type="button"
                                                        onClick={() => toggleRef(i, label)}
                                                        className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors ${
                                                          selected
                                                            ? 'bg-accent/10 text-accent-text'
                                                            : 'text-tx-secondary hover:bg-interactive-hover'
                                                        }`}
                                                      >
                                                        <span className={`shrink-0 h-3.5 w-3.5 rounded border flex items-center justify-center text-[8px] ${
                                                          selected
                                                            ? 'bg-accent border-accent text-white'
                                                            : 'border-ln bg-surface-base'
                                                        }`}>
                                                          {selected && '✓'}
                                                        </span>
                                                        {label}
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {(editedBody !== origBody || refsChanged) && (
                                          <p className="text-[9px] text-tx-muted truncate">
                                            원본: {origBody}{origRefs.length > 0 ? ` [ref: ${origRefs.join(', ')}]` : ''}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Branching Rules */}
                          {req.checkPoints && req.checkPoints.length > 1 && (
                            <div>
                              <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">분기 규칙</label>
                              <p className="text-[9px] text-tx-muted mt-0.5 mb-2">
                                특정 질문에 &quot;아니오&quot; 답변 시 건너뛸 후속 질문을 지정합니다
                              </p>
                              <div className="space-y-2">
                                {editing.branchingRules.map((rule, ruleIdx) => (
                                  <div key={ruleIdx} className="flex items-start gap-2 p-2.5 rounded-lg border border-ln bg-surface-base">
                                    <select
                                      value={rule.sourceIndex}
                                      onChange={(e) => updateBranchingSource(ruleIdx, Number(e.target.value))}
                                      className="shrink-0 text-xs border border-ln rounded px-2 py-1 bg-surface-base text-tx-primary"
                                    >
                                      {req.checkPoints!.map((_: string, i: number) => (
                                        <option key={i} value={i}>Q{i + 1}</option>
                                      ))}
                                    </select>
                                    <span className="shrink-0 text-[10px] text-tx-muted mt-1.5">= NO &rarr;</span>
                                    <div className="flex flex-wrap gap-1.5 flex-1">
                                      {req.checkPoints!.map((_: string, i: number) => {
                                        if (i <= rule.sourceIndex) return null;
                                        const isSkipped = rule.skipIndices.includes(i);
                                        return (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => toggleSkipIndex(ruleIdx, i)}
                                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                              isSkipped
                                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                                                : 'bg-surface-base text-tx-muted border-ln hover:border-ln-strong'
                                            }`}
                                          >
                                            Q{i + 1}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeBranchingRule(ruleIdx)}
                                      className="shrink-0 rounded p-1 text-tx-muted hover:text-red-500"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={addBranchingRule}
                                className="mt-2 text-[10px] font-semibold text-accent-text hover:underline"
                              >
                                + 분기 규칙 추가
                              </button>
                            </div>
                          )}

                          {/* Evidence Examples */}
                          <div>
                            <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">증빙 예시</label>
                            <p className="text-[9px] text-tx-muted mt-0.5 mb-1">줄바꿈으로 항목을 구분합니다</p>
                            <textarea
                              className="w-full rounded border border-ln bg-surface-base px-3 py-2 text-xs text-tx-primary resize-y min-h-[60px]"
                              value={editing.evidenceExamples.join('\n')}
                              onChange={(e) => setEditing({
                                ...editing,
                                evidenceExamples: e.target.value ? e.target.value.split('\n') : [],
                              })}
                              rows={3}
                              placeholder="예: 테스트 결과 보고서 캡처"
                            />
                            {JSON.stringify(editing.evidenceExamples) !== JSON.stringify(req.evidenceExamples ?? []) && (
                              <p className="mt-0.5 text-[9px] text-tx-muted">원본과 다름</p>
                            )}
                          </div>

                          {/* Test Suggestions */}
                          <div>
                            <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">테스트 제안</label>
                            <p className="text-[9px] text-tx-muted mt-0.5 mb-1">줄바꿈으로 항목을 구분합니다</p>
                            <textarea
                              className="w-full rounded border border-ln bg-surface-base px-3 py-2 text-xs text-tx-primary resize-y min-h-[60px]"
                              value={editing.testSuggestions.join('\n')}
                              onChange={(e) => setEditing({
                                ...editing,
                                testSuggestions: e.target.value ? e.target.value.split('\n') : [],
                              })}
                              rows={3}
                              placeholder="예: 기능 테스트 시나리오 작성"
                            />
                            {JSON.stringify(editing.testSuggestions) !== JSON.stringify(req.testSuggestions ?? []) && (
                              <p className="mt-0.5 text-[9px] text-tx-muted">원본과 다름</p>
                            )}
                          </div>

                          {/* Pass Criteria */}
                          <div>
                            <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">판정 기준</label>
                            <textarea
                              className="mt-1 w-full rounded border border-ln bg-surface-base px-3 py-2 text-xs text-tx-primary resize-y min-h-[40px]"
                              value={editing.passCriteria}
                              onChange={(e) => setEditing({ ...editing, passCriteria: e.target.value })}
                              rows={2}
                              placeholder="예: 모든 체크포인트 충족 시 적합"
                            />
                            {editing.passCriteria !== (req.passCriteria ?? '') && (
                              <p className="mt-0.5 text-[9px] text-tx-muted">원본: {req.passCriteria}</p>
                            )}
                          </div>
                        </div>
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
                            <span className="shrink-0 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">수정됨</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => handleEditStart(req.id)}
                            disabled={busy}
                            className="rounded p-1.5 text-tx-muted hover:text-accent-text hover:bg-accent-subtle disabled:opacity-40"
                            title="수정"
                          >
                            <Pencil size={14} />
                          </button>
                          {modified && (
                            <button
                              onClick={() => setResetTarget(req.id)}
                              disabled={busy}
                              className="rounded p-1.5 text-tx-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-40"
                              title="원본으로 되돌리기"
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

      {/* 되돌리기 확인 모달 */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-ln bg-surface-overlay shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-500/10 shrink-0">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-tx-primary">원본으로 되돌리기</h3>
                <p className="text-xs text-tx-tertiary mt-0.5">
                  <strong className="text-tx-secondary">{resetTarget}</strong> 항목의 수정 내용을 삭제하고 원본으로 복원하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                disabled={busy}
                className="rounded-lg border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleReset(resetTarget)}
                disabled={busy}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60 flex items-center gap-1.5"
              >
                {busy && <Loader2 size={12} className="animate-spin" />}
                {busy ? '처리 중...' : '되돌리기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체 초기화 확인 모달 */}
      {resetAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-ln bg-surface-overlay shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-50 dark:bg-red-500/10 shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-tx-primary">전체 초기화</h3>
                <p className="text-xs text-tx-tertiary mt-0.5">
                  수정된 <strong className="text-tx-secondary">{overrideCount}건</strong>의 오버라이드를 모두 삭제하고 원본으로 복원하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetAllConfirm(false)}
                disabled={busy}
                className="rounded-lg border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                disabled={busy}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60 flex items-center gap-1.5"
              >
                {busy && <Loader2 size={12} className="animate-spin" />}
                {busy ? '처리 중...' : '전체 초기화'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DB 작업 중 차단 오버레이 (저장/수정) */}
      {busy && !resetTarget && !resetAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface-overlay border border-ln shadow-xl px-5 py-3">
            <Loader2 size={16} className="animate-spin text-accent" />
            <span className="text-sm font-semibold text-tx-primary">저장 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
