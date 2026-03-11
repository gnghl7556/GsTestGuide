import type { ReactNode } from 'react';

type AdminPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-extrabold text-tx-primary">{title}</h1>
        <p className="text-xs text-tx-tertiary mt-1">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
