import { TestSetupPage } from '../components/TestSetupPage';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

type TestSetupViewProps = {
  onStartProject: () => Promise<{ ok: boolean; reason?: string }>;
};

export function TestSetupView({ onStartProject }: TestSetupViewProps) {
  const {
    testSetup,
    projects,
    plDirectory,
    users,
    currentUserId,
    setCurrentUserId,
    createUser,
    updateUser,
    deleteUser,
    progressByTestNumber,
    selectTestNumber,
    updateTestNumber,
    createProjectFromInput,
    updatePlId,
    updateScheduleStartDate,
    updateScheduleEndDate,
    updateManualInfo,
    uploadAgreementDoc,
    deleteAgreementDoc,
    agreementParsing,
    agreementParsingTestNumber,
    canProceed
  } = useTestSetupContext();
  return (
    <div className="flex-1 min-h-0 pb-2">
      <TestSetupPage
        testNumber={testSetup.testNumber}
        plId={testSetup.plId}
        scheduleStartDate={testSetup.scheduleStartDate}
        scheduleEndDate={testSetup.scheduleEndDate}
        projectName={testSetup.projectName}
        companyName={testSetup.companyName}
        companyContactName={testSetup.companyContactName}
        companyContactPhone={testSetup.companyContactPhone}
        companyContactEmail={testSetup.companyContactEmail}
        projects={projects}
        plDirectory={plDirectory}
        users={users}
        currentUserId={currentUserId}
        onChangeUserId={setCurrentUserId}
        onCreateUser={createUser}
        onUpdateUser={updateUser}
        onDeleteUser={deleteUser}
        progressByTestNumber={progressByTestNumber}
        docs={testSetup.docs}
        agreementParsed={testSetup.agreementParsed}
        onSelectProject={selectTestNumber}
        onChangeTestNumber={updateTestNumber}
        onSaveTestNumber={createProjectFromInput}
        onChangePlId={updatePlId}
        onChangeScheduleStartDate={updateScheduleStartDate}
        onChangeScheduleEndDate={updateScheduleEndDate}
        onUpdateManualInfo={updateManualInfo}
        onUploadAgreementDoc={uploadAgreementDoc}
        onDeleteAgreementDoc={deleteAgreementDoc}
        isParsingAgreement={agreementParsing}
        parsingTestNumber={agreementParsingTestNumber}
        onStartProject={onStartProject}
        canProceed={canProceed}
      />
    </div>
  );
}
