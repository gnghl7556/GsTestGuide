import { useState } from 'react';
import { Check, X, Eye, Pencil } from 'lucide-react';
import type { EditingState } from './types';
import { joinRef } from './types';
import { CheckpointEditor } from './CheckpointEditor';
import { BranchingRuleEditor } from './BranchingRuleEditor';
import { DetailFieldsEditor } from './DetailFieldsEditor';

type RequirementLike = {
  id: string;
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
        <div className="rounded-lg border border-ln bg-surface-base p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-tx-primary">{editing.title}</h3>
            <p className="mt-1 text-xs text-tx-secondary leading-relaxed">{editing.description}</p>
          </div>
          {Object.keys(editing.checkpoints).length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">체크포인트</span>
              <ol className="space-y-1">
                {Object.entries(editing.checkpoints)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([iStr, body]) => {
                    const i = Number(iStr);
                    const refs = editing.checkpointRefs[i] ?? [];
                    const full = joinRef(body, refs);
                    const imp = editing.checkpointImportances[i];
                    return (
                      <li key={i} className="flex items-start gap-2 text-xs text-tx-primary">
                        <span className="shrink-0 text-[10px] font-mono text-tx-tertiary mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                        <span className="flex-1">{full}</span>
                        {imp && (
                          <span className={`shrink-0 text-[9px] font-bold px-1 py-0.5 rounded ${
                            imp === 'MUST' ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
                          }`}>
                            {imp === 'MUST' ? '필수' : '권장'}
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ol>
            </div>
          )}
          {editing.branchingRules.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">분기 규칙</span>
              <ul className="mt-1 space-y-0.5">
                {editing.branchingRules.map((rule, ri) => (
                  <li key={ri} className="text-[11px] text-tx-secondary">
                    CP{rule.sourceIndex + 1}이 NO → CP{rule.skipIndices.map(i => i + 1).join(', ')} 건너뜀
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(editing.evidenceExamples.length > 0 || editing.testSuggestions.length > 0 || editing.passCriteria) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-ln-subtle">
              {editing.evidenceExamples.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-tx-tertiary">증빙 예시</span>
                  <ul className="mt-0.5 space-y-0.5">
                    {editing.evidenceExamples.map((ex, i) => (
                      <li key={i} className="text-[11px] text-tx-secondary">• {ex}</li>
                    ))}
                  </ul>
                </div>
              )}
              {editing.testSuggestions.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-tx-tertiary">테스트 제안</span>
                  <ul className="mt-0.5 space-y-0.5">
                    {editing.testSuggestions.map((s, i) => (
                      <li key={i} className="text-[11px] text-tx-secondary">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {editing.passCriteria && (
                <div>
                  <span className="text-[10px] font-bold text-tx-tertiary">판정 기준</span>
                  <p className="mt-0.5 text-[11px] text-tx-secondary">{editing.passCriteria}</p>
                </div>
              )}
            </div>
          )}
        </div>
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
