import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Search } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { RequirementCategory, QuestionImportance, ContentSnapshot } from '../../../types';
import { inferImportance } from '../../../utils/quickMode';
import { requirementToSnapshot } from '../../../lib/content/snapshotUtils';
import { saveContentVersion } from '../hooks/useContentVersioning';
import { AdminPageHeader, BusyOverlay } from '../shared';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { ContentEditForm } from './content/ContentEditForm';
import { VersionHistoryModal } from './content/VersionHistoryModal';
import { EditNoteModal } from './content/EditNoteModal';
import { splitRef, joinRef, type EditingState } from './content/types';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  SETUP: '시험 준비',
  EXECUTION: '시험 수행',
  COMPLETION: '시험 종료',
};

const CATEGORY_ORDER: RequirementCategory[] = ['SETUP', 'EXECUTION', 'COMPLETION'];


export function ContentOverrideManagement() {
  // contentVersions 루트 문서에서 현재 활성 스냅샷 구독
  const [versionedContents, setVersionedContents] = useState<Record<string, ContentSnapshot>>({});
  const [versionNumbers, setVersionNumbers] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [busy, setBusy] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<{ reqId: string; version: number; snapshot: ContentSnapshot } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<RequirementCategory>>(
    new Set(CATEGORY_ORDER),
  );
  const [docMaterialsList, setDocMaterialsList] = useState<Array<{ label: string; linkedSteps: string[] }>>([]);
  const [historyTarget, setHistoryTarget] = useState<{ reqId: string; title: string } | null>(null);
  const [refDropdownIdx, setRefDropdownIdx] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // EditNoteModal state
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [filterModified, setFilterModified] = useState(false);

  // 현재 사용자 정보
  const { currentUserId } = useTestSetupContext();

  // Subscribe to Firestore contentVersions (루트 문서들)
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'contentVersions'), (snap) => {
      const contents: Record<string, ContentSnapshot> = {};
      const versions: Record<string, number> = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data.content) {
          contents[d.id] = data.content as ContentSnapshot;
          versions[d.id] = (data.currentVersion as number) ?? 0;
        }
      });
      setVersionedContents(contents);
      setVersionNumbers(versions);
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
        if (filterModified && !(req.id in versionedContents)) return false;
        if (lowerSearch) {
          const vc = versionedContents[req.id];
          const title = (vc?.title ?? req.title).toLowerCase();
          const id = req.id.toLowerCase();
          if (!title.includes(lowerSearch) && !id.includes(lowerSearch)) return false;
        }
        return true;
      });
    }
    return result;
  }, [grouped, search, filterModified, versionedContents]);

  const versionedCount = Object.keys(versionedContents).length;

  const toggleCategory = (cat: RequirementCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  /** 스냅샷 기반 편집 시작 */
  const handleEditStart = (reqId: string) => {
    const req = REQUIREMENTS_DB.find((r) => r.id === reqId);
    if (!req) return;

    // versionedContents에 있으면 그 스냅샷을 사용, 없으면 원본에서 생성
    const snapshot = versionedContents[reqId] ?? requirementToSnapshot(req);

    const cpEntries = snapshot.checkpoints.map((cp: string, i: number) => {
      const { body, refs } = splitRef(cp);
      return { i, body, refs };
    });
    const cpImportances: Record<number, QuestionImportance> = {};
    snapshot.checkpoints.forEach((cp: string, i: number) => {
      cpImportances[i] = snapshot.checkpointImportances[i] ?? inferImportance(cp);
    });

    const cpCount = snapshot.checkpoints.length;
    const defaultOrder = Array.from({ length: cpCount }, (_, i) => i);

    setEditing({
      reqId,
      title: snapshot.title,
      description: snapshot.description,
      checkpoints: Object.fromEntries(cpEntries.map(({ i, body }) => [i, body])),
      checkpointRefs: Object.fromEntries(cpEntries.map(({ i, refs }) => [i, refs])),
      checkpointImportances: cpImportances,
      checkpointDetails: snapshot.checkpointDetails ?? {},
      checkpointEvidences: snapshot.checkpointEvidences ?? {},
      checkpointOrder: snapshot.checkpointOrder ?? defaultOrder,
      evidenceExamples: snapshot.evidenceExamples ?? [],
      testSuggestions: snapshot.testSuggestions ?? [],
      passCriteria: snapshot.passCriteria ?? '',
      branchingRules: snapshot.branchingRules ?? [],
    });
  };

  /** EditingState → ContentSnapshot 변환 */
  const buildSnapshotFromEditing = useCallback((ed: EditingState): ContentSnapshot => {
    // 체크포인트 텍스트 재조합 (body + refs)
    const checkpoints = Object.keys(ed.checkpoints)
      .sort((a, b) => Number(a) - Number(b))
      .map((iStr) => {
        const i = Number(iStr);
        return joinRef(ed.checkpoints[i], ed.checkpointRefs[i] ?? []);
      });

    // 빈 증빙 필터링 + checkpointEvidences 인덱스 리매핑
    const evidenceExamples = ed.evidenceExamples.filter(s => s.trim());
    const evidenceIndexMap = new Map<number, number>();
    let newIdx = 0;
    for (let oldIdx = 0; oldIdx < ed.evidenceExamples.length; oldIdx++) {
      if (ed.evidenceExamples[oldIdx].trim()) {
        evidenceIndexMap.set(oldIdx, newIdx++);
      }
    }
    const checkpointEvidences: Record<number, number[]> = {};
    for (const [iStr, indices] of Object.entries(ed.checkpointEvidences)) {
      const remapped = indices
        .map(ei => evidenceIndexMap.get(ei))
        .filter((ei): ei is number => ei !== undefined);
      if (remapped.length > 0) checkpointEvidences[Number(iStr)] = remapped;
    }

    const checkpointDetails: Record<number, string> = {};
    for (const [iStr, detail] of Object.entries(ed.checkpointDetails)) {
      const trimmed = detail.trim();
      if (trimmed) checkpointDetails[Number(iStr)] = trimmed;
    }

    return {
      title: ed.title,
      description: ed.description,
      checkpoints,
      checkpointImportances: ed.checkpointImportances,
      checkpointDetails,
      checkpointEvidences,
      checkpointOrder: ed.checkpointOrder,
      evidenceExamples,
      testSuggestions: ed.testSuggestions.filter(s => s.trim()),
      passCriteria: ed.passCriteria,
      branchingRules: ed.branchingRules,
    };
  }, []);

  /** 저장 버튼 → EditNoteModal 표시 */
  const handleSave = () => {
    if (!editing || !db) return;
    setShowNoteModal(true);
  };

  /** EditNoteModal에서 사유 입력 후 확인 → 실제 저장 */
  const handleSaveWithNote = async (note: string) => {
    if (!editing || !db) return;

    const newSnapshot = buildSnapshotFromEditing(editing);
    const req = REQUIREMENTS_DB.find((r) => r.id === editing.reqId);
    const previousContent = versionedContents[editing.reqId] ?? (req ? requirementToSnapshot(req) : undefined);

    setBusy(true);
    setShowNoteModal(false);
    try {
      await saveContentVersion({
        reqId: editing.reqId,
        content: newSnapshot,
        editor: currentUserId || 'admin',
        editorId: currentUserId || 'admin',
        note,
        action: 'edit',
        previousContent,
      });
    } finally {
      setBusy(false);
    }
  };

  /** v0(원본)으로 되돌리기 = 새 버전(action='rollback') 생성 */
  const handleRollback = async (reqId: string, version: number, snapshot: ContentSnapshot) => {
    if (!db || busy) return;
    setRollbackTarget({ reqId, version, snapshot });
  };

  const confirmRollback = async () => {
    if (!rollbackTarget || !db) return;
    setBusy(true);
    try {
      const req = REQUIREMENTS_DB.find((r) => r.id === rollbackTarget.reqId);
      const previousContent = versionedContents[rollbackTarget.reqId] ?? (req ? requirementToSnapshot(req) : undefined);

      await saveContentVersion({
        reqId: rollbackTarget.reqId,
        content: rollbackTarget.snapshot,
        editor: currentUserId || 'admin',
        editorId: currentUserId || 'admin',
        note: `v${rollbackTarget.version}으로 되돌리기`,
        action: 'rollback',
        previousContent,
      });

      if (editing?.reqId === rollbackTarget.reqId) setEditing(null);
    } finally {
      setBusy(false);
      setRollbackTarget(null);
    }
  };

  const hasVersion = (reqId: string) => reqId in versionedContents && (versionNumbers[reqId] ?? 0) > 0;

  const getDisplayValue = (reqId: string, field: 'title' | 'description') => {
    const req = REQUIREMENTS_DB.find((r) => r.id === reqId);
    if (!req) return '';
    const vc = versionedContents[reqId];
    if (field === 'title') return vc?.title ?? req.title;
    return vc?.description ?? req.description;
  };

  // Get the current editing requirement
  const editingReq = editing ? REQUIREMENTS_DB.find((r) => r.id === editing.reqId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header — fixed top */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <AdminPageHeader
          title="콘텐츠 관리"
          description={`점검항목의 제목, 설명, 체크포인트, 상세 정보를 수정합니다. (${versionedCount}건 버전 관리 중)`}
        />
      </div>

      {/* Body — left/right split (수직 스택 on mobile) */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 px-6 pb-6 gap-0">
        {/* Left panel — item list */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col border border-ln rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none max-h-64 lg:max-h-none bg-surface-base overflow-hidden">
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
                수정됨 {versionedCount > 0 && `(${versionedCount})`}
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
                    const modified = hasVersion(req.id);
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
                          <span className="shrink-0 text-[8px] font-bold text-accent-text bg-accent-subtle px-1 py-0.5 rounded">
                            v{versionNumbers[req.id]}
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
        <div className="flex-1 flex flex-col border border-t-0 lg:border-t border-ln lg:border-l-0 rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none bg-surface-base overflow-hidden">
          {editing && editingReq ? (
            <ContentEditForm
              key={editing.reqId}
              req={editingReq}
              editing={editing}
              setEditing={(s) => setEditing(s)}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
              busy={busy}
              isModified={hasVersion(editing.reqId)}
              onHistory={() => setHistoryTarget({ reqId: editing.reqId, title: getDisplayValue(editing.reqId, 'title') })}
              onReset={() => {
                // v0으로 되돌리기
                const req = REQUIREMENTS_DB.find((r) => r.id === editing.reqId);
                if (req) {
                  const v0Snapshot = requirementToSnapshot(req);
                  handleRollback(editing.reqId, 0, v0Snapshot);
                }
              }}
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

      {/* Edit note modal — 편집 사유 입력 */}
      <EditNoteModal
        open={showNoteModal}
        onConfirm={handleSaveWithNote}
        onCancel={() => setShowNoteModal(false)}
        busy={busy}
      />

      {/* Rollback confirm modal */}
      <ConfirmModal
        open={!!rollbackTarget}
        title="원본으로 되돌리기"
        description={
          <p className="text-xs text-tx-tertiary">
            <strong className="text-tx-secondary">{rollbackTarget?.reqId}</strong> 항목을
            v{rollbackTarget?.version}으로 되돌리시겠습니까? 새 버전(rollback)이 생성됩니다.
          </p>
        }
        confirmLabel={busy ? '처리 중...' : '되돌리기'}
        confirmVariant="warning"
        onConfirm={confirmRollback}
        onCancel={() => setRollbackTarget(null)}
        busy={busy}
        icon={
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-status-hold-bg shrink-0">
            <AlertTriangle size={20} className="text-status-hold-text" />
          </div>
        }
      />

      {/* Version history modal */}
      {historyTarget && (
        <VersionHistoryModal
          reqId={historyTarget.reqId}
          reqTitle={historyTarget.title}
          onClose={() => setHistoryTarget(null)}
          onRollback={(version, snapshot) => {
            setHistoryTarget(null);
            handleRollback(historyTarget.reqId, version, snapshot);
          }}
        />
      )}

      {/* Busy overlay for save operations */}
      <BusyOverlay visible={busy && !rollbackTarget} />
    </div>
  );
}
