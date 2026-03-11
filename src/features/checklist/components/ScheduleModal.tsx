import { useEffect } from 'react';
import type { Project } from '../../../types';
import { ScheduleWizard } from '../../../components/schedule/ScheduleWizard';

type ScheduleModalProps = {
  open: boolean;
  onClose: () => void;
  project: Project;
  otherProjects?: Project[];
  onSave: (updates: Record<string, unknown>) => void;
};

export function ScheduleModal({ open, onClose, project, otherProjects, onSave }: ScheduleModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-ln bg-surface-overlay shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-ln px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-tx-primary">일정 관리</div>
              <div className="mt-0.5 text-[11px] text-tx-tertiary">
                시험 주요 마일스톤 일정을 설정합니다
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Wizard */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScheduleWizard project={project} otherProjects={otherProjects} onSave={onSave} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
