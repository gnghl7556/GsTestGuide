import { useEffect, useState } from 'react';
import type { Project } from '../../../types';
import { MILESTONES, MILESTONE_COLOR_MAP } from '../../../constants/schedule';
import { CalendarInput } from '../../test-setup/components/CalendarInput';

type ScheduleModalProps = {
  open: boolean;
  onClose: () => void;
  project: Project;
  onSave: (updates: Record<string, string>) => void;
};

export function ScheduleModal({ open, onClose, project, onSave }: ScheduleModalProps) {
  const [dates, setDates] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const m of MILESTONES) {
      init[m.key] = (project[m.key] as string) ?? '';
    }
    return init;
  });

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    const updates: Record<string, string> = {};
    for (const m of MILESTONES) {
      if (dates[m.key]) {
        updates[m.key] = dates[m.key];
      }
    }
    onSave(updates);
  };

  const filledMilestones = MILESTONES.filter((m) => dates[m.key]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
      <div className="w-full max-w-lg rounded-2xl border border-ln bg-surface-overlay shadow-xl">
        {/* Header */}
        <div className="border-b border-ln px-5 py-4">
          <div className="text-sm font-extrabold text-tx-primary">일정 관리</div>
          <div className="mt-0.5 text-[11px] text-tx-tertiary">
            시험 주요 마일스톤 일정을 설정합니다
          </div>
        </div>

        {/* Timeline visualization */}
        {filledMilestones.length >= 2 && (
          <div className="border-b border-ln px-5 py-4">
            <div className="relative flex items-center justify-between">
              {/* Connecting line */}
              <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-ln" />
              {MILESTONES.map((m) => {
                const colors = MILESTONE_COLOR_MAP[m.color];
                const filled = Boolean(dates[m.key]);
                return (
                  <div key={m.key} className="relative z-10 flex flex-col items-center gap-1.5">
                    <div
                      className={`h-3.5 w-3.5 rounded-full border-2 ${
                        filled
                          ? `${colors.dot} border-white dark:border-[var(--surface-overlay)]`
                          : 'border-ln bg-surface-sunken'
                      }`}
                    />
                    <span className={`text-[10px] font-medium ${filled ? colors.text : 'text-tx-muted'}`}>
                      {m.label}
                    </span>
                    {filled && (
                      <span className="text-[9px] text-tx-tertiary">{dates[m.key]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Date inputs */}
        <div className="px-5 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {MILESTONES.map((m) => {
            const colors = MILESTONE_COLOR_MAP[m.color];
            return (
              <div
                key={m.key}
                className={`rounded-xl border px-3 py-3 ${colors.border} ${colors.bg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                  <span className={`text-xs font-semibold ${colors.text}`}>{m.label}</span>
                </div>
                <CalendarInput
                  label=""
                  value={dates[m.key]}
                  onChange={(next) => setDates((prev) => ({ ...prev, [m.key]: next }))}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-ln px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
