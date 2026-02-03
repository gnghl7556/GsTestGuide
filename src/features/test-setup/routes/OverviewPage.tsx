import { useNavigate } from 'react-router-dom';
import { TestSetupView } from './TestSetupView';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

export function OverviewPage() {
  const navigate = useNavigate();
  const { startProject } = useTestSetupContext();

  const handleStartProject = async (): Promise<{ ok: boolean; reason?: string }> => {
    const result = await startProject();
    if (result.ok) {
      navigate('/execution');
    }
    return result;
  };

  return <TestSetupView onStartProject={handleStartProject} />;
}
