import { forwardRef, type TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: 'default' | 'error';
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    const border =
      variant === 'error'
        ? 'border-danger focus:ring-danger/60'
        : 'border-ln focus:ring-accent/60';

    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl bg-input-bg ${border} border px-3 py-2.5 text-sm text-input-text placeholder:text-input-placeholder focus:outline-none focus:ring-2 resize-y ${className}`}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
