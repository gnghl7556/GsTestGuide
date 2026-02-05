import type { ChecklistItem, QuickAnswer, QuickModeItem, QuickQuestionId, QuickInputValue } from '../../../types';
import { CATEGORIES, CATEGORY_THEMES } from '../../../data/constants';
import { Ban } from 'lucide-react';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { DefectReportForm } from '../../defects/components/DefectReportForm';

interface CenterDisplayProps {
  activeItem: ChecklistItem | undefined;
  displayIndex?: number;
  quickModeItem: QuickModeItem | undefined;
  quickAnswers: Record<QuickQuestionId, QuickAnswer>;
  onQuickAnswer: (itemId: string, questionId: QuickQuestionId, value: QuickAnswer) => void;
  inputValues: Record<string, QuickInputValue>;
  onInputChange: (itemId: string, fieldId: string, value: QuickInputValue) => void;
}

export function CenterDisplay({
  activeItem,
  displayIndex,
  quickModeItem,
  quickAnswers,
  onQuickAnswer,
  inputValues,
  onInputChange,
}: CenterDisplayProps) {
  if (!activeItem) return <div className="h-full bg-white rounded-xl border border-gray-200" />;
  const { currentTestNumber } = useTestSetupContext();

  if (activeItem.id === 'DUR-EXEC-01' && currentTestNumber) {
    return (
      <DefectReportForm
        projectId={currentTestNumber || ''}
        testCaseId={activeItem.id}
      />
    );
  }

  const theme = CATEGORY_THEMES[activeItem.category];
  const isNA = activeItem.status === 'Not_Applicable';
  const displayLabel =
    typeof displayIndex === 'number' && displayIndex >= 0
      ? String(displayIndex + 1).padStart(2, '0')
      : activeItem.id;
  const isEquipmentItem = (item: unknown): item is { name: string; ip?: string } =>
    Boolean(item && typeof item === 'object' && 'name' in (item as Record<string, unknown>));
  const toEquipmentList = (value: unknown) =>
    Array.isArray(value) && value.every(isEquipmentItem) ? value : [{ name: '', ip: '' }];

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
      <div className={`px-6 py-4 border-b border-gray-100 ${isNA ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${isNA ? 'bg-gray-100 text-gray-500' : `${theme.bg} ${theme.text}`}`}>#{displayLabel}</span>
              <span className="text-sm font-bold text-gray-400">/</span>
              <span className={`text-sm font-bold ${isNA ? 'text-gray-400' : theme.text}`}>{CATEGORIES.find(c => c.id === activeItem.category)?.name}</span>
            </div>
            <h2 className={`text-2xl font-extrabold leading-tight ${isNA ? 'text-gray-400 decoration-slate-300' : 'text-gray-900'} flex items-center gap-2`}>
              {activeItem.title}
              {!isNA && <span className={`h-1.5 w-10 rounded-full ${theme.bg}`} aria-hidden="true" />}
            </h2>
          </div>
          {null}
        </div>
      </div>
      
      <div className="p-8 flex-1 overflow-y-auto">

        {isNA ? (
          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-start gap-3 text-gray-500 mb-6">
            <Ban className="mt-0.5 shrink-0" size={20} />
            <div>
              <strong className="block text-gray-700 text-sm mb-1">검토 제외 대상</strong>
              <span className="text-sm">{activeItem.autoReason}</span>
            </div>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none">
            {quickModeItem && (
              <>
                <p className="text-lg text-gray-900 leading-relaxed font-semibold">
                  {quickModeItem.summary}
                </p>
                <div className="mt-6 space-y-4">
                  {activeItem.relatedInfo && activeItem.relatedInfo.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                      <div className="text-[11px] font-semibold text-slate-500 mb-2">관련 정보</div>
                      <div className="space-y-1.5">
                        {(() => {
                          const contact = activeItem.relatedInfo.find((info) => info.label === '연락처');
                          const email = activeItem.relatedInfo.find((info) => info.label === '이메일');
                          return activeItem.relatedInfo
                            .filter((info) => info.label !== '연락처' && info.label !== '이메일')
                            .map((info) => {
                          return (
                            <div key={info.label} className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-500 min-w-[120px]">{info.label}</span>
                              {info.href ? (
                                <a
                                  href={info.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-700 underline"
                                >
                                  {info.value}
                                </a>
                              ) : (
                                <span className="text-slate-700 font-semibold">{info.value}</span>
                              )}
                              {info.label === '자리 배정 담당자' && (contact || email) && (
                                <span className="flex flex-wrap gap-2">
                                  {contact && (
                                    <span className="text-slate-700 font-semibold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                      {contact.value}
                                    </span>
                                  )}
                                  {email && (
                                    <span className="text-slate-700 font-semibold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                      {email.value}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                  {activeItem.inputFields && activeItem.inputFields.length > 0 ? (
                    <div className="space-y-4">
                      {activeItem.inputFields.map((field) => {
                        const value = inputValues[field.id];
                        if (field.type === 'textarea') {
                          return (
                            <label key={field.id} className="block">
                              <div className="text-sm font-semibold text-slate-700 mb-1">{field.label}</div>
                              <textarea
                                value={typeof value === 'string' ? value : ''}
                                onChange={(e) => onInputChange(activeItem.id, field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full min-h-[96px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                              />
                            </label>
                          );
                        }

                        if (field.type === 'equipmentList') {
                          const list = toEquipmentList(value);
                          return (
                            <div key={field.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-slate-700">{field.label}</div>
                                  {field.helper && (
                                    <div className="text-xs text-slate-500 mt-0.5">{field.helper}</div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...list, { name: '', ip: '' }];
                                    onInputChange(activeItem.id, field.id, next);
                                  }}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-slate-300"
                                >
                                  + 장비 추가
                                </button>
                              </div>
                              <div className="space-y-2">
                                {list.map((item, idx) => (
                                  <div key={`${field.id}-${idx}`} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-center">
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => {
                                        const next = list.map((row, rowIdx) =>
                                          rowIdx === idx ? { ...row, name: e.target.value } : row
                                        );
                                        onInputChange(activeItem.id, field.id, next);
                                      }}
                                      placeholder="장비명"
                                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                    <input
                                      type="text"
                                      value={item.ip || ''}
                                      onChange={(e) => {
                                        const next = list.map((row, rowIdx) =>
                                          rowIdx === idx ? { ...row, ip: e.target.value } : row
                                        );
                                        onInputChange(activeItem.id, field.id, next);
                                      }}
                                      placeholder="IP (옵션)"
                                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = list.filter((_, rowIdx) => rowIdx !== idx);
                                        onInputChange(activeItem.id, field.id, next.length ? next : [{ name: '', ip: '' }]);
                                      }}
                                      className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <label key={field.id} className="block">
                            <div className="text-sm font-semibold text-slate-700 mb-1">{field.label}</div>
                            <input
                              type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                              value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                              onChange={(e) =>
                                onInputChange(
                                  activeItem.id,
                                  field.id,
                                  field.type === 'number' ? Number(e.target.value) : e.target.value
                                )
                              }
                              placeholder={field.placeholder}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quickModeItem.quickQuestions.map((question, index) => {
                        return (
                        <div
                          key={question.id}
                          id={`question-${quickModeItem.requirementId}-${question.id}`}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 border border-slate-200">
                                {index + 1}
                              </span>
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 mb-0.5">
                                  {question.importance === 'MUST' ? '필수' : '권고'}
                                </div>
                                <span className="text-base text-slate-800 leading-snug font-semibold">{question.text}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onQuickAnswer(quickModeItem.requirementId, question.id, 'YES');
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                                  quickAnswers[question.id] === 'YES'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                예
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onQuickAnswer(quickModeItem.requirementId, question.id, 'NO');
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                                  quickAnswers[question.id] === 'NO'
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                아니오
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onQuickAnswer(quickModeItem.requirementId, question.id, 'NA');
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                                  quickAnswers[question.id] === 'NA'
                                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                해당없음
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
            <details className="mt-8 rounded-xl border border-slate-100 bg-white p-5">
              <summary className="cursor-pointer text-sm font-bold text-slate-800">Expert Details</summary>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">요구사항 설명</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{activeItem.description}</p>
                </div>
                {activeItem.checkPoints && activeItem.checkPoints.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2">점검 포인트</h4>
                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                      {activeItem.checkPoints.map((point, index) => (
                        <li key={`${activeItem.id}-${index}`}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeItem.evidenceExamples && activeItem.evidenceExamples.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2">증빙 예시</h4>
                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                      {activeItem.evidenceExamples.map((example, index) => (
                        <li key={`${activeItem.id}-evidence-${index}`}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeItem.testSuggestions && activeItem.testSuggestions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2">테스트 제안</h4>
                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                      {activeItem.testSuggestions.map((suggestion, index) => (
                        <li key={`${activeItem.id}-test-${index}`}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeItem.passCriteria && (
                  <div className="rounded-lg border border-green-100 bg-green-50/70 p-4 text-green-800">
                    <h4 className="text-xs font-bold mb-2">판정 기준</h4>
                    <p className="text-sm leading-relaxed">{activeItem.passCriteria}</p>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
