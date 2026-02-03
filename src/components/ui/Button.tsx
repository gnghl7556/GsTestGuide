import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantStyles = {
  primary: 'bg-primary-800 text-white hover:bg-primary-700',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-500',
  outline: 'border border-primary-200 text-primary-800 hover:bg-primary-50',
  ghost: 'text-primary-700 hover:bg-primary-50'
} as const;

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base'
} as const;

type ButtonVariant = keyof typeof variantStyles;

type ButtonSize = keyof typeof sizeStyles;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={16} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={16} />}
    </button>
  );
}
