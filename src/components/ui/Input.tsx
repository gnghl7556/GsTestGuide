import type { InputHTMLAttributes } from 'react';

const baseInputStyles =
  'w-full rounded-lg border px-3 py-2 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

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
        <label htmlFor={inputId} className="block text-xs font-semibold text-primary-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseInputStyles} ${error ? 'border-error-400 bg-error-50/40' : 'border-primary-200'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  );
}
