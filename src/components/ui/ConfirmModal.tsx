import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { BaseModal } from './BaseModal';

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
  const confirmCls =
    confirmVariant === 'success'
      ? 'bg-status-pass-text hover:opacity-90 text-white'
      : confirmVariant === 'warning'
        ? 'bg-status-hold-text hover:opacity-90 text-white'
        : 'bg-danger hover:bg-danger-hover text-white';

  const handleClose = () => { if (!busy) onCancel(); };

  if (icon) {
    return (
      <BaseModal open={open} onClose={handleClose} size="sm">
        <div className="p-6 space-y-4">
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
      </BaseModal>
    );
  }

  return (
    <BaseModal open={open} onClose={handleClose} size="sm" className="rounded-xl shadow-xl">
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
    </BaseModal>
  );
}
