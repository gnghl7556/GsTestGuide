import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-surface-200 bg-surface-base px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary-900">{title}</h1>
          {description && <p className="text-sm text-primary-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

type PageFilterBarProps = {
  children: ReactNode;
};

export function PageFilterBar({ children }: PageFilterBarProps) {
  return (
    <div className="bg-surface-raised px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

type PageContentProps = {
  children: ReactNode;
  className?: string;
};

export function PageContent({ children, className = '' }: PageContentProps) {
  return <section className={`flex-1 overflow-hidden ${className}`}>{children}</section>;
}
