import { BaseModal } from '../../../../components/ui/BaseModal';

interface AgreementFailedModalProps {
  open: boolean;
  onClose: () => void;
}

export function AgreementFailedModal({ open, onClose }: AgreementFailedModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} size="xl">
      <div className="flex items-center justify-between border-b border-ln px-5 py-4">
        <div className="text-sm font-extrabold text-tx-primary">합의서 추출 실패</div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
        >
          닫기
        </button>
      </div>
      <div className="px-5 py-4 text-sm text-danger-text">
        합의서 내용을 추출하지 못했습니다. 파일을 다시 업로드하거나 형식을 확인해주세요.
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
    </BaseModal>
  );
}
