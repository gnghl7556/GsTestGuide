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
  activeQuestionIdx?: number;
  onActiveQuestionChange?: (idx: number) => void;
}

export function CenterDisplay({
  activeItem,
  displayIndex,
  quickModeItem,
  quickAnswers,
  onQuickAnswer,
  inputValues: _inputValues,
  onInputChange: _onInputChange,
  itemGate,
  isFinalized: _isFinalized,
  activeQuestionIdx,
  onActiveQuestionChange
}: CenterDisplayProps) {
  const [selectedDoc, setSelectedDoc] = useState<RequiredDoc | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [showDefectBoard, setShowDefectBoard] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [docDescriptions, setDocDescriptions] = useState<Record<string, string>>({});
  const { currentTestNumber: _currentTestNumber, testSetup } = useTestSetupContext();
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
        // 1) storagePath가 있으면 직접 로드
        if (doc.storagePath) {
          try {
            const url = await getDownloadURL(ref(previewStorage, doc.storagePath));
            return { label: doc.label, url };
          } catch {
            return null;
          }
        }
        // 2) storagePath 없으면 관리자 업로드 폴더(checklist-previews/{label}/) 조회
        try {
          const folderRef = ref(previewStorage, `checklist-previews/${doc.label}`);
          const result = await listAll(folderRef);
          if (result.items.length === 0) return null;
          const url = await getDownloadURL(result.items[0]);
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
  const requirementId = quickModeItem?.requirementId ?? activeItem.id;
  const questions = quickModeItem?.quickQuestions ?? [];

  const isQuestionDisabled = (questionId: string): boolean => {
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx <= 0) return false;
    const prevAnswer = quickAnswers[questions[idx - 1].id];
    if (prevAnswer === 'NO' || !prevAnswer || prevAnswer === 'NA') return true;
    return false;
  };

  const handleAnswer = (questionId: string, value: QuickAnswer) => {
    onQuickAnswer(requirementId, questionId, value);
    if (value === 'NO' || value === 'NA') {
      const idx = questions.findIndex((q) => q.id === questionId);
      for (let i = idx + 1; i < questions.length; i++) {
        onQuickAnswer(requirementId, questions[i].id, 'NA');
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
                  {(() => {
                    const firstUnansweredId = questions.find((q) => {
                      if (isQuestionDisabled(q.id)) return false;
                      const ans = quickAnswers[q.id];
                      return !ans || ans === 'NA';
                    })?.id ?? null;
                    return questions.map((question, index) => {
                    const disabled = isQuestionDisabled(question.id);
                    const currentAnswer = quickAnswers[question.id] ?? 'NA';
                    const isAnswered = currentAnswer === 'YES' || currentAnswer === 'NO';
                    const isCurrent = question.id === firstUnansweredId;
                    const isKbFocused = activeQuestionIdx === index;
                    return (
                    <div
                      key={question.id}
                      id={`question-${requirementId}-${question.id}`}
                      onClick={() => onActiveQuestionChange?.(index)}
                      className={`rounded-xl px-4 py-3.5 transition-all duration-300 ease-out origin-left ${
                        disabled
                          ? 'bg-surface-sunken/50 opacity-25 pointer-events-none scale-[0.97]'
                          : isAnswered
                            ? 'bg-surface-sunken/70 scale-[0.97] opacity-60'
                            : isCurrent
                              ? 'bg-surface-base scale-100 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.15)]'
                              : 'bg-surface-sunken/40 scale-[0.97] opacity-35'
                      } ${isKbFocused && !disabled ? 'ring-2 ring-blue-500/50 ring-offset-1' : ''}`}
                    >
                      {(() => {
                        return (
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
                              {(() => {
                                const questionRefs = question.refs && question.refs.length > 0
                                  ? refItems.filter((d) => question.refs!.includes(d.label))
                                  : refItems;
                                if (questionRefs.length === 0) return null;
                                return questionRefs.map((d, i) => (
                                  <button
                                    key={`qref-${question.id}-${i}`}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDocClick(d); }}
                                    className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md border transition-colors ${
                                      selectedDoc?.label === d.label
                                        ? `${theme.text} ${theme.border} bg-white/50`
                                        : 'bg-surface-base border-ln text-tx-secondary hover:border-ln-strong hover:text-tx-primary'
                                    }`}
                                  >
                                    {d.kind === 'external' ? <ExternalLink size={9} /> : <FileDown size={9} />}
                                    {d.label}
                                  </button>
                                ));
                              })()}
                            </div>
                            <span className="text-[14px] leading-snug font-semibold text-tx-primary">{question.text}</span>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickModeItem) return;
                              handleAnswer(question.id, currentAnswer === 'NO' ? 'NA' : 'NO');
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-bold border transition-all duration-200 ${
                              currentAnswer === 'NO'
                                ? 'bg-[var(--status-fail-bg)] text-[var(--status-fail-text)] border-[var(--status-fail-border)]'
                                : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong hover:text-tx-secondary'
                            }`}
                          >
                            ← 아니오
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickModeItem) return;
                              handleAnswer(question.id, 'NA');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-tx-muted bg-surface-base border border-ln hover:border-ln-strong hover:text-tx-secondary transition-all duration-200"
                          >
                            해당없음
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickModeItem) return;
                              handleAnswer(question.id, currentAnswer === 'YES' ? 'NA' : 'YES');
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-bold border transition-all duration-200 ${
                              currentAnswer === 'YES'
                                ? 'bg-[var(--status-pass-bg)] text-[var(--status-pass-text)] border-[var(--status-pass-border)]'
                                : 'bg-surface-base text-tx-tertiary border-ln hover:border-ln-strong hover:text-tx-secondary'
                            }`}
                          >
                            예 →
                          </button>
                        </div>
                      </div>
                        );
                      })()}
                    </div>
                    );
                  });
                  })()}
                </div>
              )}
            </div>
            {contacts.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-bold text-tx-secondary mb-2.5 tracking-wide">담당자</div>
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <div key={c.role} className="rounded-xl bg-white/40 dark:bg-white/[0.06] backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.06)] px-4 py-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-surface-base flex items-center justify-center shrink-0">
                        <User size={14} className="text-tx-tertiary" />
                      </div>
                      <div className="min-w-0 flex-1 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-tx-primary">{c.name}</span>
                          <span className="text-[11px] text-tx-muted">{c.role}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {c.phone && (
                            <span className="flex items-center gap-1 text-xs text-tx-tertiary whitespace-nowrap">
                              <Phone size={10} />{c.phone}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1 text-xs text-tx-tertiary">
                              <Mail size={10} />{c.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {c.requestMethod && (
                        <span className="flex items-center gap-1 text-xs text-tx-secondary">
                          <MessageSquare size={10} className="shrink-0" />
                          {c.requestUrl ? (
                            <a href={c.requestUrl} target="_blank" rel="noreferrer" className="hover:underline">{c.requestMethod}</a>
                          ) : c.requestMethod}
                        </span>
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
