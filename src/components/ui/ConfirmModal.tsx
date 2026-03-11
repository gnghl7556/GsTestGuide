import { useEffect } from 'react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open, title, description, confirmLabel, confirmVariant = 'danger', onConfirm, onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmCls = confirmVariant === 'success'
    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
    : 'bg-danger hover:bg-danger-hover text-white';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
      <div className="w-full max-w-sm rounded-xl border border-ln bg-surface-overlay shadow-xl">
        <div className="border-b border-ln px-4 py-3 text-sm font-extrabold text-tx-primary">
          {title}
        </div>
        <div className="px-4 py-3 text-sm text-tx-secondary">
          {description}
        </div>
        <div className="flex justify-end gap-2 border-t border-ln px-4 py-3">
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary">
            취소
          </button>
          <button type="button" onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${confirmCls}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
