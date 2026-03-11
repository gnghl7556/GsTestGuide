import { useMemo, useState, useRef, useEffect } from 'react';
import type { Project } from '../../../types';
import { MILESTONES, MILESTONE_COLOR_MAP, getProjectColor } from '../../../constants/schedule';
import type { MilestoneColor } from '../../../constants/schedule';

interface ScheduleCalendarProps {
  projects: Project[];
}

type MilestoneEntry = {
  testNumber: string;
  milestoneLabel: string;
  color: MilestoneColor;
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

  // Per-project color map
  const projectColorMap = useMemo(() => {
    const map = new Map<string, MilestoneColor>();
    for (const p of projects) {
      map.set(p.testNumber, getProjectColor(p));
    }
    return map;
  }, [projects]);

  // Build date -> milestones map (using project color, not milestone color)
  const dateMap = useMemo(() => {
    const map: Record<string, MilestoneEntry[]> = {};
    for (const project of projects) {
      const color = projectColorMap.get(project.testNumber) ?? 'blue';
      for (const ms of MILESTONES) {
        const dateValue = project[ms.key as keyof Project] as string | undefined;
        if (!dateValue) continue;
        if (!map[dateValue]) map[dateValue] = [];
        map[dateValue].push({
          testNumber: project.testNumber,
          milestoneLabel: ms.label,
          color,
        });
      }
      // Custom milestones
      for (const cm of project.customMilestones ?? []) {
        if (!cm.date) continue;
        if (!map[cm.date]) map[cm.date] = [];
        map[cm.date].push({
          testNumber: project.testNumber,
          milestoneLabel: cm.label,
          color,
        });
      }
    }
    return map;
  }, [projects, projectColorMap]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  void startOfMonth;

  const cells: Array<{ day: number; dateStr: string; dayOfWeek: number } | null> = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, dateStr: `${year}-${m}-${dd}`, dayOfWeek: new Date(year, month, d).getDay() });
  }

  const handleCellClick = (dateStr: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const milestones = dateMap[dateStr];
    if (!milestones || milestones.length === 0) return;

    if (popoverDate === dateStr) {
      setPopoverDate(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const calRect = calendarRef.current?.getBoundingClientRect();
    if (calRect) {
      setPopoverPos({
        top: rect.bottom - calRect.top + 4,
        left: rect.left - calRect.left + rect.width / 2,
      });
    }
    setPopoverDate(dateStr);
  };

  // Active projects for legend
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
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition"
        >
          이전
        </button>
        <span className="text-sm font-bold text-slate-700 dark:text-white/90">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition"
        >
          다음
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div key={day} className={`text-center text-[10px] font-semibold py-1 ${
            i === 0 || i === 6 ? 'text-slate-300 dark:text-white/30' : 'text-slate-400 dark:text-white/50'
          }`}>
            {day}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) {
            const blankDow = idx % 7;
            const isWeekend = blankDow === 0 || blankDow === 6;
            return <div key={`empty-${idx}`} className={`h-10 rounded-lg ${isWeekend ? 'bg-slate-50 dark:bg-white/[0.03]' : ''}`} />;
          }

          const isToday = cell.dateStr === todayStr;
          const isWeekend = cell.dayOfWeek === 0 || cell.dayOfWeek === 6;
          const milestones = dateMap[cell.dateStr] || [];
          const hasMilestones = milestones.length > 0;
          const uniqueColors = [...new Set(milestones.map((m) => m.color))];

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={isWeekend && !hasMilestones}
              onClick={(e) => handleCellClick(cell.dateStr, e)}
              className={`relative h-10 rounded-lg text-xs font-medium transition flex flex-col items-center justify-center gap-0.5 ${
                isWeekend
                  ? hasMilestones
                    ? 'bg-slate-50 dark:bg-white/[0.03] text-slate-400 dark:text-white/40 cursor-pointer'
                    : 'bg-slate-50 dark:bg-white/[0.03] text-slate-300 dark:text-white/20 cursor-not-allowed'
                  : isToday
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 text-blue-700 dark:text-blue-200 ring-1 ring-blue-400/50 dark:ring-blue-400/40'
                    : hasMilestones
                      ? 'text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                      : 'text-slate-500 dark:text-white/60'
              }`}
            >
              <span>{cell.day}</span>
              {uniqueColors.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {uniqueColors.map((color) => (
                    <span key={color} className={`w-1.5 h-1.5 rounded-full ${MILESTONE_COLOR_MAP[color].dot}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Popover */}
      {popoverDate && dateMap[popoverDate] && (
        <div
          ref={popoverRef}
          className="absolute z-40 w-56 rounded-xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#0b1230]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-3"
          style={{
            top: popoverPos.top,
            left: Math.max(0, Math.min(popoverPos.left - 112, (calendarRef.current?.offsetWidth ?? 224) - 224)),
          }}
        >
          <div className="text-[11px] font-semibold text-slate-500 dark:text-white/60 mb-2">{popoverDate}</div>
          <div className="space-y-1.5">
            {dateMap[popoverDate].map((entry, i) => (
              <div
                key={`${entry.testNumber}-${entry.milestoneLabel}-${i}`}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${MILESTONE_COLOR_MAP[entry.color].border} ${MILESTONE_COLOR_MAP[entry.color].bg}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${MILESTONE_COLOR_MAP[entry.color].dot}`} />
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
