import { FileDown, ExternalLink } from 'lucide-react';

export type RequiredDocChipProps = {
  label: string;
  kind?: 'file' | 'external';
  toneClass: string;
  borderClass: string;
  onClick?: () => void;
  isActive?: boolean;
};

export function RequiredDocChip({ label, kind = 'file', toneClass, borderClass, onClick, isActive = false }: RequiredDocChipProps) {
  const Icon = kind === 'external' ? ExternalLink : FileDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-surface-base hover:bg-surface-raised transition-colors ${borderClass} ${toneClass} ${
        isActive ? 'ring-1 ring-offset-1 ring-ln' : ''
      }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
