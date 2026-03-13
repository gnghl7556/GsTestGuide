import type { GuideWithSource, GuideCategory } from '../../../types/guide';

interface GuideListSidebarProps {
  guides: GuideWithSource[];
  activeGuideId: string | null;
  onSelectGuide: (id: string) => void;
  showCategoryLabels?: boolean;
}

const CATEGORY_LABELS: Record<GuideCategory, string> = {
  reference: '참조 가이드',
  writing: '작성 가이드',
};

export function GuideListSidebar({
  guides,
  activeGuideId,
  onSelectGuide,
  showCategoryLabels = true,
}: GuideListSidebarProps) {
  const categories = [...new Set(guides.map(g => g.category))] as GuideCategory[];

  return (
    <div className="p-4 space-y-3 text-sm text-tx-secondary">
      {categories.map((category) => {
        const categoryGuides = guides.filter(g => g.category === category);
        return (
          <div key={category}>
            {showCategoryLabels && (
              <div className="text-[10px] font-bold text-tx-muted uppercase tracking-wider px-2 mb-2">
                {CATEGORY_LABELS[category]}
              </div>
            )}
            <div className="space-y-1">
              {categoryGuides.map((guide) => (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => onSelectGuide(guide.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 ${
                    activeGuideId === guide.id
                      ? 'bg-accent-subtle text-accent-text font-semibold'
                      : 'text-tx-secondary hover:bg-interactive-hover'
                  }`}
                >
                  {guide.icon && <span className="text-sm leading-none">{guide.icon}</span>}
                  <span className="truncate">{guide.title}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
