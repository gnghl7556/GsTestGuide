import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { Project } from '../../../types';
import { BaseModal } from '../../../components/ui/BaseModal';

const ScheduleWizard = lazy(() =>
  import('../../../components/schedule/ScheduleWizard').then(m => ({ default: m.ScheduleWizard }))
);

type ScheduleModalProps = {
  open: boolean;
  onClose: () => void;
  project: Project;
  otherProjects?: Project[];
  onSave: (updates: Record<string, unknown>) => void;
};

export function ScheduleModal({ open, onClose, project, otherProjects, onSave }: ScheduleModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} size="2xl">
      <div className="flex flex-col max-h-[85vh]">
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

        <div className="flex-1 flex flex-col min-h-0">
          <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-tx-muted" /></div>}>
            <ScheduleWizard project={project} otherProjects={otherProjects} onSave={onSave} onClose={onClose} />
          </Suspense>
        </div>
      </div>
    </BaseModal>
  );
}
