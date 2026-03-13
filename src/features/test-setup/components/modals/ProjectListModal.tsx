import { useState, useMemo, useRef, useEffect } from 'react';
import { Copy } from 'lucide-react';
import type { Project } from '../../../../types';
import type { ProjectStatus } from '../../../../types/models';
import { BaseModal } from '../../../../components/ui/BaseModal';

type ProjectWithProgress = Project & { progress: number };

const STATUS_FILTERS = ['전체', '대기', '진행', '중단', '완료', '재시험'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_COLORS: Record<string, string> = {
  '대기': 'bg-surface-sunken text-tx-secondary',
  '진행': 'bg-accent-subtle text-accent-text',
  '중단': 'bg-status-hold-bg text-status-hold-text',
  '완료': 'bg-status-pass-bg text-status-pass-text',
  '재시험': 'bg-status-retry-bg text-status-retry-text',
};

interface ProjectListModalProps {
  open: boolean;
  onClose: () => void;
  projects: ProjectWithProgress[];
  activeTestNumber: string;
  onSelectProject: (testNumber: string) => void;
  onDuplicateProject?: (sourceTestNumber: string, newTestNumber: string) => Promise<boolean>;
}

export function ProjectListModal({
  open,
  onClose,
  projects,
  activeTestNumber,
  onSelectProject,
  onDuplicateProject
}: ProjectListModalProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateSource, setDuplicateSource] = useState<string | null>(null);
  const [newTestNumber, setNewTestNumber] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const dupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (duplicateSource) dupInputRef.current?.focus();
  }, [duplicateSource]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (statusFilter !== '전체') {
      result = result.filter(p => (p.status || '대기') === statusFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        p.testNumber.toLowerCase().includes(q) ||
        (p.projectName || '').toLowerCase().includes(q) ||
        (p.companyName || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [projects, statusFilter, searchQuery]);

  const handleDuplicate = async () => {
    const trimmed = newTestNumber.trim();
    if (!trimmed || !duplicateSource || !onDuplicateProject) return;
    if (projects.some(p => p.testNumber === trimmed)) {
      window.alert('이미 존재하는 시험번호입니다.');
      return;
    }
    setDuplicating(true);
    try {
      const ok = await onDuplicateProject(duplicateSource, trimmed);
      if (ok) {
        setDuplicateSource(null);
        setNewTestNumber('');
        onSelectProject(trimmed);
        onClose();
      }
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} size="2xl">
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

      {/* Filter + Search */}
      <div className="border-b border-ln px-5 py-3 space-y-2.5">
        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => {
            const count = s === '전체'
              ? projects.length
              : projects.filter(p => (p.status || '대기') === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                  statusFilter === s
                    ? s === '전체'
                      ? 'bg-surface-sunken border-ln-strong text-tx-primary'
                      : `${STATUS_COLORS[s] || ''} border-transparent`
                    : 'border-ln text-tx-muted hover:border-ln-strong hover:text-tx-secondary'
                }`}
              >
                {s}{count > 0 ? ` ${count}` : ''}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tx-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="시험번호 / 프로젝트명 / 업체명 검색"
            className="w-full rounded-lg border border-ln bg-surface-base pl-7 pr-7 py-1.5 text-xs text-tx-primary placeholder:text-tx-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tx-muted hover:text-tx-secondary"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Project grid */}
      <div className="max-h-[55vh] overflow-auto px-5 py-4">
        {filteredProjects.length === 0 ? (
          <div className="py-8 text-center text-xs text-tx-muted">일치하는 시험이 없습니다</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProjects.map((project) => {
              const isActive = activeTestNumber === project.testNumber;
              const status = (project.status || '대기') as ProjectStatus;
              return (
                <div
                  key={project.id}
                  className={`relative rounded-xl border px-3 py-3 text-left text-sm transition ${
                    isActive
                      ? 'border-accent/60 bg-accent text-white'
                      : 'border-ln bg-surface-base text-tx-secondary hover:border-ln-strong'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(project.testNumber);
                      onClose();
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-tx-muted">시험번호</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                        isActive ? 'bg-white/20 text-white' : STATUS_COLORS[status] || ''
                      }`}>
                        {status}
                      </span>
                    </div>
                    <div className="font-semibold tracking-wide">{project.testNumber}</div>
                    {(project.projectName || project.companyName) && (
                      <div className="mt-1 text-xs text-tx-tertiary truncate">
                        {project.projectName || '-'}
                        {project.companyName ? ` · ${project.companyName}` : ''}
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-tx-muted'}`}>진행률</span>
                        <span className={`text-[10px] font-semibold ${isActive ? 'text-white/90' : 'text-tx-tertiary'}`}>{project.progress}%</span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${isActive ? 'bg-white/20' : 'bg-surface-sunken'}`}>
                        <div
                          className={`h-full rounded-full transition-all ${isActive ? 'bg-white/70' : 'bg-accent'}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </button>
                  {/* Duplicate button */}
                  {onDuplicateProject && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDuplicateSource(project.testNumber);
                        setNewTestNumber('');
                      }}
                      title="프로젝트 복제"
                      className={`absolute top-2.5 right-2.5 rounded-md p-1 transition-colors ${
                        isActive
                          ? 'text-white/60 hover:text-white hover:bg-white/15'
                          : 'text-tx-muted hover:text-accent-text hover:bg-accent-subtle'
                      }`}
                    >
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Duplicate dialog */}
      {duplicateSource && (
        <BaseModal open={true} onClose={() => { setDuplicateSource(null); setNewTestNumber(''); }} size="sm">
          <div className="border-b border-ln px-5 py-4">
            <h3 className="text-sm font-extrabold text-tx-primary">프로젝트 복제</h3>
            <p className="text-[11px] text-tx-tertiary mt-0.5">
              <strong>{duplicateSource}</strong>의 설정을 새 프로젝트에 복사합니다
            </p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-tx-muted block mb-1">새 시험번호</label>
              <input
                ref={dupInputRef}
                type="text"
                value={newTestNumber}
                onChange={(e) => setNewTestNumber(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleDuplicate(); }}
                placeholder="예: GS-25-0001"
                className="w-full rounded-lg border border-ln bg-surface-base px-3 py-2 text-sm text-tx-primary placeholder:text-tx-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div className="rounded-lg bg-surface-sunken px-3 py-2 text-[10px] text-tx-tertiary space-y-0.5">
              <div>복사 항목: 프로젝트명, 업체 정보, 일정 설정</div>
              <div>복사 제외: 진행 상태, 판정 결과, 결함 데이터</div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-ln px-5 py-3">
            <button
              type="button"
              onClick={() => { setDuplicateSource(null); setNewTestNumber(''); }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleDuplicate()}
              disabled={duplicating || !newTestNumber.trim()}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-accent-solid hover:bg-accent-hover disabled:opacity-40"
            >
              {duplicating ? '복제 중...' : '복제'}
            </button>
          </div>
        </BaseModal>
      )}
    </BaseModal>
  );
}
