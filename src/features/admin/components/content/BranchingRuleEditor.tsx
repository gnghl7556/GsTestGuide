import { X } from 'lucide-react';
import type { BranchingRule } from './types';

type BranchingRuleEditorProps = {
  checkPoints: string[];
  rules: BranchingRule[];
  onAdd: () => void;
  onRemove: (ruleIdx: number) => void;
  onUpdateSource: (ruleIdx: number, sourceIndex: number) => void;
  onToggleSkip: (ruleIdx: number, targetIdx: number) => void;
};

export function BranchingRuleEditor({
  checkPoints,
  rules,
  onAdd,
  onRemove,
  onUpdateSource,
  onToggleSkip,
}: BranchingRuleEditorProps) {
  if (!checkPoints || checkPoints.length <= 1) return null;

  return (
    <div>
      <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">분기 규칙</label>
      <p className="text-[9px] text-tx-muted mt-0.5 mb-2">
        특정 질문에 &quot;아니오&quot; 답변 시 건너뛸 후속 질문을 지정합니다
      </p>
      <div className="space-y-2">
        {rules.map((rule, ruleIdx) => (
          <div key={ruleIdx} className="flex items-start gap-2 p-2.5 rounded-lg border border-ln bg-surface-base">
            <select
              value={rule.sourceIndex}
              onChange={(e) => onUpdateSource(ruleIdx, Number(e.target.value))}
              className="shrink-0 text-xs border border-ln rounded px-2 py-1 bg-surface-base text-tx-primary"
            >
              {checkPoints.map((_: string, i: number) => (
                <option key={i} value={i}>Q{i + 1}</option>
              ))}
            </select>
            <span className="shrink-0 text-[10px] text-tx-muted mt-1.5">= NO &rarr;</span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {checkPoints.map((_: string, i: number) => {
                if (i <= rule.sourceIndex) return null;
                const isSkipped = rule.skipIndices.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onToggleSkip(ruleIdx, i)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      isSkipped
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                        : 'bg-surface-base text-tx-muted border-ln hover:border-ln-strong'
                    }`}
                  >
                    Q{i + 1}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onRemove(ruleIdx)}
              className="shrink-0 rounded p-1 text-tx-muted hover:text-red-500"
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
