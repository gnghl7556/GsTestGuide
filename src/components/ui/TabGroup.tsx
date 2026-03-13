type TabItem = {
  id: string;
  label: string;
};

type TabGroupSize = 'sm' | 'md';

interface TabGroupProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  size?: TabGroupSize;
}

const sizeStyles: Record<TabGroupSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-xs',
};

export function TabGroup({ tabs, activeId, onChange, size = 'md' }: TabGroupProps) {
  return (
    <div role="tablist" className="flex items-center gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeId === tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`${sizeStyles[size]} font-bold tracking-wide transition-colors relative ${
            activeId === tab.id
              ? "text-tx-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-full"
              : 'text-tx-muted hover:text-tx-secondary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
