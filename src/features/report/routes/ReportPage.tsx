import { useMemo, useState } from 'react';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { useDefects, type DefectFilter } from '../hooks/useDefects';
import { DefectList } from '../components/DefectList';
import { Button } from '../../../components/ui';

export function ReportPage() {
  const { currentTestNumber } = useTestSetupContext();
  const { defects, loading } = useDefects(currentTestNumber || null);
  const [filter, setFilter] = useState<DefectFilter>({ version: 'ALL', derived: 'ALL' });

  const counts = useMemo(() => {
    return defects.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.byVersion[item.reportVersion] += 1;
        if (item.isDerived) acc.derived += 1;
        return acc;
      },
      { total: 0, derived: 0, byVersion: { 1: 0, 2: 0, 3: 0, 4: 0 } }
    );
  }, [defects]);

  if (!currentTestNumber) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-6 text-sm text-surface-500">
        시험을 먼저 선택해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary-800">결함 보고 관리</h2>
            <p className="text-sm text-surface-500 mt-1">리포트 차수 및 파생 결함 기준으로 필터링합니다.</p>
          </div>
          <div className="text-xs text-surface-500">
            총 {counts.total}건 (파생 {counts.derived}건)
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-200 bg-white p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="font-semibold text-surface-600">차수</div>
        {(['ALL', 1, 2, 3, 4] as const).map((value) => (
          <Button
            key={String(value)}
            variant={filter.version === value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter((prev) => ({ ...prev, version: value }))}
          >
            {value === 'ALL' ? '전체' : `${value}차`}
          </Button>
        ))}
        <div className="ml-4 font-semibold text-surface-600">파생</div>
        {(['ALL', 'BASE', 'DERIVED'] as const).map((value) => (
          <Button
            key={value}
            variant={filter.derived === value ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFilter((prev) => ({ ...prev, derived: value }))}
          >
            {value === 'ALL' ? '전체' : value === 'DERIVED' ? '파생' : '기본'}
          </Button>
        ))}
      </div>

      <DefectList defects={defects} filter={filter} loading={loading} />
    </div>
  );
}
