import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { DEFECT_REFERENCES } from 'virtual:content/defects';

interface DefectRefBoardModalProps {
  open: boolean;
  onClose: () => void;
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

  if (!open) return null;

  type DefectReferenceItem = (typeof DEFECT_REFERENCES)[keyof typeof DEFECT_REFERENCES][number];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[80vh] rounded-xl border border-ln bg-surface-overlay shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ln px-4 py-3">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-tx-muted" />
            <span className="text-xs font-bold text-tx-primary">결함 분류 기준표 — 품질특성별 사례</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ln p-1 text-tx-muted hover:text-tx-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-ln-subtle bg-surface-sunken flex gap-1.5 overflow-x-auto">
          {tabs.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border whitespace-nowrap ${
                activeTab === key
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong hover:text-tx-secondary'
              }`}
            >
              {key}
              <span className="ml-1 text-[9px] opacity-70">
                {(DEFECT_REFERENCES[key] || []).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(DEFECT_REFERENCES[activeTab] || []).map((item: DefectReferenceItem, idx: number) => (
              <div
                key={`${String(activeTab)}-${idx}`}
                className="bg-surface-base rounded-lg border border-ln p-3 hover:border-ln-strong hover:shadow-sm transition-all flex flex-col"
              >
                <div className="flex gap-1.5 mb-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    item.severity === 'H' ? 'bg-error-50 text-error-700 border-error-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                    item.severity === 'M' ? 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                    'bg-success-50 text-success-700 border-success-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                  }`}>
                    {item.severity}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-surface-sunken text-tx-muted border-ln">
                    {item.frequency === 'A' ? 'Always' : 'Intermittent'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-tx-primary mb-1.5 line-clamp-1">
                  {item.summary}
                </h4>
                <div className="flex-1 bg-surface-sunken rounded-md p-2 border border-ln-subtle">
                  <p className="text-[11px] text-tx-tertiary leading-relaxed line-clamp-4">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {(!DEFECT_REFERENCES[activeTab] || DEFECT_REFERENCES[activeTab].length === 0) && (
            <div className="h-40 flex flex-col items-center justify-center text-tx-muted">
              <Search size={24} className="mb-2 opacity-30" />
              <p className="text-xs">등록된 사례가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
