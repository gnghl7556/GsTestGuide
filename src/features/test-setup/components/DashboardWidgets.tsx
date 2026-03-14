import { useMemo, useState, useEffect } from 'react';
import { TrendingUp, Calendar, Bug } from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Project, Defect } from '../../../types';

interface DashboardWidgetsProps {
  project: Project;
  progress: number;
  onNavigateExecution: () => void;
}

export function DashboardWidgets({ project, progress, onNavigateExecution }: DashboardWidgetsProps) {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-tx-primary">
            {project.projectName || project.testNumber} 현황
          </h2>
          <p className="text-xs text-tx-muted mt-0.5">시험 진행 현황을 한눈에 확인하세요</p>
        </div>
        <button
          type="button"
          onClick={onNavigateExecution}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md hover:opacity-90 transition"
        >
          시험 이어하기
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressSummaryWidget progress={progress} />
        <DDayWidget project={project} />
        <DefectSummaryWidget projectId={project.id} />
      </div>
    </div>
  );
}

/* ─── 진행률 요약 위젯 ─── */

function ProgressSummaryWidget({ progress }: { progress: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-2xl border border-ln bg-surface-raised p-5 flex flex-col items-center">
      <div className="flex items-center gap-1.5 self-start mb-4">
        <TrendingUp size={14} className="text-accent" />
        <span className="text-xs font-bold text-tx-secondary">점검 진행률</span>
      </div>

      <div className="relative">
        <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--ln)" strokeWidth="6" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? strokeDashoffset : circumference}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-tx-primary">{progress}%</span>
        </div>
      </div>

      <div className="mt-3 w-full">
        <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: mounted ? `${progress}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── D-Day 카운트다운 위젯 ─── */

function DDayWidget({ project }: { project: Project }) {
  const milestones = useMemo(() => {
    const items: Array<{ label: string; date: string; key: string }> = [];
    if (project.scheduleStartDate) items.push({ label: '시험 시작', date: project.scheduleStartDate, key: 'start' });
    if (project.scheduleDefect1) items.push({ label: '1차 리포트', date: project.scheduleDefect1, key: 'defect1' });
    if (project.schedulePatchDate) items.push({ label: '패치/회귀', date: project.schedulePatchDate, key: 'patch' });
    if (project.scheduleDefect2) items.push({ label: '2차 리포트', date: project.scheduleDefect2, key: 'defect2' });
    if (project.scheduleEndDate) items.push({ label: '시험 종료', date: project.scheduleEndDate, key: 'end' });
    return items;
  }, [project.scheduleStartDate, project.scheduleDefect1, project.schedulePatchDate, project.scheduleDefect2, project.scheduleEndDate]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const nextMilestone = milestones.find(m => new Date(m.date) >= today);
  const dDay = nextMilestone
    ? Math.ceil((new Date(nextMilestone.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="rounded-2xl border border-ln bg-surface-raised p-5 flex flex-col">
      <div className="flex items-center gap-1.5 mb-4">
        <Calendar size={14} className="text-accent" />
        <span className="text-xs font-bold text-tx-secondary">D-Day</span>
      </div>

      {milestones.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-tx-muted">일정이 설정되지 않았습니다</p>
        </div>
      ) : (
        <>
          {nextMilestone && dDay !== null && (
            <div className="text-center mb-4">
              <div className="text-3xl font-extrabold text-accent">
                {dDay === 0 ? 'D-Day' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
              </div>
              <div className="text-[11px] text-tx-muted mt-0.5">{nextMilestone.label}까지</div>
            </div>
          )}

          <div className="space-y-2 mt-auto">
            {milestones.map(m => {
              const mDate = new Date(m.date);
              const isPast = mDate < today;
              const isNext = m.key === nextMilestone?.key;
              const dateStr = m.date.slice(5).replace('-', '/');

              return (
                <div key={m.key} className={`flex items-center gap-2 text-[11px] ${isPast ? 'text-tx-muted' : isNext ? 'text-accent font-bold' : 'text-tx-secondary'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPast ? 'bg-tx-muted' : isNext ? 'bg-accent' : 'bg-ln-strong'}`} />
                  <span className={`flex-1 ${isPast ? 'line-through' : ''}`}>{m.label}</span>
                  <span className="tabular-nums">{dateStr}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── 결함 현황 위젯 ─── */

function DefectSummaryWidget({ projectId }: { projectId: string }) {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !projectId) { setLoading(false); return; }
    const q = query(collection(db, 'projects', projectId, 'defects'));
    getDocs(q).then(snap => {
      setDefects(snap.docs.map(d => ({ ...d.data(), defectId: d.id } as Defect)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  const stats = useMemo(() => {
    const byVersion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const bySeverity: Record<string, number> = { H: 0, M: 0, L: 0 };
    for (const d of defects) {
      byVersion[d.reportVersion] = (byVersion[d.reportVersion] || 0) + 1;
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
    }
    return { total: defects.length, byVersion, bySeverity, derived: defects.filter(d => d.isDerived).length };
  }, [defects]);

  return (
    <div className="rounded-2xl border border-ln bg-surface-raised p-5 flex flex-col">
      <div className="flex items-center gap-1.5 mb-4">
        <Bug size={14} className="text-accent" />
        <span className="text-xs font-bold text-tx-secondary">결함 현황</span>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-surface-sunken rounded w-1/2" />
          <div className="h-3 bg-surface-sunken rounded w-full" />
          <div className="h-3 bg-surface-sunken rounded w-3/4" />
        </div>
      ) : stats.total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <Bug size={20} className="text-tx-muted" />
          <p className="text-xs text-tx-muted">등록된 결함이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="text-3xl font-extrabold text-tx-primary">{stats.total}<span className="text-base font-bold">건</span></div>
            {stats.derived > 0 && (
              <div className="text-[10px] text-status-fail-text mt-0.5">파생 {stats.derived}건</div>
            )}
          </div>

          <div className="space-y-2 mb-4">
            {([1, 2, 3, 4] as const).map(v => {
              const count = stats.byVersion[v] || 0;
              const maxCount = Math.max(...Object.values(stats.byVersion), 1);
              return (
                <div key={v} className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-tx-muted w-6">{v}차</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-sunken overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-tx-secondary w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3 mt-auto">
            {(['H', 'M', 'L'] as const).map(s => (
              <div key={s} className="text-center">
                <div className={`text-sm font-bold ${s === 'H' ? 'text-status-fail-text' : s === 'M' ? 'text-status-hold-text' : 'text-tx-muted'}`}>
                  {stats.bySeverity[s] || 0}
                </div>
                <div className="text-[9px] text-tx-muted">{s}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
