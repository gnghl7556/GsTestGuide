import { useState } from 'react';
import { Copy, Search } from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { useDefectForm } from '../hooks/useDefectForm';
import { DEFECT_REFERENCES } from '../data/defectReferences';

type DefectReportFormProps = {
  projectId: string;
  testCaseId: string;
};

export function DefectReportForm({ projectId, testCaseId }: DefectReportFormProps) {
  const { state, update, save, reset, saving, errorMsg } = useDefectForm(projectId, testCaseId);
  const [activeTab, setActiveTab] = useState<string>('기능적합성');

  const envOptions = [
    { value: 'ALL_OS', label: '시험환경 모든 OS' },
    { value: 'NONE', label: '-' }
  ] as const;
  const versionOptions = [
    { value: 1, label: '1차' },
    { value: 2, label: '2차' }
  ] as const;
  const severityOptions = [
    { value: 'H', label: 'H (High)' },
    { value: 'M', label: 'M (Medium)' },
    { value: 'L', label: 'L (Low)' }
  ] as const;
  const frequencyOptions = [
    { value: 'I', label: 'I (Intermittent)' },
    { value: 'A', label: 'A (Always)' }
  ] as const;
  const qualityOptions = [
    { value: '기능적합성', label: '기능적합성' },
    { value: '성능효율성', label: '성능효율성' },
    { value: '호환성', label: '호환성' },
    { value: '사용성', label: '사용성' },
    { value: '신뢰성', label: '신뢰성' },
    { value: '보안성', label: '보안성' },
    { value: '유지보수성', label: '유지보수성' },
    { value: '이식성', label: '이식성' },
    { value: '일반적 요구사항', label: '일반적 요구사항' }
  ] as const;

  const applyReference = (refItem: { summary: string; description: string; severity: 'H' | 'M' | 'L'; frequency: 'A' | 'I' }) => {
    update('summary', refItem.summary);
    update('description', refItem.description);
    update('severity', refItem.severity);
    update('frequency', refItem.frequency);
    update('qualityCharacteristic', activeTab);
  };

  return (
    <div className="h-full bg-white rounded-xl border border-surface-200 shadow-sm flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary-800">결함 보고</h2>
            <p className="text-xs text-surface-500 mt-1">
              순서대로 입력하면 자동으로 저장 항목이 구성됩니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reset} disabled={saving}>
              초기화
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? '저장 중...' : '결함 저장'}
            </Button>
          </div>
        </div>
        <div className="mt-4 text-[11px] text-surface-500">
          필수 항목: 요약, 품질 특성
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-none border-b border-surface-200 bg-white p-6 space-y-5 text-sm text-surface-700">
          {errorMsg && (
            <div className="rounded-lg border border-error-200 bg-error-50/40 px-4 py-2 text-xs text-error-600">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="요약 *"
              value={state.summary}
              onChange={(e) => update('summary', e.target.value)}
              placeholder="예: 로그인 실패 시 오류 메시지 미표시"
            />
            <Input
              label="기능 접근 경로"
              value={state.accessPath}
              onChange={(e) => update('accessPath', e.target.value)}
              placeholder="예: 관리자 > 설정 > 계정"
            />
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
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-600">결함 정도 *</label>
              <div className="flex flex-wrap gap-2">
                {severityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update('severity', option.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      state.severity === option.value
                        ? 'border-error-500 bg-error-50 text-error-700'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-600">발생 빈도</label>
              <div className="flex flex-wrap gap-2">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update('frequency', option.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      state.frequency === option.value
                        ? 'border-warning-500 bg-warning-50 text-warning-700'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-surface-600">품질 특성 *</label>
              <div className="flex flex-wrap gap-2">
                {qualityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update('qualityCharacteristic', option.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      state.qualityCharacteristic === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="block text-xs font-semibold text-surface-600">결함 상세 설명</label>
              <textarea
                className="w-full min-h-[110px] rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-primary-800"
                value={state.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="관찰된 현상과 기대 동작을 구체적으로 작성"
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="block text-xs font-semibold text-surface-600">TTA 의견</label>
              <textarea
                className="w-full min-h-[90px] rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-primary-800"
                value={state.ttaComment}
                onChange={(e) => update('ttaComment', e.target.value)}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-surface-600">증빙 자료</label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-surface-600 hover:text-surface-800">
                파일 추가
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => update('evidenceFiles', Array.from(e.target.files || []))}
                />
              </label>
              {state.evidenceFiles.length > 0 && (
                <div className="text-xs text-surface-500">
                  {state.evidenceFiles.map((file) => file.name).join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-surface-50/50 flex flex-col min-h-0">
          <div className="px-6 py-3 bg-white border-b border-surface-200 flex items-center gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-surface-500 font-bold text-xs">
              <Search size={14} />
              <span>품질 특성별 사례</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Object.keys(DEFECT_REFERENCES).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    activeTab === key
                      ? 'bg-primary-800 text-white border-primary-800'
                      : 'bg-white text-surface-600 border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(DEFECT_REFERENCES[activeTab] || []).map((item, idx) => (
                <div
                  key={`${activeTab}-${idx}`}
                  className="group bg-white rounded-xl border border-surface-200 p-4 hover:border-primary-300 hover:shadow-md transition-all flex flex-col"
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
      </div>
    </div>
  );
}
