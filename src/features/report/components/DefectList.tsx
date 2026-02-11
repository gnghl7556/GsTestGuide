import { useMemo } from 'react';
import type { Defect } from '../../../types';
import type { DefectFilter } from '../hooks/useDefects';

const versionLabel = (value: Defect['reportVersion']) => `${value}차`;

type DefectListProps = {
  defects: Defect[];
  filter: DefectFilter;
  loading: boolean;
  isFinalized: boolean;
};

export function DefectList({ defects, filter, loading, isFinalized }: DefectListProps) {
  const filtered = useMemo(() => {
    return defects.filter((item) => {
      if (filter.version !== 'ALL' && item.reportVersion !== filter.version) return false;
      if (filter.derived === 'DERIVED' && !item.isDerived) return false;
      if (filter.derived === 'BASE' && item.isDerived) return false;
      return true;
    });
  }, [defects, filter]);

  if (loading) {
    return <div className="rounded-xl border border-surface-200 bg-surface-base p-6 text-sm text-surface-500">불러오는 중...</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-200 bg-surface-base p-6 text-sm text-surface-500">
        표시할 결함이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-200 bg-surface-base">
      {isFinalized && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold text-amber-700">
          4차 확정 이후 결함 수정은 잠금 상태입니다.
        </div>
      )}
      <table className="w-full text-left text-xs text-surface-700">
        <thead className="bg-surface-50 text-[11px] text-surface-500">
          <tr>
            <th className="px-4 py-2">차수</th>
            <th className="px-4 py-2">파생</th>
            <th className="px-4 py-2">요약</th>
            <th className="px-4 py-2">심각도</th>
            <th className="px-4 py-2">상태</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.defectId} className="border-t border-surface-100 hover:bg-surface-50">
              <td className="px-4 py-2 font-semibold text-surface-700">{versionLabel(item.reportVersion)}</td>
              <td className="px-4 py-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.isDerived ? 'bg-warning-100 text-warning-700' : 'bg-surface-100 text-surface-600'}`}>
                  {item.isDerived ? '파생' : '기본'}
                </span>
              </td>
              <td className="px-4 py-2 text-surface-800">{item.summary}</td>
              <td className="px-4 py-2">{item.severity}</td>
              <td className="px-4 py-2">{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
