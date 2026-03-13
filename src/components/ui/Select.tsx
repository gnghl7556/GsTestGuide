import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  inputSize?: 'sm' | 'md';
};

const sizeStyles = {
  sm: 'h-9 text-xs',
  md: 'h-11 text-sm',
} as const;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ inputSize = 'md', className = '', children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`w-full appearance-none rounded-xl bg-input-bg border border-ln pl-3 pr-8 text-input-text focus:outline-none focus:ring-2 focus:ring-accent/60 ${sizeStyles[inputSize]} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-tx-muted"
        />
      </div>
    );
  },
);

Select.displayName = 'Select';
