import type { AgreementParsed, QuickAnswer } from '../../../types';
import { Paperclip } from 'lucide-react';

const QUESTIONS = [
  { id: 'Q1', text: 'IP를 수령했나요?', importance: 'MUST' as const },
  { id: 'Q2', text: '네트워크 설정을 완료했나요?', importance: 'MUST' as const },
  { id: 'Q3', text: '인터넷 연결을 확인했나요?', importance: 'MUST' as const },
];

const NO_GUIDES: Record<string, string[]> = {
  Q1: [
    '관리팀에 IP 발급을 요청하세요.',
    '합의서의 "필요 장비 수"를 확인하여 필요한 IP 수를 파악하세요.',
  ],
  Q2: [
    '발급받은 IP를 각 장비에 설정하세요.',
    '서브넷 마스크: 255.255.255.0, 게이트웨이: 210.104.181.1',
    'DNS: 210.104.33.10 / 210.104.33.20',
  ],
  Q3: [
    '명령 프롬프트에서 ping 테스트를 실행하세요.',
    '예: ping 8.8.8.8 또는 ping www.google.com',
    '응답이 없으면 네트워크 설정을 다시 확인하세요.',
  ],
};

const YES_GUIDES: Record<string, { refs: string[]; guides: string[] }> = {
  Q1: {
    refs: ['환경구성 파일'],
    guides: ['환경구성 파일에 각 장비에 부여된 IP 주소를 입력하세요.'],
  },
  Q2: {
    refs: ['환경구성 파일'],
    guides: [
      '서브넷: 255.255.255.0 / 게이트웨이: 210.104.181.1',
      'DNS: 168.126.63.1',
    ],
  },
  Q3: {
    refs: [],
    guides: ['ping 8.8.8.8 또는 브라우저 접속으로 인터넷 연결을 확인하세요.'],
  },
};

interface Setup04EvidenceProps {
  agreement: AgreementParsed | undefined;
  quickAnswers: Record<string, QuickAnswer>;
  onQuickAnswer: (itemId: string, questionId: string, value: QuickAnswer) => void;
  itemId: string;
}

export function Setup04Evidence({
  agreement,
  quickAnswers,
  onQuickAnswer,
  itemId,
}: Setup04EvidenceProps) {
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
                {question.id === 'Q1' && agreement?.requiredEquipmentCount && (
                  <div className="px-3 py-2 rounded-lg bg-accent-subtle border border-accent text-sm text-accent-text">
                    <span className="font-semibold">합의서 장비 수:</span> {agreement.requiredEquipmentCount}대
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
