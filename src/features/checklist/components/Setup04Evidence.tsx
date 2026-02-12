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
