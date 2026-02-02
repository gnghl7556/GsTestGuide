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
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-slate-900 tracking-tight inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
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
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:border-gray-300"
            aria-label="산출물 내보내기"
          >
            산출물 내보내기
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:border-gray-300"
            aria-label="설정"
          >
            <Settings size={14} />
            설정
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-9 z-40 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  onManagePl();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                PL 관리
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center text-sm text-gray-500 gap-3">
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <span className="font-medium text-gray-600">{data.plName || '미등록'}</span>
          {plTooltip && (
            <span className="ml-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600">
              {plTooltip}
            </span>
          )}
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-gray-400" />
          <span className="font-medium text-gray-600">
            {data.companyUser || '미등록'}
            {data.companyName ? ` · ${data.companyName}` : ''}
          </span>
          {companyTooltip && (
            <span className="ml-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600">
              {companyTooltip}
            </span>
          )}
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="font-medium text-gray-600">{scheduleLabel}</span>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-extrabold text-slate-900">초기 화면으로 이동</div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                닫기
              </button>
            </div>
            <div className="px-5 py-5 text-sm text-slate-700">
              초기 화면으로 돌아가시겠습니까?
            </div>
            <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                이어서 작업
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  onReturnToSetup();
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
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
