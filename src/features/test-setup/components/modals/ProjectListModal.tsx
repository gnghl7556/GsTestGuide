import type { Project } from '../../../../types';

type ProjectWithProgress = Project & { progress: number };

interface ProjectListModalProps {
  open: boolean;
  onClose: () => void;
  projects: ProjectWithProgress[];
  activeTestNumber: string;
  onSelectProject: (testNumber: string) => void;
}

export function ProjectListModal({
  open,
  onClose,
  projects,
  activeTestNumber,
  onSelectProject
}: ProjectListModalProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-ln bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4">
          <div className="text-sm font-extrabold text-tx-primary">전체 시험 목록</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            닫기
          </button>
        </div>
        <div className="max-h-[60vh] overflow-auto px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((project) => {
              const isActive = activeTestNumber === project.testNumber;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    onSelectProject(project.testNumber);
                    onClose();
                  }}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                    isActive
                      ? 'border-purple-400/60 bg-accent text-white'
                      : 'border-ln bg-surface-base text-tx-secondary hover:border-ln-strong'
                  }`}
                >
                  <div className="text-xs text-tx-muted mb-1">시험번호</div>
                  <div className="font-semibold tracking-wide">{project.testNumber}</div>
                  {(project.projectName || project.companyName) && (
                    <div className="mt-1 text-xs text-tx-tertiary truncate">
                      {project.projectName || '-'}
                      {project.companyName ? ` · ${project.companyName}` : ''}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
