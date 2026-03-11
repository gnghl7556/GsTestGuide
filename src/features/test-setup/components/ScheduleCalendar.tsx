import { useMemo, useState, useRef, useEffect } from 'react';
import type { Project } from '../../../types';
import { MILESTONES, MILESTONE_COLOR_MAP } from '../../../constants/schedule';
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

  // Close popover on outside click
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

  // Build date -> milestones map
  const dateMap = useMemo(() => {
    const map: Record<string, MilestoneEntry[]> = {};
    for (const project of projects) {
      for (const ms of MILESTONES) {
        const dateValue = project[ms.key as keyof Project] as string | undefined;
        if (!dateValue) continue;
        if (!map[dateValue]) map[dateValue] = [];
        map[dateValue].push({
          testNumber: project.testNumber,
          milestoneLabel: ms.label,
          color: ms.color,
        });
      }
    }
    return map;
  }, [projects]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, dateStr: `${year}-${m}-${dd}` });
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
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-slate-400 dark:text-white/50 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-10" />;
          }

          const isToday = cell.dateStr === todayStr;
          const milestones = dateMap[cell.dateStr] || [];
          const hasMilestones = milestones.length > 0;
          // Deduplicate colors for dots
          const uniqueColors = [...new Set(milestones.map((m) => m.color))];

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={(e) => handleCellClick(cell.dateStr, e)}
              className={`relative h-10 rounded-lg text-xs font-medium transition flex flex-col items-center justify-center gap-0.5 ${
                isToday
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
                    <span
                      key={color}
                      className={`w-1.5 h-1.5 rounded-full ${MILESTONE_COLOR_MAP[color].dot}`}
                    />
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

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-3">
        {MILESTONES.map((ms) => (
          <div key={ms.key} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-white/60">
            <span className={`w-2 h-2 rounded-full ${MILESTONE_COLOR_MAP[ms.color].dot}`} />
            {ms.label}
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
