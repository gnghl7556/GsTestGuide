import type { AgreementParsed, QuickAnswer } from '../../../types';
import { Paperclip } from 'lucide-react';

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

const YES_GUIDES: Record<string, { refs: string[]; guides: string[] }> = {
  Q1: {
    refs: ['시험 합의서'],
    guides: ['합의서의 "운영체제" 항목에서 OS 정보를 확인하세요.'],
  },
  Q2: {
    refs: ['IODD 담당자'],
    guides: ['IODD 대여 후 환경구성 파일에 기록하세요.'],
  },
  Q3: {
    refs: ['환경구성 파일'],
    guides: ['환경구성 파일에 OS 설치 정보(Role, OS, CPU, Mem, Storage)를 입력하세요.'],
  },
  Q4: {
    refs: ['시험 합의서', '환경구성 파일'],
    guides: [
      '합의서의 "기타 환경" 항목에서 필요 SW를 확인하세요.',
      '환경구성 파일의 Pre-Requisite 항목에 설치한 SW를 기록하세요.',
    ],
  },
};

interface Setup03EvidenceProps {
  agreement: AgreementParsed | undefined;
  quickAnswers: Record<string, QuickAnswer>;
  onQuickAnswer: (itemId: string, questionId: string, value: QuickAnswer) => void;
  itemId: string;
}

export function Setup03Evidence({
  agreement,
  quickAnswers,
  onQuickAnswer,
  itemId,
}: Setup03EvidenceProps) {
  const agreementOs = agreement?.operatingSystem || '';
  const agreementOtherEnv = agreement?.otherEnvironment || '';

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
        const yesGuide = YES_GUIDES[question.id];
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

            {/* YES: 참조 태그 + 가이드 */}
            {answer === 'YES' && (
              <div className="mt-4 space-y-3">
                {question.id === 'Q1' && agreementOs && (
                  <div className="px-3 py-2 rounded-lg bg-accent-subtle border border-accent text-sm text-accent-text">
                    <span className="font-semibold">합의서 OS:</span> {agreementOs}
                  </div>
                )}
                {question.id === 'Q4' && agreementOtherEnv && (
                  <div className="px-3 py-2 rounded-lg bg-accent-subtle border border-accent text-sm text-accent-text">
                    <span className="font-semibold">합의서 환경 정보:</span> {agreementOtherEnv}
                  </div>
                )}
                {yesGuide && (
                  <div className="rounded-lg border border-ln bg-surface-base px-4 py-3">
                    {yesGuide.refs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {yesGuide.refs.map((r) => (
                          <span key={r} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-surface-sunken border border-ln text-tx-secondary">
                            <Paperclip size={11} />
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-tx-tertiary space-y-1">
                      {yesGuide.guides.map((guide, i) => (
                        <div key={i}>• {guide}</div>
                      ))}
                    </div>
                  </div>
                )}
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
