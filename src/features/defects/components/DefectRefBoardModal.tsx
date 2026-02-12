import { useState, useEffect, useMemo } from 'react';
import { Search, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { DEFECT_REFERENCES } from 'virtual:content/defects';

interface DefectRefBoardModalProps {
  open: boolean;
  onClose: () => void;
}

type Severity = 'H' | 'M' | 'L';
type DefectItem = (typeof DEFECT_REFERENCES)[keyof typeof DEFECT_REFERENCES][number];

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; icon: typeof AlertTriangle }> = {
  H: {
    label: 'High — 치명적 결함',
    color: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10',
    icon: AlertTriangle,
  },
  M: {
    label: 'Medium — 주요 결함',
    color: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10',
    icon: AlertCircle,
  },
  L: {
    label: 'Low — 경미한 결함',
    color: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10',
    icon: Info,
  },
};

const SEVERITY_BADGE: Record<Severity, string> = {
  H: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25',
  M: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25',
  L: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25',
};

function groupBySeverity(items: DefectItem[]) {
  const groups: Record<Severity, DefectItem[]> = { H: [], M: [], L: [] };
  for (const item of items) {
    const sev = item.severity as Severity;
    if (groups[sev]) groups[sev].push(item);
    else groups.M.push(item);
  }
  return (['H', 'M', 'L'] as Severity[]).filter((s) => groups[s].length > 0).map((s) => ({
    severity: s,
    items: groups[s],
  }));
}

export function DefectRefBoardModal({ open, onClose }: DefectRefBoardModalProps) {
  const [activeTab, setActiveTab] = useState<keyof typeof DEFECT_REFERENCES>('기능적합성');
  const tabs = Object.keys(DEFECT_REFERENCES) as Array<keyof typeof DEFECT_REFERENCES>;

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const grouped = useMemo(
    () => groupBySeverity(DEFECT_REFERENCES[activeTab] || []),
    [activeTab]
  );

  const totalCount = (DEFECT_REFERENCES[activeTab] || []).length;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-[var(--overlay-backdrop)] p-3"
      onClick={onClose}
    >
      <div
        className="w-full h-full rounded-xl border border-ln bg-surface-overlay shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ln px-4 py-2.5 bg-surface-base shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-tx-muted" />
              <span className="text-sm font-bold text-tx-primary">결함 분류 기준표</span>
            </div>
            <span className="text-[10px] text-tx-muted">품질특성별 결함 사례 · 결함 탐색 시 참고</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln p-1.5 text-tx-muted hover:text-tx-primary hover:bg-surface-raised transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left sidebar — category tabs */}
          <div className="w-44 shrink-0 border-r border-ln bg-surface-sunken overflow-y-auto py-2 px-1.5 space-y-0.5">
            {tabs.map((key) => {
              const count = (DEFECT_REFERENCES[key] || []).length;
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left px-2.5 py-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-between gap-1 ${
                    isActive
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-tx-tertiary hover:bg-surface-raised hover:text-tx-secondary'
                  }`}
                >
                  <span className="truncate">{key}</span>
                  <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-base text-tx-muted border border-ln'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Category header */}
            <div className="px-4 py-2.5 border-b border-ln-subtle bg-surface-base flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-tx-primary">{String(activeTab)}</span>
                <span className="text-[10px] text-tx-muted">{totalCount}건</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-tx-muted">
                {(['H', 'M', 'L'] as Severity[]).map((s) => {
                  const count = grouped.find((g) => g.severity === s)?.items.length ?? 0;
                  if (count === 0) return null;
                  return (
                    <span key={s} className="flex items-center gap-1">
                      <span className={`inline-block h-2 w-2 rounded-full ${
                        s === 'H' ? 'bg-red-500' : s === 'M' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      {SEVERITY_CONFIG[s].label.split('—')[0].trim()} {count}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Cards grouped by severity */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {grouped.map(({ severity, items }) => {
                const config = SEVERITY_CONFIG[severity];
                const SevIcon = config.icon;
                return (
                  <div key={severity}>
                    {/* Severity section header */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border mb-3 ${config.color}`}>
                      <SevIcon size={13} />
                      <span className="text-[11px] font-bold">{config.label}</span>
                      <span className="text-[10px] opacity-60 ml-auto">{items.length}건</span>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                      {items.map((item, idx) => (
                        <div
                          key={`${String(activeTab)}-${severity}-${idx}`}
                          className="bg-surface-base rounded-lg border border-ln px-3 py-2.5 hover:border-ln-strong hover:shadow-sm transition-all flex flex-col"
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${SEVERITY_BADGE[severity]}`}>
                              {severity}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-surface-sunken text-tx-muted border-ln">
                              {item.frequency === 'A' ? 'Always' : 'Intermittent'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-tx-primary mb-1.5 line-clamp-2 leading-snug">
                            {item.summary}
                          </h4>
                          <div className="flex-1 bg-surface-sunken rounded-md p-2 border border-ln-subtle">
                            <p className="text-[10px] text-tx-tertiary leading-relaxed line-clamp-4">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {totalCount === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-tx-muted">
                  <Search size={24} className="mb-2 opacity-30" />
                  <p className="text-xs">등록된 사례가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
