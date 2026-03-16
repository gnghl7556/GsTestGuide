import { useMemo } from 'react';
import { Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { CATEGORY_THEMES } from 'virtual:content/categories';
import type { ChecklistItem, ReviewData } from '../../../types';
import { BreakableText } from '../../../components/ui';

interface NextItemsPanelProps {
  checklist: ChecklistItem[];
  reviewData: Record<string, ReviewData>;
  setSelectedReqId: (id: string) => void;
}

const PHASE_LABELS: Record<string, string> = {
  SETUP: '시험준비',
  EXECUTION: '시험수행',
  COMPLETION: '시험종료',
};

export function NextItemsPanel({ checklist, reviewData, setSelectedReqId }: NextItemsPanelProps) {
  const { pending, held } = useMemo(() => {
    const applicable = checklist.filter(i => i.status !== 'Not_Applicable');
    const pending: ChecklistItem[] = [];
    const held: ChecklistItem[] = [];
    for (const item of applicable) {
      const s = reviewData[item.id]?.status;
      if (!s || s === 'None') pending.push(item);
      else if (s === 'Hold') held.push(item);
    }
    return { pending: pending.slice(0, 5), held };
  }, [checklist, reviewData]);

  const allDone = pending.length === 0 && held.length === 0;

  return (
    <div className="h-full bg-surface-base rounded-xl border border-ln shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-ln-subtle">
        <h3 className="text-sm font-extrabold text-tx-primary tracking-wider">다음 할 일</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {allDone ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 size={32} className="text-status-pass-text mb-3" />
            <p className="text-sm font-bold text-tx-primary mb-1">모든 항목 검토 완료</p>
            <p className="text-xs text-tx-muted">수고하셨습니다!</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-tx-muted uppercase tracking-wide px-1 mb-2">
                  미검토 항목
                </div>
                <ul className="space-y-1">
                  {pending.map(item => {
                    const theme = CATEGORY_THEMES[item.category];
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedReqId(item.id)}
                          className="w-full text-left px-3 py-2.5 rounded-lg border border-ln bg-surface-base hover:bg-surface-raised hover:border-ln-strong transition-all flex items-center gap-2.5 group"
                        >
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${theme.bg}`} />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-semibold text-tx-primary line-clamp-2 break-keep break-words">
                              <BreakableText>{item.title}</BreakableText>
                            </span>
                            <span className={`text-[10px] ${theme.text}`}>
                              {PHASE_LABELS[item.category] || item.category}
                            </span>
                          </div>
                          <ChevronRight size={12} className="text-tx-muted shrink-0 group-hover:text-tx-secondary transition-colors" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {held.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-tx-muted uppercase tracking-wide px-1 mb-2">
                  보류 항목
                </div>
                <ul className="space-y-1">
                  {held.map(item => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedReqId(item.id)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border border-status-hold-border bg-status-hold-bg/30 hover:bg-status-hold-bg/60 transition-all flex items-center gap-2.5 group"
                      >
                        <Clock size={12} className="text-status-hold-text shrink-0" />
                        <span className="flex-1 min-w-0 text-xs font-semibold text-tx-primary line-clamp-2 break-keep break-words">
                          <BreakableText>{item.title}</BreakableText>
                        </span>
                        <ChevronRight size={12} className="text-tx-muted shrink-0 group-hover:text-tx-secondary transition-colors" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
