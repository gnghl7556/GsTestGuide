import type { InputHTMLAttributes } from 'react';

const baseInputStyles =
  'w-full rounded-lg border bg-white/90 px-3 py-2 text-sm text-primary-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-primary-400 disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-500';

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
        <label htmlFor={inputId} className="block text-xs font-semibold text-surface-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseInputStyles} ${error ? 'border-error-400 bg-error-50/40 text-error-700' : 'border-surface-200'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  );
}
