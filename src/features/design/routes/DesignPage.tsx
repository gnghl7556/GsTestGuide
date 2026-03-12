import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { FeatureManager } from '../components/FeatureManager';
import { TestCaseManager } from '../components/TestCaseManager';
import { GuideView } from '../components/GuideView';
import { ProcessLayout } from '../../../components/Layout/ProcessLayout';
import { GlobalProcessHeader } from '../../../components/Layout/GlobalProcessHeader';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { db } from '../../../lib/firebase';

export function DesignPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { testSetup } = useTestSetupContext();
  const initialTab = (location.state as { tab?: 'feature' | 'testcase' | 'guide' } | null)?.tab;
  const [activeTab, setActiveTab] = useState<'feature' | 'testcase' | 'guide'>(initialTab || 'feature');
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);
  const [stepWarning, setStepWarning] = useState('');

  const projectInfo = {
    testNumber: testSetup.testNumber,
    projectName: testSetup.projectName,
    companyName: testSetup.companyName,
    scheduleWorkingDays: testSetup.scheduleWorkingDays,
    scheduleStartDate: testSetup.scheduleStartDate,
    scheduleEndDate: testSetup.scheduleEndDate,
    scheduleDefect1: testSetup.scheduleDefect1,
    scheduleDefect2: testSetup.scheduleDefect2,
    schedulePatchDate: testSetup.schedulePatchDate,
    plName: testSetup.plName,
    companyContactName: testSetup.companyContactName,
    companyContactPhone: testSetup.companyContactPhone,
    companyContactEmail: testSetup.companyContactEmail
  };

  const handleNavigateStep = useCallback(async (step: number) => {
    const paths: Record<number, string> = { 2: '/design', 3: '/execution', 4: '/report' };
    const path = paths[step];
    if (!path) return;

    // Forward navigation to execution or report — check if design has data
    if (step >= 3 && db && testSetup.testNumber) {
      const featuresSnap = await getDocs(query(collection(db, 'projects', testSetup.testNumber, 'features'), limit(1)));
      if (featuresSnap.empty) {
        setPendingNavPath(path);
        setStepWarning('설계 단계에 기능 명세가 작성되지 않았습니다. 건너뛰시겠습니까?');
        return;
      }
    }

    navigate(path);
  }, [navigate, testSetup.testNumber]);

  return (
    <>
      <ProcessLayout
        header={<GlobalProcessHeader currentStep={2} projectInfo={projectInfo} onNavigateStep={(step) => void handleNavigateStep(step)} />}
        sidebar={(
          <div className="p-4 space-y-3 text-sm text-tx-secondary">
            <div className="text-xs font-semibold text-tx-tertiary">기능 트리</div>
            <div className="rounded-lg border border-ln bg-surface-raised p-3 text-xs text-tx-tertiary">
              기능 트리와 상세 정보는 중앙 영역에서 관리합니다.
            </div>
            <div className="pt-2 text-xs font-semibold text-tx-tertiary">설계 탭</div>
            <button
              type="button"
              onClick={() => setActiveTab('feature')}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                activeTab === 'feature'
                  ? 'bg-accent-subtle text-accent-text'
                  : 'text-tx-secondary hover:bg-interactive-hover'
              }`}
            >
              기능 명세
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('testcase')}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                activeTab === 'testcase'
                  ? 'bg-accent-subtle text-accent-text'
                  : 'text-tx-secondary hover:bg-interactive-hover'
              }`}
            >
              테스트 케이스
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                activeTab === 'guide'
                  ? 'bg-accent-subtle text-accent-text'
                  : 'text-tx-secondary hover:bg-interactive-hover'
              }`}
            >
              가이드
            </button>
          </div>
        )}
        content={(
          <div className="h-full">
            {activeTab === 'feature' && <FeatureManager />}
            {activeTab === 'testcase' && <TestCaseManager />}
            {activeTab === 'guide' && <GuideView />}
          </div>
        )}
        panel={(
          <div className="p-4 space-y-4 text-sm text-tx-secondary">
            <div className="text-xs font-semibold text-tx-tertiary">AI 어시스턴트</div>
            <div className="rounded-lg border border-ln bg-surface-base p-3 text-xs text-tx-tertiary">
              기능/TC 작성 시 필요한 가이드와 요약을 제공할 예정입니다.
            </div>
          </div>
        )}
      />
      <ConfirmModal
        open={!!pendingNavPath}
        title="단계 전환 확인"
        description={stepWarning}
        confirmLabel="건너뛰기"
        confirmVariant="warning"
        onConfirm={() => { const p = pendingNavPath; setPendingNavPath(null); setStepWarning(''); if (p) navigate(p); }}
        onCancel={() => { setPendingNavPath(null); setStepWarning(''); }}
      />
    </>
  );
}
