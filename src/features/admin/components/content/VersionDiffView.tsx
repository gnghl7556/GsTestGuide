import { ArrowRight } from 'lucide-react';
import type { FieldDiff } from '../../../../types/contentVersion';

const FIELD_LABELS: Record<string, string> = {
  title: '제목',
  description: '설명',
  passCriteria: '판정 기준',
  evidenceExamples: '증빙 예시',
  testSuggestions: '테스트 제안',
  branchingRules: '분기 규칙',
  checkpointOrder: '체크포인트 순서',
  checkpointEvidences: '체크포인트-증빙 매핑',
};

const getFieldLabel = (field: string) => {
  if (field.startsWith('checkpoint:')) {
    return `체크포인트 Q${Number(field.split(':')[1]) + 1}`;
  }
  if (field.startsWith('importance:')) {
    return `중요도 Q${Number(field.split(':')[1]) + 1}`;
  }
  if (field.startsWith('detail:')) {
    return `상세 Q${Number(field.split(':')[1]) + 1}`;
  }
  return FIELD_LABELS[field] || field;
};

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + '...' : s;

interface VersionDiffViewProps {
  diffs: FieldDiff[];
}

export function VersionDiffView({ diffs }: VersionDiffViewProps) {
  if (diffs.length === 0) {
    return <p className="text-xs text-tx-muted py-2">변경 사항 없음</p>;
  }

  return (
    <div className="divide-y divide-ln">
      {diffs.map((diff, i) => (
        <div key={i} className="px-3 py-2 space-y-1">
          <div className="text-[10px] font-semibold text-tx-tertiary">
            {getFieldLabel(diff.field)}
          </div>
          <div className="flex items-start gap-1.5 text-[11px]">
            <span className="rounded bg-danger-subtle px-1.5 py-0.5 text-danger-text line-through flex-1 min-w-0 break-words">
              {truncate(diff.before || '(비어있음)', 100)}
            </span>
            <ArrowRight size={12} className="text-tx-muted shrink-0 mt-0.5" />
            <span className="rounded bg-status-pass-bg px-1.5 py-0.5 text-status-pass-text flex-1 min-w-0 break-words">
              {truncate(diff.after || '(비어있음)', 100)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
