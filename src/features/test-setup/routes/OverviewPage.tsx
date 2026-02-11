import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { TestSetupView } from './TestSetupView';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { AdminPasswordModal } from '../../admin/components/AdminPasswordModal';

export function OverviewPage() {
  const navigate = useNavigate();
  const { startProject } = useTestSetupContext();
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
      <button
        type="button"
        onClick={() => setAdminModalOpen(true)}
        className="fixed top-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white/60 hover:text-white hover:border-white/40 hover:bg-white/15 transition-all"
        aria-label="관리자 페이지"
        title="관리자 페이지"
      >
        <Settings size={14} />
        <span className="hidden sm:inline">관리자</span>
      </button>
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
