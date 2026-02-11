import { Building2, LogOut, User, List, Mail, Phone, Sun, Moon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTheme } from '../../providers/ThemeProvider';

export type GlobalProjectInfo = {
  testNumber?: string;
  projectName?: string;
  companyName?: string;
  scheduleWorkingDays?: string | number;
  scheduleStartDate?: string;
  scheduleEndDate?: string;
  plName?: string;
  companyContactName?: string;
  companyContactPhone?: string;
  companyContactEmail?: string;
};

type GlobalProcessHeaderProps = {
  currentStep: number;
  projectInfo?: GlobalProjectInfo;
  rightSlot?: ReactNode;
  onLogout?: () => void;
  onOpenTestList?: () => void;
};

const safeValue = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
};

const iconBtnCls = 'inline-flex items-center justify-center h-9 w-9 rounded-lg border border-ln text-tx-tertiary hover:text-tx-primary hover:border-ln-strong';

export function GlobalProcessHeader({
  currentStep,
  projectInfo,
  rightSlot,
  onLogout,
  onOpenTestList
}: GlobalProcessHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [companyOpen, setCompanyOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const companyPanelRef = useRef<HTMLDivElement | null>(null);
  const testNumber = safeValue(projectInfo?.testNumber);
  const projectName = safeValue(projectInfo?.projectName);
  const companyName = safeValue(projectInfo?.companyName);
  void currentStep;
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
      <div className="flex h-16 items-center justify-between border-b border-ln bg-surface-base px-6 text-tx-primary">
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
        {rightSlot && (
          <div className="hidden md:flex items-center gap-5 text-[11px] text-tx-tertiary">
            {rightSlot}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={iconBtnCls}
            aria-label={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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
      </div>
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
          <div className="w-full max-w-sm rounded-xl border border-ln bg-surface-overlay shadow-xl">
            <div className="border-b border-ln px-4 py-3 text-sm font-extrabold text-tx-primary">
              로그아웃 확인
            </div>
            <div className="px-4 py-3 text-sm text-tx-secondary">
              현재 사용자를 로그아웃하시겠습니까?
            </div>
            <div className="flex justify-end gap-2 border-t border-ln px-4 py-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  onLogout?.();
                }}
                className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-hover"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
