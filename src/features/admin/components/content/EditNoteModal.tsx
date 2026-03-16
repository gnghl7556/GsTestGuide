import { useState } from 'react';
import { FileText } from 'lucide-react';
import { BaseModal } from '../../../../components/ui/BaseModal';

interface EditNoteModalProps {
  open: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
  busy?: boolean;
  title?: string;
}

export function EditNoteModal({ open, onConfirm, onCancel, busy, title = '편집 사유 입력' }: EditNoteModalProps) {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setNote('');
  };

  return (
    <BaseModal open={open} onClose={onCancel} size="sm">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent-subtle shrink-0">
            <FileText size={16} className="text-accent" />
          </div>
          <h3 className="text-sm font-extrabold text-tx-primary">{title}</h3>
        </div>
        <textarea
          className="w-full rounded-lg border border-ln bg-surface-base px-3 py-2 text-sm text-tx-primary placeholder:text-tx-muted resize-y min-h-[80px] focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="변경 사유를 입력하세요 (필수)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-tx-muted bg-surface-sunken hover:bg-interactive-hover disabled:opacity-40 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !note.trim()}
            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 disabled:opacity-40 transition-colors"
          >
            {busy ? '저장 중...' : '확인'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
