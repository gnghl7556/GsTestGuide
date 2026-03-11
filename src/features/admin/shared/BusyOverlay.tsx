import { Loader2 } from 'lucide-react';

type BusyOverlayProps = {
  visible: boolean;
  message?: string;
};

export function BusyOverlay({ visible, message = '저장 중...' }: BusyOverlayProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="flex items-center gap-2.5 rounded-xl bg-surface-overlay border border-ln shadow-xl px-5 py-3">
        <Loader2 size={16} className="animate-spin text-accent" />
        <span className="text-sm font-semibold text-tx-primary">{message}</span>
      </div>
    </div>
  );
}
