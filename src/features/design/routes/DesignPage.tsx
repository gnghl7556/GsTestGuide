import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FeatureManager } from '../components/FeatureManager';
import { TestCaseManager } from '../components/TestCaseManager';
import { ProcessLayout } from '../../../components/Layout/ProcessLayout';
import { GlobalProcessHeader } from '../../../components/Layout/GlobalProcessHeader';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

export function DesignPage() {
  const location = useLocation();
  const { testSetup } = useTestSetupContext();
  const [activeTab, setActiveTab] = useState<'feature' | 'testcase'>('feature');

  useEffect(() => {
    const nextTab = (location.state as { tab?: 'feature' | 'testcase' } | null)?.tab;
    if (nextTab) {
      setActiveTab(nextTab);
    }
  }, [location.state]);

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
        <div className="p-4 space-y-3 text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">기능 트리</div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            기능 트리와 상세 정보는 중앙 영역에서 관리합니다.
          </div>
          <div className="pt-2 text-xs font-semibold text-slate-500">설계 탭</div>
          <button
            type="button"
            onClick={() => setActiveTab('feature')}
            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
              activeTab === 'feature'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            기능 명세
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('testcase')}
            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
              activeTab === 'testcase'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
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
        <div className="p-4 space-y-4 text-sm text-slate-600">
          <div className="text-xs font-semibold text-slate-500">AI 어시스턴트</div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">
            기능/TC 작성 시 필요한 가이드와 요약을 제공할 예정입니다.
          </div>
        </div>
      )}
    />
  );
}
