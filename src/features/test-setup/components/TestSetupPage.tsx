import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2, List, UploadCloud, User, Trash2 } from 'lucide-react';
import type {
  AgreementParsed,
  DocEntry,
  Project,
  User as AppUser,
  UserCreateInput,
  UserRank,
  UserUpdateInput
} from '../../../types';
import { CalendarInput } from './CalendarInput';
import { TestInfoCard } from './TestInfoCard';
import {
  AccessDeniedModal,
  AgreementDeleteConfirmModal,
  AgreementFailedModal,
  CreateUserModal,
  DeleteUserConfirmModal,
  EditUserModal,
  ManageUsersModal,
  ParsingOverlay,
  ProjectListModal
} from './modals';

interface TestSetupPageProps {
  testNumber: string;
  plId: string;
  scheduleStartDate: string;
  scheduleEndDate: string;
  projectName: string;
  companyName: string;
  companyContactName: string;
  companyContactPhone: string;
  companyContactEmail: string;
  users: AppUser[];
  currentUserId: string;
  onChangeUserId: (userId: string) => void;
  onCreateUser: (input: UserCreateInput) => Promise<string | null>;
  onUpdateUser: (id: string, input: UserUpdateInput) => Promise<boolean>;
  onDeleteUser: (id: string) => Promise<boolean>;
  projects: Project[];
  progressByTestNumber: Record<string, number>;
  plDirectory: Array<{ id: string; name: string; role: string; phone: string; email: string }>;
  docs: DocEntry[];
  agreementParsed?: AgreementParsed;
  onSelectProject: (testNumber: string) => void;
  onChangeTestNumber: (value: string) => void;
  onSaveTestNumber: (value: string) => void | Promise<void>;
  onChangePlId: (value: string) => void;
  onChangeScheduleStartDate: (value: string) => void;
  onChangeScheduleEndDate: (value: string) => void;
  onUpdateManualInfo: (updates: {
    projectName?: string;
    companyName?: string;
    companyContactName?: string;
    companyContactPhone?: string;
    companyContactEmail?: string;
  }) => void;
  onUploadAgreementDoc: (file: File) => void | Promise<void>;
  onDeleteAgreementDoc: () => void | Promise<void>;
  isParsingAgreement: boolean;
  parsingTestNumber: string | null;
  onStartProject: () => Promise<{ ok: boolean; reason?: string }>;
  canProceed: boolean;
}

export function TestSetupPage({
  testNumber,
  plId,
  scheduleStartDate,
  scheduleEndDate,
  projectName,
  companyName,
  companyContactName,
  companyContactPhone,
  companyContactEmail,
  users,
  currentUserId,
  onChangeUserId,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  projects,
  progressByTestNumber,
  plDirectory,
  docs,
  agreementParsed,
  onSelectProject,
  onChangeTestNumber,
  onSaveTestNumber,
  onChangePlId,
  onChangeScheduleStartDate,
  onChangeScheduleEndDate,
  onUpdateManualInfo,
  onUploadAgreementDoc,
  onDeleteAgreementDoc,
  isParsingAgreement,
  parsingTestNumber,
  onStartProject,
  canProceed
}: TestSetupPageProps) {
  const selectedTestStorageKey = 'gs-test-guide:selected-test';
  const [flowMode, setFlowMode] = useState<'create' | 'existing'>('existing');
  const trimmedTestNumber = testNumber.trim();
  const hasTestNumber = Boolean(trimmedTestNumber);
  const normalizeUpdatedAt = (value: Project['updatedAt']) => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return value.toDate().getTime();
    }
    return 0;
  };
  const visibleProjects = useMemo(() => {
    if (!currentUserId) return [];
    return projects
      .filter((project) => project.testerId === currentUserId || project.createdBy === currentUserId)
      .map((project) => ({
        ...project,
        progress: progressByTestNumber[project.testNumber] ?? 0
      }))
      .sort((a, b) => normalizeUpdatedAt(b.updatedAt) - normalizeUpdatedAt(a.updatedAt));
  }, [projects, currentUserId, progressByTestNumber]);
  const canSaveTestNumber = Boolean(
    trimmedTestNumber &&
      currentUserId &&
      !projects.some((project) => project.testNumber.trim().toUpperCase() === trimmedTestNumber.toUpperCase())
  );
  const featuredProject = visibleProjects[0];
  const otherProjects = visibleProjects.slice(1);
  const recentSideProjects = otherProjects.slice(0, 2);
  const hasMoreProjects = otherProjects.length > 2;
  const selectedProject = visibleProjects.find((project) => project.testNumber === trimmedTestNumber);
  const resolveTesterName = (project?: Project) => {
    if (!project) return '미정';
    const fromUser = users.find((u) => u.id === project.testerId)?.name;
    return fromUser || project.testerName || '미정';
  };
  const resolvePlName = (project?: Project) => {
    if (!project) return '미정';
    const fromPl = plDirectory.find((pl) => pl.id === project.plId)?.name;
    return fromPl || project.plName || '미정';
  };
  const formatDate = (value?: Project['updatedAt']) => {
    const millis = normalizeUpdatedAt(value ?? 0);
    if (!millis) return '미기록';
    const date = new Date(millis);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const missingFields = [
    !trimmedTestNumber ? '시험번호' : null,
    !plId ? '담당 PL' : null,
    !currentUserId ? '시험원' : null
  ].filter(Boolean) as string[];
  const hasAgreementDoc = docs.some((item) => item.docType === '시험 합의서' && (item.fileName || item.url));
  const sectionDone = {
    user: Boolean(currentUserId),
    pl: Boolean(plId),
    schedule: Boolean(scheduleStartDate && scheduleEndDate),
    testNumber: Boolean(trimmedTestNumber),
    info: Boolean(projectName || companyName || companyContactName || companyContactPhone || companyContactEmail),
    agreement: hasAgreementDoc
  };
  const [agreementDeleteConfirmOpen, setAgreementDeleteConfirmOpen] = useState(false);
  const [agreementFailedOpen, setAgreementFailedOpen] = useState(false);
  const prevStatusRef = useRef<AgreementParsed['parseStatus']>(undefined);
  const [projectListOpen, setProjectListOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [manageUsersOpen, setManageUsersOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState<{
    id: string;
    name: string;
    rank: UserRank | '';
    email: string;
    phone: string;
  }>({
    id: '',
    name: '',
    rank: '',
    email: '',
    phone: ''
  });
  const [deleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false);
  const [accessDeniedInfo, setAccessDeniedInfo] = useState<{ testerName: string; plName: string } | null>(null);
  const location = useLocation();
  const openedFromStateRef = useRef(false);
  const [testNumberValidation, setTestNumberValidation] = useState<{
    touched: boolean;
    isValid: boolean;
    message: string;
  }>({
    touched: false,
    isValid: false,
    message: ''
  });

  const validateTestNumber = (raw: string) => {
    const normalized = raw.trim().toUpperCase();
    if (!normalized) {
      return { normalized, isValid: false, message: '시험번호를 입력해주세요.' };
    }
    const format = /^GS-[A-Z]-\d{2}-\d{4}$/;
    if (!format.test(normalized)) {
      return {
        normalized,
        isValid: false,
        message: '형식이 올바르지 않습니다. 예: GS-A-25-0226'
      };
    }
    const isDuplicate = projects.some(
      (project) => project.testNumber.trim().toUpperCase() === normalized
    );
    if (isDuplicate) {
      return { normalized, isValid: false, message: '이미 사용 중인 시험번호입니다.' };
    }
    return { normalized, isValid: true, message: '사용 가능한 시험번호입니다.' };
  };
  const canSaveTestNumberValidated =
    canSaveTestNumber && (!testNumberValidation.touched || testNumberValidation.isValid);
  const resetCreateFields = () => {
    localStorage.removeItem(selectedTestStorageKey);
    onChangeUserId('');
    onChangeTestNumber('');
    onChangePlId('');
    onChangeScheduleStartDate('');
    onChangeScheduleEndDate('');
    onUpdateManualInfo({
      projectName: '',
      companyName: '',
      companyContactName: '',
      companyContactPhone: '',
      companyContactEmail: ''
    });
    setTestNumberValidation({ touched: false, isValid: false, message: '' });
  };

  useEffect(() => {
    const saved = localStorage.getItem(selectedTestStorageKey);
    if (!saved || trimmedTestNumber || projects.length === 0) return;
    const exists = projects.some((project) => project.testNumber === saved || project.id === saved);
    if (exists) {
      onSelectProject(saved);
      setFlowMode('existing');
    }
  }, [onSelectProject, projects, trimmedTestNumber]);

  useEffect(() => {
    if (!trimmedTestNumber) return;
    localStorage.setItem(selectedTestStorageKey, trimmedTestNumber);
  }, [trimmedTestNumber]);

  useEffect(() => {
    const shouldOpen = Boolean((location.state as { openTestList?: boolean } | null)?.openTestList);
    if (!shouldOpen || openedFromStateRef.current) return;
    setProjectListOpen(true);
    openedFromStateRef.current = true;
  }, [location.state]);

  const hasDuplicateUser = (candidate: { id?: string; name: string; email: string }) => {
    const normalizedName = candidate.name.trim();
    const normalizedEmail = candidate.email.trim().toLowerCase();
    return users.some((user) => {
      if (candidate.id && user.id === candidate.id) return false;
      const sameName = normalizedName && user.name.trim() === normalizedName;
      const sameEmail = normalizedEmail && (user.email || '').trim().toLowerCase() === normalizedEmail;
      return sameName || sameEmail;
    });
  };

  const statusLabel =
    agreementParsed?.parseStatus === 'parsed'
      ? '추출 완료'
      : agreementParsed?.parseStatus === 'failed'
        ? '추출 실패'
        : agreementParsed?.parseStatus === 'pending'
          ? '추출 중'
          : '대기';
  const isParsing = isParsingAgreement && parsingTestNumber === trimmedTestNumber;
  const parsingProgress = Math.min(100, Math.max(5, agreementParsed?.parseProgress ?? 5));

  // 파싱 실패 시 모달 표시
  useEffect(() => {
    const currentStatus = agreementParsed?.parseStatus;
    if (currentStatus && currentStatus !== prevStatusRef.current) {
      if (currentStatus === 'failed') {
        setAgreementFailedOpen(true);
      }
      prevStatusRef.current = currentStatus;
    }
  }, [agreementParsed?.parseStatus]);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-[#0a0f1f] dark:via-[#0b1230] dark:to-[#1a0f3a] flex items-center justify-center p-6">
      <div
        className="pointer-events-none absolute inset-0 blur-[120px] opacity-40 dark:opacity-70 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/10 dark:from-blue-600/30 dark:via-purple-600/30 dark:to-pink-600/20"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-7xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-10 text-slate-900 dark:text-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            GS 인증 시험 시작
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/60">GS 인증 시험 시작을 확인하고 시작하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* ===== 왼쪽 컬럼 ===== */}
          <div className="space-y-6">
            {/* 1단계: 사용자 선택 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-slate-600 dark:text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-sky-400/40 dark:border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-700 dark:text-sky-100">1단계</span>
                  사용자 선택
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.user ? 'border-emerald-400/50 dark:border-emerald-300/50 text-emerald-600 dark:text-emerald-200' : 'border-slate-300 dark:border-white/20 text-slate-400 dark:text-white/50'}`}>
                  {sectionDone.user ? '완료' : '미완료'}
                </span>
              </div>
              {users.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 p-4">
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    등록된 사용자가 없습니다. 먼저 사용자 등록이 필요합니다.
                  </p>
                </div>
              ) : (
                <div className="h-11 flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <User size={16} className="text-slate-400 dark:text-white/50" />
                  <select
                    value={currentUserId}
                    onChange={(e) => onChangeUserId(e.target.value)}
                    className="h-full bg-transparent w-full text-sm text-slate-700 dark:text-white/80 focus:outline-none"
                  >
                    <option value="" className="text-gray-900">선택하세요</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id} className="text-gray-900">
                        {user.name}{user.rank ? ` (${user.rank})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCreateUserOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-200/50 dark:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-white/80 hover:bg-slate-300/50 dark:hover:bg-white/20"
                >
                  <User size={14} />
                  사용자 추가
                </button>
                {users.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setManageUsersOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/15"
                  >
                    사용자 관리
                  </button>
                )}
              </div>
            </div>

            {/* create 모드: 담당 PL + 시험 일정 */}
            {flowMode === 'create' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-slate-600 dark:text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-sky-400/40 dark:border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-700 dark:text-sky-100">3단계</span>
                  담당 PL 선택
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.pl ? 'border-emerald-400/50 dark:border-emerald-300/50 text-emerald-600 dark:text-emerald-200' : 'border-slate-300 dark:border-white/20 text-slate-400 dark:text-white/50'}`}>
                  {sectionDone.pl ? '완료' : '미완료'}
                </span>
              </div>
              <div className="h-11 flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                <Building2 size={16} className="text-slate-400 dark:text-white/50" />
                <select
                  value={plId}
                  onChange={(e) => onChangePlId(e.target.value)}
                  className="h-full bg-transparent w-full text-sm text-slate-700 dark:text-white/80 focus:outline-none"
                >
                  <option value="" className="text-gray-900">선택하세요</option>
                  {plDirectory.map((pl) => (
                    <option key={pl.id} value={pl.id} className="text-gray-900">
                      {pl.name} {pl.role ? `(${pl.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            )}

            {flowMode === 'create' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-slate-600 dark:text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-sky-400/40 dark:border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-700 dark:text-sky-100">4단계</span>
                  시험 일정 입력
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.schedule ? 'border-emerald-400/50 dark:border-emerald-300/50 text-emerald-600 dark:text-emerald-200' : 'border-slate-300 dark:border-white/20 text-slate-400 dark:text-white/50'}`}>
                  {sectionDone.schedule ? '완료' : '미완료'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CalendarInput label="시작일" value={scheduleStartDate} onChange={onChangeScheduleStartDate} />
                <CalendarInput label="종료일" value={scheduleEndDate} onChange={onChangeScheduleEndDate} />
              </div>
            </div>
            )}

            {/* existing 모드: 시험 선택 */}
            {flowMode === 'existing' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-slate-600 dark:text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-sky-400/40 dark:border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-700 dark:text-sky-100">2단계</span>
                  시험 선택
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 dark:border-white/20 text-slate-400 dark:text-white/50">탐색</span>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(selectedTestStorageKey);
                      onChangeTestNumber('');
                      setFlowMode('create');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 dark:border-white/20 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                  >
                    선택 해제
                  </button>
                </div>
              </div>
              <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-white/50 mb-2">
                  <List size={14} className="text-slate-400 dark:text-white/50" />
                  최근 작업 시험
                </div>
                {featuredProject ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(featuredProject.testNumber);
                      setFlowMode('existing');
                    }}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      trimmedTestNumber === featuredProject.testNumber
                        ? 'border-purple-400/80 bg-purple-50 dark:bg-white/15 text-slate-900 dark:text-white shadow-[0_0_30px_rgba(124,58,237,0.2)] dark:shadow-[0_0_30px_rgba(124,58,237,0.35)]'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-white/80 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 dark:text-white/50 mb-1">시험번호</div>
                        <div className="text-lg font-semibold tracking-wide">{featuredProject.testNumber}</div>
                        {(featuredProject.projectName || featuredProject.productName || featuredProject.companyName) && (
                          <div className="mt-1 text-sm text-slate-600 dark:text-white/70 truncate" title={`${featuredProject.projectName || featuredProject.productName || '-'}${featuredProject.companyName ? ` (${featuredProject.companyName})` : ''}`}>
                            {featuredProject.projectName || featuredProject.productName || '-'}
                            {featuredProject.companyName ? ` (${featuredProject.companyName})` : ''}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-slate-400 dark:text-white/50 whitespace-nowrap">
                        최근 수정 · {formatDate(featuredProject.updatedAt)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500 dark:text-white/60">
                      <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-1">
                        진행율 {featuredProject.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, featuredProject.progress))}%` }}
                      />
                    </div>
                  </button>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 px-4 py-6 text-center text-xs text-slate-400 dark:text-white/40">
                    현재 할당된 시험이 없습니다.
                  </div>
                )}
                {otherProjects.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[11px] text-slate-400 dark:text-white/50 mb-2">최근 수정 순</div>
                    <div className="flex items-stretch gap-2">
                      {recentSideProjects.map((project) => {
                        const isActive = trimmedTestNumber === project.testNumber;
                        return (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => {
                              onSelectProject(project.testNumber);
                              setFlowMode('existing');
                            }}
                            className={`flex-1 rounded-xl border px-3 py-3 text-left text-sm transition ${
                              isActive
                                ? 'border-purple-400/70 bg-purple-50 dark:bg-white/15 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(124,58,237,0.15)] dark:shadow-[0_0_20px_rgba(124,58,237,0.25)]'
                                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/70 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="text-xs text-slate-400 dark:text-white/50 mb-1">시험번호</div>
                            <div className="font-semibold tracking-wide">{project.testNumber}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-white/70 truncate" title={`${project.projectName || project.productName || '-'}${project.companyName ? ` (${project.companyName})` : ''}`}>
                              {project.projectName || project.productName || '-'}
                              {project.companyName ? ` (${project.companyName})` : ''}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-white/50">
                              <span>진행율 {project.progress}%</span>
                              <span>{formatDate(project.updatedAt)}</span>
                            </div>
                          </button>
                        );
                      })}
                      {hasMoreProjects && (
                        <button
                          type="button"
                          onClick={() => setProjectListOpen(true)}
                          className="w-9 shrink-0 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                          aria-label="다른 시험 보기"
                          title="다른 시험 보기"
                        >
                          &gt;
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {!currentUserId && (
                  <div className="absolute inset-0 z-10 rounded-2xl bg-[var(--overlay-backdrop)] backdrop-blur-[2px] flex items-center justify-center text-center px-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-white/90">사용자 선택 필요</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-white/60">
                        시험 목록은 사용자 선택 후 확인할 수 있습니다.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* ===== 오른쪽 컬럼 ===== */}
          <div className="space-y-6">
            {/* create 모드: 시험번호 입력 */}
            {flowMode === 'create' && (
            <div className="mb-2">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-slate-600 dark:text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-indigo-400/40 dark:border-indigo-300/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700 dark:text-indigo-100">2단계</span>
                  시험 번호 입력 후 저장
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.testNumber ? 'border-emerald-400/50 dark:border-emerald-300/50 text-emerald-600 dark:text-emerald-200' : 'border-slate-300 dark:border-white/20 text-slate-400 dark:text-white/50'}`}>
                  {sectionDone.testNumber ? '완료' : '미완료'}
                </span>
              </div>
              <div className="h-11 flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                <List size={16} className="text-slate-400 dark:text-white/50" />
                <input
                  className="h-full bg-transparent w-full text-sm text-slate-700 dark:text-white/80 placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none"
                  placeholder="예: GS-A-25-0226"
                  value={trimmedTestNumber}
                  onChange={(e) => {
                    onChangeTestNumber(e.target.value);
                    setFlowMode('create');
                    if (testNumberValidation.touched) {
                      setTestNumberValidation({ touched: false, isValid: false, message: '' });
                    }
                  }}
                  onBlur={(e) => {
                    const result = validateTestNumber(e.target.value);
                    if (result.normalized !== e.target.value) {
                      onChangeTestNumber(result.normalized);
                    }
                    setTestNumberValidation({
                      touched: true,
                      isValid: result.isValid,
                      message: result.message
                    });
                  }}
                  readOnly={false}
                />
                {flowMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSaveTestNumber(trimmedTestNumber);
                      setFlowMode('create');
                    }}
                    disabled={!canSaveTestNumberValidated}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${
                      canSaveTestNumberValidated
                        ? 'border-purple-400/60 dark:border-purple-300/60 bg-purple-500/20 text-purple-700 dark:text-white hover:bg-purple-500/30'
                        : 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/30 cursor-not-allowed'
                    }`}
                  >
                    저장
                  </button>
                )}
              </div>
              {testNumberValidation.touched && (
                <div
                  className={`mt-2 text-xs ${
                    testNumberValidation.isValid ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {testNumberValidation.message}
                </div>
              )}
            </div>
            )}

            {/* 합의서 업로드 (create 모드) */}
            {flowMode === 'create' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-slate-600 dark:text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-indigo-400/40 dark:border-indigo-300/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700 dark:text-indigo-100">5단계</span>
                  시험 합의서 업로드
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.agreement ? 'border-emerald-400/50 dark:border-emerald-300/50 text-emerald-600 dark:text-emerald-200' : 'border-slate-300 dark:border-white/20 text-slate-400 dark:text-white/50'}`}>
                  {sectionDone.agreement ? '완료' : '미완료'}
                </span>
              </div>
              <div className="min-h-[230px] border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-100 dark:bg-white/5 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                <UploadCloud size={28} className="text-slate-500 dark:text-white/60" />
                <div className="text-sm font-semibold text-slate-700 dark:text-white/80">시험 합의서</div>
                <div className="text-xs text-slate-400 dark:text-white/50">드래그 파일을 업로드하세요.</div>
                <label className="absolute inset-0 cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!hasTestNumber) {
                        window.alert('먼저 시험번호를 선택해주세요.');
                        e.target.value = '';
                        return;
                      }
                      onUploadAgreementDoc(file);
                    }}
                  />
                </label>
                {agreementParsed?.parseStatus && (
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <div className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-200/50 dark:bg-white/10 px-3 py-1 text-[10px] text-slate-600 dark:text-white/70">
                      {statusLabel}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAgreementDeleteConfirmOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-200/50 dark:bg-white/10 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                      title="시험 합의서 삭제"
                      aria-label="시험 합의서 삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                  <div className="text-xs text-slate-400 dark:text-white/50 mb-1 flex justify-between">
                    <span>{agreementParsed?.parseStatus === 'pending' ? '분석 중' : '대기'}</span>
                    <span>{hasAgreementDoc ? '업로드됨' : '미업로드'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                      style={{ width: agreementParsed?.parseStatus === 'pending' ? '60%' : '20%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* TestInfoCard — 시험 정보 (9개 필드 인라인 편집) */}
            <div className="mt-5 relative">
              {!currentUserId && flowMode === 'existing' && (
                <div className="absolute inset-0 z-10 rounded-2xl bg-[var(--overlay-backdrop)] backdrop-blur-[2px] flex items-center justify-center text-center px-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-white/90">사용자 선택 필요</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-white/60">
                      시험 정보 확인은 사용자 선택 후 가능합니다.
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-white/70">
                  <span className="mr-2 inline-flex rounded-md border border-indigo-400/40 dark:border-indigo-300/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700 dark:text-indigo-100">
                    {flowMode === 'existing' ? '3단계' : '6단계'}
                  </span>
                  시험 정보 {flowMode === 'existing' ? '확인' : '입력'}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.info ? 'border-emerald-400/50 dark:border-emerald-300/50 text-emerald-600 dark:text-emerald-200' : 'border-slate-300 dark:border-white/20 text-slate-400 dark:text-white/50'}`}>
                  {sectionDone.info ? '완료' : '미완료'}
                </span>
              </div>
              <TestInfoCard
                testNumber={selectedProject?.testNumber || trimmedTestNumber || ''}
                plId={plId}
                scheduleStartDate={scheduleStartDate}
                scheduleEndDate={scheduleEndDate}
                productName={projectName}
                companyName={companyName}
                managerName={companyContactName}
                managerPhone={companyContactPhone}
                managerEmail={companyContactEmail}
                plDirectory={plDirectory}
                agreementStatus={agreementParsed?.parseStatus}
                onChangePlId={onChangePlId}
                onChangeStartDate={onChangeScheduleStartDate}
                onChangeEndDate={onChangeScheduleEndDate}
                onChangeField={(field, value) => onUpdateManualInfo({ [field]: value })}
              />
            </div>

            {/* 하단 액션 버튼 */}
            <div className="mt-6 sticky bottom-0 pt-4 pb-1 flex flex-col items-center gap-2">
              <div className="flex w-full max-w-lg items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (flowMode === 'existing') {
                      resetCreateFields();
                      setFlowMode('create');
                      return;
                    }
                    setFlowMode('existing');
                  }}
                  className="w-full max-w-xs rounded-xl border border-slate-300 dark:border-white/20 bg-slate-200/50 dark:bg-white/10 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-white/80 transition hover:bg-slate-300/50 dark:hover:bg-white/20"
                >
                  {flowMode === 'existing' ? '+ 시험 생성' : '시험 생성 닫기'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!canProceed) {
                      window.alert(`필수 항목을 입력해주세요: ${missingFields.join(', ')}`);
                      return;
                    }
                    if (flowMode === 'existing' && selectedProject) {
                      const testerMismatch =
                        selectedProject.testerId && selectedProject.testerId !== currentUserId;
                      const plMismatch = selectedProject.plId && selectedProject.plId !== plId;
                      if (testerMismatch || plMismatch) {
                        setAccessDeniedInfo({
                          testerName: resolveTesterName(selectedProject),
                          plName: resolvePlName(selectedProject)
                        });
                        setAccessDeniedOpen(true);
                        return;
                      }
                    }
                    const result = await onStartProject();
                    if (!result.ok) {
                      window.alert(`시험 시작 실패: ${result.reason || '알 수 없는 오류'}`);
                    }
                  }}
                  className={`w-full max-w-xs rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_20px_rgba(88,120,255,0.4)] dark:shadow-[0_0_20px_rgba(88,120,255,0.6)] transition ${
                    canProceed ? 'hover:opacity-90' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  시험 시작
                </button>
              </div>
              {!canProceed && (
                <div className="text-xs text-slate-500 dark:text-white/60">
                  필수 입력: {missingFields.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <AccessDeniedModal
        open={accessDeniedOpen && !!accessDeniedInfo}
        onClose={() => setAccessDeniedOpen(false)}
        testerName={accessDeniedInfo?.testerName ?? ''}
        plName={accessDeniedInfo?.plName ?? ''}
      />

      <AgreementFailedModal
        open={agreementFailedOpen}
        onClose={() => setAgreementFailedOpen(false)}
      />

      <AgreementDeleteConfirmModal
        open={agreementDeleteConfirmOpen}
        onClose={() => setAgreementDeleteConfirmOpen(false)}
        onConfirm={() => onDeleteAgreementDoc()}
      />

      <ProjectListModal
        open={projectListOpen}
        onClose={() => setProjectListOpen(false)}
        projects={visibleProjects}
        activeTestNumber={trimmedTestNumber}
        onSelectProject={(tn) => {
          onSelectProject(tn);
          setFlowMode('existing');
        }}
      />

      <CreateUserModal
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onCreateUser={onCreateUser}
        onUserCreated={onChangeUserId}
        hasDuplicateUser={(c) => hasDuplicateUser(c)}
      />

      <ManageUsersModal
        open={manageUsersOpen}
        onClose={() => setManageUsersOpen(false)}
        users={users}
        onOpenCreateUser={() => setCreateUserOpen(true)}
        onEditUser={(user) => {
          setEditUserForm({
            id: user.id,
            name: user.name || '',
            rank: user.rank || '',
            email: user.email || '',
            phone: user.phone || ''
          });
          setEditUserOpen(true);
        }}
        onDeleteUser={(user) => {
          setDeleteTargetUser(user);
          setDeleteUserConfirmOpen(true);
        }}
      />

      <EditUserModal
        open={editUserOpen}
        onClose={() => setEditUserOpen(false)}
        initialData={editUserForm}
        onUpdateUser={onUpdateUser}
        hasDuplicateUser={(c) => hasDuplicateUser(c)}
      />

      <DeleteUserConfirmModal
        open={deleteUserConfirmOpen && !!deleteTargetUser}
        onClose={() => {
          setDeleteUserConfirmOpen(false);
          setDeleteTargetUser(null);
        }}
        userName={deleteTargetUser?.name ?? ''}
        onConfirm={async () => {
          if (deleteTargetUser) {
            await onDeleteUser(deleteTargetUser.id);
          }
        }}
      />

      <ParsingOverlay visible={isParsing} progress={parsingProgress} />
    </div>
  );
}
