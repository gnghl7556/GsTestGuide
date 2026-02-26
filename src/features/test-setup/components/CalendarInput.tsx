import { useState } from 'react';

interface CalendarInputProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

export function CalendarInput({ label, value, onChange }: CalendarInputProps) {
  const [open, setOpen] = useState(false);
  const toLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [viewDate, setViewDate] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();
  const weeks: Array<{ label: string; date: Date | null }> = [];

  void startOfMonth;

  for (let i = 0; i < startDay; i += 1) {
    weeks.push({ label: '', date: null });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    weeks.push({ label: String(d), date: new Date(viewDate.getFullYear(), viewDate.getMonth(), d) });
  }

  const formatValue = value || '날짜 선택';
  const isSelected = (date: Date) => value === toLocalDateString(date);

  return (
    <div className="relative">
      <label className="text-xs text-slate-500 dark:text-white/60 block mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full text-left bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-white/80 hover:border-slate-300 dark:hover:border-white/20"
      >
        {formatValue}
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0b1230]/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-3">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-white/70 mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10"
            >
              이전
            </button>
            <span className="font-semibold text-slate-700 dark:text-white/80">
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10"
            >
              다음
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-400 dark:text-white/50 mb-1">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="text-center">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {weeks.map((cell, idx) => (
              <button
                key={`${cell.label}-${idx}`}
                type="button"
                disabled={!cell.date}
                onClick={() => {
                  if (!cell.date) return;
                  onChange(toLocalDateString(cell.date));
                  setOpen(false);
                }}
                className={`h-8 rounded-md ${
                  cell.date
                    ? isSelected(cell.date)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10'
                    : 'text-slate-300 dark:text-white/30'
                }`}
              >
                {cell.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
