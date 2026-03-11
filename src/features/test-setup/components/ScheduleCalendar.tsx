import { useMemo, useState, useRef, useEffect } from 'react';
import type { Project } from '../../../types';
import { MILESTONES, MILESTONE_COLOR_MAP, MILESTONE_ICON_MAP, getProjectColor } from '../../../constants/schedule';
import type { MilestoneColor } from '../../../constants/schedule';
import { MilestoneIcon } from '../../../components/schedule/MilestoneIcon';

interface ScheduleCalendarProps {
  projects: Project[];
}

type MilestoneEntry = {
  testNumber: string;
  milestoneKey: string;
  milestoneLabel: string;
  color: MilestoneColor;
};

type ProjectSpan = {
  testNumber: string;
  color: MilestoneColor;
  minDate: string;
  maxDate: string;
  lane: number;
};

type PeriodBar = {
  color: MilestoneColor;
  lane: number;
  isStart: boolean;
  isEnd: boolean;
};

export function ScheduleCalendar({ projects }: ScheduleCalendarProps) {
  const today = new Date();
  const todayStr = toLocalDateString(today);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const calendarRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverDate) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverDate(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverDate]);

  const projectColorMap = useMemo(() => {
    const map = new Map<string, MilestoneColor>();
    for (const p of projects) map.set(p.testNumber, getProjectColor(p));
    return map;
  }, [projects]);

  const dateMap = useMemo(() => {
    const map: Record<string, MilestoneEntry[]> = {};
    for (const project of projects) {
      const color = projectColorMap.get(project.testNumber) ?? 'blue';
      for (const ms of MILESTONES) {
        const dateValue = project[ms.key as keyof Project] as string | undefined;
        if (!dateValue) continue;
        if (!map[dateValue]) map[dateValue] = [];
        map[dateValue].push({ testNumber: project.testNumber, milestoneKey: ms.key, milestoneLabel: ms.label, color });
      }
      for (const cm of project.customMilestones ?? []) {
        if (!cm.date) continue;
        if (!map[cm.date]) map[cm.date] = [];
        map[cm.date].push({ testNumber: project.testNumber, milestoneKey: cm.id, milestoneLabel: cm.label, color });
      }
    }
    return map;
  }, [projects, projectColorMap]);

  // Compute project spans + lane assignment
  const projectSpans = useMemo(() => {
    const spans: Array<Omit<ProjectSpan, 'lane'>> = [];
    for (const project of projects) {
      const color = projectColorMap.get(project.testNumber) ?? 'blue';
      const dates: string[] = [];
      for (const ms of MILESTONES) {
        const d = project[ms.key as keyof Project] as string | undefined;
        if (d) dates.push(d);
      }
      for (const cm of project.customMilestones ?? []) {
        if (cm.date) dates.push(cm.date);
      }
      if (dates.length >= 2) {
        dates.sort();
        spans.push({ testNumber: project.testNumber, color, minDate: dates[0], maxDate: dates[dates.length - 1] });
      }
    }
    // Greedy lane assignment
    spans.sort((a, b) => a.minDate.localeCompare(b.minDate));
    const laneEnds: string[] = [];
    const result: ProjectSpan[] = [];
    for (const span of spans) {
      let lane = -1;
      for (let i = 0; i < laneEnds.length; i++) {
        if (laneEnds[i] < span.minDate) { lane = i; laneEnds[i] = span.maxDate; break; }
      }
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(span.maxDate); }
      result.push({ ...span, lane });
    }
    return result;
  }, [projects, projectColorMap]);

  // Precompute date -> period bars (skip weekends)
  const datePeriodMap = useMemo(() => {
    const map = new Map<string, PeriodBar[]>();
    for (const span of projectSpans) {
      const d = new Date(span.minDate + 'T00:00:00');
      const end = new Date(span.maxDate + 'T00:00:00');
      // Collect weekday-only dates in range
      const weekdays: string[] = [];
      while (d <= end) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) weekdays.push(toLocalDateString(d));
        d.setDate(d.getDate() + 1);
      }
      for (let i = 0; i < weekdays.length; i++) {
        const ds = weekdays[i];
        const arr = map.get(ds) ?? [];
        arr.push({ color: span.color, lane: span.lane, isStart: i === 0, isEnd: i === weekdays.length - 1 });
        map.set(ds, arr);
      }
    }
    return map;
  }, [projectSpans]);

  const maxLanes = projectSpans.length > 0 ? Math.max(...projectSpans.map((s) => s.lane)) + 1 : 0;
  const cellHeight = 44 + Math.min(maxLanes, 3) * 3;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number; dateStr: string; dayOfWeek: number } | null> = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, dateStr: `${year}-${mm}-${dd}`, dayOfWeek: new Date(year, month, d).getDay() });
  }

  const handleCellClick = (dateStr: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const milestones = dateMap[dateStr];
    if (!milestones || milestones.length === 0) return;
    if (popoverDate === dateStr) { setPopoverDate(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const calRect = calendarRef.current?.getBoundingClientRect();
    if (calRect) {
      setPopoverPos({ top: rect.bottom - calRect.top + 4, left: rect.left - calRect.left + rect.width / 2 });
    }
    setPopoverDate(dateStr);
  };

  const activeProjects = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ testNumber: string; color: MilestoneColor }> = [];
    for (const p of projects) {
      if (seen.has(p.testNumber)) continue;
      seen.add(p.testNumber);
      result.push({ testNumber: p.testNumber, color: projectColorMap.get(p.testNumber) ?? 'blue' });
    }
    return result;
  }, [projects, projectColorMap]);

  return (
    <div ref={calendarRef} className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0b1230]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition">이전</button>
        <span className="text-sm font-bold text-slate-700 dark:text-white/90">{year}년 {month + 1}월</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition">다음</button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div key={day} className={`text-center text-[10px] font-semibold py-1 ${
            i === 0 || i === 6 ? 'text-slate-300 dark:text-white/30' : 'text-slate-400 dark:text-white/50'
          }`}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, idx) => {
          if (!cell) {
            const blankDow = idx % 7;
            const isWeekend = blankDow === 0 || blankDow === 6;
            return <div key={`empty-${idx}`} style={{ height: cellHeight }} className={`rounded-xl ${isWeekend ? 'bg-slate-50/80 dark:bg-white/[0.02]' : ''}`} />;
          }

          const isToday = cell.dateStr === todayStr;
          const isWeekend = cell.dayOfWeek === 0 || cell.dayOfWeek === 6;
          const milestones = dateMap[cell.dateStr] || [];
          const hasMilestones = milestones.length > 0;
          const periods = datePeriodMap.get(cell.dateStr) ?? [];

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={isWeekend && !hasMilestones}
              onClick={(e) => handleCellClick(cell.dateStr, e)}
              style={{ height: cellHeight }}
              className={`relative rounded-xl text-xs font-medium transition-all duration-150 flex flex-col items-center justify-start pt-1.5 gap-0.5 overflow-hidden ${
                isWeekend
                  ? hasMilestones
                    ? 'bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] text-slate-400 dark:text-white/40 cursor-pointer hover:shadow-sm'
                    : 'bg-slate-50/80 dark:bg-white/[0.02] text-slate-300 dark:text-white/15 cursor-not-allowed'
                  : isToday
                    ? 'bg-gradient-to-br from-blue-500/15 to-purple-500/15 dark:from-blue-500/25 dark:to-purple-500/25 border border-blue-300/60 dark:border-blue-400/30 text-blue-700 dark:text-blue-200 shadow-[0_2px_8px_rgba(59,130,246,0.15)] dark:shadow-[0_2px_8px_rgba(59,130,246,0.2)]'
                    : hasMilestones
                      ? 'bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_3px_12px_rgba(0,0,0,0.3)] hover:scale-[1.03] cursor-pointer'
                      : 'bg-white/60 dark:bg-white/[0.025] border border-slate-100/60 dark:border-white/[0.04] text-slate-500 dark:text-white/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none'
              }`}
            >
              {/* Liquid fill — 시험 진행 기간 표시 (층 분리) */}
              {periods.length > 0 && !isWeekend && (
                (() => {
                  const uniqueColors = [...new Set(periods.map((p) => p.color))];
                  const layerH = Math.min(30, 50 / Math.max(uniqueColors.length, 1));
                  return uniqueColors.map((c, ci) => (
                    <div
                      key={ci}
                      className={`absolute inset-x-0 ${MILESTONE_COLOR_MAP[c].dot} transition-all duration-300 ${ci === 0 ? 'rounded-b-xl' : ''}`}
                      style={{
                        bottom: `${ci * layerH}%`,
                        height: `${layerH}%`,
                        opacity: 0.18,
                      }}
                    />
                  ));
                })()
              )}
              <span className="relative z-10">{cell.day}</span>
              {milestones.length > 0 && (
                <div className="flex items-center gap-0.5 relative z-10">
                  {milestones.slice(0, 3).map((m, mi) => (
                    <MilestoneIcon key={`${m.testNumber}-${m.milestoneKey}-${mi}`}
                      name={MILESTONE_ICON_MAP[m.milestoneKey] ?? 'star'}
                      className={`w-2.5 h-2.5 ${MILESTONE_COLOR_MAP[m.color].text}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Popover */}
      {popoverDate && dateMap[popoverDate] && (
        <div ref={popoverRef}
          className="absolute z-40 w-56 rounded-xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#0b1230]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-3"
          style={{ top: popoverPos.top, left: Math.max(0, Math.min(popoverPos.left - 112, (calendarRef.current?.offsetWidth ?? 224) - 224)) }}>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-white/60 mb-2">{popoverDate}</div>
          <div className="space-y-1.5">
            {dateMap[popoverDate].map((entry, i) => (
              <div key={`${entry.testNumber}-${entry.milestoneLabel}-${i}`}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${MILESTONE_COLOR_MAP[entry.color].border} ${MILESTONE_COLOR_MAP[entry.color].bg}`}>
                <MilestoneIcon name={MILESTONE_ICON_MAP[entry.milestoneKey] ?? 'star'} className={`w-3 h-3 shrink-0 ${MILESTONE_COLOR_MAP[entry.color].text}`} />
                <span className={`font-semibold ${MILESTONE_COLOR_MAP[entry.color].text}`}>{entry.testNumber}</span>
                <span className={`${MILESTONE_COLOR_MAP[entry.color].text} opacity-80`}>{entry.milestoneLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend: per-project */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-3">
        {activeProjects.map((p) => (
          <div key={p.testNumber} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-white/60">
            <span className={`w-2 h-2 rounded-full ${MILESTONE_COLOR_MAP[p.color].dot}`} />
            {p.testNumber}
          </div>
        ))}
      </div>
    </div>
  );
}

function toLocalDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
