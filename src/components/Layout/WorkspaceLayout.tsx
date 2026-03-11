import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GlobalProcessHeader } from './GlobalProcessHeader';
import { ProcessLayout } from './ProcessLayout';
import { ScheduleModal } from '../../features/checklist/components/ScheduleModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useTestSetupContext } from '../../providers/useTestSetupContext';
import { useExecutionToolbar } from '../../providers/ExecutionToolbarContext';
import { useMemo, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const getStepFromPath = (pathname: string) => {
  if (pathname.startsWith('/design')) return 2;
  if (pathname.startsWith('/execution')) return 3;
  if (pathname.startsWith('/report')) return 4;
  return 1;
};

export function WorkspaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    testSetup,
    setCurrentUserId,
    currentUserId,
    projects,
    progressByTestNumber,
    selectTestNumber,
    resetTestSetup
  } = useTestSetupContext();
  const [testListOpen, setTestListOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const currentStep = getStepFromPath(location.pathname);
  const { onReset, onFinalize, canFinalize, isFinalized } = useExecutionToolbar();
  const currentProject = projects.find((p) => p.testNumber === testSetup.testNumber);

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

  const visibleProjects = useMemo(
    () =>
      projects
        .filter((project) => project.testerId === currentUserId || project.createdBy === currentUserId)
        .map((project) => ({
          ...project,
          progress: progressByTestNumber[project.testNumber] ?? 0
        }))
        .sort((a, b) => {
          const aTime =
            typeof a.updatedAt === 'number'
              ? a.updatedAt
              : a.updatedAt && typeof a.updatedAt === 'object' && 'toDate' in a.updatedAt
                ? a.updatedAt.toDate().getTime()
                : 0;
          const bTime =
            typeof b.updatedAt === 'number'
              ? b.updatedAt
              : b.updatedAt && typeof b.updatedAt === 'object' && 'toDate' in b.updatedAt
                ? b.updatedAt.toDate().getTime()
                : 0;
          return bTime - aTime;
        }),
    [projects, currentUserId, progressByTestNumber]
  );

  return (
    <>
      <ProcessLayout
        header={
          <GlobalProcessHeader
            currentStep={currentStep}
            projectInfo={projectInfo}
            onReset={
              currentStep === 3 && onReset
                ? () => setResetConfirmOpen(true)
                : undefined
            }
            onFinalize={currentStep === 3 ? onFinalize ?? undefined : undefined}
            canFinalize={currentStep === 3 ? canFinalize : false}
            isFinalized={currentStep === 3 ? isFinalized : false}
            onLogout={() => {
              setCurrentUserId('');
              resetTestSetup();
              navigate('/dashboard', { replace: false });
            }}
            onOpenTestList={() => {
              setTestListOpen(true);
            }}
            onOpenSchedule={() => setScheduleOpen(true)}
          />
        }
        content={<Outlet />}
      />
      {testListOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-ln bg-surface-overlay shadow-xl">
            <div className="flex items-center justify-between border-b border-ln px-5 py-4">
              <div className="text-sm font-extrabold text-tx-primary">전체 시험 목록</div>
              <button
                type="button"
                onClick={() => setTestListOpen(false)}
                className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
              >
                닫기
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {visibleProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ln bg-surface-sunken px-4 py-6 text-center text-xs text-tx-tertiary">
                  현재 할당된 시험이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleProjects.map((project) => {
                    const isCompleted = project.status === '완료';
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => {
                          selectTestNumber(project.testNumber);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('gs-test-guide:selected-test', project.testNumber);
                          }
                          setTestListOpen(false);
                        }}
                        className={`relative rounded-xl border px-4 py-3 text-left transition ${
                          isCompleted
                            ? 'opacity-60 border-ln bg-surface-sunken'
                            : testSetup.testNumber === project.testNumber
                              ? 'border-accent bg-accent-subtle'
                              : 'border-ln bg-surface-base hover:border-ln-strong'
                        }`}
                      >
                        {isCompleted && (
                          <span className="absolute top-2 right-2 inline-flex rounded-full border border-ln bg-surface-sunken px-1.5 py-0.5 text-[9px] font-semibold text-tx-tertiary">
                            완료
                          </span>
                        )}
                        <div className="text-[11px] text-tx-muted mb-1">시험번호</div>
                        <div className="font-semibold text-tx-primary">{project.testNumber}</div>
                        <div className="mt-1 text-xs text-tx-tertiary truncate">
                          {project.projectName || project.productName || '-'}
                          {project.companyName ? ` (${project.companyName})` : ''}
                        </div>
                        <div className="mt-2 text-[10px] text-tx-muted">
                          진행율 {project.progress}%
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={resetConfirmOpen}
        title="점검 데이터 초기화"
        description="현재 시험의 모든 점검 데이터(답변, 판정, 의견)를 초기화하시겠습니까?"
        confirmLabel="초기화"
        confirmVariant="danger"
        onConfirm={() => { setResetConfirmOpen(false); onReset?.(); }}
        onCancel={() => setResetConfirmOpen(false)}
      />
      {scheduleOpen && currentProject && (
        <ScheduleModal
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          project={currentProject}
          otherProjects={projects.filter((p) => p.id !== currentProject.id)}
          onSave={async (updates) => {
            if (!db || !testSetup.testNumber) return;
            await setDoc(
              doc(db, 'projects', testSetup.testNumber),
              { ...updates, updatedAt: serverTimestamp() },
              { merge: true }
            );
            setScheduleOpen(false);
          }}
        />
      )}
    </>
  );
}
