import { Building2, LogOut, User, List, Mail, Phone, Sun, Moon, RotateCcw, Calendar, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { ConfirmModal } from '../ui/ConfirmModal';

export type GlobalProjectInfo = {
  testNumber?: string;
  projectName?: string;
  companyName?: string;
  scheduleWorkingDays?: string | number;
  scheduleStartDate?: string;
  scheduleEndDate?: string;
  scheduleDefect1?: string;
  scheduleDefect2?: string;
  schedulePatchDate?: string;
  plName?: string;
  companyContactName?: string;
  companyContactPhone?: string;
  companyContactEmail?: string;
};

type GlobalProcessHeaderProps = {
  currentStep: number;
  projectInfo?: GlobalProjectInfo;
  rightSlot?: ReactNode;
  onReset?: () => void;
  onFinalize?: () => void;
  canFinalize?: boolean;
  isFinalized?: boolean;
  onLogout?: () => void;
  onOpenTestList?: () => void;
  onOpenSchedule?: () => void;
  onNavigateStep?: (step: number) => void;
};

const safeValue = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
};

const iconBtnCls = 'inline-flex items-center justify-center h-9 w-9 rounded-lg border border-ln text-tx-tertiary hover:text-tx-primary hover:border-ln-strong';

const parseScheduleDate = (s?: string) => {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

type MilestoneData = { date: Date; color: string; pastColor: string; label: string };

function useScheduleData(info?: GlobalProjectInfo) {
  const start = parseScheduleDate(info?.scheduleStartDate);
  const end = parseScheduleDate(info?.scheduleEndDate);
  if (!start || !end || end <= start) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = today.getTime() - start.getTime();
  const progress = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000);

  const milestones: MilestoneData[] = [
    { date: start, color: 'bg-emerald-400', pastColor: 'bg-emerald-500', label: '시작' },
  ];
  const d1 = parseScheduleDate(info?.scheduleDefect1);
  if (d1) milestones.push({ date: d1, color: 'bg-amber-300', pastColor: 'bg-amber-500', label: '1차 결함' });
  const d2 = parseScheduleDate(info?.scheduleDefect2);
  if (d2) milestones.push({ date: d2, color: 'bg-orange-300', pastColor: 'bg-orange-500', label: '2차 결함' });
  const p = parseScheduleDate(info?.schedulePatchDate);
  if (p) milestones.push({ date: p, color: 'bg-sky-300', pastColor: 'bg-sky-500', label: '패치' });
  milestones.push({ date: end, color: 'bg-rose-300', pastColor: 'bg-rose-500', label: '종료' });

  const getPos = (d: Date) => Math.max(1, Math.min(99, ((d.getTime() - start.getTime()) / totalMs) * 100));
  const isPast = (d: Date) => d.getTime() <= today.getTime();
  const isOverdue = daysLeft < 0;

  return { start, end, today, progress, daysLeft, milestones, getPos, isPast, isOverdue };
}

function ScheduleEdge({ info }: { info: GlobalProjectInfo }) {
  const data = useScheduleData(info);
  if (!data) return <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-ln" />;

  const { progress, daysLeft, milestones, getPos, isPast, isOverdue } = data;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px]">
      {/* Track background */}
      <div className="absolute inset-0 bg-ln/30" />
      {/* Progress fill */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ${
          isOverdue
            ? 'bg-rose-400/80 dark:bg-rose-500/80'
            : 'bg-gradient-to-r from-blue-400/70 via-purple-400/70 to-purple-500/70 dark:from-blue-500/70 dark:via-purple-500/70 dark:to-purple-600/70'
        }`}
        style={{ width: `${progress}%` }}
      />
      {/* Milestone diamonds */}
      {milestones.map((m, i) => {
        const pos = getPos(m.date);
        const past = isPast(m.date);
        return (
          <div
            key={i}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1]"
            style={{ left: `${pos}%` }}
            title={`${m.label}: ${m.date.getMonth() + 1}/${m.date.getDate()}`}
          >
            <div
              className={`w-[7px] h-[7px] rotate-45 transition-all ${
                past
                  ? `${m.pastColor} shadow-sm shadow-black/20`
                  : 'border border-white/40 dark:border-white/20 bg-transparent'
              }`}
            />
          </div>
        );
      })}
      {/* Today dot */}
      {progress > 0 && progress < 100 && (
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-[2]"
          style={{ left: `${progress}%` }}
          title={`오늘 (${daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day' : `D+${Math.abs(daysLeft)}`})`}
        >
          <div className="w-[9px] h-[9px] rounded-full border-2 border-white bg-accent shadow-[0_0_6px_rgba(99,102,241,0.5)] dark:shadow-[0_0_6px_rgba(129,140,248,0.6)]" />
        </div>
      )}
    </div>
  );
}

function DdayBadge({ info }: { info?: GlobalProjectInfo }) {
  const data = useScheduleData(info);
  if (!data) return null;
  const { daysLeft, isOverdue } = data;
  const label = daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day' : `D+${Math.abs(daysLeft)}`;
  return (
    <span className={`hidden md:inline-flex items-center h-5 rounded px-1.5 text-[10px] font-bold tabular-nums ${
      isOverdue
        ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20'
        : daysLeft <= 3
          ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
          : 'bg-surface-sunken text-tx-tertiary'
    }`}>
      {label}
    </span>
  );
}

export function GlobalProcessHeader({
  currentStep,
  projectInfo,
  rightSlot,
  onReset,
  onFinalize,
  canFinalize,
  isFinalized,
  onLogout,
  onOpenTestList,
  onOpenSchedule,
  onNavigateStep
}: GlobalProcessHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [companyOpen, setCompanyOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const companyPanelRef = useRef<HTMLDivElement | null>(null);
  const testNumber = safeValue(projectInfo?.testNumber);
  const projectName = safeValue(projectInfo?.projectName);
  const companyName = safeValue(projectInfo?.companyName);
  const companyContactName = safeValue(projectInfo?.companyContactName);
  const companyContactPhone = safeValue(projectInfo?.companyContactPhone);
  const companyContactEmail = safeValue(projectInfo?.companyContactEmail);

  useEffect(() => {
    if (!companyOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!companyPanelRef.current) return;
      if (!companyPanelRef.current.contains(event.target as Node)) {
        setCompanyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [companyOpen]);

  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="relative flex h-16 items-center bg-surface-base px-6 text-tx-primary gap-4">
        <div className="text-sm font-semibold flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenTestList}
            className={iconBtnCls}
            aria-label="시험 목록"
            title="시험 목록"
          >
            <List size={16} />
          </button>
          <span className="font-extrabold text-tx-primary">{testNumber}</span>
          <span className="text-tx-muted">|</span>
          <span className="text-tx-secondary truncate">{projectName}</span>
          <span className="text-tx-muted">|</span>
          <span className="text-tx-tertiary truncate">{companyName}</span>
        </div>
        {onNavigateStep && (
          <nav className="hidden md:flex items-center gap-0.5 rounded-lg bg-surface-sunken p-0.5 shrink-0">
            {([
              { step: 2, label: '설계' },
              { step: 3, label: '점검' },
              { step: 4, label: '리포트' },
            ] as const).map(({ step, label }) => (
              <button
                key={step}
                type="button"
                onClick={() => onNavigateStep(step)}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${
                  currentStep === step
                    ? 'bg-surface-base text-tx-primary shadow-sm'
                    : 'text-tx-tertiary hover:text-tx-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        {projectInfo && <DdayBadge info={projectInfo} />}
        <div className="flex-1 min-w-0" />
        {rightSlot && (
          <div className="hidden md:flex items-center gap-5 text-[11px] text-tx-tertiary">
            {rightSlot}
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {isFinalized && (
            <span className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-ln bg-surface-sunken px-2.5 text-[11px] font-semibold text-tx-tertiary">
              <CheckCircle size={14} />
              <span className="hidden sm:inline">완료됨</span>
            </span>
          )}
          {canFinalize && !isFinalized && onFinalize && (
            <button
              type="button"
              onClick={() => setFinalizeConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-emerald-400 dark:border-emerald-500 bg-emerald-500 dark:bg-emerald-600 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
              title="검토 완료"
            >
              <CheckCircle size={14} />
              <span className="hidden sm:inline">검토 완료</span>
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-ln px-2.5 text-[11px] font-semibold text-tx-tertiary hover:text-danger hover:border-danger transition-colors"
              title="점검 초기화"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">초기화</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className={iconBtnCls}
            aria-label={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {onOpenSchedule && (
            <button
              type="button"
              onClick={onOpenSchedule}
              className="inline-flex items-center gap-2 h-9 rounded-lg border border-ln px-3 text-xs font-semibold text-tx-secondary hover:text-tx-primary hover:border-ln-strong"
            >
              일정
              <Calendar size={14} />
            </button>
          )}
          <div className="relative" ref={companyPanelRef}>
            <button
              type="button"
              onClick={() => setCompanyOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 h-9 rounded-lg border border-ln px-3 text-xs font-semibold text-tx-secondary hover:text-tx-primary hover:border-ln-strong"
            >
              업체정보
              <Building2 size={14} />
            </button>
            {companyOpen && (
              <div className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-ln bg-surface-overlay p-3 text-xs text-tx-secondary shadow-xl">
                <div className="text-[10px] font-semibold text-tx-muted mb-2">업체 담당자</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-tx-muted" />
                    <span>{companyContactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-tx-muted" />
                    <span>{companyContactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-tx-muted" />
                    <span>{companyContactEmail}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-ln text-tx-tertiary hover:text-danger hover:border-danger"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <LogOut size={16} />
          </button>
        </div>
        {/* Edge gradient timeline — replaces border-bottom */}
        {projectInfo ? <ScheduleEdge info={projectInfo} /> : <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-ln" />}
      </div>
      <ConfirmModal
        open={logoutConfirmOpen}
        title="로그아웃 확인"
        description="현재 사용자를 로그아웃하시겠습니까?"
        confirmLabel="로그아웃"
        confirmVariant="danger"
        onConfirm={() => { setLogoutConfirmOpen(false); onLogout?.(); }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
      <ConfirmModal
        open={finalizeConfirmOpen}
        title="최종 검토 완료"
        description="최종 검토를 완료하시겠습니까? 완료 후에는 점검 데이터가 읽기 전용으로 전환됩니다."
        confirmLabel="완료"
        confirmVariant="success"
        onConfirm={() => { setFinalizeConfirmOpen(false); onFinalize?.(); }}
        onCancel={() => setFinalizeConfirmOpen(false)}
      />
    </div>
  );
}
