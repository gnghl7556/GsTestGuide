import { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useGuides } from '../../../hooks/useGuides';
import { GuideListSidebar } from './GuideListSidebar';
import { WritingGuideContent } from './WritingGuideContent';

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function GuideModal({ open, onClose }: GuideModalProps) {
  const guides = useGuides();
  const [activeGuideId, setActiveGuideId] = useState<string | null>(guides[0]?.id ?? null);

  const activeGuide = guides.find((g) => g.id === activeGuideId) ?? guides[0] ?? null;

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[75vh] rounded-xl border border-ln bg-surface-overlay shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ln px-4 py-2.5 bg-surface-base shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-tx-muted" />
            <span className="text-sm font-bold text-tx-primary">참고 가이드</span>
            <span className="text-[10px] text-tx-muted">시험 수행 시 참고할 가이드 모음</span>
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
          {/* Left sidebar */}
          <div className="w-52 shrink-0 border-r border-ln bg-surface-sunken overflow-y-auto">
            <GuideListSidebar
              guides={guides}
              activeGuideId={activeGuide?.id ?? null}
              onSelectGuide={setActiveGuideId}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {activeGuide ? (
              <WritingGuideContent guide={activeGuide} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-tx-muted">참고 가이드를 선택해주세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
