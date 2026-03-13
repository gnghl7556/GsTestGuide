import { forwardRef, type InputHTMLAttributes } from 'react';

const sizeStyles = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-3 text-sm',
} as const;

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'error';
  inputSize?: 'sm' | 'md';
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', inputSize = 'md', className = '', ...props }, ref) => {
    const border =
      variant === 'error'
        ? 'border-danger focus:ring-danger/60'
        : 'border-ln focus:ring-accent/60';

    return (
      <input
        ref={ref}
        className={`w-full rounded-xl bg-input-bg ${border} border text-input-text placeholder:text-input-placeholder focus:outline-none focus:ring-2 ${sizeStyles[inputSize]} ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
