import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string | ReactNode;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'success' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  icon?: ReactNode;
};

export function ConfirmModal({
  open, title, description, confirmLabel, confirmVariant = 'danger',
  onConfirm, onCancel, busy, icon,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel, busy]);

  if (!open) return null;

  const confirmCls =
    confirmVariant === 'success'
      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
      : confirmVariant === 'warning'
        ? 'bg-amber-500 hover:bg-amber-600 text-white'
        : 'bg-danger hover:bg-danger-hover text-white';

  if (icon) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl border border-ln bg-surface-overlay shadow-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h3 className="text-sm font-extrabold text-tx-primary">{title}</h3>
              <div className="text-xs text-tx-tertiary mt-0.5">{description}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover disabled:opacity-40"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${confirmCls} disabled:opacity-60 flex items-center gap-1.5`}
            >
              {busy && <Loader2 size={12} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <button type="button" onClick={onCancel} disabled={busy}
            className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary disabled:opacity-40">
            취소
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${confirmCls} disabled:opacity-60 flex items-center gap-1.5`}>
            {busy && <Loader2 size={12} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
