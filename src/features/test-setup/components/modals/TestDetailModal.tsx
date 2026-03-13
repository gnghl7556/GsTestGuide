import type { Project } from '../../../../types';
import { ScheduleWizard } from '../../../../components/schedule/ScheduleWizard';
import { BaseModal } from '../../../../components/ui/BaseModal';

interface TestDetailModalProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  otherProjects?: Project[];
  onSave?: (updates: Record<string, unknown>) => void;
}

const INFO_FIELDS: Array<{ key: keyof Project; label: string }> = [
  { key: 'testNumber', label: '시험번호' },
  { key: 'projectName', label: '프로젝트명' },
  { key: 'companyName', label: '업체명' },
  { key: 'companyContactName', label: '업체 담당자' },
  { key: 'companyContactPhone', label: '담당자 연락처' },
  { key: 'companyContactEmail', label: '담당자 이메일' },
];

export function TestDetailModal({ open, onClose, project, otherProjects, onSave }: TestDetailModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} size="2xl" className="max-h-[90vh] flex flex-col">
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

      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* 기본 정보 (읽기 전용) */}
        <div className="px-5 pt-4 pb-2 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {INFO_FIELDS.map(({ key, label }) => {
              const value = (project[key] as string | undefined) || '-';
              return (
                <div
                  key={key}
                  className="flex items-start justify-between rounded-lg border border-ln bg-surface-raised px-3 py-2"
                >
                  <span className="text-[11px] font-semibold text-tx-tertiary shrink-0">{label}</span>
                  <span className="text-[11px] text-tx-secondary text-right ml-2 break-all">{value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 일정 위저드 */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pt-2 pb-1 shrink-0">
            <div className="text-[11px] font-semibold text-tx-muted">시험 일정</div>
          </div>
          <ScheduleWizard
            project={project}
            otherProjects={otherProjects}
            onSave={(updates) => onSave?.(updates)}
            onClose={onClose}
          />
        </div>
      </div>
    </BaseModal>
  );
}
