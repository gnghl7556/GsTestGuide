import { useCallback, useRef } from 'react';
import type { GuideWithSource } from '../../../types/guide';

interface WritingGuideContentProps {
  guide: GuideWithSource;
}

export function WritingGuideContent({ guide }: WritingGuideContentProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((index: number) => {
    const el = scrollContainerRef.current?.querySelector(`#guide-section-${index}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const showToc = guide.sections.length > 3;

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{guide.icon}</span>
          <h2 className="text-lg font-bold text-tx-primary">{guide.title}</h2>
        </div>
        <p className="text-sm text-tx-tertiary">{guide.description}</p>
      </div>

      {showToc && (
        <div className="sticky top-0 z-10 -mx-6 px-6 py-2 mb-4 bg-surface-base/95 backdrop-blur-sm border-b border-ln">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {guide.sections.map((sub, i) => (
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
        {guide.sections.map((sub, i) => (
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
