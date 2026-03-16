import { useEffect, useState } from 'react';
import { History, X, RotateCcw, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { BaseModal } from '../../../../components/ui/BaseModal';
import { VersionDiffView } from './VersionDiffView';
import type { ContentVersionDoc, ContentSnapshot } from '../../../../types/contentVersion';
import { getVersionHistory } from '../../hooks/useContentVersioning';

const ACTION_CONFIG: Record<string, { label: string; className: string }> = {
  create: { label: '원본', className: 'bg-surface-sunken text-tx-tertiary' },
  edit: { label: '수정', className: 'bg-accent-subtle text-accent-text' },
  rollback: { label: '되돌리기', className: 'bg-status-hold-bg text-status-hold-text' },
};

const formatTime = (ts: Timestamp | null): string => {
  if (!ts) return '-';
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts as unknown as number);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
};

interface VersionHistoryModalProps {
  reqId: string;
  reqTitle: string;
  onClose: () => void;
  onRollback?: (version: number, snapshot: ContentSnapshot) => void;
  onPreview?: (snapshot: ContentSnapshot) => void;
}

export function VersionHistoryModal({
  reqId,
  reqTitle,
  onClose,
  onRollback,
  onPreview,
}: VersionHistoryModalProps) {
  const [history, setHistory] = useState<ContentVersionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVersionHistory(reqId).then((docs) => {
      if (!cancelled) {
        setHistory(docs);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [reqId]);

  const toggleExpand = (version: number) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  };

  return (
    <BaseModal open={true} onClose={onClose} size="lg" className="flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ln px-5 py-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <History size={16} className="text-tx-tertiary shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-tx-primary truncate">버전 히스토리</h3>
            <p className="text-[11px] text-tx-tertiary truncate">{reqId} · {reqTitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-tx-muted">불러오는 중...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-tx-muted">버전 이력이 없습니다</div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const config = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.edit;
              const isExpanded = expandedVersions.has(entry.version);
              const hasDiff = entry.diff && entry.diff.length > 0;
              const isV0 = entry.version === 0;

              return (
                <div
                  key={entry.version}
                  className="rounded-xl border border-ln bg-surface-base overflow-hidden"
                >
                  {/* Version header */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-surface-sunken">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-extrabold text-tx-primary">
                        v{entry.version}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${config.className}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-tx-secondary truncate">
                        {entry.editor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-tx-muted">
                        {formatTime(entry.editedAt)}
                      </span>
                      {onPreview && (
                        <button
                          type="button"
                          onClick={() => onPreview(entry.content)}
                          className="rounded p-1 text-tx-muted hover:text-accent hover:bg-accent-subtle transition-colors"
                          title="미리보기"
                        >
                          <Eye size={13} />
                        </button>
                      )}
                      {onRollback && !isV0 && entry.version !== history[0]?.version && (
                        <button
                          type="button"
                          onClick={() => onRollback(entry.version, entry.content)}
                          className="rounded p-1 text-tx-muted hover:text-status-hold-text hover:bg-status-hold-bg transition-colors"
                          title="이 버전으로 되돌리기"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  {entry.note && (
                    <div className="px-3 py-2 border-t border-ln/50">
                      <p className="text-[11px] text-tx-secondary">{entry.note}</p>
                    </div>
                  )}

                  {/* Diff toggle */}
                  {hasDiff && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleExpand(entry.version)}
                        className="flex w-full items-center gap-1.5 px-3 py-1.5 border-t border-ln/50 text-[10px] font-semibold text-tx-muted hover:text-tx-secondary hover:bg-interactive-hover transition-colors"
                      >
                        {isExpanded
                          ? <ChevronDown size={12} />
                          : <ChevronRight size={12} />
                        }
                        변경 내용 ({entry.diff!.length}건)
                      </button>
                      {isExpanded && (
                        <div className="border-t border-ln/50">
                          <VersionDiffView diffs={entry.diff!} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
