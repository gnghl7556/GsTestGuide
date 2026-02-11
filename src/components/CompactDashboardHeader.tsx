import { useState } from 'react';
import { Calendar, User, Building2, ClipboardCheck, Settings } from 'lucide-react';

interface CompactDashboardHeaderProps {
  data: {
    testId: string;
    plName: string;
    plPhone?: string;
    plEmail?: string;
    companyUser: string;
    companyName?: string;
    companyPhone?: string;
    companyEmail?: string;
    startDate?: string;
    endDate?: string;
  };
  onManagePl: () => void;
  onReturnToSetup: () => void;
  onOpenExport: () => void;
}

export function CompactDashboardHeader({ data, onManagePl, onReturnToSetup, onOpenExport }: CompactDashboardHeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scheduleLabel =
    data.startDate && data.endDate
      ? `${data.startDate} ~ ${data.endDate}`
      : data.startDate
        ? `${data.startDate} ~`
        : data.endDate
          ? `~ ${data.endDate}`
          : '미등록';

  const plTooltip = [data.plPhone, data.plEmail].filter(Boolean).join(' · ');
  const companyTooltip = [data.companyPhone, data.companyEmail].filter(Boolean).join(' · ');

  return (
    <header className="bg-surface-base border-b border-ln px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-tx-primary tracking-tight inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent text-tx-tertiary hover:text-tx-secondary hover:border-ln"
            aria-label="초기 화면으로 이동"
            title="초기 화면으로 이동"
          >
            <ClipboardCheck size={20} />
          </button>
          {data.testId || '미등록'}
        </div>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-2 rounded-md border border-ln bg-surface-base px-3 py-1.5 text-xs font-semibold text-tx-secondary hover:text-tx-primary hover:border-ln-strong"
            aria-label="산출물 내보내기"
          >
            산출물 내보내기
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-md border border-ln bg-surface-base px-3 py-1.5 text-xs font-semibold text-tx-secondary hover:text-tx-primary hover:border-ln-strong"
            aria-label="설정"
          >
            <Settings size={14} />
            설정
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-9 z-40 w-40 rounded-lg border border-ln bg-surface-base shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  onManagePl();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover"
              >
                PL 관리
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center text-sm text-tx-tertiary gap-3">
        <div className="flex items-center gap-2">
          <User size={14} className="text-tx-muted" />
          <span className="font-medium text-tx-secondary">{data.plName || '미등록'}</span>
          {plTooltip && (
            <span className="ml-1 rounded-md border border-ln bg-surface-base px-2 py-1 text-[11px] text-tx-secondary">
              {plTooltip}
            </span>
          )}
        </div>
        <span className="text-tx-muted">|</span>
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-tx-muted" />
          <span className="font-medium text-tx-secondary">
            {data.companyUser || '미등록'}
            {data.companyName ? ` · ${data.companyName}` : ''}
          </span>
          {companyTooltip && (
            <span className="ml-1 rounded-md border border-ln bg-surface-base px-2 py-1 text-[11px] text-tx-secondary">
              {companyTooltip}
            </span>
          )}
        </div>
        <span className="text-tx-muted">|</span>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-tx-muted" />
          <span className="font-medium text-tx-secondary">{scheduleLabel}</span>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
          <div className="w-full max-w-md rounded-2xl border border-ln bg-surface-base shadow-xl">
            <div className="flex items-center justify-between border-b border-ln px-5 py-4">
              <div className="text-sm font-extrabold text-tx-primary">초기 화면으로 이동</div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
              >
                닫기
              </button>
            </div>
            <div className="px-5 py-5 text-sm text-tx-secondary">
              초기 화면으로 돌아가시겠습니까?
            </div>
            <div className="border-t border-ln px-5 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:text-tx-primary"
              >
                이어서 작업
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  onReturnToSetup();
                }}
                className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white"
              >
                초기 화면
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
