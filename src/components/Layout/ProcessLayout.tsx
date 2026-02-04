import type { ReactNode } from 'react';

type ProcessLayoutProps = {
  header?: ReactNode;
  sidebar?: ReactNode;
  content?: ReactNode;
  panel?: ReactNode;
};

export function ProcessLayout({ header, sidebar, content, panel }: ProcessLayoutProps) {
  const hasSidebar = Boolean(sidebar);
  const hasPanel = Boolean(panel);
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100">
      {header && <div className="flex-none z-10">{header}</div>}
      <div className="flex-1 flex overflow-hidden">
        {hasSidebar && (
          <aside className="w-[clamp(240px,20vw,320px)] flex-none border-r border-slate-200 bg-white overflow-y-auto">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-none">{content}</div>
        </main>
        {hasPanel && (
          <aside className="w-[clamp(280px,24vw,380px)] flex-none border-l border-slate-200 bg-white overflow-y-auto">
            {panel}
          </aside>
        )}
      </div>
    </div>
  );
}
