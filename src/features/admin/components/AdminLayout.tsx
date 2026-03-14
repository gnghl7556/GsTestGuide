import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, FolderKanban, LogOut, Contact, FileBox, FileText, BookOpen, Menu, X } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-admin-sidebar-active-bg text-admin-sidebar-active-text'
        : 'text-admin-sidebar-item-text hover:bg-admin-sidebar-hover-bg hover:text-admin-sidebar-text'
    }`;

  const sidebarContent = (onNavClick?: () => void) => (
    <>
      <div className="px-4 py-4 border-b border-admin-sidebar-border text-[10px] font-bold uppercase tracking-wider text-admin-sidebar-label">
        관리자 메뉴
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={navLinkClass}
            onClick={onNavClick}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-admin-sidebar-border p-3">
        <button
          type="button"
          onClick={() => { onNavClick?.(); handleLogout(); }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-admin-sidebar-item-text hover:bg-admin-sidebar-active-bg hover:text-danger"
        >
          <LogOut size={14} />
          관리자 나가기
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-surface-raised">
      {/* 모바일 헤더 */}
      <div className="md:hidden flex items-center justify-between h-12 px-4 bg-admin-sidebar-bg text-admin-sidebar-text border-b border-admin-sidebar-border shrink-0">
        <button type="button" onClick={() => setSidebarOpen(true)} className="p-1 rounded-lg hover:bg-admin-sidebar-hover-bg transition-colors">
          <Menu size={20} />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-admin-sidebar-label">관리자 메뉴</span>
        <div className="w-7" />
      </div>

      {/* 모바일 오버레이 사이드바 */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-admin-sidebar-bg text-admin-sidebar-text shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-admin-sidebar-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-admin-sidebar-label">관리자 메뉴</span>
              <button type="button" onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-admin-sidebar-hover-bg transition-colors">
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navLinkClass}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-admin-sidebar-border p-3">
              <button
                type="button"
                onClick={() => { setSidebarOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-admin-sidebar-item-text hover:bg-admin-sidebar-active-bg hover:text-danger"
              >
                <LogOut size={14} />
                관리자 나가기
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-56 flex-col bg-admin-sidebar-bg text-admin-sidebar-text shrink-0">
        {sidebarContent()}
      </aside>

      <main className="flex-1 overflow-auto pt-12 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
