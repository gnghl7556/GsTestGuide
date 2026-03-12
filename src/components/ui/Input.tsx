import type { InputHTMLAttributes } from 'react';

const baseInputStyles =
  'w-full rounded-lg border bg-input-bg px-3 py-2 text-sm text-input-text placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-tx-muted';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export function Input({
  label,
  error,
  id,
  className = '',
  containerClassName = '',
  ...props
}: InputProps) {
  const inputId = id || props.name;
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-tx-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseInputStyles} ${error ? 'border-danger bg-danger-subtle text-danger-text' : 'border-input-border'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger-text">{error}</p>}
    </div>
  );
}
