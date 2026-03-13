import { useEffect, useRef, useCallback, type ReactNode } from 'react';

export type BaseModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: BaseModalSize;
  className?: string;
  closeOnEsc?: boolean;
  closeOnBackdropClick?: boolean;
  ariaLabelledBy?: string;
}

const sizeClasses: Record<BaseModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'w-full h-full',
};

export function BaseModal({
  open,
  onClose,
  children,
  size = 'sm',
  className = '',
  closeOnEsc = true,
  closeOnBackdropClick = true,
  ariaLabelledBy,
}: BaseModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, closeOnEsc]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);

    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) onClose();
  }, [closeOnBackdropClick, onClose]);

  if (!open) return null;

  const isFullSize = size === 'full';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] backdrop-blur-sm ${isFullSize ? 'p-3' : 'p-4'}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby={ariaLabelledBy}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={`w-full ${sizeClasses[size]} ${isFullSize ? 'rounded-xl' : 'rounded-2xl'} border border-ln bg-surface-overlay shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
