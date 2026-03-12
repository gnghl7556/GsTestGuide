import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FeatureManager } from '../components/FeatureManager';
import { TestCaseManager } from '../components/TestCaseManager';
import { GuideView } from '../components/GuideView';
import { ProcessLayout } from '../../../components/Layout/ProcessLayout';
import { GlobalProcessHeader } from '../../../components/Layout/GlobalProcessHeader';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { guideContent } from '../data/guideContent';

type ActiveView = 'feature' | 'testcase' | { guide: string };

export function DesignPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { testSetup } = useTestSetupContext();
  const initialTab = (location.state as { tab?: 'feature' | 'testcase' } | null)?.tab;
  const [activeView, setActiveView] = useState<ActiveView>(initialTab || 'feature');

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

  const handleNavigateStep = useCallback((step: number) => {
    const paths: Record<number, string> = { 2: '/design', 3: '/execution', 4: '/report' };
    const path = paths[step];
    if (!path) return;
    navigate(path);
  }, [navigate]);

  const activeGuideId = typeof activeView === 'object' ? activeView.guide : null;

  return (
      <ProcessLayout
        header={<GlobalProcessHeader currentStep={2} projectInfo={projectInfo} onNavigateStep={handleNavigateStep} />}
        sidebar={(
          <div className="p-4 space-y-1 text-sm text-tx-secondary">
            <div className="text-[10px] font-bold text-tx-muted uppercase tracking-wider px-2 mb-2">설계</div>
            <button
              type="button"
              onClick={() => setActiveView('feature')}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                activeView === 'feature'
                  ? 'bg-accent-subtle text-accent-text'
                  : 'text-tx-secondary hover:bg-interactive-hover'
              }`}
            >
              기능 명세
            </button>
            <button
              type="button"
              onClick={() => setActiveView('testcase')}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                activeView === 'testcase'
                  ? 'bg-accent-subtle text-accent-text'
                  : 'text-tx-secondary hover:bg-interactive-hover'
              }`}
            >
              테스트 케이스
            </button>

            <div className="border-t border-ln my-3" />
            <div className="text-[10px] font-bold text-tx-muted uppercase tracking-wider px-2 mb-2">가이드</div>
            {guideContent.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveView({ guide: section.id })}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 ${
                  activeGuideId === section.id
                    ? 'bg-accent-subtle text-accent-text font-semibold'
                    : 'text-tx-secondary hover:bg-interactive-hover'
                }`}
              >
                <span className="text-sm leading-none">{section.icon}</span>
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </div>
        )}
        content={(
          <div className="h-full">
            {activeView === 'feature' && <FeatureManager />}
            {activeView === 'testcase' && <TestCaseManager />}
            {activeGuideId && <GuideView initialSectionId={activeGuideId} />}
          </div>
        )}
      />
  );
}
