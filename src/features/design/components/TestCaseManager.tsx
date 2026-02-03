import { useMemo, useState } from 'react';
import { Plus, Save, RefreshCcw, X } from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { PageHeader, PageFilterBar, PageContent } from '../../../components/ui/layout';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { useTestCaseActions, type TestCaseItem } from '../hooks/useTestCaseActions';
// import { DefectReportModal } from '../../../components/DefectReportModal';

type NewCaseInput = Omit<TestCaseItem, 'id' | 'testCaseId'>;

type StatusFilter = 'ALL' | TestCaseItem['status'];

export function TestCaseManager() {
  const { currentTestNumber } = useTestSetupContext();
  const projectId = currentTestNumber;

  const {
    testCases,
    features,
    loading,
    saving,
    addTestCase,
    deleteTestCase,
    updateTestCase,
    saveTestCases,
    generateDraft
  } = useTestCaseActions();

  const featureOptions = useMemo(() => {
    return features.map((feature) => ({
      id: feature.id,
      label:
        [feature.category1, feature.category2, feature.category3, feature.category4].filter(Boolean).join(' > ') ||
        feature.description ||
        feature.id
    }));
  }, [features]);

  const [selectedFeature, setSelectedFeature] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      if (selectedFeature && tc.featureId !== selectedFeature) return false;
      if (statusFilter !== 'ALL' && tc.status !== statusFilter) return false;
      return true;
    });
  }, [testCases, selectedFeature, statusFilter]);

  const selectedCase = selectedId ? testCases.find((tc) => tc.id === selectedId) : undefined;

  const [newCase, setNewCase] = useState<NewCaseInput>({
    featureId: '',
    scenario: '',
    preCondition: '',
    steps: [],
    expectedResult: '',
    status: '대기',
    version: 1
  });

  const addCase = () => {
    if (!newCase.featureId || !newCase.scenario.trim()) return;
    addTestCase({
      featureId: newCase.featureId,
      scenario: newCase.scenario,
      preCondition: newCase.preCondition || '',
      steps: newCase.steps,
      expectedResult: newCase.expectedResult,
      status: newCase.status,
      version: newCase.version
    });
    setNewCase({
      featureId: '',
      scenario: '',
      preCondition: '',
      steps: [],
      expectedResult: '',
      status: '대기',
      version: 1
    });
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="테스트 케이스 관리"
        description="기능 리스트 기반 TC 초안 생성 및 편집"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Plus} onClick={addCase} disabled={!projectId}>
              TC 추가
            </Button>
            <Button size="sm" icon={Save} onClick={saveTestCases} disabled={saving || !projectId}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        }
      />

      <PageFilterBar>
        <select
          className="rounded-md border border-surface-200 bg-white px-2 py-1 text-xs text-primary-700"
          value={selectedFeature}
          onChange={(e) => setSelectedFeature(e.target.value)}
        >
          <option value="">기능 선택 (전체)</option>
          {featureOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-surface-200 bg-white px-2 py-1 text-xs text-primary-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="ALL">상태 전체</option>
          {['대기', 'Pass', 'Fail', 'Skip'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCcw}
          onClick={generateDraft}
          disabled={!projectId}
        >
          초안 재생성
        </Button>
        {!projectId && (
          <span className="ml-auto text-xs text-warning-700 bg-warning-50 border border-warning-200 px-2 py-1 rounded">
            시험번호가 없습니다. 프로젝트를 먼저 선택해주세요.
          </span>
        )}
      </PageFilterBar>

      <PageContent className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2.2fr_1fr]">
          <section className="rounded-xl border border-surface-200 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-primary-900">TC 목록</div>
              <div className="text-xs text-primary-400">{filteredCases.length}개</div>
            </div>
            {loading ? (
              <div className="py-12 text-center text-sm text-primary-400">불러오는 중...</div>
            ) : (
              <div className="mt-3 overflow-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-100 text-primary-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">TC ID</th>
                      <th className="px-3 py-2 text-left font-semibold">기능</th>
                      <th className="px-3 py-2 text-left font-semibold">시나리오</th>
                      <th className="px-3 py-2 text-left font-semibold">상태</th>
                      <th className="px-3 py-2 text-right font-semibold">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((tc, idx) => (
                      <tr
                        key={tc.id}
                        className={`border-b border-surface-200 hover:bg-slate-50 transition-colors ${
                          selectedId === tc.id ? 'bg-slate-50' : ''
                        }`}
                        onClick={() => setSelectedId(tc.id)}
                      >
                        <td className="px-3 py-2 font-semibold text-primary-700">
                          {tc.testCaseId || `TC-${idx + 1}`}
                        </td>
                        <td className="px-3 py-2 text-primary-700">
                          {featureOptions.find((opt) => opt.id === tc.featureId)?.label || '미지정'}
                        </td>
                        <td className="px-3 py-2 text-primary-600 truncate max-w-[220px]">{tc.scenario}</td>
                        <td className="px-3 py-2 text-primary-700">{tc.status}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTestCase(tc.id);
                              if (selectedId === tc.id) setSelectedId(null);
                            }}
                            className="text-[11px] text-error-600"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCases.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-primary-400">
                          등록된 TC가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {selectedCase && (
              <div className="mt-4 rounded-lg border border-surface-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-primary-900">TC 편집</div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="inline-flex items-center gap-1 text-xs text-primary-500"
                  >
                    <X size={12} />
                    닫기
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <select
                    className="rounded-md border border-surface-200 px-2 py-1 text-xs text-primary-700"
                    value={selectedCase.featureId}
                    onChange={(e) =>
                      updateTestCase({
                        ...selectedCase,
                        featureId: e.target.value
                      })
                    }
                  >
                    <option value="">기능 선택</option>
                    {featureOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-md border border-surface-200 px-2 py-1 text-xs text-primary-700"
                    value={selectedCase.status}
                    onChange={(e) =>
                      updateTestCase({
                        ...selectedCase,
                        status: e.target.value as TestCaseItem['status']
                      })
                    }
                  >
                    {['대기', 'Pass', 'Fail', 'Skip'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="md:col-span-2"
                    value={selectedCase.scenario}
                    onChange={(e) =>
                      updateTestCase({
                        ...selectedCase,
                        scenario: e.target.value
                      })
                    }
                    placeholder="테스트 시나리오"
                  />
                  <Input
                    className="md:col-span-2"
                    value={selectedCase.preCondition || ''}
                    onChange={(e) =>
                      updateTestCase({
                        ...selectedCase,
                        preCondition: e.target.value
                      })
                    }
                    placeholder="사전 조건"
                  />
                  <textarea
                    className="md:col-span-2 w-full rounded-lg border border-surface-200 px-3 py-2 text-xs text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedCase.steps.join('\n')}
                    onChange={(e) =>
                      updateTestCase({
                        ...selectedCase,
                        steps: e.target.value.split('\n')
                      })
                    }
                    rows={3}
                    placeholder="실행 단계 (줄바꿈 구분)"
                  />
                  <textarea
                    className="md:col-span-2 w-full rounded-lg border border-surface-200 px-3 py-2 text-xs text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedCase.expectedResult}
                    onChange={(e) =>
                      updateTestCase({
                        ...selectedCase,
                        expectedResult: e.target.value
                      })
                    }
                    rows={2}
                    placeholder="기대 결과"
                  />
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-xl border border-surface-200 bg-white p-4 space-y-3">
            <div className="text-sm font-semibold text-primary-900">새 TC 추가</div>
            <select
              className="w-full rounded-md border border-surface-200 px-2 py-1 text-xs text-primary-700"
              value={newCase.featureId}
              onChange={(e) => setNewCase((prev) => ({ ...prev, featureId: e.target.value }))}
            >
              <option value="">기능 선택</option>
              {featureOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Input
              placeholder="테스트 시나리오"
              value={newCase.scenario}
              onChange={(e) => setNewCase((prev) => ({ ...prev, scenario: e.target.value }))}
            />
            <Input
              placeholder="사전 조건"
              value={newCase.preCondition || ''}
              onChange={(e) => setNewCase((prev) => ({ ...prev, preCondition: e.target.value }))}
            />
            <textarea
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-xs text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="실행 단계 (줄바꿈 구분)"
              value={newCase.steps.join('\n')}
              onChange={(e) => setNewCase((prev) => ({ ...prev, steps: e.target.value.split('\n') }))}
            />
            <textarea
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-xs text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="기대 결과"
              value={newCase.expectedResult}
              onChange={(e) => setNewCase((prev) => ({ ...prev, expectedResult: e.target.value }))}
            />
            <select
              className="w-full rounded-md border border-surface-200 px-2 py-1 text-xs text-primary-700"
              value={newCase.status}
              onChange={(e) => setNewCase((prev) => ({ ...prev, status: e.target.value as TestCaseItem['status'] }))}
            >
              {['대기', 'Pass', 'Fail', 'Skip'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button variant="secondary" icon={Plus} onClick={addCase}>
              TC 추가
            </Button>
          </aside>
        </div>
      </PageContent>

      {/* 결함 보고 모달은 추후 연결 예정 */}
      {/*
      {defectTarget && (
        <DefectReportModal
          open={defectModalOpen}
          projectId={projectId}
          testCaseId={defectTarget.testCaseId || defectTarget.id}
          onClose={() => {
            setDefectModalOpen(false);
            setDefectTarget(null);
          }}
        />
      )}
      */}
    </div>
  );
}
