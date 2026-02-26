interface ShortcutHelpOverlayProps {
  onDismiss: () => void;
}

const Section = ({ title, items }: { title: string; items: [string, string][] }) => (
  <div>
    <h4 className="text-[11px] font-bold text-tx-muted uppercase tracking-wide mb-2">{title}</h4>
    <div className="space-y-1.5">
      {items.map(([key, desc]) => (
        <div key={key} className="flex items-center gap-3">
          <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md bg-surface-sunken border border-ln text-[11px] font-bold text-tx-secondary shrink-0">
            {key}
          </kbd>
          <span className="text-xs text-tx-tertiary">{desc}</span>
        </div>
      ))}
    </div>
  </div>
);

export function ShortcutHelpOverlay({ onDismiss }: ShortcutHelpOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ln bg-surface-overlay shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-tx-primary">키보드 단축키</h3>
          <span className="text-[10px] text-tx-muted">아무 키나 누르면 닫힘</span>
        </div>

        <Section
          title="체크포인트 답변"
          items={[
            ['\u2192', '예 (YES)'],
            ['\u2190', '아니오 (NO) — 후속 질문 자동 NA'],
            ['Space', '해당없음 (NA)'],
          ]}
        />

        <Section
          title="체크포인트 이동"
          items={[
            ['\u2191', '이전 체크포인트'],
            ['\u2193', '다음 체크포인트'],
            ['Enter', '판정 확정 후 다음 항목'],
          ]}
        />

        <Section
          title="기타"
          items={[
            ['Ctrl+D', '결함 보고'],
            ['?', '이 도움말 토글'],
          ]}
        />
      </div>
    </div>
  );
}
