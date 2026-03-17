import { useState, useMemo } from 'react';
import { Eye, Pencil, ChevronDown, ChevronRight, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import type { StalenessInfo } from '../../../../lib/content/snapshotUtils';
import type { EditingState } from './types';
import { splitRef } from './types';
import type { RequirementCategory } from '../../../../types';
import { CheckpointEditor } from './CheckpointEditor';
import { BranchingRuleEditor } from './BranchingRuleEditor';
import { DetailFieldsEditor } from './DetailFieldsEditor';
import { ContentPreview } from './ContentPreview';

type RequirementLike = {
  id: string;
  category: RequirementCategory;
  title: string;
  description: string;
  checkPoints?: string[];
  evidenceExamples?: string[];
  testSuggestions?: string[];
  passCriteria?: string;
};

type ContentEditFormProps = {
  req: RequirementLike;
  editing: EditingState;
  setEditing: (state: EditingState) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  isModified: boolean;
  staleInfo?: StalenessInfo | null;
  onHistory?: () => void;
  onReset?: () => void;
  groupedMaterials: Array<{ name: string; labels: string[] }>;
  toggleRef: (cpIdx: number, label: string) => void;
  refDropdownIdx: number | null;
  setRefDropdownIdx: (idx: number | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  addBranchingRule: () => void;
  removeBranchingRule: (ruleIdx: number) => void;
  updateBranchingSource: (ruleIdx: number, sourceIndex: number) => void;
  toggleSkipIndex: (ruleIdx: number, targetIdx: number) => void;
};

function EditSection({
  title,
  badge,
  defaultOpen,
  children,
}: {
  title: string;
  badge?: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-ln rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 rounded-t-lg bg-surface-raised hover:bg-interactive-hover transition-colors"
      >
        {open
          ? <ChevronDown size={14} className="text-tx-muted shrink-0" />
          : <ChevronRight size={14} className="text-tx-muted shrink-0" />
        }
        <span className="text-xs font-bold text-tx-primary flex-1 text-left">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="shrink-0 text-[9px] font-bold text-status-hold-text bg-status-hold-bg px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-surface-base">
          {children}
        </div>
      )}
    </div>
  );
}

export function ContentEditForm({
  req,
  editing,
  setEditing,
  onSave,
  onCancel,
  busy,
  isModified,
  staleInfo,
  onHistory,
  onReset,
  groupedMaterials,
  toggleRef,
  refDropdownIdx,
  setRefDropdownIdx,
  dropdownRef,
  addBranchingRule,
  removeBranchingRule,
  updateBranchingSource,
  toggleSkipIndex,
}: ContentEditFormProps) {
  const [preview, setPreview] = useState(false);

  // Change badge calculations
  const basicBadge = useMemo(() => {
    let count = 0;
    if (editing.title !== req.title) count++;
    if (editing.description !== req.description) count++;
    return count;
  }, [editing.title, editing.description, req.title, req.description]);

  const checkpointBadge = useMemo(() => {
    const cps = req.checkPoints ?? [];
    let count = 0;
    for (let i = 0; i < cps.length; i++) {
      const { body: origBody, refs: origRefs } = splitRef(cps[i]);
      const editedBody = editing.checkpoints[i] ?? '';
      const editedRefs = editing.checkpointRefs[i] ?? [];
      if (editedBody !== origBody || JSON.stringify(editedRefs) !== JSON.stringify(origRefs)) {
        count++;
      }
    }
    return count;
  }, [editing.checkpoints, editing.checkpointRefs, req.checkPoints]);

  const detailBadge = useMemo(() => {
    let count = 0;
    const origEvidence = req.evidenceExamples ?? [];
    if (JSON.stringify(editing.evidenceExamples.filter(s => s.trim())) !== JSON.stringify(origEvidence)) count++;
    const origSuggestions = req.testSuggestions ?? [];
    if (JSON.stringify(editing.testSuggestions.filter(s => s.trim())) !== JSON.stringify(origSuggestions)) count++;
    if (editing.passCriteria !== (req.passCriteria ?? '')) count++;
    return count;
  }, [editing.evidenceExamples, editing.testSuggestions, editing.passCriteria, req.evidenceExamples, req.testSuggestions, req.passCriteria]);

  const branchingBadge = editing.branchingRules.length;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-ln bg-surface-raised">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">
            {req.id}
          </span>
          <span className="text-sm font-semibold text-tx-primary truncate">
            {editing.title}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
              preview
                ? 'bg-accent text-white'
                : 'bg-surface-base border border-ln text-tx-muted hover:text-tx-secondary hover:border-ln-strong'
            }`}
          >
            {preview ? <><Pencil size={11} /> 편집</> : <><Eye size={11} /> 미리보기</>}
          </button>
          {onHistory && (
            <button
              type="button"
              onClick={onHistory}
              className="rounded p-1.5 text-tx-muted hover:text-tx-secondary hover:bg-surface-sunken"
              title="변경 이력"
            >
              <Clock size={14} />
            </button>
          )}
          {isModified && onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={busy}
              className="rounded p-1.5 text-tx-muted hover:text-status-hold-text hover:bg-status-hold-bg disabled:opacity-40"
              title="원본으로 되돌리기"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Stale snapshot warning banner */}
        {staleInfo?.isStale && (
          <div className="flex items-start gap-2 rounded-lg bg-status-hold-bg px-3 py-2.5">
            <AlertTriangle size={16} className="text-status-hold-text shrink-0 mt-0.5" />
            <div className="text-xs text-status-hold-text">
              <p className="font-semibold">원본 콘텐츠가 변경되어 저장된 스냅샷이 초기화되었습니다.</p>
              <p className="mt-0.5 text-[11px] opacity-80">
                마크다운 기본값으로 편집을 시작합니다. 저장하면 새 스냅샷이 생성됩니다.
              </p>
            </div>
          </div>
        )}

        {preview ? (
          <ContentPreview editing={editing} category={req.category} />
        ) : (
          <>
            {/* Basic info section */}
            <EditSection title="기본 정보" badge={basicBadge} defaultOpen>
              <div>
                <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">제목</label>
                <input
                  className={`mt-1 w-full rounded border bg-surface-base px-3 py-2 text-sm text-tx-primary ${
                    editing.title !== req.title
                      ? 'border-l-[3px] border-l-status-hold-border border-t-ln border-r-ln border-b-ln bg-status-hold-bg/20'
                      : 'border-ln'
                  }`}
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
                {editing.title !== req.title && (
                  <div className="mt-1.5 flex items-center gap-1.5 bg-surface-sunken rounded px-2 py-1">
                    <span className="shrink-0 text-[9px] font-semibold text-tx-muted">원본</span>
                    <span className="text-[11px] text-tx-muted line-through">{req.title}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">설명</label>
                <textarea
                  className={`mt-1 w-full rounded border bg-surface-base px-3 py-2 text-sm text-tx-primary resize-y min-h-[60px] ${
                    editing.description !== req.description
                      ? 'border-l-[3px] border-l-status-hold-border border-t-ln border-r-ln border-b-ln bg-status-hold-bg/20'
                      : 'border-ln'
                  }`}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                />
                {editing.description !== req.description && (
                  <div className="mt-1.5 flex items-start gap-1.5 bg-surface-sunken rounded px-2 py-1">
                    <span className="shrink-0 text-[9px] font-semibold text-tx-muted mt-px">원본</span>
                    <span className="text-[11px] text-tx-muted line-through line-clamp-3">{req.description}</span>
                  </div>
                )}
              </div>
            </EditSection>

            {/* Checkpoints section */}
            <EditSection title="체크포인트" badge={checkpointBadge} defaultOpen>
              <CheckpointEditor
                checkPoints={req.checkPoints ?? []}
                editing={editing}
                setEditing={setEditing}
                groupedMaterials={groupedMaterials}
                toggleRef={toggleRef}
                refDropdownIdx={refDropdownIdx}
                setRefDropdownIdx={setRefDropdownIdx}
                dropdownRef={dropdownRef}
                evidenceExamples={editing.evidenceExamples}
              />
            </EditSection>

            {/* Detail fields section */}
            <EditSection title="상세 정보" badge={detailBadge} defaultOpen={false}>
              <DetailFieldsEditor
                editing={editing}
                setEditing={setEditing}
                originalReq={req}
              />
            </EditSection>

            {/* Branching rules section */}
            <EditSection title="분기 규칙" badge={branchingBadge} defaultOpen={false}>
              <BranchingRuleEditor
                checkPoints={req.checkPoints ?? []}
                checkpointOrder={editing.checkpointOrder}
                rules={editing.branchingRules}
                onAdd={addBranchingRule}
                onRemove={removeBranchingRule}
                onUpdateSource={updateBranchingSource}
                onToggleSkip={toggleSkipIndex}
              />
            </EditSection>
          </>
        )}
      </div>

      {/* Fixed bottom action bar */}
      <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 border-t border-ln bg-surface-raised">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg px-4 py-1.5 text-xs font-semibold text-tx-muted bg-surface-sunken hover:bg-interactive-hover disabled:opacity-40 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 disabled:opacity-40 transition-colors"
        >
          {busy ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
