import { Building2, Calendar, User } from 'lucide-react';
import type { ReactNode } from 'react';

export type GlobalProjectInfo = {
  testNumber?: string;
  projectName?: string;
  companyName?: string;
  scheduleWorkingDays?: string | number;
  scheduleStartDate?: string;
  scheduleEndDate?: string;
  plName?: string;
  companyContactName?: string;
};

type GlobalProcessHeaderProps = {
  currentStep: number;
  projectInfo?: GlobalProjectInfo;
  rightSlot?: ReactNode;
};

const steps = [
  { id: 1, label: '시험 식별' },
  { id: 2, label: '시험 설계' },
  { id: 3, label: '시험 수행' },
  { id: 4, label: '결과 산출' }
];

const safeValue = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
};

export function GlobalProcessHeader({ currentStep, projectInfo, rightSlot }: GlobalProcessHeaderProps) {
  const testNumber = safeValue(projectInfo?.testNumber);
  const projectName = safeValue(projectInfo?.projectName);
  const companyName = safeValue(projectInfo?.companyName);
  const workingDays = safeValue(projectInfo?.scheduleWorkingDays);
  const startDate = safeValue(projectInfo?.scheduleStartDate);
  const endDate = safeValue(projectInfo?.scheduleEndDate);
  const plName = safeValue(projectInfo?.plName);
  const companyContactName = safeValue(projectInfo?.companyContactName);

  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="flex items-center justify-between bg-slate-900 px-6 text-white h-12">
        <div className="text-sm font-semibold flex items-center gap-2">
          <span className="text-white font-bold">{testNumber}</span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">{projectName}</span>
          <span className="text-white/40">|</span>
          <span className="text-white/70">{companyName}</span>
        </div>
        <div className="flex items-center gap-5 text-[11px] text-white/70">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-white/50" />
            <span>시험기간 {workingDays}일</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-white/50" />
            <span>{startDate} ~ {endDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <User size={14} className="text-white/50" />
            <span>PL {plName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 size={14} className="text-white/50" />
            <span>업체담당자 {companyContactName}</span>
          </div>
          {rightSlot}
        </div>
      </div>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-10">
          {steps.map((step) => {
            const active = step.id === currentStep;
            return (
              <div key={step.id} className="flex-1 text-center">
                <div className={active ? 'text-blue-600 text-xs font-semibold' : 'text-slate-500 text-xs'}>
                  {step.id}. {step.label}
                </div>
                <div className={active ? 'mt-2 h-0.5 w-full bg-blue-500' : 'mt-2 h-0.5 w-full bg-transparent'} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
