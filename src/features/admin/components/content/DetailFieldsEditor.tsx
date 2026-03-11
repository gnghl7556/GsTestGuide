import type { EditingState } from './types';

type DetailFieldsEditorProps = {
  editing: EditingState;
  setEditing: (state: EditingState) => void;
  originalReq: { evidenceExamples?: string[]; testSuggestions?: string[]; passCriteria?: string };
};

export function DetailFieldsEditor({ editing, setEditing, originalReq }: DetailFieldsEditorProps) {
  return (
    <>
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
        {JSON.stringify(editing.evidenceExamples) !== JSON.stringify(originalReq.evidenceExamples ?? []) && (
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
        {JSON.stringify(editing.testSuggestions) !== JSON.stringify(originalReq.testSuggestions ?? []) && (
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
        {editing.passCriteria !== (originalReq.passCriteria ?? '') && (
          <p className="mt-0.5 text-[9px] text-tx-muted">원본: {originalReq.passCriteria}</p>
        )}
      </div>
    </>
  );
}
