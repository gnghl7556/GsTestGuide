interface AccessDeniedModalProps {
  open: boolean;
  onClose: () => void;
  testerName: string;
  plName: string;
}

export function AccessDeniedModal({ open, onClose, testerName, plName }: AccessDeniedModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-ln bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4">
          <div className="text-sm font-extrabold text-tx-primary">접근 권한 없음</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            닫기
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-tx-secondary space-y-3">
          <div className="rounded-lg border border-ln bg-surface-raised p-3 text-xs text-tx-secondary">
            선택한 시험은 현재 사용자에게 할당되지 않았습니다.
          </div>
          <div className="space-y-2 text-xs text-tx-secondary">
            <div>
              <span className="font-semibold text-tx-secondary">시험원:</span> {testerName}
            </div>
            <div>
              <span className="font-semibold text-tx-secondary">담당 PL:</span> {plName}
            </div>
          </div>
        </div>
        <div className="border-t border-ln px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
