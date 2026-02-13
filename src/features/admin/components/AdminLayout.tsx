import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, FolderKanban, ArrowLeft, LogOut, Contact, FileBox } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

const NAV_ITEMS = [
  { path: '/admin/users', label: '사용자 관리', icon: Users },
  { path: '/admin/projects', label: '프로젝트 관리', icon: FolderKanban },
  { path: '/admin/contacts', label: '담당자 관리', icon: Contact },
  { path: '/admin/materials', label: '자료 관리', icon: FileBox },
] as const;

export function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen bg-surface-raised">
      <aside className="flex w-56 flex-col bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft size={14} />
            돌아가기
          </button>
        </div>
        <div className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          관리자 메뉴
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut size={14} />
            관리자 나가기
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
