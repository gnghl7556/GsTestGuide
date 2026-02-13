import { useState, useEffect, useRef } from 'react';
import { Wrench, X, Monitor, Camera, TestTube, Gauge } from 'lucide-react';

interface ToolEntry {
  name: string;
  description: string;
  url?: string;
}

interface ToolCategory {
  label: string;
  icon: typeof Camera;
  color: string;
  tools: ToolEntry[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    label: '캡처 / 녹화',
    icon: Camera,
    color: 'text-rose-500 dark:text-rose-400',
    tools: [
      { name: 'PickPick', description: '화면 캡처 및 간단 편집', url: 'https://picpick.app/ko/' },
      { name: 'FastStone Capture', description: '스크롤 캡처 및 화면 녹화', url: 'https://www.faststone.org/FSCaptureDetail.htm' },
    ],
  },
  {
    label: '원격 접속',
    icon: Monitor,
    color: 'text-sky-500 dark:text-sky-400',
    tools: [
      { name: 'Putty', description: 'SSH/Telnet 원격 터미널', url: 'https://www.putty.org/' },
      { name: 'RemoteView', description: '원격 데스크톱 접속', url: 'https://www.remoteview.com/' },
    ],
  },
  {
    label: '테스트 도구',
    icon: TestTube,
    color: 'text-emerald-500 dark:text-emerald-400',
    tools: [
      { name: 'Postman', description: 'API 요청 테스트', url: 'https://www.postman.com/downloads/' },
      { name: 'Wireshark', description: '네트워크 패킷 분석', url: 'https://www.wireshark.org/download.html' },
    ],
  },
  {
    label: '성능 측정',
    icon: Gauge,
    color: 'text-amber-500 dark:text-amber-400',
    tools: [
      { name: 'PotPlayer', description: '미디어 성능 확인 및 재생', url: 'https://potplayer.daum.net/' },
    ],
  },
];

export function HelperToolsPopup() {
  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={popupRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold border transition-all w-full ${
          open
            ? 'bg-accent text-white border-accent shadow-sm'
            : 'bg-surface-base text-tx-secondary border-ln hover:border-ln-strong hover:bg-surface-raised'
        }`}
      >
        <Wrench size={13} />
        보조 프로그램
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-ln bg-surface-overlay shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-ln bg-surface-base">
            <div className="flex items-center gap-2">
              <Wrench size={13} className="text-tx-muted" />
              <span className="text-xs font-bold text-tx-primary">보조 프로그램</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-tx-muted hover:text-tx-primary hover:bg-surface-raised transition-colors"
            >
              <X size={12} />
            </button>
          </div>

          <div className="p-2.5 space-y-2.5 max-h-80 overflow-y-auto">
            {TOOL_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <div key={cat.label}>
                  <div className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${cat.color}`}>
                    <CatIcon size={11} />
                    {cat.label}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {cat.tools.map((tool) => (
                      <a
                        key={tool.name}
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-surface-raised transition-colors group"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-tx-primary group-hover:text-accent-text transition-colors">
                            {tool.name}
                          </div>
                          <div className="text-[10px] text-tx-muted leading-snug">{tool.description}</div>
                        </div>
                        <span className="shrink-0 text-[9px] text-tx-muted opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          열기 ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
