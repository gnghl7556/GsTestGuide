interface DeleteUserConfirmModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  onConfirm: () => Promise<void>;
}

export function DeleteUserConfirmModal({ open, onClose, userName, onConfirm }: DeleteUserConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-xl text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-4">
          <div className="text-sm font-extrabold">사용자 삭제</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-white/10 px-2 py-1 text-xs font-semibold text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
          >
            닫기
          </button>
        </div>
        <div className="px-5 py-5 text-sm text-slate-700 dark:text-white/80">
          {userName} 사용자를 삭제하시겠습니까?
        </div>
        <div className="border-t border-slate-200 dark:border-white/10 px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
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
      </div>
    </div>
  );
}
