import type { GuideWithSource } from '../../../types/guide';

interface GuideListSidebarProps {
  guides: GuideWithSource[];
  activeGuideId: string | null;
  onSelectGuide: (id: string) => void;
}

export function GuideListSidebar({
  guides,
  activeGuideId,
  onSelectGuide,
}: GuideListSidebarProps) {
  return (
    <div className="p-4 space-y-1 text-sm text-tx-secondary">
      {guides.map((guide) => (
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
  );
}
