import { useMemo } from 'react';
import { X } from 'lucide-react';
import { splitRef, type BranchingRule } from './types';

type BranchingRuleEditorProps = {
  checkPoints: string[];
  checkpointOrder: number[];
  rules: BranchingRule[];
  onAdd: () => void;
  onRemove: (ruleIdx: number) => void;
  onUpdateSource: (ruleIdx: number, sourceIndex: number) => void;
  onToggleSkip: (ruleIdx: number, targetIdx: number) => void;
};

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export function BranchingRuleEditor({
  checkPoints,
  checkpointOrder,
  rules,
  onAdd,
  onRemove,
  onUpdateSource,
  onToggleSkip,
}: BranchingRuleEditorProps) {
  if (!checkPoints || checkPoints.length <= 1) return null;

  const cpLabels = useMemo(
    () => checkPoints.map((cp) => splitRef(cp).body),
    [checkPoints],
  );

  // origIdx → display position (1-based)
  const displayNumMap = useMemo(() => {
    const map = new Map<number, number>();
    checkpointOrder.forEach((origIdx, pos) => map.set(origIdx, pos + 1));
    return map;
  }, [checkpointOrder]);

  // Collect branching info per checkpoint for flow summary
  const flowInfo = useMemo(() => {
    const sourceSet = new Set<number>();
    const skipSet = new Set<number>();
    const sourceSkipMap = new Map<number, number[]>();

    for (const rule of rules) {
      sourceSet.add(rule.sourceIndex);
      sourceSkipMap.set(rule.sourceIndex, [
        ...(sourceSkipMap.get(rule.sourceIndex) ?? []),
        ...rule.skipIndices,
      ]);
      for (const si of rule.skipIndices) skipSet.add(si);
    }

    return checkPoints.map((_, i) => ({
      isSource: sourceSet.has(i),
      isSkipped: skipSet.has(i),
      skips: sourceSkipMap.get(i) ?? [],
    }));
  }, [checkPoints, rules]);

  return (
    <div>
      <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">분기 규칙</label>
      <p className="text-[9px] text-tx-muted mt-0.5 mb-2">
        특정 질문에 &quot;아니오&quot; 답변 시 건너뛸 후속 질문을 지정합니다
      </p>

      {/* ── Flow Summary Panel ── */}
      {rules.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-surface-sunken border border-ln">
          <p className="text-[9px] font-semibold text-tx-tertiary uppercase tracking-wider mb-2">플로우 요약</p>
          <div className="relative pl-4">
            {/* Vertical connector line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-ln" />

            {checkpointOrder.map((origIdx) => {
              const info = flowInfo[origIdx];
              const dn = displayNumMap.get(origIdx) ?? origIdx + 1;
              const label = truncate(cpLabels[origIdx], 40);
              const isSource = info.isSource;
              const isSkipped = info.isSkipped;

              return (
                <div key={origIdx} className="relative flex items-start gap-2 mb-1.5 last:mb-0">
                  {/* Node dot */}
                  <div
                    className={`relative z-10 mt-1 w-2.5 h-2.5 rounded-full shrink-0 border ${
                      isSource
                        ? 'bg-status-hold-text border-status-hold-border'
                        : isSkipped
                          ? 'bg-surface-base border-dashed border-tx-muted'
                          : 'bg-accent border-accent'
                    }`}
                  />

                  {/* Node content */}
                  <div
                    className={`flex-1 min-w-0 rounded px-2 py-1 text-[10px] leading-relaxed ${
                      isSkipped
                        ? 'border border-dashed border-ln text-tx-muted'
                        : 'text-tx-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold shrink-0">Q{dn}</span>
                      {isSource && (
                        <span className="px-1.5 py-px rounded text-[8px] font-bold bg-status-hold-bg text-status-hold-text">
                          분기
                        </span>
                      )}
                      {isSkipped && (
                        <span className="px-1.5 py-px rounded text-[8px] font-bold bg-surface-sunken text-tx-muted">
                          건너뜀
                        </span>
                      )}
                      <span className={`truncate ${isSkipped ? 'opacity-50' : ''}`}>{label}</span>
                    </div>
                    {isSource && info.skips.length > 0 && (
                      <p className="mt-0.5 text-[9px] text-status-hold-text">
                        NO → {info.skips.map((s) => `Q${(displayNumMap.get(s) ?? s + 1)}`).join(', ')} 건너뜀
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rule Edit Cards ── */}
      <div className="space-y-2">
        {rules.map((rule, ruleIdx) => (
          <div key={ruleIdx} className="flex items-start gap-2 p-2.5 rounded-lg border border-ln bg-surface-base">
            <select
              value={rule.sourceIndex}
              onChange={(e) => onUpdateSource(ruleIdx, Number(e.target.value))}
              className="shrink-0 text-xs border border-ln rounded px-2 py-1 bg-surface-base text-tx-primary"
            >
              {checkPoints.map((_: string, i: number) => (
                <option key={i} value={i}>
                  Q{displayNumMap.get(i) ?? i + 1} — {truncate(cpLabels[i], 30)}
                </option>
              ))}
            </select>
            <span className="shrink-0 text-[10px] text-tx-muted mt-1.5">= NO &rarr;</span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {checkPoints.map((_: string, i: number) => {
                if (i <= rule.sourceIndex) return null;
                const isSkipped = rule.skipIndices.includes(i);
                const dn = displayNumMap.get(i) ?? i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onToggleSkip(ruleIdx, i)}
                    title={cpLabels[i]}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      isSkipped
                        ? 'bg-status-hold-bg text-status-hold-text border-status-hold-border'
                        : 'bg-surface-base text-tx-muted border-ln hover:border-ln-strong'
                    }`}
                  >
                    <span>Q{dn}</span>
                    {isSkipped && (
                      <span className="block text-[8px] opacity-70 max-w-[120px] truncate">
                        {truncate(cpLabels[i], 20)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onRemove(ruleIdx)}
              className="shrink-0 rounded p-1 text-tx-muted hover:text-danger"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 text-[10px] font-semibold text-accent-text hover:underline"
      >
        + 분기 규칙 추가
      </button>
    </div>
  );
}
