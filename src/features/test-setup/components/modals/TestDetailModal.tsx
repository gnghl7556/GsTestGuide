import { useEffect } from 'react';
import type { Project } from '../../../../types';

interface TestDetailModalProps {
  open: boolean;
  onClose: () => void;
  project: Project;
}

const FIELDS: Array<{ key: keyof Project; label: string }> = [
  { key: 'testNumber', label: '시험번호' },
  { key: 'projectName', label: '프로젝트명' },
  { key: 'companyName', label: '업체명' },
  { key: 'scheduleStartDate', label: '시험 시작일' },
  { key: 'scheduleEndDate', label: '시험 종료일' },
  { key: 'scheduleDefect1', label: '1차 결함 리포트' },
  { key: 'schedulePatchDate', label: '패치일' },
  { key: 'companyContactName', label: '업체 담당자' },
  { key: 'companyContactPhone', label: '담당자 연락처' },
  { key: 'companyContactEmail', label: '담당자 이메일' },
];

export function TestDetailModal({ open, onClose, project }: TestDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-ln bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4">
          <div className="text-sm font-extrabold text-tx-primary">시험 상세 정보</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            닫기
          </button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {FIELDS.map(({ key, label }) => {
            const value = (project[key] as string | undefined) || '-';
            return (
              <div
                key={key}
                className="flex items-start justify-between rounded-lg border border-ln bg-surface-raised px-3 py-2.5"
              >
                <span className="text-xs font-semibold text-tx-tertiary shrink-0">{label}</span>
                <span className="text-xs text-tx-secondary text-right ml-3 break-all">{value}</span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-ln px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
