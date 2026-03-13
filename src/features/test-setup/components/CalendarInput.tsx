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
      <label className="text-xs text-tx-tertiary block mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full text-left bg-input-bg border border-ln rounded-xl px-3 py-2 text-sm text-input-text hover:border-ln-strong"
      >
        {formatValue}
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-ln bg-surface-overlay backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-3">
          <div className="flex items-center justify-between text-xs text-tx-secondary mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="px-2 py-1 rounded-md hover:bg-interactive-hover"
            >
              이전
            </button>
            <span className="font-semibold text-tx-secondary">
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="px-2 py-1 rounded-md hover:bg-interactive-hover"
            >
              다음
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-tx-muted mb-1">
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
                      ? 'bg-accent text-white'
                      : 'text-tx-secondary hover:bg-interactive-hover'
                    : 'text-tx-muted'
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
