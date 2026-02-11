interface AgreementDeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AgreementDeleteConfirmModal({ open, onClose, onConfirm }: AgreementDeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-ln bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4">
          <div className="text-sm font-extrabold text-tx-primary">시험 합의서 삭제</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            닫기
          </button>
        </div>
        <div className="px-5 py-5 text-sm text-tx-secondary">
          기존 시험 합의서 파일을 삭제하시겠습니까?
          <span className="block mt-2 text-xs text-tx-tertiary">(삭제 시, 추출한 정보가 초기화됩니다.)</span>
        </div>
        <div className="border-t border-ln px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:text-tx-primary"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="rounded-md bg-danger px-4 py-2 text-xs font-semibold text-white"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
