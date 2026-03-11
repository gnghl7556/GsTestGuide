import { useEffect, useState } from 'react';
import type { Project } from '../../../../types';
import { MILESTONES, MILESTONE_COLOR_MAP } from '../../../../constants/schedule';
import { CalendarInput } from '../CalendarInput';

interface TestDetailModalProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onSave?: (updates: Record<string, string>) => void;
}

const INFO_FIELDS: Array<{ key: keyof Project; label: string }> = [
  { key: 'testNumber', label: '시험번호' },
  { key: 'projectName', label: '프로젝트명' },
  { key: 'companyName', label: '업체명' },
  { key: 'companyContactName', label: '업체 담당자' },
  { key: 'companyContactPhone', label: '담당자 연락처' },
  { key: 'companyContactEmail', label: '담당자 이메일' },
];

export function TestDetailModal({ open, onClose, project, onSave }: TestDetailModalProps) {
  const [dates, setDates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, string> = {};
    for (const m of MILESTONES) {
      init[m.key] = (project[m.key] as string) ?? '';
    }
    setDates(init);
  }, [open, project]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const hasChanges = MILESTONES.some(
    (m) => dates[m.key] !== ((project[m.key] as string) ?? '')
  );

  const handleSave = () => {
    if (!onSave) return;
    const updates: Record<string, string> = {};
    for (const m of MILESTONES) {
      updates[m.key] = dates[m.key] || '';
    }
    onSave(updates);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-ln bg-surface-base shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4 shrink-0">
          <div className="text-sm font-extrabold text-tx-primary">시험 상세 정보</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            닫기
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* 기본 정보 (읽기 전용) */}
          <div className="space-y-2">
            {INFO_FIELDS.map(({ key, label }) => {
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

          {/* 일정 필드 (편집 가능) */}
          <div>
            <div className="text-[11px] font-semibold text-tx-muted mb-2">시험 일정</div>
            <div className="space-y-2">
              {MILESTONES.map((m) => {
                const colors = MILESTONE_COLOR_MAP[m.color];
                return (
                  <div
                    key={m.key}
                    className={`rounded-xl border px-3 py-3 ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      <span className={`text-xs font-semibold ${colors.text}`}>{m.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={dates[m.key] || ''}
                        onChange={(e) => {
                          setDates((prev) => ({ ...prev, [m.key]: e.target.value }));
                        }}
                        className="flex-1 h-9 rounded-lg border border-ln bg-surface-base px-3 text-xs text-tx-primary placeholder:text-tx-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                      <div className="w-28">
                        <CalendarInput
                          label=""
                          value={dates[m.key] || ''}
                          onChange={(next) => setDates((prev) => ({ ...prev, [m.key]: next }))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-ln px-5 py-3 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
          >
            취소
          </button>
          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${
                hasChanges
                  ? 'bg-accent hover:bg-accent-hover'
                  : 'bg-accent/50 cursor-not-allowed'
              }`}
            >
              저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
