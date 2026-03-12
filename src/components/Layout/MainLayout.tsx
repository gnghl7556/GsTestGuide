import { NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, PenTool, ClipboardCheck, FileText } from 'lucide-react';

const navItems = [
  { label: '개요', path: '/dashboard', icon: LayoutGrid },
  { label: '설계', path: '/design', icon: PenTool },
  { label: '수행', path: '/execution', icon: ClipboardCheck },
  { label: '결과', path: '/report', icon: FileText }
];

export function MainLayout() {
  return (
    <div className="min-h-screen bg-surface-base text-tx-primary grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="hidden md:flex bg-primary-900 text-white flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="text-sm uppercase tracking-widest text-white/60">GS 인증</div>
          <div className="text-xl font-extrabold">시험 가이드</div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-secondary-500 text-white shadow-[0_10px_20px_rgba(20,184,166,0.35)]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-xs text-white/50 border-t border-white/10">GS Test Guide</div>
      </aside>

      <div className="flex flex-col min-h-screen">
        <header className="h-16 border-b border-ln bg-surface-base/80 backdrop-blur flex items-center px-6">
          <h1 className="text-lg font-bold text-tx-primary">GS 인증 시험 가이드</h1>
        </header>
        <main className="flex-1 p-6 bg-surface-base">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
