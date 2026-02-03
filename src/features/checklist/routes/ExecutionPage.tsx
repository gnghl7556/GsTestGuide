import { useEffect, useMemo, useRef, useState } from 'react';
import { ChecklistView } from './ChecklistView';
import { generateChecklist } from '../../../utils/checklistGenerator';
import { toQuickModeItem, getRecommendation } from '../../../utils/quickMode';
import type {
  ChecklistItem,
  QuickAnswer,
  QuickDecision,
  QuickModeItem,
  QuickQuestionId,
  QuickReviewAnswer,
  ReviewData,
  UserProfile
} from '../../../types';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { isDocEntry } from '../../../utils/testSetup';
import type { AgreementParsed, TestSetupState } from '../../../types';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const storageKey = 'gs-test-guide:review';

type QuickInputValues = NonNullable<QuickReviewAnswer['inputValues']>;

type QuickInputValue = QuickInputValues[string];

export function ExecutionPage() {
  const {
    testSetup,
    setTestSetup,
    currentUserId,
    setCurrentUserId,
    currentTestNumber
  } = useTestSetupContext();
  const didLoadRef = useRef(false);

  const [profile, setProfile] = useState<UserProfile>({
    productType: 'SaMD',
    hasAI: false,
    hasPatientData: false,
    hasUI: true
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<Record<string, ReviewData>>({});
  const [quickReviewById, setQuickReviewById] = useState<Record<string, QuickReviewAnswer>>({});

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        profile?: UserProfile;
        reviewData?: Record<string, ReviewData>;
        selectedReqId?: string | null;
        quickReviewById?: Record<string, QuickReviewAnswer>;
        testSetup?: TestSetupState;
        currentUserId?: string;
      };
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.reviewData) setReviewData(parsed.reviewData);
      if (parsed.selectedReqId) setSelectedReqId(parsed.selectedReqId);
      if (parsed.quickReviewById) setQuickReviewById(parsed.quickReviewById);
      if (typeof parsed.currentUserId === 'string') setCurrentUserId(parsed.currentUserId);
      if (parsed.testSetup) {
        setTestSetup(parsed.testSetup);
      } else {
        const legacyInputs = parsed.quickReviewById?.['PRE-01']?.inputValues as Record<string, unknown> | undefined;
        if (legacyInputs) {
          setTestSetup({
            testNumber: typeof legacyInputs.pre01TestNumber === 'string' ? legacyInputs.pre01TestNumber : '',
            plId: typeof legacyInputs.pre01PlId === 'string' ? legacyInputs.pre01PlId : '',
            plName: '',
            plPhone: '',
            plEmail: '',
            testerName: '',
            testerPhone: '',
            testerEmail: '',
            companyContactName: '',
            companyContactPhone: '',
            companyContactEmail: '',
            companyName: '',
            scheduleWorkingDays: '',
            scheduleStartDate: '',
            scheduleDefect1: '',
            scheduleDefect2: '',
            schedulePatchDate: '',
            scheduleEndDate: '',
            projectName: '',
            docs: Array.isArray(legacyInputs.pre01Docs) ? legacyInputs.pre01Docs.filter(isDocEntry) : [],
            agreementParsed:
              legacyInputs.pre01AgreementParsed && typeof legacyInputs.pre01AgreementParsed === 'object'
                ? (legacyInputs.pre01AgreementParsed as AgreementParsed)
                : undefined
          });
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [setCurrentUserId, setQuickReviewById, setReviewData, setSelectedReqId, setTestSetup]);

  useEffect(() => {
    const payload = JSON.stringify({ profile, reviewData, selectedReqId, quickReviewById, testSetup, currentUserId });
    localStorage.setItem(storageKey, payload);
  }, [profile, reviewData, selectedReqId, quickReviewById, testSetup, currentUserId]);

  const generatedChecklist = useMemo(() => generateChecklist(profile), [profile]);

  useEffect(() => {
    setChecklist(generatedChecklist);
    if (generatedChecklist.length > 0) {
      const exists = generatedChecklist.find((item) => item.id === selectedReqId);
      if (!selectedReqId || !exists) {
        setSelectedReqId(generatedChecklist[0].id);
      }
    }
  }, [generatedChecklist, selectedReqId]);

  const activeItem = useMemo(
    () => checklist.find((item) => item.id === selectedReqId) || checklist[0],
    [checklist, selectedReqId]
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
  const recommendation: QuickDecision = quickModeItem
    ? getRecommendation(quickModeItem.quickQuestions, quickAnswers)
    : 'HOLD';

  const isItemReadyForReview = (itemId: string) => {
    const item = quickModeById[itemId];
    const entry = quickReviewById[itemId];
    if (!item || !entry) return false;
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
      const autoRecommendation = getRecommendation(item.quickQuestions, nextAnswers);
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

  const scrollToQuestion = (itemId: string, questionId: QuickQuestionId) => {
    setSelectedReqId(itemId);
    const targetId = `question-${itemId}-${questionId}`;
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    });
  };

  return (
    <ChecklistView
      checklist={checklist}
      reviewData={reviewData}
      quickReviewById={quickReviewById}
      selectedReqId={selectedReqId}
      setSelectedReqId={setSelectedReqId}
      activeItem={activeItem}
      activeIndex={activeIndex}
      quickModeItem={quickModeItem}
      quickAnswers={quickAnswers}
      quickInputValues={quickInputValues}
      onQuickAnswer={updateQuickAnswer}
      onInputChange={updateQuickInput}
      onSelectQuestion={scrollToQuestion}
      onOpenFeatureManager={() => undefined}
      onOpenTestCaseManager={() => undefined}
      updateReviewData={updateReviewData}
      recommendation={recommendation}
      canReview={canReview}
    />
  );
}
