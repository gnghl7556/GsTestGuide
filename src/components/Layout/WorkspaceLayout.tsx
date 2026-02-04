import { Outlet, useLocation } from 'react-router-dom';
import { GlobalProcessHeader } from './GlobalProcessHeader';
import { ProcessLayout } from './ProcessLayout';
import { useTestSetupContext } from '../../providers/useTestSetupContext';

const getStepFromPath = (pathname: string) => {
  if (pathname.startsWith('/design')) return 2;
  if (pathname.startsWith('/execution')) return 3;
  if (pathname.startsWith('/report')) return 4;
  return 1;
};

export function WorkspaceLayout() {
  const location = useLocation();
  const { testSetup } = useTestSetupContext();
  const currentStep = getStepFromPath(location.pathname);

  const projectInfo = {
    testNumber: testSetup.testNumber,
    projectName: testSetup.projectName,
    companyName: testSetup.companyName,
    scheduleWorkingDays: testSetup.scheduleWorkingDays,
    scheduleStartDate: testSetup.scheduleStartDate,
    scheduleEndDate: testSetup.scheduleEndDate,
    plName: testSetup.plName,
    companyContactName: testSetup.companyContactName
  };

  return (
    <ProcessLayout
      header={<GlobalProcessHeader currentStep={currentStep} projectInfo={projectInfo} />}
      content={<Outlet />}
    />
  );
}
