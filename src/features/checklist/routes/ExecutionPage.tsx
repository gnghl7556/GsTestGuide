import { useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ChecklistView } from './ChecklistView';
import { generateChecklist } from '../../../utils/checklistGenerator';
import { toQuickModeItem, getRecommendation } from '../../../utils/quickMode';
import { useDefects } from '../../report/hooks/useDefects';
import { computeExecutionGate } from '../utils/executionGate';
import type {
  QuickAnswer,
  QuickDecision,
  QuickModeItem,
  QuickQuestionId,
  QuickReviewAnswer,
  ReviewData,
  UserProfile
} from '../../../types';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { db } from '../../../lib/firebase';

const storageKey = 'gs-test-guide:review';

type QuickInputValues = NonNullable<QuickReviewAnswer['inputValues']>;
type QuickInputValue = QuickInputValues[string];

type StoredReviewPayload = {
  profile?: UserProfile;
  reviewData?: Record<string, ReviewData>;
  selectedReqId?: string | null;
  quickReviewById?: Record<string, QuickReviewAnswer>;
};

const readStoredReview = (): StoredReviewPayload => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  if (window.sessionStorage?.getItem('gs-test-guide:skip-restore') === '1') {
    window.sessionStorage.removeItem('gs-test-guide:skip-restore');
    return {};
  }
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredReviewPayload;
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
  const stored = useMemo(() => readStoredReview(), []);

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
  const { defects } = useDefects(currentTestNumber || null);

  useEffect(() => {
    const payload = JSON.stringify({ profile, reviewData, selectedReqId, quickReviewById, testSetup, currentUserId });
    localStorage.setItem(storageKey, payload);
  }, [profile, reviewData, selectedReqId, quickReviewById, testSetup, currentUserId]);

  const checklist = useMemo(() => generateChecklist(profile), [profile]);
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

  const quickModeItems = useMemo(() => checklist.map(toQuickModeItem), [checklist]);
  const quickModeById = useMemo(() => {
    return quickModeItems.reduce<Record<string, QuickModeItem>>((acc, item) => {
      acc[item.requirementId] = item;
      return acc;
    }, {});
  }, [quickModeItems]);

  const quickModeItem = activeItem ? quickModeById[activeItem.id] : undefined;
  const quickReview = quickModeItem ? quickReviewById[quickModeItem.requirementId] : undefined;
  const quickAnswers = quickReview?.answers || { Q1: 'NA', Q2: 'NA', Q3: 'NA' };
  const quickInputValues: QuickInputValues = quickReview?.inputValues || {};
  let recommendation: QuickDecision = quickModeItem
    ? getRecommendation(quickModeItem.quickQuestions, quickAnswers)
    : 'HOLD';
  if (activeItem?.id === 'ENV-01') {
    if (quickAnswers.Q1 === 'YES' || quickAnswers.Q2 === 'YES') {
      recommendation = 'PASS';
    } else if (quickAnswers.Q1 === 'NO' && quickAnswers.Q2 === 'NO') {
      recommendation = 'HOLD';
    }
  }

  const isItemReadyForReview = (itemId: string) => {
    const gate = itemGates[itemId];
    if (gate && gate.state !== 'enabled') return false;
    const item = quickModeById[itemId];
    const entry = quickReviewById[itemId];
    if (!item || !entry) return false;
    if (itemId === 'ENV-01') {
      const q1 = entry.answers?.Q1 ?? 'NA';
      const q2 = entry.answers?.Q2 ?? 'NA';
      if (q1 === 'YES') return true;
      if (q1 === 'NO') return q2 !== 'NA';
      return false;
    }
    const answered = entry.answeredQuestions || {};
    return item.quickQuestions.every((q) => Boolean(answered[q.id]));
  };
  const canReview = activeItem ? isItemReadyForReview(activeItem.id) : false;

  const saveQuickReviewItem = async (itemId: string) => {
    if (!db || !currentTestNumber) return;
    const entry = quickReviewById[itemId];
    if (!entry) return;
    try {
      await setDoc(
        doc(db, 'quickReviews', currentTestNumber),
        {
          testNumber: currentTestNumber,
          items: {
            [itemId]: {
              requirementId: itemId,
              answers: entry.answers,
              inputValues: entry.inputValues || {},
              updatedAt: serverTimestamp()
            }
          }
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('[Firestore] 질문 저장 실패:', error);
    }
  };

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
    setReviewData((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { docName: '', page: '', status: 'None', comment: '' }),
        [field]: value
      }
    }));

    if (field === 'status') {
      setQuickReviewById((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {
            requirementId: id,
            answers: { Q1: 'NA', Q2: 'NA', Q3: 'NA' },
            autoRecommendation: recommendation
          }),
          finalDecision: statusToDecision[value as ReviewData['status']]
        }
      }));
      if (value !== 'None') {
        void saveQuickReviewItem(id);
      }
    }

    if (field === 'comment') {
      setQuickReviewById((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {
            requirementId: id,
            answers: { Q1: 'NA', Q2: 'NA', Q3: 'NA' },
            autoRecommendation: recommendation
          }),
          note: value as string
        }
      }));
    }
  };

  const updateQuickAnswer = (itemId: string, questionId: QuickQuestionId, value: QuickAnswer) => {
    if (itemGates[itemId]?.state !== 'enabled') return;
    const item = quickModeById[itemId];
    if (!item) return;
    setQuickReviewById((prev) => {
      const existing = prev[itemId] || {
        requirementId: itemId,
        answers: { Q1: 'NA', Q2: 'NA', Q3: 'NA' },
        autoRecommendation: 'HOLD' as QuickDecision
      };
      const nextAnswers = { ...existing.answers, [questionId]: value };
      const nextAnswered = { ...(existing.answeredQuestions || {}), [questionId]: true };
      let autoRecommendation = getRecommendation(item.quickQuestions, nextAnswers);
      if (itemId === 'ENV-01') {
        const q1 = nextAnswers.Q1 ?? 'NA';
        const q2 = nextAnswers.Q2 ?? 'NA';
        if (q1 === 'YES') autoRecommendation = 'PASS';
        else if (q1 === 'NO' && q2 === 'YES') autoRecommendation = 'PASS';
        else if (q1 === 'NO' && q2 === 'NO') autoRecommendation = 'HOLD';
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          answers: nextAnswers,
          answeredQuestions: nextAnswered,
          autoRecommendation
        }
      };
    });
  };

  const updateQuickInput = (itemId: string, fieldId: string, value: QuickInputValue) => {
    if (itemGates[itemId]?.state !== 'enabled') return;
    setQuickReviewById((prev) => {
      const existing = prev[itemId] || {
        requirementId: itemId,
        answers: { Q1: 'NA', Q2: 'NA', Q3: 'NA' },
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

  return (
    <ChecklistView
      checklist={checklist}
      reviewData={reviewData}
      quickReviewById={quickReviewById}
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
    />
  );
}
