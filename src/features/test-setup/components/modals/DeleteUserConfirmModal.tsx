import { BaseModal } from '../../../../components/ui/BaseModal';

interface DeleteUserConfirmModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  onConfirm: () => Promise<void>;
}

export function DeleteUserConfirmModal({ open, onClose, userName, onConfirm }: DeleteUserConfirmModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} size="lg">
      <div className="flex items-center justify-between border-b border-ln px-5 py-4">
        <div className="text-sm font-extrabold text-tx-primary">사용자 삭제</div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
        >
          닫기
        </button>
      </div>
      <div className="px-5 py-5 text-sm text-tx-secondary">
        {userName} 사용자를 삭제하시겠습니까?
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
          onClick={async () => {
            await onConfirm();
            onClose();
          }}
          className="rounded-md bg-danger px-4 py-2 text-xs font-semibold text-white"
        >
          삭제
        </button>
      </div>
    </BaseModal>
  );
}
