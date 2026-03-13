import type { GuideWithSource } from '../../../types/guide';

interface ReferenceGuideContentProps {
  guide: GuideWithSource;
}

export function ReferenceGuideContent({ guide }: ReferenceGuideContentProps) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-tx-primary">{guide.title}</h2>
      </div>

      <div className="space-y-4">
        {guide.description && (
          <div className="rounded-lg border border-ln bg-surface-base p-4">
            <p className="text-sm text-tx-secondary leading-relaxed">{guide.description}</p>
          </div>
        )}

        {guide.checkPoints && guide.checkPoints.length > 0 && (
          <div className="rounded-lg border border-ln bg-surface-base p-4 space-y-2">
            <h3 className="text-sm font-bold text-tx-primary mb-2">체크포인트</h3>
            <ul className="space-y-1.5">
              {guide.checkPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-tx-secondary">
                  <span className="shrink-0 mt-0.5 h-4 w-4 rounded border border-ln-strong bg-surface-raised" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {guide.tip && (
          <div className="rounded-md bg-status-hold-bg border border-status-hold-border px-3 py-2 text-xs text-status-hold-text leading-relaxed whitespace-pre-line">
            {guide.tip}
          </div>
        )}

        {guide.sections.length > 0 && (
          <div className="space-y-4">
            {guide.sections
              .filter(s => s.heading !== '설명' && s.heading !== '체크포인트' && s.heading !== 'TIP')
              .map((section, i) => (
                <div key={i} className="rounded-xl border border-ln bg-surface-base p-5">
                  <h3 className="text-sm font-bold text-tx-primary mb-3">{section.heading}</h3>
                  <div className="text-sm text-tx-secondary leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
