import { useCallback, useRef } from 'react';
import { guideContent } from '../data/guideContent';

type GuideViewProps = {
  initialSectionId?: string;
};

export function GuideView({ initialSectionId }: GuideViewProps) {
  const section = guideContent.find((s) => s.id === initialSectionId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((index: number) => {
    const el = scrollContainerRef.current?.querySelector(`#guide-section-${index}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (!section) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <p className="text-sm text-tx-muted">가이드를 선택해주세요.</p>
      </div>
    );
  }

  const showToc = section.sections.length > 3;

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{section.icon}</span>
          <h2 className="text-lg font-bold text-tx-primary">{section.title}</h2>
        </div>
        <p className="text-sm text-tx-tertiary">{section.description}</p>
      </div>

      {showToc && (
        <div className="sticky top-0 z-10 -mx-6 px-6 py-2 mb-4 bg-surface-base/95 backdrop-blur-sm border-b border-ln">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {section.sections.map((sub, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToSection(i)}
                className="shrink-0 rounded-full px-3 py-1 text-[11px] font-medium text-tx-tertiary bg-surface-sunken hover:text-tx-primary hover:bg-interactive-hover transition-colors"
              >
                {sub.heading}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {section.sections.map((sub, i) => (
          <div key={i} id={`guide-section-${i}`} className="rounded-xl border border-ln bg-surface-base p-5 scroll-mt-16">
            <h3 className="text-sm font-bold text-tx-primary mb-3">{sub.heading}</h3>
            <div className="text-sm text-tx-secondary leading-relaxed whitespace-pre-line">
              {sub.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
