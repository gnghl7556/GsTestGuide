import type { ReactNode } from 'react';

type ProcessLayoutProps = {
  header?: ReactNode;
  sidebar?: ReactNode;
  content?: ReactNode;
  panel?: ReactNode;
};

export function ProcessLayout({ header, sidebar, content, panel }: ProcessLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {header && <div className="flex-none z-10">{header}</div>}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[280px] flex-none border-r border-slate-200 bg-white overflow-y-auto">
          {sidebar}
        </aside>
        <main className="flex-1 min-w-0 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto w-full">{content}</div>
        </main>
        <aside className="w-[320px] flex-none border-l border-slate-200 bg-white overflow-y-auto">
          {panel}
        </aside>
      </div>
    </div>
  );
}
