import { type ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';
import { BaseModal, type BaseModalSize } from './BaseModal';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: BaseModalSize;
  busy?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: () => void | Promise<void>;
  error?: string | null;
  children: ReactNode;
}

export function FormModal({
  open,
  onClose,
  title,
  size = 'lg',
  busy = false,
  submitLabel = '확인',
  cancelLabel = '취소',
  onSubmit,
  error,
  children,
}: FormModalProps) {
  const handleClose = () => {
    if (!busy) onClose();
  };

  return (
    <BaseModal open={open} onClose={handleClose} size={size}>
      <div className="flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4 shrink-0">
          <div className="text-sm font-extrabold text-tx-primary">{title}</div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-md border border-ln p-1.5 text-tx-muted hover:text-tx-primary hover:bg-surface-raised transition-colors disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {children}
          {error && (
            <div className="text-xs text-danger-text">{error}</div>
          )}
        </div>

        <div className="border-t border-ln px-5 py-3 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-lg border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:text-tx-primary disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60 flex items-center gap-1.5"
          >
            {busy && <Loader2 size={12} className="animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
