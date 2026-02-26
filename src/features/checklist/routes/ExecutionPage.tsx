import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ChecklistView } from './ChecklistView';
import { generateChecklist } from '../../../utils/checklistGenerator';
import { toQuickModeItem, getRecommendation } from '../../../utils/quickMode';
import { computeSkippedIndices, findNextActiveIndex, findPrevActiveIndex } from '../../../utils/branchingResolver';
import { useDefects } from '../../report/hooks/useDefects';
import { computeExecutionGate } from '../utils/executionGate';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type {
  QuickAnswer,
  QuickDecision,
  QuickModeItem,
  QuickReviewAnswer,
  ReviewData,
  UserProfile
} from '../../../types';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { useContentOverrides } from '../../../hooks/useContentOverrides';
import { useDocMaterials } from '../../../hooks/useDocMaterials';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { mergeOverrides, mergeDocLinks } from '../../../lib/content/mergeOverrides';
import { db } from '../../../lib/firebase';
import { useRegisterExecutionToolbar } from '../../../providers/ExecutionToolbarContext';

const storageKey = 'gs-test-guide:review';

type QuickInputValues = NonNullable<QuickReviewAnswer['inputValues']>;
type QuickInputValue = QuickInputValues[string];

type StoredReviewPayload = {
  profile?: UserProfile;
  reviewData?: Record<string, ReviewData>;
  selectedReqId?: string | null;
  quickReviewById?: Record<string, QuickReviewAnswer>;
  testNumber?: string;
};

const readStoredReview = (currentTestNumber: string): StoredReviewPayload => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  if (window.sessionStorage?.getItem('gs-test-guide:skip-restore') === '1') {
    window.sessionStorage.removeItem('gs-test-guide:skip-restore');
    return {};
  }
  if (!currentTestNumber) return {};
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredReviewPayload & { testSetup?: { testNumber?: string } };
    const storedTestNumber = parsed.testNumber || parsed.testSetup?.testNumber || '';
    if (currentTestNumber && storedTestNumber && storedTestNumber !== currentTestNumber) {
      return { profile: parsed.profile };
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(storageKey);
    return {};
  }
};

export function ExecutionPage() {
  const {
    testSetup,
    currentUserId,
    currentTestNumber,
    projects
  } = useTestSetupContext();
  const stored = useMemo(() => readStoredReview(currentTestNumber), []);

  const [profile] = useState<UserProfile>(
    stored.profile || {
      productType: 'SaMD',
      hasAI: false,
      hasPatientData: false,
      hasUI: true
    }
  );
  const [selectedReqId, setSelectedReqId] = useState<string | null>(stored.selectedReqId || null);
  const [reviewData, setReviewData] = useState<Record<string, ReviewData>>(stored.reviewData || {});
  const [quickReviewById, setQuickReviewById] = useState<Record<string, QuickReviewAnswer>>(stored.quickReviewById || {});
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);
  const activeTestRef = useRef(currentTestNumber);
  const { defects } = useDefects(currentTestNumber || null);
  const contentOverrides = useContentOverrides();
  const docMaterials = useDocMaterials();

  // Firestore에서 점검 데이터 로드 (localStorage에 데이터가 없을 때 fallback)
  useEffect(() => {
    if (!db || !currentTestNumber) return;
    activeTestRef.current = currentTestNumber;
    if (firestoreLoaded) return;
    const hasLocalData = Object.keys(quickReviewById).length > 0 || Object.keys(reviewData).length > 0;
    if (hasLocalData) {
      setFirestoreLoaded(true);
      return;
    }

    let alive = true;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db!, 'quickReviews', currentTestNumber));
        if (!alive || currentTestNumber !== activeTestRef.current) return;
        setFirestoreLoaded(true);
        if (!snap.exists()) return;
        const data = snap.data() as { items?: Record<string, Record<string, unknown>> };
        if (!data.items || Object.keys(data.items).length === 0) return;

        setQuickReviewById((prev) => {
          if (Object.keys(prev).length > 0) return prev;
          const result: Record<string, QuickReviewAnswer> = {};
          for (const [itemId, item] of Object.entries(data.items!)) {
            result[itemId] = {
              requirementId: (item.requirementId as string) || itemId,
              answers: (item.answers as Record<string, QuickAnswer>) || {},
              inputValues: (item.inputValues as QuickInputValues) || {},
              answeredQuestions: (item.answeredQuestions as Record<string, boolean>) || {},
              autoRecommendation: (item.autoRecommendation as QuickDecision) || 'HOLD',
              finalDecision: (item.finalDecision as QuickDecision) || undefined,
              note: (item.note as string) || ''
            };
          }
          return result;
        });

        setReviewData((prev) => {
          if (Object.keys(prev).length > 0) return prev;
          const result: Record<string, ReviewData> = {};
          for (const [itemId, item] of Object.entries(data.items!)) {
            const status = item.reviewStatus as ReviewData['status'] | undefined;
            if (status && status !== 'None') {
              result[itemId] = {
                status,
                comment: (item.reviewComment as string) || '',
                docName: (item.reviewDocName as string) || '',
                page: (item.reviewPage as string) || ''
              };
            }
          }
          return result;
        });
      } catch (error) {
        if (alive) setFirestoreLoaded(true);
        console.warn('[Firestore] 점검 데이터 로드 실패:', error);
      }
    };
    void load();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTestNumber, firestoreLoaded]);

  // 시험 전환 감지 — 다른 시험 선택 시 Firestore에서 새 데이터 로드
  const prevTestRef = useRef(currentTestNumber);
  useEffect(() => {
    if (prevTestRef.current === currentTestNumber) return;
    prevTestRef.current = currentTestNumber;
    if (!currentTestNumber) {
      setReviewData({});
      setQuickReviewById({});
      setSelectedReqId(null);
      return;
    }
    // 시험 전환 시 기존 데이터 클리어 후 Firestore 로드
    setReviewData({});
    setQuickReviewById({});
    setSelectedReqId(null);
    setFirestoreLoaded(false);
  }, [currentTestNumber]);

  // localStorage 캐시 저장 (testNumber 포함)
  useEffect(() => {
    if (!currentTestNumber) return;
    const payload = JSON.stringify({
      profile, reviewData, selectedReqId, quickReviewById,
      testSetup, currentUserId, testNumber: currentTestNumber
    });
    localStorage.setItem(storageKey, payload);
  }, [profile, reviewData, selectedReqId, quickReviewById, testSetup, currentUserId, currentTestNumber]);

  const mergedRequirements = useMemo(
    () => mergeDocLinks(mergeOverrides(REQUIREMENTS_DB, contentOverrides), docMaterials),
    [contentOverrides, docMaterials],
  );
  const checklist = useMemo(() => generateChecklist(profile, mergedRequirements), [profile, mergedRequirements]);
  const currentProject = useMemo(
    () => projects.find((project) => project.testNumber === currentTestNumber || project.id === currentTestNumber),
    [projects, currentTestNumber]
  );
  const isFinalized = useMemo(
    () => Boolean(currentProject?.executionState?.finalizedAt) || currentProject?.status === '완료',
    [currentProject]
  );
  const { itemGates, executionState } = useMemo(
    () => computeExecutionGate({ checklist, reviewData, defects, finalized: isFinalized }),
    [checklist, reviewData, defects, isFinalized]
  );

  useEffect(() => {
    if (!db || !currentTestNumber) return;
    void setDoc(
      doc(db, 'projects', currentTestNumber),
      { executionState: { ...executionState, updatedAt: serverTimestamp() } },
      { merge: true }
    );
  }, [currentTestNumber, executionState]);

  const quickModeItems = useMemo(() => checklist.map(toQuickModeItem), [checklist]);
  const quickModeById = useMemo(() => {
    return quickModeItems.reduce<Record<string, QuickModeItem>>((acc, item) => {
      acc[item.requirementId] = item;
      return acc;
    }, {});
  }, [quickModeItems]);

  /** 해당 항목의 모든 체크포인트 응답 + 검토 판정까지 완료되었는지 */
  const isItemCompleted = useCallback((itemId: string) => {
    const review = reviewData[itemId];
    if (!review || review.status === 'None') return false;
    const item = quickModeById[itemId];
    const entry = quickReviewById[itemId];
    if (!item || !entry) return false;
    const answered = entry.answeredQuestions || {};
    const itemSkipped = computeSkippedIndices(
      item.quickQuestions, entry.answers || {}, item.branchingRules
    );
    return item.quickQuestions.every((q, idx) =>
      itemSkipped.has(idx) || Boolean(answered[q.id])
    );
  }, [reviewData, quickModeById, quickReviewById]);

  /** 체크리스트에서 첫 번째 미완료 항목 ID (enabled 상태만) */
  const findFirstIncompleteId = useCallback(() => {
    return checklist.find((item) => {
      const gate = itemGates[item.id];
      if (gate && gate.state !== 'enabled') return false;
      return !isItemCompleted(item.id);
    })?.id ?? null;
  }, [checklist, itemGates, isItemCompleted]);

  // 첫 로드 시, 저장된 항목이 완료 상태면 다음 미완료 항목으로 자동 이동 (1회만)
  const didAutoAdvance = useRef(false);
  useEffect(() => {
    if (didAutoAdvance.current || checklist.length === 0) return;
    didAutoAdvance.current = true;
    const current = selectedReqId;
    // 저장된 항목이 없거나 이미 완료된 경우만 자동 이동
    if (!current || isItemCompleted(current)) {
      const next = findFirstIncompleteId();
      if (next) setSelectedReqId(next);
    }
  }, [checklist.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedSelectedReqId = useMemo(() => {
    const selectedExists = selectedReqId && checklist.some((item) => item.id === selectedReqId);
    const fallbackId = checklist[0]?.id ?? null;
    const candidate = selectedExists ? selectedReqId : fallbackId;
    if (!candidate) return null;
    const gate = itemGates[candidate];
    if (!gate || gate.state === 'enabled') return candidate;
    const firstEnabled = checklist.find((item) => itemGates[item.id]?.state === 'enabled');
    return firstEnabled?.id ?? candidate;
  }, [checklist, itemGates, selectedReqId]);

  const activeItem = useMemo(
    () => checklist.find((item) => item.id === resolvedSelectedReqId) || checklist[0],
    [checklist, resolvedSelectedReqId]
  );
  const activeIndex = useMemo(() => {
    if (!activeItem) return -1;
    return checklist.findIndex((item) => item.id === activeItem.id);
  }, [checklist, activeItem]);

  const quickModeItem = activeItem ? quickModeById[activeItem.id] : undefined;
  const quickReview = quickModeItem ? quickReviewById[quickModeItem.requirementId] : undefined;
  const quickAnswers = quickReview?.answers || {};
  const quickInputValues: QuickInputValues = quickReview?.inputValues || {};

  // 분기 규칙
  const skippedIndices = useMemo(() => {
    if (!quickModeItem) return new Set<number>();
    return computeSkippedIndices(quickModeItem.quickQuestions, quickAnswers, quickModeItem.branchingRules);
  }, [quickModeItem, quickAnswers]);
  const hasBranching = Boolean(quickModeItem?.branchingRules?.length);

  const recommendation: QuickDecision = quickModeItem
    ? getRecommendation(quickModeItem.quickQuestions, quickAnswers, skippedIndices.size > 0 ? skippedIndices : undefined)
    : 'HOLD';

  // 키보드 단축키: 현재 활성 질문 인덱스
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  // 항목 변경 시 질문 인덱스 리셋
  const prevActiveItemId = useRef(resolvedSelectedReqId);
  useEffect(() => {
    if (prevActiveItemId.current !== resolvedSelectedReqId) {
      prevActiveItemId.current = resolvedSelectedReqId;
      setActiveQuestionIdx(0);
    }
  }, [resolvedSelectedReqId]);

  const isItemReadyForReview = (itemId: string) => {
    const gate = itemGates[itemId];
    if (gate && gate.state !== 'enabled') return false;
    const item = quickModeById[itemId];
    const entry = quickReviewById[itemId];
    if (!item || !entry) return false;
    const answered = entry.answeredQuestions || {};
    const itemSkipped = computeSkippedIndices(
      item.quickQuestions, entry.answers || {}, item.branchingRules
    );
    return item.quickQuestions.every((q, idx) =>
      itemSkipped.has(idx) || Boolean(answered[q.id])
    );
  };
  const canReview = activeItem ? isItemReadyForReview(activeItem.id) : false;

  const saveQuickReviewItem = useCallback(async (
    itemId: string,
    qrEntry?: QuickReviewAnswer,
    rdEntry?: ReviewData
  ) => {
    if (!db || !currentTestNumber) return;
    const entry = qrEntry || quickReviewById[itemId];
    if (!entry) return;
    const review = rdEntry || reviewData[itemId];
    try {
      await setDoc(
        doc(db, 'quickReviews', currentTestNumber),
        {
          testNumber: currentTestNumber,
          items: {
            [itemId]: {
              requirementId: itemId,
              answers: entry.answers || {},
              inputValues: entry.inputValues || {},
              answeredQuestions: entry.answeredQuestions || {},
              autoRecommendation: entry.autoRecommendation || 'HOLD',
              finalDecision: entry.finalDecision || null,
              note: entry.note || '',
              reviewStatus: review?.status || 'None',
              reviewComment: review?.comment || '',
              reviewDocName: review?.docName || '',
              reviewPage: review?.page || '',
              updatedAt: serverTimestamp()
            }
          }
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('[Firestore] 질문 저장 실패:', error);
    }
  }, [currentTestNumber, quickReviewById, reviewData]);

  const statusToDecision: Record<ReviewData['status'], QuickDecision> = {
    Verified: 'PASS',
    Cannot_Verify: 'FAIL',
    Hold: 'HOLD',
    None: 'HOLD'
  };

  const updateReviewData = (id: string, field: keyof ReviewData, value: ReviewData[keyof ReviewData]) => {
    if (itemGates[id]?.state !== 'enabled') return;
    if (field === 'status' && value !== 'None' && !isItemReadyForReview(id)) {
      return;
    }

    const baseReview = reviewData[id] || { docName: '', page: '', status: 'None' as const, comment: '' };
    const updatedReview: ReviewData = { ...baseReview, [field]: value };

    setReviewData((prev) => ({ ...prev, [id]: updatedReview }));

    if (field === 'status') {
      let savedQr: QuickReviewAnswer | undefined;
      setQuickReviewById((prev) => {
        const existing = prev[id] || {
          requirementId: id,
          answers: {},
          autoRecommendation: recommendation
        };
        const statusVal = value as ReviewData['status'];
        const updatedQr: QuickReviewAnswer = {
          ...existing,
          finalDecision: statusVal === 'None' ? undefined : statusToDecision[statusVal],
          ...(statusVal === 'None' ? { answers: {}, answeredQuestions: {}, autoRecommendation: 'HOLD' as const } : {})
        };
        savedQr = updatedQr;
        return { ...prev, [id]: updatedQr };
      });
      if (value !== 'None') {
        void saveQuickReviewItem(id, savedQr!, updatedReview);
        // 검토 판정 완료 후 다음 미완료 항목으로 자동 이동
        requestAnimationFrame(() => {
          const nextIncomplete = findFirstIncompleteId();
          if (nextIncomplete && nextIncomplete !== id) {
            setSelectedReqId(nextIncomplete);
          }
        });
      }
    } else if (field === 'comment') {
      const updatedQr: QuickReviewAnswer = {
        ...(quickReviewById[id] || {
          requirementId: id,
          answers: {},
          autoRecommendation: recommendation
        }),
        note: value as string
      };
      setQuickReviewById((prev) => ({ ...prev, [id]: updatedQr }));
      void saveQuickReviewItem(id, updatedQr, updatedReview);
    } else {
      // docName, page 변경 시에도 Firestore 저장
      void saveQuickReviewItem(id, undefined, updatedReview);
    }
  };

  const updateQuickAnswer = (itemId: string, questionId: string, value: QuickAnswer) => {
    if (itemGates[itemId]?.state !== 'enabled') return;
    const item = quickModeById[itemId];
    if (!item) return;

    // 이미 판정된 항목의 답변이 변경되면 판정 초기화
    const currentStatus = reviewData[itemId]?.status;
    if (currentStatus && currentStatus !== 'None') {
      setReviewData((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], status: 'None' as const }
      }));
    }

    setQuickReviewById((prev) => {
      const existing = prev[itemId] || {
        requirementId: itemId,
        answers: {},
        autoRecommendation: 'HOLD' as QuickDecision
      };
      const nextAnswers = { ...existing.answers, [questionId]: value };
      const nextAnswered = { ...(existing.answeredQuestions || {}), [questionId]: true };
      const itemSkipped = computeSkippedIndices(item.quickQuestions, nextAnswers, item.branchingRules);
      const autoRecommendation = getRecommendation(
        item.quickQuestions, nextAnswers,
        itemSkipped.size > 0 ? itemSkipped : undefined
      );
      return {
        ...prev,
        [itemId]: {
          ...existing,
          answers: nextAnswers,
          answeredQuestions: nextAnswered,
          autoRecommendation,
          ...(currentStatus && currentStatus !== 'None' ? { finalDecision: undefined } : {})
        }
      };
    });
  };

  const updateQuickInput = (itemId: string, fieldId: string, value: QuickInputValue) => {
    if (itemGates[itemId]?.state !== 'enabled') return;
    setQuickReviewById((prev) => {
      const existing = prev[itemId] || {
        requirementId: itemId,
        answers: {},
        autoRecommendation: 'HOLD' as QuickDecision
      };
      return {
        ...prev,
        [itemId]: {
          ...existing,
          inputValues: {
            ...(existing.inputValues || {}),
            [fieldId]: value
          }
        }
      };
    });
  };

  // 키보드 단축키: 현재 질문 답변
  const answerCurrentQuestion = useCallback((value: QuickAnswer) => {
    if (!quickModeItem || !activeItem) return;
    if (itemGates[activeItem.id]?.state !== 'enabled') return;
    const questions = quickModeItem.quickQuestions;
    const q = questions[activeQuestionIdx];
    if (!q) return;

    updateQuickAnswer(activeItem.id, q.id, value);

    if (value === 'NO' || value === 'NA') {
      if (hasBranching) {
        // 분기 모드: 규칙에 해당하는 질문만 NA 처리
        const newAnswers = { ...quickAnswers, [q.id]: value };
        const newSkipped = computeSkippedIndices(questions, newAnswers, quickModeItem.branchingRules);
        for (const skipIdx of newSkipped) {
          if (skipIdx > activeQuestionIdx) {
            updateQuickAnswer(activeItem.id, questions[skipIdx].id, 'NA');
          }
        }
        // 다음 활성 질문으로 이동
        const nextIdx = findNextActiveIndex(activeQuestionIdx, questions.length, newSkipped);
        if (nextIdx >= 0) setActiveQuestionIdx(nextIdx);
      } else {
        // 레거시: 후속 전체 NA
        for (let i = activeQuestionIdx + 1; i < questions.length; i++) {
          updateQuickAnswer(activeItem.id, questions[i].id, 'NA');
        }
      }
    } else if (value === 'YES') {
      if (hasBranching) {
        const nextIdx = findNextActiveIndex(activeQuestionIdx, questions.length, skippedIndices);
        if (nextIdx >= 0) setActiveQuestionIdx(nextIdx);
      } else {
        const nextIdx = activeQuestionIdx + 1;
        if (nextIdx < questions.length) {
          setActiveQuestionIdx(nextIdx);
        }
      }
    }
  }, [quickModeItem, activeItem, activeQuestionIdx, itemGates, updateQuickAnswer, quickAnswers, hasBranching, skippedIndices]);

  // 키보드 단축키: 같은 항목 내 체크포인트 간 이동
  const selectNextQuestion = useCallback(() => {
    if (!quickModeItem) return;
    const total = quickModeItem.quickQuestions.length;
    if (hasBranching) {
      const nextIdx = findNextActiveIndex(activeQuestionIdx, total, skippedIndices);
      if (nextIdx >= 0) setActiveQuestionIdx(nextIdx);
    } else {
      if (activeQuestionIdx < total - 1) {
        setActiveQuestionIdx(activeQuestionIdx + 1);
      }
    }
  }, [quickModeItem, activeQuestionIdx, hasBranching, skippedIndices]);

  const selectPrevQuestion = useCallback(() => {
    if (hasBranching) {
      const prevIdx = findPrevActiveIndex(activeQuestionIdx, skippedIndices);
      if (prevIdx >= 0) setActiveQuestionIdx(prevIdx);
    } else {
      if (activeQuestionIdx > 0) {
        setActiveQuestionIdx(activeQuestionIdx - 1);
      }
    }
  }, [activeQuestionIdx, hasBranching, skippedIndices]);

  // 키보드 단축키: 판정 확정 + 다음 이동
  const confirmAndMoveNext = useCallback(() => {
    if (!activeItem) return;
    const review = reviewData[activeItem.id];
    if (!review || review.status === 'None') return;
    // 판정 이미 설정됨 — 다음 미완료 항목으로 이동
    const next = findFirstIncompleteId();
    if (next && next !== activeItem.id) {
      setSelectedReqId(next);
    }
  }, [activeItem, reviewData, findFirstIncompleteId]);

  // 결함 모달
  const [showDefectModal, setShowDefectModal] = useState(false);
  const openDefectModal = useCallback(() => setShowDefectModal(true), []);

  // 모든 질문 답변 완료 여부 (키보드 모드 전환용)
  const isAllQuestionsAnswered = canReview;
  const hasVerdict = Boolean(activeItem && reviewData[activeItem.id]?.status && reviewData[activeItem.id]?.status !== 'None');

  const setVerdict = useCallback((status: ReviewData['status']) => {
    if (activeItem) updateReviewData(activeItem.id, 'status', status);
  }, [activeItem, updateReviewData]);

  // ESC 키: 판정/답변 역순 취소
  const undoLastAction = useCallback(() => {
    if (!activeItem || !quickModeItem) return;
    const itemId = activeItem.id;

    // 1) 검토 최종 판정이 있으면 → 판정 취소
    const currentStatus = reviewData[itemId]?.status;
    if (currentStatus && currentStatus !== 'None') {
      setVerdict('None');
      return;
    }

    // 2) 체크포인트 답변이 있으면 → 마지막 답변한 질문부터 역순 취소
    const questions = quickModeItem.quickQuestions;
    const answers = quickReviewById[itemId]?.answers || {};

    // 마지막으로 답변된 활성 질문 인덱스 찾기
    let targetIdx = -1;
    for (let i = activeQuestionIdx; i >= 0; i--) {
      if (hasBranching && skippedIndices.has(i)) continue;
      if (answers[questions[i].id] !== undefined) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === -1) {
      for (let i = questions.length - 1; i >= 0; i--) {
        if (hasBranching && skippedIndices.has(i)) continue;
        if (answers[questions[i].id] !== undefined) {
          targetIdx = i;
          break;
        }
      }
    }
    if (targetIdx === -1) return;

    setQuickReviewById((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const nextAnswers = { ...existing.answers };
      const nextAnswered = { ...(existing.answeredQuestions || {}) };

      if (hasBranching) {
        // 분기 모드: 해당 질문 + 해당 질문의 skip 대상만 제거
        delete nextAnswers[questions[targetIdx].id];
        delete nextAnswered[questions[targetIdx].id];
        // 이 질문이 트리거하던 skip 대상 질문들도 제거
        const branchingRules = quickModeItem.branchingRules || [];
        for (const rule of branchingRules) {
          if (rule.sourceIndex === targetIdx) {
            for (const skipIdx of rule.skipIndices) {
              if (skipIdx < questions.length) {
                delete nextAnswers[questions[skipIdx].id];
                delete nextAnswered[questions[skipIdx].id];
              }
            }
          }
        }
      } else {
        // 레거시: targetIdx부터 끝까지 모두 제거
        for (let i = targetIdx; i < questions.length; i++) {
          delete nextAnswers[questions[i].id];
          delete nextAnswered[questions[i].id];
        }
      }

      const itemSkipped = computeSkippedIndices(questions, nextAnswers, quickModeItem.branchingRules);
      const autoRecommendation = getRecommendation(
        questions, nextAnswers,
        itemSkipped.size > 0 ? itemSkipped : undefined
      );
      return {
        ...prev,
        [itemId]: { ...existing, answers: nextAnswers, answeredQuestions: nextAnswered, autoRecommendation }
      };
    });
    setActiveQuestionIdx(targetIdx);
  }, [activeItem, quickModeItem, reviewData, quickReviewById, activeQuestionIdx, setVerdict, hasBranching, skippedIndices]);

  // 전체 점검 데이터 초기화 (로컬 + Firestore)
  const handleResetAll = useCallback(() => {
    setReviewData({});
    setQuickReviewById({});
    setSelectedReqId(null);
    localStorage.removeItem(storageKey);
    if (db && currentTestNumber) {
      void deleteDoc(doc(db, 'quickReviews', currentTestNumber));
    }
  }, [currentTestNumber]);

  useRegisterExecutionToolbar(handleResetAll);

  const { showShortcutHelp, dismissHelp } = useKeyboardShortcuts({
    isAllQuestionsAnswered,
    hasVerdict,
    isFinalized,
    answerCurrentQuestion,
    setVerdict,
    undoLastAction,
    selectNextItem: selectNextQuestion,
    selectPrevItem: selectPrevQuestion,
    confirmAndMoveNext,
    openDefectModal
  });

  return (
    <ChecklistView
      checklist={checklist}
      reviewData={reviewData}
      quickReviewById={quickReviewById}
      quickModeById={quickModeById}
      selectedReqId={resolvedSelectedReqId}
      setSelectedReqId={(nextId) => {
        if (!nextId) return;
        if (itemGates[nextId]?.state !== 'enabled') return;
        setSelectedReqId(nextId);
      }}
      activeItem={activeItem}
      activeIndex={activeIndex}
      quickModeItem={quickModeItem}
      quickAnswers={quickAnswers}
      quickInputValues={quickInputValues}
      onQuickAnswer={updateQuickAnswer}
      onInputChange={updateQuickInput}
      itemGates={itemGates}
      isFinalized={isFinalized}
      updateReviewData={updateReviewData}
      recommendation={recommendation}
      canReview={canReview}
      activeQuestionIdx={activeQuestionIdx}
      onActiveQuestionChange={setActiveQuestionIdx}
      showShortcutHelp={showShortcutHelp}
      onDismissShortcutHelp={dismissHelp}
      showDefectModal={showDefectModal}
      onCloseDefectModal={() => setShowDefectModal(false)}
      currentTestNumber={currentTestNumber}
    />
  );
}
