import { Plus, X } from 'lucide-react';
import type { EditingState } from './types';

type DetailFieldsEditorProps = {
  editing: EditingState;
  setEditing: (state: EditingState) => void;
  originalReq: { evidenceExamples?: string[]; testSuggestions?: string[]; passCriteria?: string };
};

function ListFieldEditor({
  label,
  placeholder,
  items,
  originalItems,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  originalItems: string[];
  onChange: (next: string[]) => void;
}) {
  const changed = JSON.stringify(items.filter(s => s.trim())) !== JSON.stringify(originalItems);

  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, '']);
  };

  // 삭제된 원본 항목 (items에 없는 originalItems 항목)
  const deletedOriginals = originalItems.slice(items.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">{label}</label>
        {changed && <span className="text-[9px] text-status-hold-text font-medium">원본과 다름</span>}
      </div>
      {items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map((item, i) => {
            const isNew = i >= originalItems.length;
            const isChanged = !isNew && item !== originalItems[i];
            return (
              <div key={i}>
                <div className={`flex items-center gap-1.5 ${
                  isNew || isChanged ? 'pl-0' : ''
                }`}>
                  <span className="shrink-0 text-[10px] font-bold text-tx-tertiary w-4 text-right">{i + 1}</span>
                  <input
                    className={`flex-1 rounded border bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary focus:border-accent focus:outline-none transition-colors ${
                      isNew || isChanged
                        ? 'border-l-[3px] border-l-status-hold-border border-t-ln border-r-ln border-b-ln bg-status-hold-bg/20'
                        : 'border-ln'
                    }`}
                    value={item}
                    onChange={(e) => updateItem(i, e.target.value)}
                    placeholder={placeholder}
                  />
                  {isNew && (
                    <span className="shrink-0 text-[8px] font-bold text-status-pass-text bg-status-pass-bg px-1 py-0.5 rounded">
                      + 신규
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="shrink-0 rounded p-1 text-tx-muted hover:text-status-fail-text hover:bg-status-fail-bg transition-colors"
                    title="삭제"
                  >
                    <X size={13} />
                  </button>
                </div>
                {isChanged && (
                  <div className="ml-5 mt-1 flex items-center gap-1.5 bg-surface-sunken rounded px-2 py-1">
                    <span className="shrink-0 text-[9px] font-semibold text-tx-muted">원본</span>
                    <span className="text-[10px] text-tx-muted line-through truncate">{originalItems[i]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-tx-muted py-2">항목이 없습니다</p>
      )}

      {/* 삭제된 원본 항목 표시 */}
      {deletedOriginals.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {deletedOriginals.map((orig, di) => (
            <div key={`del-${di}`} className="flex items-center gap-1.5 ml-5 bg-surface-sunken rounded px-2 py-1 opacity-60">
              <span className="shrink-0 text-[9px] font-semibold text-status-fail-text">삭제</span>
              <span className="text-[10px] text-tx-muted line-through truncate">{orig}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-tx-muted hover:text-accent-text transition-colors px-1 py-0.5"
      >
        <Plus size={11} /> 항목 추가
      </button>
    </div>
  );
}

export function DetailFieldsEditor({ editing, setEditing, originalReq }: DetailFieldsEditorProps) {
  return (
    <>
      <ListFieldEditor
        label="증빙 예시"
        placeholder="예: 테스트 결과 보고서 캡처"
        items={editing.evidenceExamples}
        originalItems={originalReq.evidenceExamples ?? []}
        onChange={(next) => {
          // 증빙 삭제 시 checkpointEvidences 인덱스 리매핑
          if (next.length < editing.evidenceExamples.length) {
            let removedIdx = -1;
            for (let i = 0; i < editing.evidenceExamples.length; i++) {
              if (i >= next.length || editing.evidenceExamples[i] !== next[i]) {
                removedIdx = i;
                break;
              }
            }
            if (removedIdx >= 0) {
              const remapped: Record<number, number[]> = {};
              for (const [cpStr, indices] of Object.entries(editing.checkpointEvidences)) {
                const updated = indices
                  .filter(ei => ei !== removedIdx)
                  .map(ei => ei > removedIdx ? ei - 1 : ei);
                if (updated.length > 0) remapped[Number(cpStr)] = updated;
              }
              setEditing({ ...editing, evidenceExamples: next, checkpointEvidences: remapped });
              return;
            }
          }
          setEditing({ ...editing, evidenceExamples: next });
        }}
      />

      <ListFieldEditor
        label="테스트 제안"
        placeholder="예: 기능 테스트 시나리오 작성"
        items={editing.testSuggestions}
        originalItems={originalReq.testSuggestions ?? []}
        onChange={(next) => setEditing({ ...editing, testSuggestions: next })}
      />

      {/* Pass Criteria — 단일 값이므로 텍스트영역 유지 */}
      <div>
        <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">판정 기준</label>
        <textarea
          className={`mt-1 w-full rounded border bg-surface-base px-3 py-2 text-xs text-tx-primary resize-y min-h-[40px] focus:border-accent focus:outline-none transition-colors ${
            editing.passCriteria !== (originalReq.passCriteria ?? '')
              ? 'border-l-[3px] border-l-status-hold-border border-t-ln border-r-ln border-b-ln bg-status-hold-bg/20'
              : 'border-ln'
          }`}
          value={editing.passCriteria}
          onChange={(e) => setEditing({ ...editing, passCriteria: e.target.value })}
          rows={2}
          placeholder="예: 모든 체크포인트 충족 시 적합"
        />
        {editing.passCriteria !== (originalReq.passCriteria ?? '') && (
          <div className="mt-1.5 flex items-start gap-1.5 bg-surface-sunken rounded px-2 py-1">
            <span className="shrink-0 text-[9px] font-semibold text-tx-muted mt-px">원본</span>
            <span className="text-[10px] text-tx-muted line-through">{originalReq.passCriteria}</span>
          </div>
        )}
      </div>
    </>
  );
}
