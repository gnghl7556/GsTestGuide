import { ChevronDown, FileDown } from 'lucide-react';
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
  if (!checkPoints || checkPoints.length === 0) return null;

  return (
    <div>
      <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">체크포인트</label>
      <div className="mt-1 space-y-2.5">
        {checkPoints.map((origCp: string, i: number) => {
          const { body: origBody, refs: origRefs } = splitRef(origCp);
          const editedBody = editing.checkpoints[i] ?? origBody;
          const editedRefs = editing.checkpointRefs[i] ?? [];
          const refsChanged = JSON.stringify(editedRefs) !== JSON.stringify(origRefs);
          const isDropdownOpen = refDropdownIdx === i;
          const currentImportance = editing.checkpointImportances[i] ?? inferImportance(origCp);
          const inferredImportance = inferImportance(origCp);
          const importanceChanged = currentImportance !== inferredImportance;
          return (
            <div key={i} className="rounded-lg border border-ln bg-surface-base/50 overflow-hidden">
              <div className="flex items-start gap-2 px-3 pt-2.5 pb-2">
              <span className="shrink-0 mt-1.5 text-[10px] font-bold text-tx-tertiary w-5 text-right">{i + 1}</span>
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
                  {/* MUST/SHOULD toggle */}
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
                        ? 'bg-danger-subtle text-danger-text'
                        : 'bg-surface-sunken text-tx-tertiary'
                    } ${importanceChanged ? 'ring-1 ring-status-hold-border' : ''}`}
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
                {(editedBody !== origBody || refsChanged) && (
                  <p className="text-[9px] text-tx-muted truncate">
                    원본: {origBody}{origRefs.length > 0 ? ` [ref: ${origRefs.join(', ')}]` : ''}
                  </p>
                )}
              </div>
              </div>
              {/* detail memo at card bottom */}
              <div className="border-t border-ln bg-surface-sunken/40 px-3 py-2 space-y-2">
                <textarea
                  className="w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary resize-y placeholder:text-tx-muted/50"
                  value={editing.checkpointDetails[i] ?? ''}
                  onChange={(e) => setEditing({
                    ...editing,
                    checkpointDetails: { ...editing.checkpointDetails, [i]: e.target.value },
                  })}
                  rows={1}
                  placeholder="이 체크포인트에 대한 상세 메모를 입력하세요"
                />
                {evidenceExamples.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-tx-muted uppercase tracking-wider">증빙 예시 연결</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {evidenceExamples.map((ev, evIdx) => {
                        const selected = (editing.checkpointEvidences[i] ?? []).includes(evIdx);
                        return (
                          <button
                            key={evIdx}
                            type="button"
                            onClick={() => toggleEvidence(i, evIdx)}
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition-colors ${
                              selected
                                ? 'bg-accent/10 text-accent-text border-accent/30 font-semibold'
                                : 'bg-surface-base text-tx-muted border-ln hover:border-ln-strong hover:text-tx-secondary'
                            }`}
                          >
                            <span className={`shrink-0 h-3 w-3 rounded-sm border flex items-center justify-center text-[7px] ${
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
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
