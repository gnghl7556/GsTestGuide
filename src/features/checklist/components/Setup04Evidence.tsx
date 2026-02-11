import type { AgreementParsed, IpEntry, QuickAnswer, QuickInputValue } from '../../../types';

const IP_PREFIX = '210.104.181.';

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

function isIpEntryArray(value: unknown): value is IpEntry[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'object' &&
    value[0] !== null &&
    'label' in value[0] &&
    'lastOctet' in value[0]
  );
}

function toIpEntryList(value: QuickInputValue | undefined, equipmentCount: number): IpEntry[] {
  if (isIpEntryArray(value)) return value;
  const count = Math.max(equipmentCount, 1);
  return Array.from({ length: count }, (_, i) => ({
    label: `장비 ${i + 1}`,
    lastOctet: '',
  }));
}

function validateOctet(value: string): boolean {
  if (value === '') return true;
  const num = Number(value);
  return /^\d{1,3}$/.test(value) && num >= 0 && num <= 255;
}

const inputCls = 'w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-input-text placeholder-input-placeholder focus:border-[var(--focus-ring)] focus:ring-2 focus:ring-[var(--focus-ring)]/20 outline-none';
const textareaSmCls = `${inputCls} min-h-[60px] resize-y`;

interface Setup04EvidenceProps {
  agreement: AgreementParsed | undefined;
  quickAnswers: Record<string, QuickAnswer>;
  onQuickAnswer: (itemId: string, questionId: string, value: QuickAnswer) => void;
  inputValues: Record<string, QuickInputValue>;
  onInputChange: (itemId: string, fieldId: string, value: QuickInputValue) => void;
  itemId: string;
}

export function Setup04Evidence({
  agreement,
  quickAnswers,
  onQuickAnswer,
  inputValues,
  onInputChange,
  itemId,
}: Setup04EvidenceProps) {
  const equipmentCount = Number(agreement?.requiredEquipmentCount) || 1;
  const ipEntries = toIpEntryList(inputValues.evidence_Q1, equipmentCount);

  const getStringInput = (key: string) =>
    typeof inputValues[key] === 'string' ? (inputValues[key] as string) : '';

  const handleIpChange = (index: number, lastOctet: string) => {
    if (!validateOctet(lastOctet)) return;
    const next = ipEntries.map((entry, i) =>
      i === index ? { ...entry, lastOctet } : entry
    );
    onInputChange(itemId, 'evidence_Q1', next);
  };

  const addEquipment = () => {
    const next = [...ipEntries, { label: `장비 ${ipEntries.length + 1}`, lastOctet: '' }];
    onInputChange(itemId, 'evidence_Q1', next);
  };

  const removeEquipment = (index: number) => {
    if (ipEntries.length <= 1) return;
    const next = ipEntries
      .filter((_, i) => i !== index)
      .map((entry, i) => ({ ...entry, label: `장비 ${i + 1}` }));
    onInputChange(itemId, 'evidence_Q1', next);
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
                {agreement?.requiredEquipmentCount && (
                  <div className="px-3 py-2 rounded-lg bg-accent-subtle border border-accent text-sm text-accent-text">
                    <span className="font-semibold">합의서 장비 수:</span> {agreement.requiredEquipmentCount}대
                  </div>
                )}
                <div className="space-y-2">
                  {ipEntries.map((entry, idx) => (
                    <div key={`ip-${idx}`} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-tx-tertiary min-w-[56px]">{entry.label}</span>
                      <span className="text-sm text-tx-muted font-mono">{IP_PREFIX}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={entry.lastOctet}
                        onChange={(e) => handleIpChange(idx, e.target.value)}
                        placeholder="0~255"
                        maxLength={3}
                        className="w-20 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-input-text font-mono text-center placeholder-input-placeholder focus:border-[var(--focus-ring)] focus:ring-2 focus:ring-[var(--focus-ring)]/20 outline-none"
                      />
                      {ipEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEquipment(idx)}
                          className="text-xs font-semibold px-2 py-1 rounded-md border border-ln text-tx-tertiary hover:text-tx-secondary"
                        >
                          삭제
                        </button>
                      )}
                      {entry.lastOctet && (
                        <span className="text-xs text-tx-muted font-mono">
                          {IP_PREFIX}{entry.lastOctet}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addEquipment}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full border border-ln text-tx-tertiary hover:border-ln-strong"
                >
                  + 장비 추가
                </button>
              </div>
            )}

            {answer === 'YES' && question.id === 'Q2' && (
              <div className="mt-4">
                <textarea
                  value={getStringInput('evidence_Q2')}
                  onChange={(e) => onInputChange(itemId, 'evidence_Q2', e.target.value)}
                  placeholder="네트워크 설정 내용을 입력하세요 (예: 각 장비 IP 설정 완료, 게이트웨이/DNS 확인)"
                  className={textareaSmCls}
                />
              </div>
            )}

            {answer === 'YES' && question.id === 'Q3' && (
              <div className="mt-4">
                <textarea
                  value={getStringInput('evidence_Q3')}
                  onChange={(e) => onInputChange(itemId, 'evidence_Q3', e.target.value)}
                  placeholder="인터넷 연결 확인 내용을 입력하세요 (예: ping 테스트 정상, 브라우저 접속 확인)"
                  className={textareaSmCls}
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
