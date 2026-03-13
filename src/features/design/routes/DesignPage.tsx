import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessLayout } from '../../../components/Layout/ProcessLayout';
import { GlobalProcessHeader } from '../../../components/Layout/GlobalProcessHeader';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { useGuides } from '../../../hooks/useGuides';
import { GuideListSidebar } from '../../guide/components/GuideListSidebar';
import { WritingGuideContent } from '../../guide/components/WritingGuideContent';

export function DesignPage() {
  const navigate = useNavigate();
  const { testSetup } = useTestSetupContext();
  const guides = useGuides();
  const [activeGuideId, setActiveGuideId] = useState<string | null>(guides[0]?.id ?? null);

  const activeGuide = guides.find((g) => g.id === activeGuideId) ?? guides[0] ?? null;

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

  return (
      <ProcessLayout
        header={<GlobalProcessHeader currentStep={2} projectInfo={projectInfo} onNavigateStep={handleNavigateStep} />}
        sidebar={(
          <GuideListSidebar
            guides={guides}
            activeGuideId={activeGuide?.id ?? null}
            onSelectGuide={setActiveGuideId}
          />
        )}
        content={(
          <div className="h-full">
            {activeGuide ? (
              <WritingGuideContent guide={activeGuide} />
            ) : (
              <div className="h-full flex items-center justify-center p-6">
                <p className="text-sm text-tx-muted">가이드를 선택해주세요.</p>
              </div>
            )}
          </div>
        )}
      />
  );
}
