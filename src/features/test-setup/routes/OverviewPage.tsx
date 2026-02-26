import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Sun, Moon } from 'lucide-react';
import { TestSetupView } from './TestSetupView';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { useTheme } from '../../../providers/ThemeProvider';
import { AdminPasswordModal } from '../../admin/components/AdminPasswordModal';

export function OverviewPage() {
  const navigate = useNavigate();
  const { startProject } = useTestSetupContext();
  const { theme, toggleTheme } = useTheme();
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const handleStartProject = async (): Promise<{ ok: boolean; reason?: string }> => {
    const result = await startProject();
    if (result.ok) {
      navigate('/execution');
    }
    return result;
  };

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-sm w-9 h-9 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/40 hover:bg-white dark:hover:bg-white/15 transition-all"
          aria-label={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          type="button"
          onClick={() => setAdminModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/40 hover:bg-white dark:hover:bg-white/15 transition-all"
          aria-label="관리자 페이지"
          title="관리자 페이지"
        >
          <Settings size={14} />
          <span className="hidden sm:inline">관리자</span>
        </button>
      </div>
      <TestSetupView onStartProject={handleStartProject} />
      <AdminPasswordModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={() => {
          setAdminModalOpen(false);
          navigate('/admin');
        }}
      />
    </div>
  );
}
