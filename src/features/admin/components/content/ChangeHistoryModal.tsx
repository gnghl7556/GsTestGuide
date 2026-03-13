import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { X, History, ArrowRight } from 'lucide-react';
import { db } from '../../../../lib/firebase';
import { BaseModal } from '../../../../components/ui/BaseModal';

type ChangeEntry = {
  field: string;
  before: string;
  after: string;
};

type HistoryDoc = {
  id: string;
  changedAt: Timestamp | null;
  changedBy: string;
  action: 'edit' | 'reset';
  changes: ChangeEntry[];
};

const FIELD_LABELS: Record<string, string> = {
  title: '제목',
  description: '설명',
  passCriteria: '판정 기준',
  evidenceExamples: '증빙 예시',
  testSuggestions: '테스트 제안',
  branchingRules: '분기 규칙',
};

const getFieldLabel = (field: string) => {
  if (field.startsWith('checkpoint:')) {
    const idx = field.split(':')[1];
    return `체크포인트 Q${Number(idx) + 1}`;
  }
  if (field.startsWith('importance:')) {
    const idx = field.split(':')[1];
    return `중요도 Q${Number(idx) + 1}`;
  }
  if (field.startsWith('detail:')) {
    const idx = field.split(':')[1];
    return `상세 Q${Number(idx) + 1}`;
  }
  return FIELD_LABELS[field] || field;
};

const formatTime = (ts: Timestamp | null): string => {
  if (!ts) return '-';
  const d = ts.toDate();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
};

const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max) + '...' : s;

interface ChangeHistoryModalProps {
  reqId: string;
  reqTitle: string;
  onClose: () => void;
}

export function ChangeHistoryModal({ reqId, reqTitle, onClose }: ChangeHistoryModalProps) {
  const [history, setHistory] = useState<HistoryDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const q = query(
      collection(db, 'contentOverrides', reqId, 'history'),
      orderBy('changedAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HistoryDoc, 'id'>),
      }));
      setHistory(docs);
      setLoading(false);
    });
    return () => unsub();
  }, [reqId]);

  return (
    <BaseModal open={true} onClose={onClose} size="lg" className="flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ln px-5 py-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <History size={16} className="text-tx-tertiary shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-tx-primary truncate">변경 이력</h3>
            <p className="text-[11px] text-tx-tertiary truncate">{reqId} · {reqTitle}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary">
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-tx-muted">불러오는 중...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-tx-muted">변경 이력이 없습니다</div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-ln bg-surface-base overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      entry.action === 'reset'
                        ? 'bg-status-hold-bg text-status-hold-text'
                        : 'bg-accent-subtle text-accent-text'
                    }`}>
                      {entry.action === 'reset' ? '초기화' : '수정'}
                    </span>
                    <span className="text-[10px] text-tx-tertiary">{entry.changedBy}</span>
                  </div>
                  <span className="text-[10px] text-tx-muted">{formatTime(entry.changedAt)}</span>
                </div>
                <div className="divide-y divide-ln">
                  {entry.changes.map((change, i) => (
                    <div key={i} className="px-3 py-2 space-y-1">
                      <div className="text-[10px] font-semibold text-tx-tertiary">{getFieldLabel(change.field)}</div>
                      <div className="flex items-start gap-1.5 text-[11px]">
                        <span className="rounded bg-danger-subtle px-1.5 py-0.5 text-danger-text line-through flex-1 min-w-0 break-words">
                          {truncate(change.before || '(비어있음)', 100)}
                        </span>
                        <ArrowRight size={12} className="text-tx-muted shrink-0 mt-0.5" />
                        <span className="rounded bg-status-pass-bg px-1.5 py-0.5 text-status-pass-text flex-1 min-w-0 break-words">
                          {truncate(change.after || '(비어있음)', 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
