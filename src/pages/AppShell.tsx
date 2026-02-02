import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { generateChecklist } from '../utils/checklistGenerator';
import {
  toQuickModeItem,
  getRecommendation
} from '../utils/quickMode';
import type {
  ChecklistItem,
  QuickAnswer,
  QuickDecision,
  QuickModeItem,
  QuickQuestionId,
  QuickReviewAnswer,
  ReviewData,
  UserProfile
} from '../types';

import { CompactDashboardHeader } from '../components/CompactDashboardHeader';
import { FeatureListModal } from '../components/FeatureListModal';
import { TestCaseModal } from '../components/TestCaseModal';
import { ExportModal } from '../components/ExportModal';
import { PlDirectoryView } from './PlDirectoryView';
import { TestSetupView } from './TestSetupView';
import { ChecklistView } from './ChecklistView';
import { auth, db, storage } from '../firebase/config';
import { useAuthReady } from '../hooks/useAuthReady';
import { usePlDirectory } from '../hooks/usePlDirectory';
import { useUsers } from '../hooks/useUsers';
import { useProjects } from '../hooks/useProjects';
import { useProgressByTestNumber } from '../hooks/useProgressByTestNumber';
import { TestSetupProvider } from '../context/TestSetupProvider';
import { useTestSetupContext } from '../context/useTestSetupContext';
import { isDocEntry } from '../utils/testSetup';
import type { AgreementParsed, TestSetupState } from '../types/testSetup';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

const storageKey = 'gs-test-guide:review';

type AppContentProps = {
  profile: UserProfile;
  setProfile: Dispatch<SetStateAction<UserProfile>>;
  checklist: ChecklistItem[];
  setChecklist: Dispatch<SetStateAction<ChecklistItem[]>>;
  selectedReqId: string | null;
  setSelectedReqId: Dispatch<SetStateAction<string | null>>;
  reviewData: Record<string, ReviewData>;
  setReviewData: Dispatch<SetStateAction<Record<string, ReviewData>>>;
  quickReviewById: Record<string, QuickReviewAnswer>;
  setQuickReviewById: Dispatch<SetStateAction<Record<string, QuickReviewAnswer>>>;
  view: 'test-setup' | 'checklist' | 'pl-directory';
  setView: Dispatch<SetStateAction<'test-setup' | 'checklist' | 'pl-directory'>>;
  featureModalOpen: boolean;
  setFeatureModalOpen: Dispatch<SetStateAction<boolean>>;
  testCaseModalOpen: boolean;
  setTestCaseModalOpen: Dispatch<SetStateAction<boolean>>;
  exportModalOpen: boolean;
  setExportModalOpen: Dispatch<SetStateAction<boolean>>;
  authReady: boolean;
};

type QuickInputValues = NonNullable<QuickReviewAnswer['inputValues']>;
type QuickInputValue = QuickInputValues[string];

function AppContent({
  profile,
  setProfile,
  checklist,
  setChecklist,
  selectedReqId,
  setSelectedReqId,
  reviewData,
  setReviewData,
  quickReviewById,
  setQuickReviewById,
  view,
  setView,
  featureModalOpen,
  setFeatureModalOpen,
  testCaseModalOpen,
  setTestCaseModalOpen,
  exportModalOpen,
  setExportModalOpen,
  authReady
}: AppContentProps) {
  const {
    testSetup,
    setTestSetup,
    currentUserId,
    setCurrentUserId,
    currentTestNumber,
    startProject
  } = useTestSetupContext();
  const didLoadRef = useRef(false);

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
  }, [setCurrentUserId, setProfile, setQuickReviewById, setReviewData, setSelectedReqId, setTestSetup]);

  useEffect(() => {
    const payload = JSON.stringify({ profile, reviewData, selectedReqId, quickReviewById, testSetup, currentUserId });
    localStorage.setItem(storageKey, payload);
  }, [profile, reviewData, selectedReqId, quickReviewById, testSetup, currentUserId]);

  useEffect(() => {
    if (!currentTestNumber && view === 'checklist') {
      setView('test-setup');
    }
  }, [currentTestNumber, setView, view]);

  const generatedChecklist = useMemo(() => generateChecklist(profile), [profile]);

  useEffect(() => {
    setChecklist(generatedChecklist);
    if (generatedChecklist.length > 0) {
      const exists = generatedChecklist.find((item) => item.id === selectedReqId);
      if (!selectedReqId || !exists) {
        setSelectedReqId(generatedChecklist[0].id);
      }
    }
  }, [generatedChecklist, selectedReqId, setChecklist, setSelectedReqId]);

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
    if (!db || !authReady || !currentTestNumber) return;
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

  const openFeatureManager = () => {
    if (!currentTestNumber) {
      window.alert('시험번호를 먼저 선택해주세요.');
      return;
    }
    setFeatureModalOpen(true);
  };

  const openTestCaseManager = () => {
    if (!currentTestNumber) {
      window.alert('시험번호를 먼저 선택해주세요.');
      return;
    }
    setTestCaseModalOpen(true);
  };

  const openExportModal = () => {
    if (!currentTestNumber) {
      window.alert('시험번호를 먼저 선택해주세요.');
      return;
    }
    setExportModalOpen(true);
  };

  const handleStartProject = async (): Promise<{ ok: boolean; reason?: string }> => {
    const result = await startProject();
    if (!result.ok) {
      console.warn('[Project] 시작 실패:', result.reason);
      return result;
    }
    setView('checklist');
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return result;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 font-sans text-gray-800 flex flex-col h-screen overflow-hidden">
      <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col">
        {view !== 'test-setup' && (
          <CompactDashboardHeader
            data={{
              testId: testSetup.testNumber,
              plName: testSetup.plName,
              plPhone: testSetup.plPhone,
              plEmail: testSetup.plEmail,
              companyUser: testSetup.companyContactName,
              companyName: testSetup.companyName,
              companyPhone: testSetup.companyContactPhone,
              companyEmail: testSetup.companyContactEmail,
              startDate: testSetup.scheduleStartDate,
              endDate: testSetup.scheduleEndDate
            }}
            onManagePl={() => setView('pl-directory')}
            onReturnToSetup={() => setView('test-setup')}
            onOpenExport={openExportModal}
          />
        )}

        {view === 'pl-directory' ? (
          <PlDirectoryView />
        ) : view === 'test-setup' ? (
          <TestSetupView onStartProject={handleStartProject} />
        ) : (
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
            onOpenFeatureManager={openFeatureManager}
            onOpenTestCaseManager={openTestCaseManager}
            updateReviewData={updateReviewData}
            recommendation={recommendation}
            canReview={canReview}
          />
        )}
        <FeatureListModal
          open={featureModalOpen}
          projectId={currentTestNumber}
          onClose={() => setFeatureModalOpen(false)}
        />
        <TestCaseModal
          open={testCaseModalOpen}
          projectId={currentTestNumber}
          onClose={() => setTestCaseModalOpen(false)}
        />
        <ExportModal
          open={exportModalOpen}
          projectId={currentTestNumber}
          onClose={() => setExportModalOpen(false)}
        />
      </div>
    </div>
  );
}

export function AppShell() {
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
  const [view, setView] = useState<'test-setup' | 'checklist' | 'pl-directory'>('test-setup');
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [testCaseModalOpen, setTestCaseModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const authReady = useAuthReady(auth);
  const plDirectory = usePlDirectory(db, authReady);
  const users = useUsers(db, authReady);
  const projects = useProjects(db, authReady);
  const progressByTestNumber = useProgressByTestNumber(db, authReady, projects, checklist);

  return (
    <TestSetupProvider
      db={db}
      storage={storage}
      authReady={authReady}
      projects={projects}
      plDirectory={plDirectory}
      users={users}
      progressByTestNumber={progressByTestNumber}
    >
      <AppContent
        profile={profile}
        setProfile={setProfile}
        checklist={checklist}
        setChecklist={setChecklist}
        selectedReqId={selectedReqId}
        setSelectedReqId={setSelectedReqId}
        reviewData={reviewData}
        setReviewData={setReviewData}
        quickReviewById={quickReviewById}
        setQuickReviewById={setQuickReviewById}
        view={view}
        setView={setView}
        featureModalOpen={featureModalOpen}
        setFeatureModalOpen={setFeatureModalOpen}
        testCaseModalOpen={testCaseModalOpen}
        setTestCaseModalOpen={setTestCaseModalOpen}
        exportModalOpen={exportModalOpen}
        setExportModalOpen={setExportModalOpen}
        authReady={authReady}
      />
    </TestSetupProvider>
  );
}
