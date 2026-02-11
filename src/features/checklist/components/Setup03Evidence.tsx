import { useState } from 'react';
import type { AgreementParsed, QuickAnswer, QuickInputValue } from '../../../types';

const OS_DATABASE = [
  'Windows 11 Pro', 'Windows 11 Home', 'Windows 10 Pro', 'Windows 10 Home',
  'Windows Server 2022', 'Windows Server 2019', 'Windows Server 2016',
  'Ubuntu 24.04 LTS', 'Ubuntu 22.04 LTS', 'Ubuntu 20.04 LTS',
  'CentOS 7', 'CentOS Stream 9',
  'Rocky Linux 9', 'Rocky Linux 8',
  'macOS Sonoma', 'macOS Ventura',
];

const QUESTIONS = [
  { id: 'Q1', text: 'OS 종류/버전을 확인했나요?', importance: 'MUST' as const },
  { id: 'Q2', text: 'IODD를 대여했나요?', importance: 'MUST' as const },
  { id: 'Q3', text: 'OS 설치를 완료했나요?', importance: 'MUST' as const },
  { id: 'Q4', text: '필수 SW를 설치했나요?', importance: 'MUST' as const },
];

const NO_GUIDES: Record<string, string[]> = {
  Q1: [
    '시험 합의서의 "운영체제" 항목에서 OS 정보를 확인하세요.',
    '합의서에 OS 정보가 없으면 업체 담당자에게 문의하세요.',
  ],
  Q2: [
    'IODD 대여가 필요한 경우 관리팀에 요청하세요.',
    'OS가 이미 설치된 장비라면 "해당없음"을 선택하세요.',
  ],
  Q3: [
    'IODD를 사용하여 합의서에 명시된 OS를 설치하세요.',
    '설치 후 정상 부팅 여부를 확인하세요.',
  ],
  Q4: [
    '합의서의 "기타 환경" 항목에서 필요한 SW 목록을 확인하세요.',
    '해당 SW를 설치하고, 정상 실행 여부를 확인하세요.',
  ],
};

const inputCls = 'w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-input-text placeholder-input-placeholder focus:border-[var(--focus-ring)] focus:ring-2 focus:ring-[var(--focus-ring)]/20 outline-none';
const textareaSmCls = `${inputCls} min-h-[60px] resize-y`;
const selectCls = inputCls;

interface Setup03EvidenceProps {
  agreement: AgreementParsed | undefined;
  quickAnswers: Record<string, QuickAnswer>;
  onQuickAnswer: (itemId: string, questionId: string, value: QuickAnswer) => void;
  inputValues: Record<string, QuickInputValue>;
  onInputChange: (itemId: string, fieldId: string, value: QuickInputValue) => void;
  itemId: string;
}

export function Setup03Evidence({
  agreement,
  quickAnswers,
  onQuickAnswer,
  inputValues,
  onInputChange,
  itemId,
}: Setup03EvidenceProps) {
  const [showCustomOs, setShowCustomOs] = useState(false);

  const agreementOs = agreement?.operatingSystem || '';
  const agreementOtherEnv = agreement?.otherEnvironment || '';

  const getStringInput = (key: string) =>
    typeof inputValues[key] === 'string' ? (inputValues[key] as string) : '';

  const handleInput = (fieldId: string, value: string) => {
    onInputChange(itemId, fieldId, value);
  };

  const renderAnswerButtons = (questionId: string) => {
    const currentAnswer = quickAnswers[questionId] ?? 'NA';
    return (
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onQuickAnswer(itemId, questionId, 'YES')}
          className={`px-4 py-2 rounded-lg text-sm font-bold border ${
            currentAnswer === 'YES'
              ? 'bg-status-pass-bg text-status-pass-text border-status-pass-border'
              : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong'
          }`}
        >
          예
        </button>
        <button
          type="button"
          onClick={() => onQuickAnswer(itemId, questionId, 'NO')}
          className={`px-4 py-2 rounded-lg text-sm font-bold border ${
            currentAnswer === 'NO'
              ? 'bg-status-fail-bg text-status-fail-text border-status-fail-border'
              : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong'
          }`}
        >
          아니오
        </button>
        <button
          type="button"
          onClick={() => onQuickAnswer(itemId, questionId, 'NA')}
          className={`px-4 py-2 rounded-lg text-sm font-bold border ${
            currentAnswer === 'NA'
              ? 'bg-status-pending-bg text-tx-tertiary border-status-pending-border'
              : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong'
          }`}
        >
          해당없음
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {QUESTIONS.map((question, index) => {
        const answer = quickAnswers[question.id] ?? 'NA';
        return (
          <div
            key={question.id}
            className="p-4 rounded-xl border shadow-sm border-ln bg-surface-sunken"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-base text-xs font-bold text-tx-tertiary border border-ln">
                  {index + 1}
                </span>
                <div>
                  <div className="text-[10px] font-bold text-tx-muted mb-0.5">
                    {question.importance === 'MUST' ? '필수' : '권고'}
                  </div>
                  <span className="text-base text-tx-primary leading-snug font-semibold">
                    {question.text}
                  </span>
                </div>
              </div>
              {renderAnswerButtons(question.id)}
            </div>

            {/* YES: 상세 입력 영역 */}
            {answer === 'YES' && question.id === 'Q1' && (
              <div className="mt-4 space-y-3">
                {agreementOs && (
                  <div className="px-3 py-2 rounded-lg bg-accent-subtle border border-accent text-sm text-accent-text">
                    <span className="font-semibold">합의서 OS:</span> {agreementOs}
                  </div>
                )}
                {!showCustomOs ? (
                  <select
                    value={getStringInput('evidence_Q1')}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setShowCustomOs(true);
                        handleInput('evidence_Q1', '');
                      } else {
                        handleInput('evidence_Q1', e.target.value);
                      }
                    }}
                    className={selectCls}
                  >
                    <option value="">OS 선택...</option>
                    {OS_DATABASE.map((os) => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                    <option value="__custom__">직접 입력...</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={getStringInput('evidence_Q1')}
                      onChange={(e) => handleInput('evidence_Q1', e.target.value)}
                      placeholder="OS 이름 및 버전 직접 입력"
                      className={`flex-1 ${inputCls}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomOs(false);
                        handleInput('evidence_Q1', '');
                      }}
                      className="text-xs font-semibold px-3 py-2 rounded-lg border border-ln text-tx-tertiary hover:border-ln-strong whitespace-nowrap"
                    >
                      목록 선택
                    </button>
                  </div>
                )}
              </div>
            )}

            {answer === 'YES' && question.id === 'Q2' && (
              <div className="mt-4">
                <textarea
                  value={getStringInput('evidence_Q2')}
                  onChange={(e) => handleInput('evidence_Q2', e.target.value)}
                  placeholder="대여 정보를 입력하세요 (예: IODD 1개 대여완료)"
                  className={textareaSmCls}
                />
              </div>
            )}

            {answer === 'YES' && question.id === 'Q3' && (
              <div className="mt-4">
                <textarea
                  value={getStringInput('evidence_Q3')}
                  onChange={(e) => handleInput('evidence_Q3', e.target.value)}
                  placeholder="설치 완료 내용을 입력하세요 (예: Windows 11 Pro 설치 완료, 정상 부팅 확인)"
                  className={textareaSmCls}
                />
              </div>
            )}

            {answer === 'YES' && question.id === 'Q4' && (
              <div className="mt-4 space-y-3">
                {agreementOtherEnv && (
                  <div className="px-3 py-2 rounded-lg bg-accent-subtle border border-accent text-sm text-accent-text">
                    <span className="font-semibold">합의서 환경 정보:</span> {agreementOtherEnv}
                  </div>
                )}
                <textarea
                  value={getStringInput('evidence_Q4')}
                  onChange={(e) => handleInput('evidence_Q4', e.target.value)}
                  placeholder="설치한 SW 목록을 입력하세요 (예: Java 11, Tomcat 9, MariaDB 10.5)"
                  className={`${textareaSmCls} min-h-[80px]`}
                />
              </div>
            )}

            {/* NO: 가이드 텍스트 */}
            {answer === 'NO' && (
              <div className="mt-4 rounded-lg border border-ln bg-surface-sunken px-4 py-3">
                <div className="text-xs text-tx-tertiary space-y-1.5">
                  {NO_GUIDES[question.id]?.map((guide, i) => (
                    <div key={i}>
                      <span className="text-tx-muted mr-1.5">{i + 1}.</span>
                      {guide}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
