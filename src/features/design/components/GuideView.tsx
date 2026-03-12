import { useState } from 'react';
import { guideContent, type GuideSection } from '../data/guideContent';

export function GuideView() {
  const [selected, setSelected] = useState<GuideSection | null>(null);

  if (selected) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-tx-secondary hover:bg-interactive-hover transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          목록으로
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{selected.icon}</span>
            <h2 className="text-lg font-bold text-tx-primary">{selected.title}</h2>
          </div>
          <p className="text-sm text-tx-tertiary">{selected.description}</p>
        </div>

        <div className="space-y-6">
          {selected.sections.map((sub, i) => (
            <div key={i} className="rounded-xl border border-ln bg-surface-base p-5">
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

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-tx-primary mb-1">GS 시험 가이드</h2>
        <p className="text-sm text-tx-tertiary">
          GS 인증 시험에 필요한 주요 주제별 작성법과 사용법을 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {guideContent.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setSelected(section)}
            className="group rounded-xl border border-ln bg-surface-base p-5 text-left transition-all hover:shadow-md hover:border-ln-strong hover:-translate-y-0.5"
          >
            <div className="text-2xl mb-3">{section.icon}</div>
            <h3 className="text-sm font-bold text-tx-primary mb-1 group-hover:text-accent-text transition-colors">
              {section.title}
            </h3>
            <p className="text-xs text-tx-tertiary leading-relaxed">{section.description}</p>
            <div className="mt-3 text-xs text-tx-muted">
              {section.sections.length}개 항목
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
