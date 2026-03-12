import { guideContent } from '../data/guideContent';

type GuideViewProps = {
  initialSectionId?: string;
};

export function GuideView({ initialSectionId }: GuideViewProps) {
  const section = guideContent.find((s) => s.id === initialSectionId);

  if (!section) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <p className="text-sm text-tx-muted">가이드를 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{section.icon}</span>
          <h2 className="text-lg font-bold text-tx-primary">{section.title}</h2>
        </div>
        <p className="text-sm text-tx-tertiary">{section.description}</p>
      </div>

      <div className="space-y-6">
        {section.sections.map((sub, i) => (
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
