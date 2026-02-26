import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GlobalProcessHeader } from './GlobalProcessHeader';
import { ProcessLayout } from './ProcessLayout';
import { useTestSetupContext } from '../../providers/useTestSetupContext';
import { useExecutionToolbar } from '../../providers/ExecutionToolbarContext';
import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

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
  const currentStep = getStepFromPath(location.pathname);
  const { onReset } = useExecutionToolbar();

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
            rightSlot={
              currentStep === 3 && onReset ? (
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ln px-2.5 py-1.5 text-[11px] font-semibold text-tx-tertiary hover:text-danger hover:border-danger transition-colors"
                >
                  <RotateCcw size={13} />
                  점검 초기화
                </button>
              ) : undefined
            }
            onLogout={() => {
              setCurrentUserId('');
              resetTestSetup();
              navigate('/dashboard', { replace: false });
            }}
            onOpenTestList={() => {
              setTestListOpen(true);
            }}
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
                  {visibleProjects.map((project) => (
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
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        testSetup.testNumber === project.testNumber
                          ? 'border-accent bg-accent-subtle'
                          : 'border-ln bg-surface-base hover:border-ln-strong'
                      }`}
                    >
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
          <div className="w-full max-w-sm rounded-xl border border-ln bg-surface-overlay shadow-xl">
            <div className="border-b border-ln px-4 py-3 text-sm font-extrabold text-tx-primary">
              점검 데이터 초기화
            </div>
            <div className="px-4 py-3 text-sm text-tx-secondary">
              현재 시험의 모든 점검 데이터(답변, 판정, 의견)를 초기화하시겠습니까?
            </div>
            <div className="flex justify-end gap-2 border-t border-ln px-4 py-3">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetConfirmOpen(false);
                  onReset?.();
                }}
                className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-hover"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
