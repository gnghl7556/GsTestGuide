import type {
  ChecklistItem,
  ExecutionItemGate,
  QuickAnswer,
  QuickModeItem,
  QuickQuestionId,
  QuickInputValue,
  RequiredDoc
} from '../../../types';
import { CATEGORY_THEMES } from '../../../data/constants';
import { Ban } from 'lucide-react';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { DefectReportForm } from '../../defects/components/DefectReportForm';
import { RequiredDocChip } from '../../../components/ui';
import { useEffect, useState } from 'react';



interface CenterDisplayProps {
  activeItem: ChecklistItem | undefined;
  displayIndex?: number;
  quickModeItem: QuickModeItem | undefined;
  quickAnswers: Record<QuickQuestionId, QuickAnswer>;
  onQuickAnswer: (itemId: string, questionId: QuickQuestionId, value: QuickAnswer) => void;
  inputValues: Record<string, QuickInputValue>;
  onInputChange: (itemId: string, fieldId: string, value: QuickInputValue) => void;
  itemGate?: ExecutionItemGate;
  isFinalized: boolean;
}

export function CenterDisplay({
  activeItem,
  displayIndex,
  quickModeItem,
  quickAnswers,
  onQuickAnswer,
  inputValues,
  onInputChange,
  itemGate,
  isFinalized
}: CenterDisplayProps) {
  const [selectedDoc, setSelectedDoc] = useState<RequiredDoc | null>(null);
  const { currentTestNumber } = useTestSetupContext();
  useEffect(() => {
    if (!selectedDoc) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedDoc(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedDoc]);
  if (!activeItem) return <div className="h-full bg-white rounded-xl border border-gray-200" />;

  if (activeItem.id === 'DUR-EXEC-01' && currentTestNumber) {
    return (
      <DefectReportForm
        projectId={currentTestNumber || ''}
        testCaseId={activeItem.id}
        isFinalized={isFinalized}
      />
    );
  }

  const theme = CATEGORY_THEMES[activeItem.category];
  const isNA = activeItem.status === 'Not_Applicable';
  const displayLabel =
    typeof displayIndex === 'number' && displayIndex >= 0
      ? String(displayIndex + 1).padStart(2, '0')
      : activeItem.id;
  const refItems = activeItem.requiredDocs ?? [];
  const isEquipmentItem = (item: unknown): item is { name: string; ip?: string } =>
    Boolean(item && typeof item === 'object' && 'name' in (item as Record<string, unknown>));
  const toEquipmentList = (value: unknown) =>
    Array.isArray(value) && value.every(isEquipmentItem) ? value : [{ name: '', ip: '' }];
  const isSeatAssignment = activeItem.id === 'ENV-01';
  const seatValue = typeof inputValues.seatLocation === 'string' ? inputValues.seatLocation : '';
  const requirementId = quickModeItem?.requirementId ?? activeItem.id;
  const seatQuestions = isSeatAssignment
    ? ([
        {
          id: 'Q1',
          text: activeItem.checkPoints?.[0] ?? '시험 배정 후, 시험 자리가 이미 배정되었나요?',
          importance: 'MUST'
        },
        {
          id: 'Q2',
          text: activeItem.checkPoints?.[1] ?? '시험에 필요한 장비 및 공간을 확인했나요?',
          importance: 'MUST'
        }
      ] satisfies Array<{ id: QuickQuestionId; text: string; importance: 'MUST' | 'SHOULD' }>)
    : (quickModeItem?.quickQuestions ?? []);

  const q1Answer = quickAnswers.Q1 ?? 'NA';
  const q2Answer = quickAnswers.Q2 ?? 'NA';

  const handleEnvAnswer = (questionId: QuickQuestionId, value: QuickAnswer) => {
    onQuickAnswer(activeItem.id, questionId, value);
    if (!isSeatAssignment) return;
    if (questionId === 'Q1') {
      if (value === 'YES') {
        onQuickAnswer(activeItem.id, 'Q2', 'NA');
      }
      if (value === 'NO') {
        onQuickAnswer(activeItem.id, 'Q2', q2Answer === 'NA' ? 'NA' : q2Answer);
      }
    }
  };

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
      <div className={`px-6 py-5 border-b border-gray-100 ${isNA ? 'bg-gray-50' : theme.lightBg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <span className={`text-sm font-bold ${isNA ? 'text-gray-400' : theme.text}`}>시험 준비</span>
              <span className="text-sm font-bold text-gray-400">/</span>
              <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${isNA ? 'bg-gray-100 text-gray-500' : `${theme.bg} ${theme.text}`}`}>#{displayLabel}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className={`text-4xl font-extrabold leading-tight ${isNA ? 'text-gray-400 decoration-slate-300' : 'text-gray-900'}`}>
                {activeItem.title}
              </h2>
              {itemGate && itemGate.state !== 'enabled' && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    itemGate.state === 'blockedByFinalization'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                  title={itemGate.reason || ''}
                >
                  {itemGate.state === 'blockedByFinalization' ? '최종 잠금' : '조건 대기'}
                </span>
              )}
              {refItems.length > 0 && !isNA && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {refItems.map((doc, index) => (
                    <RequiredDocChip
                      key={`${doc.label}-${index}`}
                      label={doc.label}
                      toneClass={theme.text}
                      borderClass={theme.border}
                      isActive={selectedDoc?.label === doc.label}
                      onClick={() => setSelectedDoc(doc)}
                    />
                  ))}
                </div>
              )}
            </div>
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
            {quickModeItem ? (
              <>
                <p className="text-lg text-gray-900 leading-relaxed font-semibold">
                  {quickModeItem.summary}
                </p>
                {activeItem.description && (
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">
                    {activeItem.description}
                  </p>
                )}
              </>
            ) : (
              activeItem.description && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {activeItem.description}
                </p>
              )
            )}
            <div className="mt-6 space-y-4">
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
                  {seatQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      id={`question-${requirementId}-${question.id}`}
                      className={`p-4 rounded-xl border shadow-sm ${
                        isSeatAssignment && question.id === 'Q2' && (q1Answer === 'NA' || q1Answer === 'YES')
                          ? 'border-slate-200 bg-slate-50/70 opacity-50 pointer-events-none'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {(() => {
                        const currentAnswer =
                          question.id === 'Q1' ? q1Answer : question.id === 'Q2' ? q2Answer : quickAnswers[question.id];
                        return (
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
                              if (!quickModeItem && !isSeatAssignment) return;
                              if (isSeatAssignment && (question.id === 'Q1' || question.id === 'Q2')) {
                                handleEnvAnswer(question.id, 'YES');
                                return;
                              }
                              onQuickAnswer(requirementId, question.id, 'YES');
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                              currentAnswer === 'YES'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            예
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickModeItem && !isSeatAssignment) return;
                              if (isSeatAssignment && (question.id === 'Q1' || question.id === 'Q2')) {
                                handleEnvAnswer(question.id, 'NO');
                                return;
                              }
                              onQuickAnswer(requirementId, question.id, 'NO');
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                              currentAnswer === 'NO'
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            아니오
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickModeItem && !isSeatAssignment) return;
                              onQuickAnswer(requirementId, question.id, 'NA');
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                              currentAnswer === 'NA'
                                ? 'bg-gray-100 text-gray-600 border-gray-200'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            해당없음
                          </button>
                        </div>
                      </div>
                        );
                      })()}
                      {isSeatAssignment && question.id === 'Q1' && q1Answer === 'YES' && (
                        <div className="mt-4 space-y-2">
                          <div className="text-xs font-bold text-slate-500">시험 자리</div>
                          <input
                            type="text"
                            value={seatValue}
                            onChange={(e) => onInputChange(activeItem.id, 'seatLocation', e.target.value)}
                            placeholder="예: 9-L/R, 10-L/R"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                          <p className="text-[11px] text-emerald-600">
                            자리 정보 입력 후 다음 항목을 건너뛰고 판정에 참고하세요.
                          </p>
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q1' && q1Answer === 'NO' && (
                        <div className="mt-4 text-xs text-slate-600">
                          다음 질문을 진행하세요.
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q2' && q1Answer === 'NA' && (
                        <div className="mt-4 text-xs text-slate-500">
                          먼저 1번 질문에 답해주세요.
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q2' && q1Answer === 'YES' && (
                        <div className="mt-4 text-xs text-slate-500">
                          1번에서 자리 배정을 확인했으므로 다음 항목으로 이동하세요.
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q2' && q2Answer === 'YES' && (
                        <div className="mt-4 space-y-2">
                          <div className="text-xs font-bold text-slate-500">시험 자리</div>
                          <input
                            type="text"
                            value={seatValue}
                            onChange={(e) => onInputChange(activeItem.id, 'seatLocation', e.target.value)}
                            placeholder="예: 9-L/R, 10-L/R"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                          <p className="text-[11px] text-emerald-600">
                            자리 정보 입력 후 다음 항목을 건너뛰고 판정에 참고하세요.
                          </p>
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q2' && q1Answer === 'NO' && q2Answer === 'NO' && (
                        <div className="mt-4 space-y-3">
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 space-y-1">
                            <div>• 시험에 필요한 장비 확인: <span className="font-semibold">시험 합의서</span>를 확인하세요.</div>
                            <div>• 사용 가능한 시험 자리: <span className="font-semibold">관련 정보</span>에서 담당자 정보를 확인하세요.</div>
                          </div>
                          {activeItem.relatedInfo && activeItem.relatedInfo.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                              <div className="text-[11px] font-semibold text-slate-500 mb-2">관련 정보</div>
                              <div className="space-y-1.5">
                                {(() => {
                                  const contact = activeItem.relatedInfo.find((info) => info.label === '연락처');
                                  const email = activeItem.relatedInfo.find((info) => info.label === '이메일');
                                  const manager = activeItem.relatedInfo.find((info) => info.label === '자리 배정 담당자');
                                  const others = activeItem.relatedInfo.filter(
                                    (info) => info.label !== '연락처' && info.label !== '이메일' && info.label !== '자리 배정 담당자'
                                  );
                                  const ordered = [manager, ...others].filter(Boolean) as typeof activeItem.relatedInfo;
                                  return ordered.map((info) => (
                                    <div
                                      key={info.label}
                                      className="flex flex-wrap items-center gap-2"
                                    >
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
                                        <span className={`text-slate-800 ${info.label === '자리 배정 담당자' ? 'font-bold' : 'font-semibold'}`}>
                                          {info.value}
                                        </span>
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
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!isSeatAssignment && activeItem.relatedInfo && activeItem.relatedInfo.length > 0 && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
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
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
          onClick={() => setSelectedDoc(null)}
        >
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-bold text-slate-800">{selectedDoc.label}</div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                닫기
              </button>
            </div>
            <div className="grid grid-cols-[7fr_3fr] gap-0 min-h-[60vh]" onClick={(e) => e.stopPropagation()}>
              <div className="border-r border-slate-200 bg-slate-50 p-4">
                {selectedDoc.previewImageUrl && (
                  <img
                    src={selectedDoc.previewImageUrl}
                    alt={selectedDoc.label}
                    className="h-full w-full rounded-lg object-contain bg-white"
                  />
                )}
                {!selectedDoc.previewImageUrl && (
                  <div className="h-full w-full rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-sm text-slate-400">
                    미리보기 준비 중
                  </div>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">설명</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedDoc.description || '이 자료를 확인한 뒤 점검을 진행하세요.'}
                  </p>
                </div>
                {selectedDoc.showRelatedInfo && activeItem.relatedInfo && activeItem.relatedInfo.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    <div className="text-[11px] font-semibold text-slate-500 mb-2">관련 정보</div>
                    <div className="space-y-1.5">
                      {activeItem.relatedInfo.map((info) => (
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
