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
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-base font-semibold bg-white ${borderClass} ${toneClass} ${
        isActive ? 'ring-2 ring-offset-2 ring-slate-200' : ''
      }`}
    >
      <FileText size={18} />
      {label}
    </button>
  );
}
