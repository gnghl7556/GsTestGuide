import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, Circle, Check, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_THEMES } from 'virtual:content/categories';
import type { ChecklistItem, ReviewData } from '../../../types';

interface ProgressDashboardProps {
  checklist: ChecklistItem[];
  reviewData: Record<string, ReviewData>;
  setSelectedReqId: (id: string) => void;
}

const PHASE_LABELS: Record<string, string> = {
  SETUP: '시험준비',
  EXECUTION: '시험수행',
  COMPLETION: '시험종료',
};

export function ProgressDashboard({ checklist, reviewData, setSelectedReqId }: ProgressDashboardProps) {
  const stats = useMemo(() => {
    const applicable = checklist.filter(i => i.status !== 'Not_Applicable');
    let pass = 0, fail = 0, hold = 0, none = 0;
    for (const item of applicable) {
      const s = reviewData[item.id]?.status;
      if (s === 'Verified') pass++;
      else if (s === 'Cannot_Verify') fail++;
      else if (s === 'Hold') hold++;
      else none++;
    }
    const total = applicable.length;
    const completed = pass + fail;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, pass, fail, hold, none, completed, rate };
  }, [checklist, reviewData]);

  const phaseStats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const items = checklist.filter(i => i.category === cat.id);
      const applicable = items.filter(i => i.status !== 'Not_Applicable');
      const completed = applicable.filter(i => {
        const s = reviewData[i.id]?.status;
        return s === 'Verified' || s === 'Cannot_Verify';
      });
      return {
        id: cat.id,
        name: cat.name,
        items: applicable,
        total: applicable.length,
        completed: completed.length,
        rate: applicable.length === 0 ? 0 : Math.round((completed.length / applicable.length) * 100),
      };
    });
  }, [checklist, reviewData]);

  // SVG circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.rate / 100) * circumference;

  // 입장 애니메이션
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handlePhaseClick = (phase: typeof phaseStats[number]) => {
    const firstPending = phase.items.find(i => {
      const s = reviewData[i.id]?.status;
      return !s || s === 'None';
    });
    setSelectedReqId(firstPending?.id ?? phase.items[0]?.id);
  };

  return (
    <div className="h-full bg-surface-base rounded-xl border border-ln shadow-sm flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 상단: 전체 완료율 */}
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
              <circle
                cx="64" cy="64" r={radius}
                fill="none"
                stroke="var(--ln)"
                strokeWidth="8"
              />
              <circle
                cx="64" cy="64" r={radius}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={mounted ? strokeDashoffset : circumference}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-tx-primary">{stats.rate}%</span>
              <span className="text-[10px] text-tx-muted font-medium">{stats.completed}/{stats.total}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-tx-primary mb-1">점검 진행 현황</h2>
            <p className="text-xs text-tx-muted leading-relaxed">
              전체 {stats.total}개 항목 중 {stats.completed}개 검토 완료
            </p>
          </div>
        </div>

        {/* 중단: phase별 진행 바 */}
        <div className="space-y-4">
          {phaseStats.map((phase, phaseIdx) => {
            const theme = CATEGORY_THEMES[phase.id];
            return (
              <div
                key={phase.id}
                className={`rounded-xl border border-ln p-4 ${theme.lightBg} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => handlePhaseClick(phase)}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-sm font-bold ${theme.text}`}>
                    {PHASE_LABELS[phase.id] || phase.name}
                  </span>
                  <span className={`text-xs font-semibold ${theme.text} opacity-80`}>
                    {phase.completed}/{phase.total}
                  </span>
                </div>
                {/* 진행 바 */}
                <div className="h-2 rounded-full bg-surface-sunken overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${theme.bg}`}
                    style={{
                      width: mounted ? `${phase.rate}%` : '0%',
                      transitionDelay: `${phaseIdx * 150}ms`,
                    }}
                  />
                </div>
                {/* 항목별 미니 도트 */}
                <div className="flex flex-wrap gap-1.5">
                  {phase.items.map(item => {
                    const status = reviewData[item.id]?.status ?? 'None';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedReqId(item.id)}
                        title={item.title}
                        className="group relative"
                      >
                        {status === 'Verified' ? (
                          <span className="h-5 w-5 rounded-full bg-status-pass-text text-white inline-flex items-center justify-center group-hover:scale-125 transition-transform">
                            <Check size={10} />
                          </span>
                        ) : status === 'Cannot_Verify' ? (
                          <span className="h-5 w-5 rounded-full bg-status-fail-text text-white inline-flex items-center justify-center group-hover:scale-125 transition-transform">
                            <X size={10} />
                          </span>
                        ) : status === 'Hold' ? (
                          <span className="h-5 w-5 rounded-full bg-status-hold-text text-white inline-flex items-center justify-center group-hover:scale-125 transition-transform">
                            <span className="text-[10px] font-bold leading-none">-</span>
                          </span>
                        ) : (
                          <span className="h-5 w-5 rounded-full bg-surface-sunken border border-ln inline-flex items-center justify-center group-hover:scale-125 group-hover:border-ln-strong transition-all" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단: 상태별 분포 */}
        <div
          className={`grid grid-cols-4 gap-3 transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '450ms' }}
        >
          <div className="rounded-xl bg-surface-raised border border-ln px-3 py-3 text-center">
            <div className="flex items-center justify-center mb-1.5">
              <CheckCircle2 size={14} className="text-status-pass-text" />
            </div>
            <div className="text-xl font-extrabold text-status-pass-text">{stats.pass}</div>
            <div className="text-[10px] text-tx-tertiary font-medium mt-0.5">적합</div>
          </div>
          <div className="rounded-xl bg-surface-raised border border-ln px-3 py-3 text-center">
            <div className="flex items-center justify-center mb-1.5">
              <AlertCircle size={14} className="text-status-fail-text" />
            </div>
            <div className="text-xl font-extrabold text-status-fail-text">{stats.fail}</div>
            <div className="text-[10px] text-tx-tertiary font-medium mt-0.5">부적합</div>
          </div>
          <div className="rounded-xl bg-surface-raised border border-ln px-3 py-3 text-center">
            <div className="flex items-center justify-center mb-1.5">
              <Clock size={14} className="text-status-hold-text" />
            </div>
            <div className="text-xl font-extrabold text-status-hold-text">{stats.hold}</div>
            <div className="text-[10px] text-tx-tertiary font-medium mt-0.5">보류</div>
          </div>
          <div className="rounded-xl bg-surface-raised border border-ln px-3 py-3 text-center">
            <div className="flex items-center justify-center mb-1.5">
              <Circle size={14} className="text-tx-muted" />
            </div>
            <div className="text-xl font-extrabold text-tx-muted">{stats.none}</div>
            <div className="text-[10px] text-tx-tertiary font-medium mt-0.5">미검토</div>
          </div>
        </div>
      </div>
    </div>
  );
}
