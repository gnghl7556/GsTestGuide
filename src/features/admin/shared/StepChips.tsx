import { REQUIREMENTS_DB } from 'virtual:content/process';

const ALL_STEPS = REQUIREMENTS_DB.map((r) => ({ id: r.id, title: r.title }));

type StepChipsToggleProps = {
  mode: 'toggle';
  selected: string[];
  onToggle: (stepId: string) => void;
};

type StepChipsDisplayProps = {
  mode: 'display';
  steps: string[];
};

type StepChipsProps = StepChipsToggleProps | StepChipsDisplayProps;

export function StepChips(props: StepChipsProps) {
  if (props.mode === 'display') {
    if (props.steps.length === 0) return <span className="text-xs text-tx-muted">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {props.steps.map((sid) => (
          <span
            key={sid}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-sunken text-tx-muted border border-ln"
            title={ALL_STEPS.find((s) => s.id === sid)?.title ?? sid}
          >
            {sid}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {ALL_STEPS.map((step) => {
        const isSelected = props.selected.includes(step.id);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => props.onToggle(step.id)}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
              isSelected
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-surface-sunken text-tx-muted border-ln hover:border-ln-strong'
            }`}
            title={step.title}
          >
            {step.id}
          </button>
        );
      })}
    </div>
  );
}
