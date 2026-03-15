import { useState } from 'react';
import { ChevronRight, FileDown, GripVertical, Plus, X } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { inferImportance } from '../../../../utils/quickMode';
import { splitRef, type EditingState } from './types';

type CheckpointEditorProps = {
  checkPoints: string[];
  editing: EditingState;
  setEditing: (state: EditingState) => void;
  groupedMaterials: Array<{ name: string; labels: string[] }>;
  toggleRef: (cpIdx: number, label: string) => void;
  refDropdownIdx: number | null;
  setRefDropdownIdx: (idx: number | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  evidenceExamples: string[];
};

type SortableCardProps = {
  id: string;
  origIdx: number;
  displayNum: number;
  origCp: string;
  editing: EditingState;
  setEditing: (state: EditingState) => void;
  groupedMaterials: Array<{ name: string; labels: string[] }>;
  toggleRef: (cpIdx: number, label: string) => void;
  refDropdownIdx: number | null;
  setRefDropdownIdx: (idx: number | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  evidenceExamples: string[];
  memoOpenIdx: Set<number>;
  toggleMemo: (idx: number) => void;
  evidencePopoverIdx: number | null;
  setEvidencePopoverIdx: (idx: number | null) => void;
  toggleEvidence: (cpIdx: number, evIdx: number) => void;
};

function SortableCheckpointCard({
  id,
  origIdx,
  displayNum,
  origCp,
  editing,
  setEditing,
  groupedMaterials,
  toggleRef,
  refDropdownIdx,
  setRefDropdownIdx,
  dropdownRef,
  evidenceExamples,
  memoOpenIdx,
  toggleMemo,
  evidencePopoverIdx,
  setEvidencePopoverIdx,
  toggleEvidence,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const i = origIdx;
  const { body: origBody, refs: origRefs } = splitRef(origCp);
  const editedBody = editing.checkpoints[i] ?? origBody;
  const editedRefs = editing.checkpointRefs[i] ?? [];
  const refsChanged = JSON.stringify(editedRefs) !== JSON.stringify(origRefs);
  const isDropdownOpen = refDropdownIdx === i;
  const currentImportance = editing.checkpointImportances[i] ?? inferImportance(origCp);
  const inferredImportance = inferImportance(origCp);
  const importanceChanged = currentImportance !== inferredImportance;
  const memoContent = editing.checkpointDetails[i] ?? '';
  const hasMemo = memoContent.length > 0;
  const isMemoOpen = memoOpenIdx.has(i);
  const connectedEvidenceCount = (editing.checkpointEvidences[i] ?? []).length;
  const isEvidencePopoverOpen = evidencePopoverIdx === i;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-ln bg-surface-base/50 px-3 py-2.5 space-y-2"
    >
      {/* Row 1: Drag handle + Number + Badge */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing text-tx-muted hover:text-tx-secondary touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <span className="shrink-0 text-[10px] font-bold text-tx-tertiary w-5 text-right">{displayNum}</span>
        <button
          type="button"
          onClick={() => setEditing({
            ...editing,
            checkpointImportances: {
              ...editing.checkpointImportances,
              [i]: currentImportance === 'MUST' ? 'SHOULD' : 'MUST',
            },
          })}
          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
            currentImportance === 'MUST'
              ? 'bg-danger-subtle text-danger-text'
              : 'bg-surface-sunken text-tx-tertiary'
          } ${importanceChanged ? 'ring-1 ring-status-hold-border' : ''}`}
          title={`클릭하여 ${currentImportance === 'MUST' ? '권고' : '필수'}로 변경`}
        >
          {currentImportance === 'MUST' ? '필수' : '권고'}
        </button>
      </div>

      {/* Row 2: Input (bigger, prominent) */}
      <div className="pl-9">
        <input
          className="w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-sm font-medium text-tx-primary"
          value={editedBody}
          onChange={(e) => setEditing({
            ...editing,
            checkpoints: { ...editing.checkpoints, [i]: e.target.value },
          })}
        />
      </div>

      {/* Row 3: Ref tag chips + Evidence tag + original diff */}
      <div className="pl-9 flex flex-wrap items-center gap-1.5">
        {/* Selected ref tags */}
        {editedRefs.map((ref) => (
          <span
            key={ref}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent-text border border-accent/20"
          >
            <FileDown size={9} />
            {ref}
            <button
              type="button"
              onClick={() => toggleRef(i, ref)}
              className="hover:text-danger-text transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {/* Add ref button + dropdown */}
        <div className="relative" ref={isDropdownOpen ? dropdownRef : undefined}>
          <button
            type="button"
            onClick={() => setRefDropdownIdx(isDropdownOpen ? null : i)}
            className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-dashed border-ln text-tx-muted hover:border-ln-strong hover:text-tx-secondary transition-colors"
            title="참고 자료 추가"
          >
            <Plus size={10} />
            참고자료
          </button>
          {isDropdownOpen && (
            <div className="absolute z-30 left-0 top-full mt-1 w-72 max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto rounded-lg border border-ln bg-surface-overlay shadow-lg">
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
                          {selected && '\u2713'}
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

        {/* Evidence inline tag with popover */}
        {evidenceExamples.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setEvidencePopoverIdx(isEvidencePopoverOpen ? null : i)}
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                connectedEvidenceCount > 0
                  ? 'bg-status-pass-bg text-status-pass-text border-status-pass-border'
                  : 'border-dashed border-ln text-tx-muted hover:border-ln-strong hover:text-tx-secondary'
              }`}
            >
              증빙 {connectedEvidenceCount}건
            </button>
            {isEvidencePopoverOpen && (
              <div className="absolute z-30 left-0 top-full mt-1 w-64 max-h-52 overflow-y-auto rounded-lg border border-ln bg-surface-overlay shadow-lg p-1.5">
                {evidenceExamples.map((ev, evIdx) => {
                  const selected = (editing.checkpointEvidences[i] ?? []).includes(evIdx);
                  return (
                    <button
                      key={evIdx}
                      type="button"
                      onClick={() => toggleEvidence(i, evIdx)}
                      className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-left text-xs transition-colors ${
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
                        {selected && '\u2713'}
                      </span>
                      {ev}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Original diff indicator */}
        {(editedBody !== origBody || refsChanged) && (
          <span className="text-[9px] text-tx-muted truncate max-w-48" title={`원본: ${origBody}${origRefs.length > 0 ? ` [ref: ${origRefs.join(', ')}]` : ''}`}>
            원본: {origBody.slice(0, 30)}{origBody.length > 30 ? '...' : ''}
          </span>
        )}
      </div>

      {/* Row 4: Collapsible memo disclosure */}
      <div className="pl-9">
        <button
          type="button"
          onClick={() => toggleMemo(i)}
          className="inline-flex items-center gap-1 text-[10px] text-tx-muted hover:text-tx-secondary transition-colors"
        >
          <ChevronRight size={12} className={`transition-transform ${isMemoOpen ? 'rotate-90' : ''}`} />
          <span>메모</span>
          {hasMemo && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
        </button>
        {isMemoOpen && (
          <textarea
            className="mt-1 w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary resize-y placeholder:text-tx-muted/50"
            value={memoContent}
            onChange={(e) => setEditing({
              ...editing,
              checkpointDetails: { ...editing.checkpointDetails, [i]: e.target.value },
            })}
            rows={2}
            placeholder="이 체크포인트에 대한 상세 메모를 입력하세요"
          />
        )}
      </div>
    </div>
  );
}

export function CheckpointEditor({
  checkPoints,
  editing,
  setEditing,
  groupedMaterials,
  toggleRef,
  refDropdownIdx,
  setRefDropdownIdx,
  dropdownRef,
  evidenceExamples,
}: CheckpointEditorProps) {
  const [memoOpenIdx, setMemoOpenIdx] = useState<Set<number>>(new Set());
  const [evidencePopoverIdx, setEvidencePopoverIdx] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleMemo = (idx: number) => {
    setMemoOpenIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleEvidence = (cpIdx: number, evIdx: number) => {
    const current = editing.checkpointEvidences[cpIdx] ?? [];
    const next = current.includes(evIdx)
      ? current.filter(i => i !== evIdx)
      : [...current, evIdx].sort((a, b) => a - b);
    setEditing({
      ...editing,
      checkpointEvidences: { ...editing.checkpointEvidences, [cpIdx]: next },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const order = editing.checkpointOrder;
    const oldIndex = order.indexOf(Number(String(active.id).replace('cp-', '')));
    const newIndex = order.indexOf(Number(String(over.id).replace('cp-', '')));
    if (oldIndex === -1 || newIndex === -1) return;

    setEditing({
      ...editing,
      checkpointOrder: arrayMove(order, oldIndex, newIndex),
    });
  };

  if (!checkPoints || checkPoints.length === 0) return null;

  const order = editing.checkpointOrder;
  const sortableIds = order.map((origIdx) => `cp-${origIdx}`);

  return (
    <div>
      <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">체크포인트</label>
      <p className="text-[9px] text-tx-muted mt-0.5 mb-1">드래그하여 순서를 변경할 수 있습니다</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="mt-1 space-y-2.5">
            {order.map((origIdx, pos) => (
              <SortableCheckpointCard
                key={`cp-${origIdx}`}
                id={`cp-${origIdx}`}
                origIdx={origIdx}
                displayNum={pos + 1}
                origCp={checkPoints[origIdx]}
                editing={editing}
                setEditing={setEditing}
                groupedMaterials={groupedMaterials}
                toggleRef={toggleRef}
                refDropdownIdx={refDropdownIdx}
                setRefDropdownIdx={setRefDropdownIdx}
                dropdownRef={dropdownRef}
                evidenceExamples={evidenceExamples}
                memoOpenIdx={memoOpenIdx}
                toggleMemo={toggleMemo}
                evidencePopoverIdx={evidencePopoverIdx}
                setEvidencePopoverIdx={setEvidencePopoverIdx}
                toggleEvidence={toggleEvidence}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
