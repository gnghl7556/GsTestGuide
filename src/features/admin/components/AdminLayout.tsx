import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, FolderKanban, LogOut, Contact, FileBox, FileText, BookOpen } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

const NAV_ITEMS = [
  { path: '/admin/users', label: '사용자 관리', icon: Users },
  { path: '/admin/projects', label: '프로젝트 관리', icon: FolderKanban },
  { path: '/admin/contacts', label: '담당자 관리', icon: Contact },
  { path: '/admin/materials', label: '자료 관리', icon: FileBox },
  { path: '/admin/content', label: '콘텐츠 관리', icon: FileText },
  { path: '/admin/guides', label: '참고 가이드', icon: BookOpen },
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
      <aside className="flex w-56 flex-col bg-admin-sidebar-bg text-admin-sidebar-text">
        <div className="px-4 py-4 border-b border-admin-sidebar-border text-[10px] font-bold uppercase tracking-wider text-admin-sidebar-label">
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
                    ? 'bg-admin-sidebar-active-bg text-admin-sidebar-active-text'
                    : 'text-admin-sidebar-item-text hover:bg-admin-sidebar-hover-bg hover:text-admin-sidebar-text'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-admin-sidebar-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-admin-sidebar-item-text hover:bg-admin-sidebar-active-bg hover:text-danger"
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
