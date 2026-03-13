import { useEffect, type ReactNode } from 'react';

type BaseModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: BaseModalSize;
  className?: string;
}

const sizeClasses: Record<BaseModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function BaseModal({ open, onClose, children, size = 'sm', className = '' }: BaseModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] backdrop-blur-sm p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-2xl border border-ln bg-surface-overlay shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
