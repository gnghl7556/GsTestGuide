import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FeatureManager } from '../components/FeatureManager';
import { TestCaseManager } from '../components/TestCaseManager';
import { ProcessLayout } from '../../../components/Layout/ProcessLayout';
import { GlobalProcessHeader } from '../../../components/Layout/GlobalProcessHeader';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

export function DesignPage() {
  const location = useLocation();
  const { testSetup } = useTestSetupContext();
  const initialTab = (location.state as { tab?: 'feature' | 'testcase' } | null)?.tab;
  const [activeTab, setActiveTab] = useState<'feature' | 'testcase'>(initialTab || 'feature');

  const projectInfo = {
    testNumber: testSetup.testNumber,
    projectName: testSetup.projectName,
    companyName: testSetup.companyName,
    scheduleWorkingDays: testSetup.scheduleWorkingDays,
    scheduleStartDate: testSetup.scheduleStartDate,
    scheduleEndDate: testSetup.scheduleEndDate,
    plName: testSetup.plName,
    companyContactName: testSetup.companyContactName,
    companyContactPhone: testSetup.companyContactPhone,
    companyContactEmail: testSetup.companyContactEmail
  };

  return (
    <ProcessLayout
      header={<GlobalProcessHeader currentStep={2} projectInfo={projectInfo} />}
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
        </div>
      )}
      content={(
        <div className="h-full">
          {activeTab === 'feature' ? <FeatureManager /> : <TestCaseManager />}
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
  );
}
