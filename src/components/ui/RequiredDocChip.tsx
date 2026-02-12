import { FileText } from 'lucide-react';

export type RequiredDocChipProps = {
  label: string;
  toneClass: string;
  borderClass: string;
  onClick?: () => void;
  isActive?: boolean;
};

export function RequiredDocChip({ label, toneClass, borderClass, onClick, isActive = false }: RequiredDocChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-surface-base hover:bg-surface-raised transition-colors ${borderClass} ${toneClass} ${
        isActive ? 'ring-1 ring-offset-1 ring-ln' : ''
      }`}
    >
      <FileText size={12} />
      {label}
    </button>
  );
}
