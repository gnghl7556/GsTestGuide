import { useMemo, useState } from 'react';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { useDefects, type DefectFilter } from '../hooks/useDefects';
import { DefectList } from '../components/DefectList';
import { Button } from '../../../components/ui';

export function ReportPage() {
  const { currentTestNumber, projects } = useTestSetupContext();
  const { defects, loading } = useDefects(currentTestNumber || null);
  const [filter, setFilter] = useState<DefectFilter>({ version: 'ALL', derived: 'ALL', quality: 'ALL' });
  const currentProject = useMemo(
    () => projects.find((project) => project.testNumber === currentTestNumber || project.id === currentTestNumber),
    [projects, currentTestNumber]
  );
  const isFinalized =
    Boolean(currentProject?.executionState?.finalizedAt) || currentProject?.status === '완료';

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
      <div className="rounded-xl border border-surface-200 bg-surface-base p-6 text-sm text-surface-500">
        시험을 먼저 선택해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-200 bg-surface-base p-6">
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

      <div className="rounded-xl border border-surface-200 bg-surface-base p-4 flex flex-wrap items-center gap-3 text-xs">
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
        <div className="ml-4 font-semibold text-surface-600">품질특성</div>
        <select
          className="rounded-md border border-ln bg-surface-base px-2 py-1 text-xs text-tx-secondary"
          value={filter.quality}
          onChange={(e) => setFilter((prev) => ({ ...prev, quality: e.target.value }))}
        >
          <option value="ALL">전체</option>
          <option value="사용성">사용성</option>
          <option value="기능적합성">기능적합성</option>
          <option value="보안성">보안성</option>
          <option value="신뢰성">신뢰성</option>
          <option value="유지보수성">유지보수성</option>
          <option value="성능효율성">성능효율성</option>
          <option value="이식성">이식성</option>
          <option value="호환성">호환성</option>
          <option value="일반적 요구사항">일반적 요구사항</option>
        </select>
      </div>

      <DefectList defects={defects} filter={filter} loading={loading} isFinalized={isFinalized} />
    </div>
  );
}
