import { useEffect, useState } from 'react';
import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Firestore
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import type { PlContact } from '../../pl-directory/components/PlDirectoryPage';
import type { Project, TestSetupState, User } from '../../../types';
import { isDocEntry } from '../../../utils/testSetup';

export type UseTestSetupParams = {
  db: Firestore | null | undefined;
  storage: FirebaseStorage | null | undefined;
  authReady: boolean;
  projects: Project[];
  plDirectory: PlContact[];
  users: User[];
  initialTestSetup?: TestSetupState;
  initialCurrentUserId?: string;
};

const createEmptyTestSetup = (): TestSetupState => ({
  testNumber: '',
  plId: '',
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
  docs: [],
  agreementParsed: undefined
});

export function useTestSetupState({
  db,
  storage,
  authReady,
  projects,
  plDirectory,
  users,
  initialTestSetup,
  initialCurrentUserId
}: UseTestSetupParams) {
  const [testSetup, setTestSetup] = useState<TestSetupState>(initialTestSetup || createEmptyTestSetup());
  const [currentUserId, setCurrentUserIdState] = useState(initialCurrentUserId || '');
  const [pendingAgreementFile, setPendingAgreementFile] = useState<File | null>(null);
  const [agreementModalEnabled, setAgreementModalEnabled] = useState(false);
  const [agreementParsing, setAgreementParsing] = useState(false);
  const [agreementParsingTestNumber, setAgreementParsingTestNumber] = useState<string | null>(null);

  const currentTestNumber = testSetup.testNumber.trim();
  const currentPlId = testSetup.plId;
  const currentTester = users.find((item) => item.id === currentUserId);
  const resolvedTesterName = currentTester?.name || testSetup.testerName;
  const resolvedTesterPhone = currentTester?.phone || testSetup.testerPhone;
  const resolvedTesterEmail = currentTester?.email || testSetup.testerEmail;
  const currentTesterName = resolvedTesterName.trim();

  const setCurrentUserId = (nextUserId: string) => {
    setCurrentUserIdState(nextUserId);
    if (!nextUserId) return;
    const user = users.find((item) => item.id === nextUserId);
    if (!user) return;
    setTestSetup((prev) => ({
      ...prev,
      testerName: user.name || prev.testerName,
      testerPhone: user.phone || prev.testerPhone,
      testerEmail: user.email || prev.testerEmail
    }));
  };

  useEffect(() => {
    if (!db || !authReady || !currentTestNumber) return;
    const dbRef = db;
    const docRef = doc(dbRef, 'testDocuments', currentTestNumber);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as {
        docs?: { docType: string; fileName?: string; label?: string; url?: string }[];
      };
      const docs = data.docs || [];
      setTestSetup((prev) => ({
        ...prev,
        docs: docs.filter(isDocEntry)
      }));
    });
    return () => unsubscribe();
  }, [authReady, currentTestNumber, db]);

  useEffect(() => {
    if (!db || !authReady || !currentTestNumber) return;
    const dbRef = db;
    const docRef = doc(dbRef, 'agreementDocs', currentTestNumber);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as {
        parseStatus?: 'pending' | 'parsed' | 'failed';
        parseProgress?: number;
        parsed?: {
          applicationNumber?: string;
          contractType?: string;
          certificationType?: string;
          productNameKo?: string;
          companyName?: string;
          managerName?: string;
          managerMobile?: string;
          managerEmail?: string;
          managerDepartment?: string;
          managerJobTitle?: string;
          담당자?: string;
          연락처?: string;
          이메일?: string;
        };
      };
      const parsed = data.parsed || {};
      const normalizedParsed = {
        ...parsed,
        managerName: parsed.managerName ?? parsed.담당자,
        managerMobile: parsed.managerMobile ?? parsed.연락처,
        managerEmail: parsed.managerEmail ?? parsed.이메일
      };
      setTestSetup((prev) => {
        const nextAgreementParsed = {
          parseStatus: data.parseStatus,
          parseProgress: data.parseProgress,
          ...normalizedParsed
        };
        let changed = false;
        const next = { ...prev, agreementParsed: nextAgreementParsed };
        if ((nextAgreementParsed as { managerName?: string }).managerName && !prev.companyContactName) {
          next.companyContactName = (nextAgreementParsed as { managerName?: string }).managerName || '';
          changed = true;
        }
        if ((nextAgreementParsed as { managerMobile?: string }).managerMobile && !prev.companyContactPhone) {
          next.companyContactPhone = (nextAgreementParsed as { managerMobile?: string }).managerMobile || '';
          changed = true;
        }
        if ((nextAgreementParsed as { managerEmail?: string }).managerEmail && !prev.companyContactEmail) {
          next.companyContactEmail = (nextAgreementParsed as { managerEmail?: string }).managerEmail || '';
          changed = true;
        }
        if ((nextAgreementParsed as { productNameKo?: string }).productNameKo && !prev.projectName) {
          next.projectName = (nextAgreementParsed as { productNameKo?: string }).productNameKo || '';
          changed = true;
        }
        if ((nextAgreementParsed as { companyName?: string }).companyName && !prev.companyName) {
          next.companyName = (nextAgreementParsed as { companyName?: string }).companyName || '';
          changed = true;
        }
        if ((nextAgreementParsed as { workingDays?: string }).workingDays && !prev.scheduleWorkingDays) {
          next.scheduleWorkingDays = (nextAgreementParsed as { workingDays?: string }).workingDays || '';
          changed = true;
        }
        return changed ? next : { ...prev, agreementParsed: nextAgreementParsed };
      });

      if (data.parseStatus === 'parsed' || data.parseStatus === 'failed') {
        setAgreementParsing(false);
        setAgreementParsingTestNumber(null);
      }
    });
    return () => unsubscribe();
  }, [authReady, currentTestNumber, db]);

  const updatePlId = (value: string) => {
    const matched = plDirectory.find((pl) => pl.id === value);
    setTestSetup((prev) => ({
      ...prev,
      plId: value,
      plName: matched?.name || prev.plName,
      plPhone: matched?.phone || prev.plPhone,
      plEmail: matched?.email || prev.plEmail
    }));
  };

  const updateScheduleStartDate = (value: string) => {
    setTestSetup((prev) => ({
      ...prev,
      scheduleStartDate: value
    }));
  };

  const updateScheduleEndDate = (value: string) => {
    setTestSetup((prev) => ({
      ...prev,
      scheduleEndDate: value
    }));
  };

  const updateManualInfo = (updates: {
    projectName?: string;
    companyName?: string;
    companyContactName?: string;
    companyContactPhone?: string;
    companyContactEmail?: string;
  }) => {
    setTestSetup((prev) => ({
      ...prev,
      ...updates
    }));
  };

  const resetTestSetup = () => {
    setTestSetup(createEmptyTestSetup());
    setPendingAgreementFile(null);
    setAgreementParsing(false);
    setAgreementParsingTestNumber(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gs-test-guide:selected-test');
    }
  };

  const ensureProjectSkeleton = async (testNumber: string) => {
    if (!db || !authReady || !testNumber.trim()) return;
    try {
      await setDoc(
        doc(db, 'projects', testNumber.trim()),
        {
          projectId: testNumber.trim(),
          testNumber: testNumber.trim(),
          testerId: currentUserId || null,
          testerName: resolvedTesterName,
          testerPhone: resolvedTesterPhone,
          testerEmail: resolvedTesterEmail,
          createdBy: currentUserId || null,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('[Firestore] 프로젝트 기본 생성 실패:', error);
    }
  };

  const saveProjectNow = async (): Promise<{ ok: boolean; reason?: string }> => {
    if (!db || !authReady) {
      console.warn('[Firestore] 연결되지 않았습니다.');
      return { ok: false, reason: 'Firestore 연결되지 않음' };
    }
    if (!currentTestNumber || !currentPlId) {
      console.warn('[Firestore] 시험번호/담당 PL 누락.');
      return { ok: false, reason: '시험번호/담당 PL 누락' };
    }
    if (!currentUserId) {
      console.warn('[Firestore] 시험원 누락.');
      return { ok: false, reason: '시험원 누락' };
    }
    const parts = currentTestNumber.split('-').map((part) => part.trim());
    const yearPart = parts.find((part) => /^\d{2}$/.test(part));
    const numberPart = parts[parts.length - 1];
    const projectYear = yearPart ? 2000 + Number(yearPart) : undefined;
    const projectNumber = numberPart && /^\d+$/.test(numberPart) ? Number(numberPart) : undefined;
    try {
      const startDate = testSetup.scheduleStartDate
        ? Timestamp.fromDate(new Date(`${testSetup.scheduleStartDate}T00:00:00`))
        : undefined;
      const endDate = testSetup.scheduleEndDate
        ? Timestamp.fromDate(new Date(`${testSetup.scheduleEndDate}T00:00:00`))
        : undefined;
      const projectPayload = {
        projectId: currentTestNumber,
        ...(projectYear ? { projectYear } : {}),
        ...(projectNumber ? { projectNumber } : {}),
          projectName: testSetup.projectName || '',
          companyName: testSetup.companyName || '',
          status: '진행',
          startDate: startDate || serverTimestamp(),
          endDate: endDate || serverTimestamp(),
          contractType: testSetup.agreementParsed?.contractType || '',
          companyContactName: testSetup.companyContactName,
          companyContactEmail: testSetup.companyContactEmail,
          companyContactPhone: testSetup.companyContactPhone,
          plId: currentPlId,
          plName: testSetup.plName,
          plPhone: testSetup.plPhone,
          plEmail: testSetup.plEmail,
          testerName: resolvedTesterName,
          testerPhone: resolvedTesterPhone,
          testerEmail: resolvedTesterEmail,
          testerId: currentUserId || null,
          scheduleWorkingDays: testSetup.scheduleWorkingDays,
          scheduleStartDate: testSetup.scheduleStartDate,
          scheduleDefect1: testSetup.scheduleDefect1,
          scheduleDefect2: testSetup.scheduleDefect2,
          schedulePatchDate: testSetup.schedulePatchDate,
          scheduleEndDate: testSetup.scheduleEndDate,
          createdBy: currentUserId || null,
          updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'projects', currentTestNumber), projectPayload, { merge: true });
      return { ok: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn('[Firestore] 프로젝트 저장 실패:', error);
      return { ok: false, reason };
    }
  };

  const saveDocsNow = async (): Promise<{ ok: boolean; reason?: string }> => {
    if (!db || !authReady) {
      console.warn('[Firestore] 연결되지 않았습니다.');
      return { ok: false, reason: 'Firestore 연결되지 않음' };
    }
    if (!currentTestNumber) {
      console.warn('[Firestore] 시험번호 누락.');
      return { ok: false, reason: '시험번호 누락' };
    }
    let docs = Array.isArray(testSetup.docs) ? testSetup.docs.filter(isDocEntry) : [];
    let agreementUrl = '';
    if (pendingAgreementFile) {
      const fixedFileName = `${currentTestNumber}_시험 합의서.pdf`;
      const storagePath = `agreements/${currentTestNumber}/${fixedFileName}`;
      if (!storage) {
        console.warn('[Storage] 연결되지 않았습니다.');
        return { ok: false, reason: 'Storage 연결되지 않음' };
      }
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, pendingAgreementFile);
      agreementUrl = await getDownloadURL(fileRef);
      docs = [
        ...docs.filter((item) => item.docType !== '시험 합의서'),
        { docType: '시험 합의서', fileName: fixedFileName, url: agreementUrl, source: 'storage' as const }
      ];
      setPendingAgreementFile(null);
      setTestSetup((prev) => ({
        ...prev,
        docs
      }));
      await setDoc(
        doc(db, 'agreementDocs', currentTestNumber),
        {
          testNumber: currentTestNumber,
          storagePath,
          fileName: fixedFileName,
          uploadedAt: serverTimestamp(),
          parsed: {}
        },
        { merge: true }
      );
    }
    if (docs.length === 0) return { ok: true };
    try {
      await setDoc(
        doc(db, 'testDocuments', currentTestNumber),
        { testNumber: currentTestNumber, docs, updatedAt: serverTimestamp() },
        { merge: true }
      );
      return { ok: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn('[Firestore] 시험자료 저장 실패:', error);
      return { ok: false, reason };
    }
  };

  const uploadAgreementNow = async (file: File) => {
    if (!db || !authReady || !currentTestNumber) return false;
    if (!storage) {
      console.warn('[Storage] 연결되지 않았습니다.');
      return false;
    }
    const fixedFileName = `${currentTestNumber}_시험 합의서.pdf`;
    const storagePath = `agreements/${currentTestNumber}/${fixedFileName}`;
    try {
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      const agreementUrl = await getDownloadURL(fileRef);
      const docs = [
        ...testSetup.docs.filter((item) => item.docType !== '시험 합의서'),
        { docType: '시험 합의서', fileName: fixedFileName, url: agreementUrl, source: 'storage' as const }
      ];
      setTestSetup((prev) => ({
        ...prev,
        docs
      }));
      await setDoc(
        doc(db, 'agreementDocs', currentTestNumber),
        {
          testNumber: currentTestNumber,
          storagePath,
          fileName: fixedFileName,
          uploadedAt: serverTimestamp(),
          parsed: {},
          parseStatus: 'pending'
        },
        { merge: true }
      );
      await setDoc(
        doc(db, 'testDocuments', currentTestNumber),
        { testNumber: currentTestNumber, docs, updatedAt: serverTimestamp() },
        { merge: true }
      );
      return true;
    } catch (error) {
      console.warn('[Storage] 합의서 업로드 실패:', error);
      return false;
    }
  };

  const uploadAgreementDoc = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      window.alert('합의서는 PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    if (!currentTestNumber.trim()) {
      window.alert('시험번호를 먼저 입력해주세요.');
      return;
    }
    if (!currentUserId) {
      window.alert('시험원을 먼저 선택해주세요.');
      return;
    }
    setAgreementModalEnabled(true);
    setAgreementParsing(true);
    setAgreementParsingTestNumber(currentTestNumber);
    await ensureProjectSkeleton(currentTestNumber);
    const ok = await uploadAgreementNow(file);
    if (!ok) {
      setAgreementParsing(false);
      return;
    }
    window.setTimeout(() => {
      setAgreementParsing(false);
    }, 3 * 60 * 1000);
  };

  const deleteAgreementDoc = async () => {
    if (!db || !authReady || !currentTestNumber) return;
    const nextDocs = testSetup.docs.filter((item) => item.docType !== '시험 합의서');
    setTestSetup((prev) => ({
      ...prev,
      docs: nextDocs,
      agreementParsed: undefined
    }));
    setAgreementModalEnabled(false);
    try {
      await setDoc(
        doc(db, 'testDocuments', currentTestNumber),
        { testNumber: currentTestNumber, docs: nextDocs, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await deleteDoc(doc(db, 'agreementDocs', currentTestNumber));
    } catch (error) {
      console.warn('[Firestore] 합의서 삭제 실패:', error);
    }
    if (storage) {
      const fixedFileName = `${currentTestNumber}_시험 합의서.pdf`;
      const storagePath = `agreements/${currentTestNumber}/${fixedFileName}`;
      deleteObject(ref(storage, storagePath)).catch((error) => {
        console.warn('[Storage] 합의서 삭제 실패:', error);
      });
    }
  };

  const selectTestNumber = (testNumber: string) => {
    const project = projects.find((item) => item.testNumber === testNumber || item.id === testNumber);
    const matchedPl = project?.plId ? plDirectory.find((pl) => pl.id === project.plId) : undefined;
    setTestSetup((prev) => ({
      ...prev,
      testNumber,
      plId: testNumber ? project?.plId || prev.plId : '',
      plName: testNumber ? project?.plName || matchedPl?.name || '' : '',
      plPhone: testNumber ? project?.plPhone || matchedPl?.phone || '' : '',
      plEmail: testNumber ? project?.plEmail || matchedPl?.email || '' : '',
      testerName: testNumber ? project?.testerName || '' : '',
      testerPhone: testNumber ? project?.testerPhone || '' : '',
      testerEmail: testNumber ? project?.testerEmail || '' : '',
      companyContactName: testNumber ? project?.companyContactName || '' : '',
      companyContactPhone: testNumber ? project?.companyContactPhone || '' : '',
      companyContactEmail: testNumber ? project?.companyContactEmail || '' : '',
      companyName: testNumber ? project?.companyName || '' : '',
      scheduleWorkingDays: testNumber ? project?.scheduleWorkingDays || '' : '',
      scheduleStartDate: testNumber ? project?.scheduleStartDate || '' : '',
      scheduleDefect1: testNumber ? project?.scheduleDefect1 || '' : '',
      scheduleDefect2: testNumber ? project?.scheduleDefect2 || '' : '',
      schedulePatchDate: testNumber ? project?.schedulePatchDate || '' : '',
      scheduleEndDate: testNumber ? project?.scheduleEndDate || '' : '',
      projectName: testNumber ? project?.projectName || '' : '',
      docs: testNumber && testNumber === prev.testNumber ? prev.docs : [],
      agreementParsed: testNumber && testNumber === prev.testNumber ? prev.agreementParsed : undefined
    }));
    if (agreementParsingTestNumber && agreementParsingTestNumber !== testNumber) {
      setAgreementParsing(false);
      setAgreementParsingTestNumber(null);
    }
  };

  const updateTestNumber = (value: string) => {
    setTestSetup((prev) => ({
      ...prev,
      testNumber: value
    }));
    if (agreementParsingTestNumber && agreementParsingTestNumber !== value.trim()) {
      setAgreementParsing(false);
      setAgreementParsingTestNumber(null);
    }
  };

  const createProjectFromInput = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!currentUserId) {
      window.alert('사용자를 먼저 선택해주세요.');
      return;
    }
    const exists = projects.find((item) => item.testNumber === trimmed || item.id === trimmed);
    if (exists) {
      window.alert('이미 존재하는 시험번호입니다.');
      return;
    }
    await ensureProjectSkeleton(trimmed);
    setTestSetup((prev) => ({
      ...prev,
      testNumber: trimmed
    }));
  };

  const startProject = async (): Promise<{ ok: boolean; reason?: string }> => {
    if (!db || !authReady) {
      return { ok: false, reason: 'Firestore 연결 상태가 준비되지 않았습니다.' };
    }
    if (!currentTestNumber || !currentPlId || !currentUserId) {
      return { ok: false, reason: '시험번호/담당 PL/시험원 정보가 누락되었습니다.' };
    }
    const savedProject = await saveProjectNow();
    if (!savedProject.ok) {
      return { ok: false, reason: savedProject.reason || '프로젝트 저장 실패(규칙 확인 필요)' };
    }
    const docsSaved = await saveDocsNow();
    if (!docsSaved.ok) {
      return { ok: false, reason: docsSaved.reason || '문서 저장 실패(규칙 확인 필요)' };
    }
    // Reset fields to allow adding a new test after starting the project.
    setTestSetup((prev) => ({
      ...prev,
      testNumber: '',
      scheduleWorkingDays: '',
      scheduleStartDate: '',
      scheduleDefect1: '',
      scheduleDefect2: '',
      schedulePatchDate: '',
      scheduleEndDate: '',
      docs: [],
      agreementParsed: undefined
    }));
    setPendingAgreementFile(null);
    setAgreementParsing(false);
    setAgreementParsingTestNumber(null);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('gs-test-guide:skip-restore', '1');
    }
    return { ok: true };
  };

  const canProceed = Boolean(currentTestNumber && currentPlId && currentUserId);

  return {
    testSetup,
    setTestSetup,
    currentUserId,
    setCurrentUserId,
    currentTestNumber,
    currentPlId,
    currentTesterName,
    pendingAgreementFile,
    setPendingAgreementFile,
    agreementModalEnabled,
    setAgreementModalEnabled,
    agreementParsing,
    agreementParsingTestNumber,
    updatePlId,
    updateScheduleStartDate,
    updateScheduleEndDate,
    updateManualInfo,
    resetTestSetup,
    ensureProjectSkeleton,
    saveProjectNow,
    saveDocsNow,
    uploadAgreementDoc,
    deleteAgreementDoc,
    selectTestNumber,
    updateTestNumber,
    createProjectFromInput,
    startProject,
    canProceed
  };
}

export type UseTestSetupStateReturn = ReturnType<typeof useTestSetupState>;
