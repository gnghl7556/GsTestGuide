import { useState } from 'react';
import { Check, X, Eye, Pencil } from 'lucide-react';
import type { EditingState } from './types';
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

export function ContentEditForm({
  req,
  editing,
  setEditing,
  onSave,
  onCancel,
  busy,
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
  return (
    <div className="p-4 bg-accent-subtle space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{req.id}</span>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              preview
                ? 'bg-accent text-white'
                : 'bg-surface-base border border-ln text-tx-muted hover:text-tx-secondary hover:border-ln-strong'
            }`}
          >
            {preview ? <><Eye size={11} /> 미리보기</> : <><Pencil size={11} /> 편집 중</>}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onSave} disabled={busy} className="rounded p-1.5 text-status-pass-text hover:bg-status-pass-bg disabled:opacity-40" title="저장">
            <Check size={16} />
          </button>
          <button onClick={onCancel} disabled={busy} className="rounded p-1.5 text-tx-muted hover:bg-interactive-hover disabled:opacity-40" title="취소">
            <X size={16} />
          </button>
        </div>
      </div>

      {preview ? (
        <ContentPreview editing={editing} category={req.category} />
      ) : (
        <>
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
          <CheckpointEditor
            checkPoints={req.checkPoints ?? []}
            editing={editing}
            setEditing={setEditing}
            groupedMaterials={groupedMaterials}
            toggleRef={toggleRef}
            refDropdownIdx={refDropdownIdx}
            setRefDropdownIdx={setRefDropdownIdx}
            dropdownRef={dropdownRef}
          />

          {/* Branching Rules */}
          <BranchingRuleEditor
            checkPoints={req.checkPoints ?? []}
            rules={editing.branchingRules}
            onAdd={addBranchingRule}
            onRemove={removeBranchingRule}
            onUpdateSource={updateBranchingSource}
            onToggleSkip={toggleSkipIndex}
          />

          {/* Evidence, Test Suggestions, Pass Criteria */}
          <DetailFieldsEditor
            editing={editing}
            setEditing={setEditing}
            originalReq={req}
          />
        </>
      )}
    </div>
  );
}
