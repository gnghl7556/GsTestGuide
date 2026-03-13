import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Sun, Moon } from 'lucide-react';
import { TestSetupView } from './TestSetupView';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { useTheme } from '../../../providers/ThemeProvider';
import { AdminPasswordModal } from '../../admin/components/AdminPasswordModal';

export function OverviewPage() {
  const navigate = useNavigate();
  const { startProject, selectTestNumber } = useTestSetupContext();
  const { theme, toggleTheme } = useTheme();
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const handleStartProject = async (): Promise<{ ok: boolean; reason?: string }> => {
    const result = await startProject();
    if (result.ok) {
      navigate('/execution');
    }
    return result;
  };

  const handleQuickStart = (testNumber: string) => {
    selectTestNumber(testNumber);
    navigate('/execution');
  };

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center justify-center rounded-lg border border-ln-strong bg-surface-overlay backdrop-blur-sm w-9 h-9 text-tx-tertiary hover:text-tx-primary hover:border-ln-strong hover:bg-interactive-hover transition-all"
          aria-label={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          type="button"
          onClick={() => setAdminModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ln-strong bg-surface-overlay backdrop-blur-sm px-3 py-2 text-xs font-semibold text-tx-tertiary hover:text-tx-primary hover:border-ln-strong hover:bg-interactive-hover transition-all"
          aria-label="관리자 페이지"
          title="관리자 페이지"
        >
          <Settings size={14} />
          <span className="hidden sm:inline">관리자</span>
        </button>
      </div>
      <TestSetupView onStartProject={handleStartProject} onQuickStart={handleQuickStart} />
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
