import type {
  ChecklistItem,
  ExecutionItemGate,
  QuickAnswer,
  QuickModeItem,
  QuickInputValue,
  RequiredDoc
} from '../../../types';
import { CATEGORY_THEMES } from 'virtual:content/categories';
import { Ban, FileDown, ExternalLink, Download, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { DefectReportForm } from '../../defects/components/DefectReportForm';
import { RequiredDocChip } from '../../../components/ui';
import { Setup03Evidence } from './Setup03Evidence';
import { Setup04Evidence } from './Setup04Evidence';
import { useEffect, useState } from 'react';
import { db, storage } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getDownloadURL, ref, listAll } from 'firebase/storage';
import { DefectRefBoardModal } from '../../defects/components/DefectRefBoardModal';
import { useStepContacts } from '../../admin/hooks/useStepContacts';



interface CenterDisplayProps {
  activeItem: ChecklistItem | undefined;
  displayIndex?: number;
  quickModeItem: QuickModeItem | undefined;
  quickAnswers: Record<string, QuickAnswer>;
  onQuickAnswer: (itemId: string, questionId: string, value: QuickAnswer) => void;
  inputValues: Record<string, QuickInputValue>;
  onInputChange: (itemId: string, fieldId: string, value: QuickInputValue) => void;
  itemGate?: ExecutionItemGate;
  isFinalized: boolean;
}

/* ── Shared input class (token-based, no dark: prefix) ── */
const inputCls = 'w-full rounded-xl border border-input-border bg-input-bg px-3 py-2 text-sm text-input-text placeholder-input-placeholder focus:border-[var(--focus-ring)] focus:ring-2 focus:ring-[var(--focus-ring)]/20 outline-none';

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
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [showDefectBoard, setShowDefectBoard] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [docDescriptions, setDocDescriptions] = useState<Record<string, string>>({});
  const { currentTestNumber, testSetup } = useTestSetupContext();
  const agreement = testSetup.agreementParsed;
  const contacts = useStepContacts(activeItem?.id, activeItem?.contacts);

  // Subscribe to Firestore docMaterials for admin-managed descriptions
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'docMaterials'), (snap) => {
      const map: Record<string, string> = {};
      snap.forEach((d) => {
        const data = d.data() as { label?: string; description?: string };
        if (data.label && data.description) map[data.label] = data.description;
      });
      setDocDescriptions(map);
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    if (!selectedDoc) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedDoc(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedDoc]);
  useEffect(() => {
    setDownloadUrl(null);
    if (!selectedDoc || !storage) return;
    let canceled = false;
    const folderRef = ref(storage, `sample-downloads/${selectedDoc.label}`);
    void listAll(folderRef)
      .then(async (result) => {
        if (canceled || result.items.length === 0) return;
        const url = await getDownloadURL(result.items[0]);
        if (!canceled) setDownloadUrl(url);
      })
      .catch(() => {});
    return () => { canceled = true; };
  }, [selectedDoc]);
  if (!activeItem) return <div className="h-full bg-surface-base rounded-xl border border-ln" />;

  if (activeItem.id === 'DUR-EXEC-01' && currentTestNumber) {
    return (
      <DefectReportForm
        projectId={currentTestNumber || ''}
        testCaseId={activeItem.id}
        isFinalized={isFinalized}
      />
    );
  }

  const theme = CATEGORY_THEMES[activeItem.category] ?? CATEGORY_THEMES['SETUP'];
  const isNA = activeItem.status === 'Not_Applicable';
  const displayLabel =
    typeof displayIndex === 'number' && displayIndex >= 0
      ? String(displayIndex + 1).padStart(2, '0')
      : activeItem.id;
  const refItems = activeItem.requiredDocs ?? [];
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
  const toPublicStorageUrl = (storagePath: string) =>
    storageBucket
      ? `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(storagePath)}?alt=media`
      : '';
  const DEFECT_BOARD_LABEL = '결함 분류 기준표';
  const handleDocClick = (doc: RequiredDoc) => {
    if (doc.label === DEFECT_BOARD_LABEL) {
      setShowDefectBoard(true);
      return;
    }
    setSelectedDoc(doc);
  };
  const resolveDocPreviewUrl = (doc: RequiredDoc) => {
    const byLabel = previewUrls[doc.label];
    if (byLabel) return byLabel;
    if (doc.previewImageUrl && !doc.previewImageUrl.startsWith('/src/assets/')) return doc.previewImageUrl;
    if (doc.storagePath) return toPublicStorageUrl(doc.storagePath);
    return '';
  };

  useEffect(() => {
    if (!storage || refItems.length === 0) return;
    const previewStorage = storage;
    let canceled = false;
    void Promise.all(
      refItems.map(async (doc) => {
        if (!doc.storagePath) return null;
        try {
          const url = await getDownloadURL(ref(previewStorage, doc.storagePath));
          return { label: doc.label, url };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (canceled) return;
      setPreviewUrls((prev) => {
        const next = { ...prev };
        results.forEach((item) => {
          if (item) next[item.label] = item.url;
        });
        return next;
      });
    });
    return () => {
      canceled = true;
    };
  }, [refItems]);
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
      ] satisfies Array<{ id: string; text: string; importance: 'MUST' | 'SHOULD' }>)
    : (quickModeItem?.quickQuestions ?? []);

  const q1Answer = quickAnswers.Q1 ?? 'NA';
  const q2Answer = quickAnswers.Q2 ?? 'NA';

  /* ── Sequential gate: Q(n) "NO" → disable Q(n+1)+ ── */
  const SKIP_RULES: Record<string, { trigger: string; skip: string[]; keep?: string[] }> = {
    'SETUP-03': { trigger: 'Q2', skip: ['Q3', 'Q4'], keep: ['Q5'] },
  };

  const isQuestionDisabled = (questionId: string, questions: typeof seatQuestions): boolean => {
    if (isSeatAssignment) {
      if (questionId === 'Q2' && (q1Answer === 'NA' || q1Answer === 'YES')) return true;
      return false;
    }
    const rule = SKIP_RULES[activeItem.id];
    if (rule) {
      const triggerAnswer = quickAnswers[rule.trigger];
      if (triggerAnswer === 'NO' && rule.skip.includes(questionId)) return true;
    }
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx <= 0) return false;
    for (let i = idx - 1; i >= 0; i--) {
      const prevId = questions[i].id;
      const prevAnswer = quickAnswers[prevId];
      if (rule && rule.skip.includes(prevId)) continue;
      if (prevAnswer === 'NO') {
        if (rule && rule.keep?.includes(questionId)) return false;
        return true;
      }
      if (!prevAnswer || prevAnswer === 'NA') return true;
      break;
    }
    return false;
  };

  const handleAnswer = (questionId: string, value: QuickAnswer) => {
    onQuickAnswer(isSeatAssignment ? activeItem.id : requirementId, questionId, value);
    if (isSeatAssignment && questionId === 'Q1' && value === 'YES') {
      onQuickAnswer(activeItem.id, 'Q2', 'NA');
    }
    const questions = isSeatAssignment ? seatQuestions : (quickModeItem?.quickQuestions ?? []);
    if (value === 'NO') {
      const rule = SKIP_RULES[activeItem.id];
      const idx = questions.findIndex((q) => q.id === questionId);
      for (let i = idx + 1; i < questions.length; i++) {
        const qid = questions[i].id;
        if (rule && rule.trigger === questionId && rule.keep?.includes(qid)) continue;
        if (rule && rule.trigger === questionId && rule.skip.includes(qid)) {
          onQuickAnswer(isSeatAssignment ? activeItem.id : requirementId, qid, 'NA');
          continue;
        }
        onQuickAnswer(isSeatAssignment ? activeItem.id : requirementId, qid, 'NA');
      }
    }
  };

  return (
    <div className="h-full bg-surface-base rounded-xl border border-ln shadow-sm flex flex-col overflow-hidden relative">
      <div className={`px-6 py-4 border-b border-ln-subtle ${isNA ? 'bg-surface-sunken' : theme.lightBg}`}>
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className={`text-xs font-bold tracking-wide uppercase ${isNA ? 'text-tx-muted' : theme.text}`}>{activeItem.category === 'SETUP' ? '시험준비' : activeItem.category === 'EXECUTION' ? '시험수행' : '시험종료'}</span>
          <span className="text-tx-muted text-xs">/</span>
          <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isNA ? 'bg-surface-sunken text-tx-tertiary' : `${theme.lightBg} ${theme.text}`}`}>#{displayLabel}</span>
          {itemGate && itemGate.state !== 'enabled' && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                itemGate.state === 'blockedByFinalization'
                  ? 'bg-status-hold-bg text-status-hold-text border border-status-hold-border'
                  : 'bg-surface-sunken text-tx-tertiary border border-ln'
              }`}
              title={itemGate.reason || ''}
            >
              {itemGate.state === 'blockedByFinalization' ? '최종 잠금' : '조건 대기'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className={`text-2xl font-bold leading-snug ${isNA ? 'text-tx-muted' : 'text-tx-primary'}`}>
            {activeItem.title}
          </h2>
          {refItems.length > 0 && !isNA && (
            <div className="flex flex-wrap items-center gap-1">
              {refItems.map((doc, index) => (
                <RequiredDocChip
                  key={`${doc.label}-${index}`}
                  label={doc.label}
                  kind={doc.kind}
                  toneClass={theme.text}
                  borderClass={theme.border}
                  isActive={selectedDoc?.label === doc.label}
                  onClick={() => handleDocClick(doc)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto">

        {isNA ? (
          <div className="p-4 bg-surface-sunken rounded-lg border border-dashed border-ln-strong flex items-start gap-3 text-tx-tertiary mb-5">
            <Ban className="mt-0.5 shrink-0" size={18} />
            <div>
              <strong className="block text-tx-secondary text-base font-bold mb-0.5">검토 제외 대상</strong>
              <span className="text-base">{activeItem.autoReason}</span>
            </div>
          </div>
        ) : (
          <div className="max-w-none">
            {activeItem.description && (
              <p className="text-base text-tx-secondary leading-relaxed">
                {activeItem.description}
              </p>
            )}
            <div className="mt-5 space-y-4">
              {activeItem.id === 'SETUP-03' ? (
                <Setup03Evidence
                  agreement={agreement}
                  quickAnswers={quickAnswers}
                  onQuickAnswer={onQuickAnswer}
                  itemId={activeItem.id}
                />
              ) : activeItem.id === 'SETUP-04' ? (
                <Setup04Evidence
                  agreement={agreement}
                  quickAnswers={quickAnswers}
                  onQuickAnswer={onQuickAnswer}
                  itemId={activeItem.id}
                />
              ) : activeItem.inputFields && activeItem.inputFields.length > 0 ? (
                <div className="space-y-4">
                  {refItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {refItems.map((doc, i) => (
                        <button key={`ref-${i}`} type="button" onClick={() => handleDocClick(doc)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-surface-sunken border border-ln text-tx-secondary hover:border-ln-strong hover:text-tx-primary transition-colors">
                          {doc.kind === 'external' ? <ExternalLink size={11} /> : <FileDown size={11} />}
                          {doc.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {activeItem.evidenceExamples && activeItem.evidenceExamples.length > 0 && (
                    <div className="rounded-md border border-ln bg-surface-sunken px-3.5 py-3">
                      <div className="text-xs font-bold text-tx-muted mb-2 uppercase tracking-wide">증빙 안내</div>
                      <div className="text-sm text-tx-tertiary space-y-1">
                        {activeItem.evidenceExamples.map((example, i) => (
                          <div key={i}>• {example}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {seatQuestions.map((question, index) => {
                    const disabled = isQuestionDisabled(question.id, seatQuestions);
                    return (
                    <div
                      key={question.id}
                      id={`question-${requirementId}-${question.id}`}
                      className={`p-4 rounded-xl border shadow-sm transition-colors ${
                        disabled
                          ? 'border-ln-subtle bg-surface-raised opacity-50 pointer-events-none'
                          : quickAnswers[question.id] === 'YES'
                            ? 'border-status-pass-border/40 bg-status-pass-bg/30'
                            : quickAnswers[question.id] === 'NO'
                              ? 'border-status-fail-border/40 bg-status-fail-bg/30'
                              : 'border-ln bg-surface-sunken'
                      }`}
                    >
                      {(() => {
                        const currentAnswer = quickAnswers[question.id] ?? 'NA';
                        return (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                            currentAnswer === 'YES'
                              ? 'bg-status-pass-bg text-status-pass-text border border-status-pass-border'
                              : currentAnswer === 'NO'
                                ? 'bg-status-fail-bg text-status-fail-text border border-status-fail-border'
                                : 'bg-surface-base text-tx-tertiary border border-ln'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-tx-muted mb-0.5">
                              {question.importance === 'MUST' ? '필수' : '권고'}
                            </div>
                            {!isSeatAssignment && (() => {
                              const questionRefs = question.refs && question.refs.length > 0
                                ? refItems.filter((d) => question.refs!.includes(d.label))
                                : refItems;
                              if (questionRefs.length === 0) return null;
                              return (
                                <div className="flex items-center gap-1 mb-1 flex-wrap">
                                  {questionRefs.map((d, i) => (
                                    <button
                                      key={`qref-${question.id}-${i}`}
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleDocClick(d); }}
                                      className={`inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-md border transition-colors ${
                                        selectedDoc?.label === d.label
                                          ? `${theme.text} ${theme.border} bg-white/50`
                                          : 'bg-surface-base border-ln text-tx-secondary hover:border-ln-strong hover:text-tx-primary'
                                      }`}
                                    >
                                      {d.kind === 'external' ? <ExternalLink size={9} /> : <FileDown size={9} />}
                                      {d.label}
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                            <span className="text-[15px] text-tx-primary leading-snug font-semibold">{question.text}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickModeItem && !isSeatAssignment) return;
                              handleAnswer(question.id, 'YES');
                            }}
                            className={`px-4 py-2 rounded-lg text-base font-bold border transition-colors ${
                              currentAnswer === 'YES'
                                ? 'bg-status-pass-bg text-status-pass-text border-status-pass-border'
                                : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong'
                            }`}
                          >
                            예
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickModeItem && !isSeatAssignment) return;
                              handleAnswer(question.id, 'NO');
                            }}
                            className={`px-4 py-2 rounded-lg text-base font-bold border transition-colors ${
                              currentAnswer === 'NO'
                                ? 'bg-status-fail-bg text-status-fail-text border-status-fail-border'
                                : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong'
                            }`}
                          >
                            아니오
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickModeItem && !isSeatAssignment) return;
                              handleAnswer(question.id, 'NA');
                            }}
                            className={`px-4 py-2 rounded-lg text-base font-bold border transition-colors ${
                              currentAnswer === 'NA'
                                ? 'bg-status-pending-bg text-tx-tertiary border-status-pending-border'
                                : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong'
                            }`}
                          >
                            해당없음
                          </button>
                        </div>
                      </div>
                        );
                      })()}
                      {isSeatAssignment && question.id === 'Q1' && q1Answer === 'YES' && (
                        <div className="mt-3.5 space-y-2">
                          <div className="text-xs font-bold text-tx-tertiary">시험 자리</div>
                          <input
                            type="text"
                            value={seatValue}
                            onChange={(e) => onInputChange(activeItem.id, 'seatLocation', e.target.value)}
                            placeholder="예: 9-L/R, 10-L/R"
                            className={inputCls}
                          />
                          <p className="text-xs text-status-pass-text">
                            자리 정보 입력 후 다음 항목을 건너뛰고 판정에 참고하세요.
                          </p>
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q1' && q1Answer === 'NO' && (
                        <div className="mt-3.5 text-xs text-tx-tertiary">
                          다음 질문을 진행하세요.
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q2' && q1Answer === 'NA' && (
                        <div className="mt-3.5 text-xs text-tx-muted">
                          먼저 1번 질문에 답해주세요.
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q2' && q1Answer === 'YES' && (
                        <div className="mt-3.5 text-xs text-tx-muted">
                          1번에서 자리 배정을 확인했으므로 다음 항목으로 이동하세요.
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q2' && q2Answer === 'YES' && (
                        <div className="mt-3.5 space-y-2">
                          <div className="text-xs font-bold text-tx-tertiary">시험 자리</div>
                          <input
                            type="text"
                            value={seatValue}
                            onChange={(e) => onInputChange(activeItem.id, 'seatLocation', e.target.value)}
                            placeholder="예: 9-L/R, 10-L/R"
                            className={inputCls}
                          />
                          <p className="text-xs text-status-pass-text">
                            자리 정보 입력 후 다음 항목을 건너뛰고 판정에 참고하세요.
                          </p>
                        </div>
                      )}
                      {isSeatAssignment && question.id === 'Q2' && q1Answer === 'NO' && q2Answer === 'NO' && (
                        <div className="mt-3.5 space-y-3">
                          <div className="rounded-md border border-ln bg-surface-base px-3.5 py-2.5 text-sm text-tx-tertiary space-y-1">
                            <div>• 시험에 필요한 장비 확인: <span className="font-semibold">시험 합의서</span>를 확인하세요.</div>
                            <div>• 사용 가능한 시험 자리: 아래 <span className="font-semibold">담당자</span> 정보를 확인하세요.</div>
                          </div>
                          {contacts.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {contacts.map((c) => (
                                <div key={c.role} className="rounded-xl border border-ln bg-surface-base px-5 py-4 flex items-start gap-4">
                                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                    <User size={18} className="text-accent" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium text-tx-muted">{c.role}</div>
                                    <div className="text-base font-bold text-tx-primary mt-0.5">{c.name}</div>
                                    {c.phone && (
                                      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-tx-tertiary">
                                        <Phone size={13} />
                                        {c.phone}
                                      </div>
                                    )}
                                    {c.email && (
                                      <div className="flex items-center gap-1.5 mt-0.5 text-sm text-tx-tertiary">
                                        <Mail size={13} />
                                        {c.email}
                                      </div>
                                    )}
                                    {c.requestMethod && (
                                      <div className="flex items-center gap-1.5 mt-2 text-sm text-accent-text">
                                        <MessageSquare size={13} />
                                        {c.requestUrl ? (
                                          <a href={c.requestUrl} target="_blank" rel="noreferrer" className="hover:underline">{c.requestMethod}</a>
                                        ) : (
                                          <span>{c.requestMethod}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeItem.relatedInfo && activeItem.relatedInfo.length > 0 && (
                            <div className="rounded-md border border-ln bg-surface-base px-3.5 py-3 text-xs text-tx-tertiary">
                              <div className="text-xs font-bold text-tx-muted mb-2 uppercase tracking-wide">참조 정보</div>
                              <div className="space-y-1.5">
                                {activeItem.relatedInfo.map((info) => (
                                  <div key={info.label} className="flex flex-wrap items-center gap-2">
                                    <span className="text-tx-muted min-w-[120px]">{info.label}</span>
                                    {info.href ? (
                                      <a href={info.href} target="_blank" rel="noreferrer" className="text-accent-text hover:text-accent-hover underline">
                                        {info.value}
                                      </a>
                                    ) : (
                                      <span className="text-tx-secondary font-semibold">{info.value}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            {!isSeatAssignment && contacts.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-bold text-tx-muted mb-3 uppercase tracking-wide">담당자</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contacts.map((c) => (
                    <div key={c.role} className="rounded-xl border border-ln bg-surface-sunken px-5 py-4 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <User size={18} className="text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-tx-muted">{c.role}</div>
                        <div className="text-base font-bold text-tx-primary mt-0.5">{c.name}</div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-tx-tertiary">
                            <Phone size={13} />
                            {c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-sm text-tx-tertiary">
                            <Mail size={13} />
                            {c.email}
                          </div>
                        )}
                        {c.requestMethod && (
                          <div className="flex items-center gap-1.5 mt-2 text-sm text-accent-text">
                            <MessageSquare size={13} />
                            {c.requestUrl ? (
                              <a href={c.requestUrl} target="_blank" rel="noreferrer" className="hover:underline">{c.requestMethod}</a>
                            ) : (
                              <span>{c.requestMethod}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!isSeatAssignment && activeItem.relatedInfo && activeItem.relatedInfo.length > 0 && (
              <div className="mt-5 rounded-lg border border-ln bg-surface-sunken px-4 py-3 text-sm text-tx-tertiary">
                <div className="text-xs font-bold text-tx-muted mb-2 uppercase tracking-wide">참조 정보</div>
                <div className="space-y-2">
                  {activeItem.relatedInfo.map((info) => (
                    <div key={info.label} className="flex flex-wrap items-center gap-2">
                      <span className="text-tx-muted min-w-[120px]">{info.label}</span>
                      {info.href ? (
                        <a href={info.href} target="_blank" rel="noreferrer" className="text-accent-text hover:text-accent-hover underline">
                          {info.value}
                        </a>
                      ) : (
                        <span className="text-tx-secondary font-semibold">{info.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <details className="mt-8 rounded-lg border border-ln-subtle bg-surface-base group">
              <summary className="cursor-pointer px-4 py-3 text-base font-bold text-tx-tertiary hover:text-tx-secondary transition-colors flex items-center gap-1.5">
                <span className="inline-block transition-transform group-open:rotate-90 text-tx-muted">▸</span>
                상세 정보
              </summary>
              <div className="px-4 pb-4 space-y-4 border-t border-ln-subtle pt-3.5">
                <div>
                  <h4 className="text-xs font-bold text-tx-muted mb-1.5 uppercase tracking-wide">요구사항 설명</h4>
                  <p className="text-sm text-tx-tertiary leading-relaxed">{activeItem.description}</p>
                </div>
                {activeItem.checkPoints && activeItem.checkPoints.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-tx-muted mb-1.5 uppercase tracking-wide">점검 포인트</h4>
                    <ul className="list-disc pl-4 text-sm text-tx-tertiary space-y-1">
                      {activeItem.checkPoints.map((point, index) => (
                        <li key={`${activeItem.id}-${index}`}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeItem.evidenceExamples && activeItem.evidenceExamples.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-tx-muted mb-1.5 uppercase tracking-wide">증빙 예시</h4>
                    <ul className="list-disc pl-4 text-sm text-tx-tertiary space-y-1">
                      {activeItem.evidenceExamples.map((example, index) => (
                        <li key={`${activeItem.id}-evidence-${index}`}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeItem.testSuggestions && activeItem.testSuggestions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-tx-muted mb-1.5 uppercase tracking-wide">테스트 제안</h4>
                    <ul className="list-disc pl-4 text-sm text-tx-tertiary space-y-1">
                      {activeItem.testSuggestions.map((suggestion, index) => (
                        <li key={`${activeItem.id}-test-${index}`}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeItem.passCriteria && (
                  <div className="rounded-md border border-status-pass-border bg-status-pass-bg px-3.5 py-2.5 text-status-pass-text">
                    <h4 className="text-xs font-bold mb-1.5 uppercase tracking-wide">판정 기준</h4>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6"
          onClick={() => setSelectedDoc(null)}
        >
          {(() => {
            const selectedPreviewUrl = resolveDocPreviewUrl(selectedDoc);
            return (
          <div className="w-full max-w-5xl rounded-2xl border border-ln bg-surface-overlay shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-ln px-5 py-4">
              <div className="text-sm font-bold text-tx-primary">{selectedDoc.label}</div>
              <div className="flex items-center gap-2">
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Download size={13} />
                    샘플 다운로드
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-lg border border-ln px-3 py-1.5 text-xs font-semibold text-tx-tertiary hover:text-tx-primary"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="grid grid-cols-[7fr_3fr] gap-0 min-h-[60vh]" onClick={(e) => e.stopPropagation()}>
              <div className="border-r border-ln-subtle bg-surface-sunken p-4">
                {selectedPreviewUrl && (
                  <img
                    src={selectedPreviewUrl}
                    alt={selectedDoc.label}
                    className="h-full w-full rounded-lg object-contain bg-surface-base"
                  />
                )}
                {!selectedPreviewUrl && (
                  <div className="h-full w-full rounded-lg border border-dashed border-ln-strong bg-surface-base flex items-center justify-center text-sm text-tx-muted">
                    미리보기 준비 중
                  </div>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-tx-muted mb-2">설명</div>
                  <p className="text-sm text-tx-secondary leading-relaxed">
                    {docDescriptions[selectedDoc.label] || selectedDoc.description || '이 자료를 확인한 뒤 점검을 진행하세요.'}
                  </p>
                </div>
                {selectedDoc.showRelatedInfo && activeItem.relatedInfo && activeItem.relatedInfo.length > 0 && (
                  <div className="rounded-xl border border-ln bg-surface-sunken px-4 py-3 text-xs text-tx-tertiary">
                    <div className="text-xs font-semibold text-tx-muted mb-2">관련 정보</div>
                    <div className="space-y-1.5">
                      {activeItem.relatedInfo.map((info) => (
                        <div key={info.label} className="flex flex-wrap items-center gap-2">
                          <span className="text-tx-muted min-w-[120px]">{info.label}</span>
                          {info.href ? (
                            <a
                              href={info.href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent-text hover:text-accent-hover underline"
                            >
                              {info.value}
                            </a>
                          ) : (
                            <span className="text-tx-secondary font-semibold">{info.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}
      <DefectRefBoardModal open={showDefectBoard} onClose={() => setShowDefectBoard(false)} />
    </div>
  );
}
