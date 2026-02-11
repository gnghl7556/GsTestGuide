import { X, BookOpen } from 'lucide-react';
import { REFERENCES } from 'virtual:content/references';
import type { ReferenceGuide } from 'virtual:content/references';

interface ReferenceGuideModalProps {
  open: boolean;
  onClose: () => void;
}

function ReferenceCard({ guide }: { guide: ReferenceGuide }) {
  return (
    <div className="rounded-lg border border-ln bg-surface-base p-4 space-y-3">
      <h3 className="text-sm font-bold text-tx-primary">{guide.title}</h3>
      {guide.description && (
        <p className="text-xs text-tx-secondary leading-relaxed">{guide.description}</p>
      )}
      {guide.checkPoints.length > 0 && (
        <ul className="space-y-1.5">
          {guide.checkPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-tx-secondary">
              <span className="shrink-0 mt-0.5 h-4 w-4 rounded border border-ln-strong bg-surface-raised" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
      {guide.tip && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 leading-relaxed whitespace-pre-line">
          {guide.tip}
        </div>
      )}
    </div>
  );
}

export function ReferenceGuideModal({ open, onClose }: ReferenceGuideModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)]">
      <div className="relative w-full max-w-lg max-h-[80vh] bg-surface-base rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ln">
          <h2 className="flex items-center gap-2 text-sm font-bold text-tx-primary">
            <BookOpen size={16} className="text-tx-tertiary" />
            참조 가이드
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md border border-ln bg-surface-base text-tx-muted hover:text-tx-secondary hover:border-ln-strong transition-colors inline-flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {REFERENCES.map((guide) => (
            <ReferenceCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>
    </div>
  );
}
