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

  const firstUnansweredId = QUESTIONS.find((q) => {
    const ans = quickAnswers[q.id];
    return !ans || ans === 'NA';
  })?.id ?? null;

  return (
    <div className="space-y-3">
      {QUESTIONS.map((question, index) => {
        const currentAnswer = quickAnswers[question.id] ?? 'NA';
        const isAnswered = currentAnswer === 'YES' || currentAnswer === 'NO';
        const isCurrent = question.id === firstUnansweredId;
        const yesGuide = YES_GUIDES[question.id];

        return (
          <div
            key={question.id}
            className={`rounded-xl px-4 py-3.5 transition-all duration-300 ease-out origin-left ${
              isAnswered
                ? 'bg-surface-sunken/70 scale-[0.97] opacity-60'
                : isCurrent
                  ? 'bg-surface-base scale-100 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.15)]'
                  : 'bg-surface-sunken/40 scale-[0.97] opacity-35'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold shrink-0 text-tx-tertiary">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      question.importance === 'MUST'
                        ? 'bg-[var(--status-fail-bg)] text-[var(--status-fail-text)]'
                        : 'bg-surface-sunken text-tx-muted'
                    }`}>
                      {question.importance === 'MUST' ? '필수' : '권고'}
                    </span>
                  </div>
                  <span className="text-[14px] leading-snug font-semibold text-tx-primary">{question.text}</span>
                </div>
              </div>
              <div className="flex items-center shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => onQuickAnswer(itemId, question.id, currentAnswer === 'YES' ? 'NA' : 'YES')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-bold border transition-all duration-200 ${
                    currentAnswer === 'YES'
                      ? 'bg-[var(--status-pass-bg)] text-[var(--status-pass-text)] border-[var(--status-pass-border)]'
                      : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong hover:text-tx-secondary'
                  }`}
                >
                  예
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAnswer(itemId, question.id, currentAnswer === 'NO' ? 'NA' : 'NO')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-bold border transition-all duration-200 ${
                    currentAnswer === 'NO'
                      ? 'bg-[var(--status-fail-bg)] text-[var(--status-fail-text)] border-[var(--status-fail-border)]'
                      : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong hover:text-tx-secondary'
                  }`}
                >
                  아니오
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAnswer(itemId, question.id, 'NA')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-tx-muted bg-surface-base border border-ln hover:border-ln-strong hover:text-tx-secondary transition-all duration-200"
                >
                  해당없음
                </button>
              </div>
            </div>

            {currentAnswer === 'YES' && (
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

            {currentAnswer === 'NO' && (
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
