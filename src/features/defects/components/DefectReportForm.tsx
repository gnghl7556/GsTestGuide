import { useState } from 'react';
import { Copy, Search } from 'lucide-react';
import { Button } from '../../../components/ui';
import { useDefectForm } from '../hooks/useDefectForm';
import { DefectFormFields } from './DefectFormFields';
import { DEFECT_REFERENCES } from 'virtual:content/defects';

type DefectReportFormProps = {
  projectId: string;
  testCaseId: string;
  isFinalized?: boolean;
};

export function DefectReportForm({ projectId, testCaseId, isFinalized = false }: DefectReportFormProps) {
  const { state, update, save, reset, saving, errorMsg } = useDefectForm(projectId, testCaseId, isFinalized);
  const [activeTab, setActiveTab] = useState<keyof typeof DEFECT_REFERENCES>('기능적합성');
  type DefectReferenceItem = (typeof DEFECT_REFERENCES)[keyof typeof DEFECT_REFERENCES][number];
  const tabs = Object.keys(DEFECT_REFERENCES) as Array<keyof typeof DEFECT_REFERENCES>;

  const envOptions = [
    { value: 'ALL_OS' as const, label: '시험환경 모든 OS' },
    { value: 'NONE' as const, label: '-' }
  ];
  const versionOptions = [
    { value: 1 as const, label: '1차' },
    { value: 2 as const, label: '2차' }
  ];

  const applyReference = (refItem: { summary: string; description: string; severity: 'H' | 'M' | 'L'; frequency: 'A' | 'I' }) => {
    if (isFinalized) return;
    update('summary', refItem.summary);
    update('description', refItem.description);
    update('severity', refItem.severity);
    update('frequency', refItem.frequency);
    update('qualityCharacteristic', activeTab);
  };

  const formLocked = saving || isFinalized;

  // DefectFormFields 호환 values
  const formValues = {
    summary: state.summary,
    severity: state.severity as 'H' | 'M' | 'L' | '',
    frequency: state.frequency as 'A' | 'I' | '',
    qualityCharacteristic: state.qualityCharacteristic,
    accessPath: state.accessPath,
    testEnvironment: state.testEnvironment,
    stepsToReproduce: state.stepsToReproduce,
    description: state.description,
    ttaComment: state.ttaComment
  };

  const handleFieldChange = (key: string, value: string) => {
    update(key as keyof typeof state, value as never);
  };

  return (
    <div className="h-full bg-surface-base rounded-xl border border-surface-200 shadow-sm flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary-800">결함 보고</h2>
            <p className="text-xs text-surface-500 mt-1">
              순서대로 입력하면 자동으로 저장 항목이 구성됩니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reset} disabled={formLocked}>
              초기화
            </Button>
            <Button size="sm" onClick={save} disabled={formLocked}>
              {isFinalized ? '4차 이후 수정 불가' : saving ? '저장 중...' : '결함 저장'}
            </Button>
          </div>
        </div>
        {isFinalized && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            4차 확정 이후에는 결함 등록/수정이 잠금됩니다.
          </div>
        )}
        <div className="mt-4 text-[11px] text-surface-500">
          필수 항목: 요약, 품질 특성
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <fieldset disabled={formLocked} className="contents">
        <div className="flex-none border-b border-surface-200 bg-surface-base p-6 space-y-5 text-sm text-surface-700">
          {errorMsg && (
            <div className="rounded-lg border border-error-200 bg-error-50/40 px-4 py-2 text-xs text-error-600">
              {errorMsg}
            </div>
          )}

          {/* 시험환경 + 차수 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-surface-600">시험 환경</label>
              <div className="flex flex-wrap gap-2">
                {envOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update('testEnvironment', option.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      state.testEnvironment === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-600">결함 리포트 차수</label>
              <div className="flex flex-wrap gap-2">
                {versionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update('reportVersion', option.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      state.reportVersion === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 공통 필드 */}
          <DefectFormFields
            values={formValues}
            onChange={handleFieldChange}
            onFilesChange={(files) => update('evidenceFiles', files)}
            fileNames={state.evidenceFiles.map((f) => f.name)}
            disabled={formLocked}
          />
        </div>

        {/* 품질 특성별 사례 참조 */}
        <div className="flex-1 bg-surface-50/50 flex flex-col min-h-0">
          <div className="px-6 py-3 bg-surface-base border-b border-surface-200 flex items-center gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-surface-500 font-bold text-xs">
              <Search size={14} />
              <span>품질 특성별 사례</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    activeTab === key
                      ? 'bg-primary-800 text-white border-primary-800'
                      : 'bg-surface-base text-surface-600 border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(DEFECT_REFERENCES[activeTab] || []).map((item: DefectReferenceItem, idx: number) => (
                <div
                  key={`${activeTab}-${idx}`}
                  className="group bg-surface-base rounded-xl border border-surface-200 p-4 hover:border-primary-300 hover:shadow-md transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.severity === 'H' ? 'bg-error-50 text-error-700 border-error-200' :
                        item.severity === 'M' ? 'bg-warning-50 text-warning-700 border-warning-200' :
                        'bg-success-50 text-success-700 border-success-200'
                      }`}>
                        {item.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-surface-50 text-surface-600 border-surface-100">
                        {item.frequency === 'A' ? 'Always' : 'Intermittent'}
                      </span>
                    </div>
                    <button
                      onClick={() => applyReference(item)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded bg-primary-50 text-primary-700 text-[10px] font-bold hover:bg-primary-700 hover:text-white"
                      type="button"
                    >
                      <Copy size={10} /> 적용
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-surface-800 mb-2 line-clamp-1 group-hover:text-primary-700">
                    {item.summary}
                  </h4>
                  <div className="flex-1 bg-surface-50 rounded-lg p-3 border border-surface-100">
                    <p className="text-xs text-surface-600 leading-relaxed line-clamp-4">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {(!DEFECT_REFERENCES[activeTab] || DEFECT_REFERENCES[activeTab].length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-surface-400">
                <Search size={32} className="mb-3 opacity-20" />
                <p className="text-sm">등록된 사례가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
        </fieldset>
      </div>
    </div>
  );
}
