import { useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

type ProjectDoc = {
  projectId?: string;
  projectName?: string;
  plId?: string;
  createdBy?: string | null;
  startDate?: Timestamp;
  endDate?: Timestamp;
  status?: string;
};

const locales = {
  ko
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales
});

const STATUS_FILTERS = ['전체', '대기', '진행', '중단', '완료', '재시험'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_COLORS: Record<string, string> = {
  '대기': 'bg-surface-sunken text-tx-secondary',
  '진행': 'bg-accent-subtle text-accent-text',
  '중단': 'bg-status-hold-bg text-status-hold-text',
  '완료': 'bg-status-pass-bg text-status-pass-text',
  '재시험': 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
};

export function DashboardPage() {
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [currentUserId] = useState(() => {
    const raw = localStorage.getItem('gs-test-guide:review');
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw) as { currentUserId?: string };
      return parsed.currentUserId || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as ProjectDoc;
        return { id: docSnap.id, ...data };
      });
      setProjects(next);
    });
    return () => unsubscribe();
  }, []);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (currentUserId) {
      result = result.filter((project) => project.plId === currentUserId || project.createdBy === currentUserId);
    }
    if (statusFilter !== '전체') {
      result = result.filter((project) => (project.status || '대기') === statusFilter);
    }
    return result;
  }, [projects, currentUserId, statusFilter]);

  const events = useMemo(() => {
    return filteredProjects
      .map((project) => {
        if (!project.startDate || !project.endDate) return null;
        const start = project.startDate.toDate();
        const end = project.endDate.toDate();
        return {
          title: project.projectName || project.projectId || '프로젝트',
          start,
          end,
          allDay: true
        };
      })
      .filter(Boolean) as Array<{ title: string; start: Date; end: Date; allDay: boolean }>;
  }, [filteredProjects]);

  return (
    <div className="min-h-screen bg-surface-raised p-4 text-tx-primary">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="bg-surface-base rounded-xl border border-ln shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-extrabold text-tx-primary">통합 대시보드</h1>
              <p className="text-xs text-tx-tertiary mt-1">담당 프로젝트 일정 캘린더 ({filteredProjects.length}건)</p>
            </div>
            <div className="text-xs text-tx-tertiary">
              사용자: {currentUserId || '미선택'}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {STATUS_FILTERS.map((s) => {
              const count = s === '전체'
                ? (currentUserId ? projects.filter(p => p.plId === currentUserId || p.createdBy === currentUserId).length : projects.length)
                : (currentUserId ? projects.filter(p => (p.plId === currentUserId || p.createdBy === currentUserId) && (p.status || '대기') === s).length : projects.filter(p => (p.status || '대기') === s).length);
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
        </div>

        <div className="bg-surface-base rounded-xl border border-ln shadow-sm p-4">
          <div className="h-[70vh]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              defaultView={Views.MONTH}
              style={{ height: '100%' }}
              popup
              messages={{
                next: '다음',
                previous: '이전',
                today: '오늘',
                month: '월',
                week: '주',
                day: '일',
                agenda: '일정'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
