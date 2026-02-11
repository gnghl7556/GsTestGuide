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

export function DashboardPage() {
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
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
    if (!currentUserId) return projects;
    return projects.filter((project) => project.plId === currentUserId || project.createdBy === currentUserId);
  }, [projects, currentUserId]);

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-tx-primary">통합 대시보드</h1>
              <p className="text-xs text-tx-tertiary mt-1">담당 프로젝트 일정 캘린더</p>
            </div>
            <div className="text-xs text-tx-tertiary">
              사용자: {currentUserId || '미선택'}
            </div>
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
