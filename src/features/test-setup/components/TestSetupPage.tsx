import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2, List, UploadCloud, User, Trash2, Eye } from 'lucide-react';
import type {
  AgreementParsed,
  DocEntry,
  Project,
  User as AppUser,
  UserCreateInput,
  UserRank,
  UserUpdateInput
} from '../../../types';
import { AgreementVerifyModal } from './AgreementVerifyModal';
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
  showAgreementModal: boolean;
  isParsingAgreement: boolean;
  parsingTestNumber: string | null;
  onAgreementModalConsumed: () => void;
  onVerifiedSave: (corrected: Record<string, string>) => Promise<void>;
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
  showAgreementModal,
  isParsingAgreement,
  parsingTestNumber,
  onAgreementModalConsumed,
  onVerifiedSave,
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
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [agreementModalStatus, setAgreementModalStatus] = useState<'parsed' | 'failed' | null>(null);
  const prevStatusRef = useRef<AgreementParsed['parseStatus']>(undefined);
  const [agreementDeleteConfirmOpen, setAgreementDeleteConfirmOpen] = useState(false);
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
  const isParsing =
    (isParsingAgreement && parsingTestNumber === trimmedTestNumber) || showAgreementModal;
  const parsingProgress = Math.min(100, Math.max(5, agreementParsed?.parseProgress ?? 5));

  useEffect(() => {
    const currentStatus = agreementParsed?.parseStatus;
    if (currentStatus && currentStatus !== prevStatusRef.current) {
      if ((showAgreementModal || isParsingAgreement) && (currentStatus === 'parsed' || currentStatus === 'failed')) {
        setAgreementModalStatus(currentStatus);
        setAgreementModalOpen(true);
        onAgreementModalConsumed();
      }
      prevStatusRef.current = currentStatus;
    }
  }, [agreementParsed?.parseStatus, showAgreementModal, isParsingAgreement, onAgreementModalConsumed]);

  const CalendarInput = ({
    label,
    value,
    onChange
  }: {
    label: string;
    value: string;
    onChange: (next: string) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const toLocalDateString = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const [viewDate, setViewDate] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));

    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    const weeks: Array<{ label: string; date: Date | null }> = [];

    for (let i = 0; i < startDay; i += 1) {
      weeks.push({ label: '', date: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      weeks.push({ label: String(d), date: new Date(viewDate.getFullYear(), viewDate.getMonth(), d) });
    }

    const formatValue = value || '날짜 선택';
    const isSelected = (date: Date) => value === toLocalDateString(date);

    return (
      <div className="relative">
        <label className="text-xs text-white/60 block mb-1">{label}</label>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full text-left bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 hover:border-white/20"
        >
          {formatValue}
        </button>
        {open && (
          <div className="absolute z-30 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0b1230]/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-3">
            <div className="flex items-center justify-between text-xs text-white/70 mb-2">
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="px-2 py-1 rounded-md hover:bg-white/10"
              >
                이전
              </button>
              <span className="font-semibold text-white/80">
                {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
              </span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="px-2 py-1 rounded-md hover:bg-white/10"
              >
                다음
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-white/50 mb-1">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="text-center">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {weeks.map((cell, idx) => (
                <button
                  key={`${cell.label}-${idx}`}
                  type="button"
                  disabled={!cell.date}
                  onClick={() => {
                    if (!cell.date) return;
                    onChange(toLocalDateString(cell.date));
                    setOpen(false);
                  }}
                  className={`h-8 rounded-md ${
                    cell.date
                      ? isSelected(cell.date)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-white/80 hover:bg-white/10'
                      : 'text-white/30'
                  }`}
                >
                  {cell.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0a0f1f] via-[#0b1230] to-[#1a0f3a] flex items-center justify-center p-6">
      <div
        className="pointer-events-none absolute inset-0 blur-[120px] opacity-70 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/20"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-7xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-10 text-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            GS 인증 시험 시작
          </h1>
          <p className="mt-2 text-sm text-white/60">GS 인증 시험 시작을 확인하고 시작하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-100">1단계</span>
                  사용자 선택
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.user ? 'border-emerald-300/50 text-emerald-200' : 'border-white/20 text-white/50'}`}>
                  {sectionDone.user ? '완료' : '미완료'}
                </span>
              </div>
              {users.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4">
                  <p className="text-xs text-white/60">
                    등록된 사용자가 없습니다. 먼저 사용자 등록이 필요합니다.
                  </p>
                </div>
              ) : (
                <div className="h-11 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <User size={16} className="text-white/50" />
                  <select
                    value={currentUserId}
                    onChange={(e) => onChangeUserId(e.target.value)}
                    className="h-full bg-transparent w-full text-sm text-white/80 focus:outline-none"
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
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/20"
                >
                  <User size={14} />
                  사용자 추가
                </button>
                {users.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setManageUsersOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/15"
                  >
                    사용자 관리
                  </button>
                )}
              </div>
            </div>

            {flowMode === 'create' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-100">3단계</span>
                  담당 PL 선택
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.pl ? 'border-emerald-300/50 text-emerald-200' : 'border-white/20 text-white/50'}`}>
                  {sectionDone.pl ? '완료' : '미완료'}
                </span>
              </div>
              <div className="h-11 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                <Building2 size={16} className="text-white/50" />
                <select
                  value={plId}
                  onChange={(e) => onChangePlId(e.target.value)}
                  className="h-full bg-transparent w-full text-sm text-white/80 focus:outline-none"
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
                <label className="text-sm text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-100">4단계</span>
                  시험 일정 입력
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.schedule ? 'border-emerald-300/50 text-emerald-200' : 'border-white/20 text-white/50'}`}>
                  {sectionDone.schedule ? '완료' : '미완료'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CalendarInput label="시작일" value={scheduleStartDate} onChange={onChangeScheduleStartDate} />
                <CalendarInput label="종료일" value={scheduleEndDate} onChange={onChangeScheduleEndDate} />
              </div>
            </div>
            )}

            {flowMode === 'existing' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-100">2단계</span>
                  시험 선택
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/50">탐색</span>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(selectedTestStorageKey);
                      onChangeTestNumber('');
                      setFlowMode('create');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/60 hover:text-white"
                  >
                    선택 해제
                  </button>
                </div>
              </div>
              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-[11px] text-white/50 mb-2">
                  <List size={14} className="text-white/50" />
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
                        ? 'border-purple-400/80 bg-white/15 text-white shadow-[0_0_30px_rgba(124,58,237,0.35)]'
                        : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] text-white/50 mb-1">시험번호</div>
                        <div className="text-lg font-semibold tracking-wide">{featuredProject.testNumber}</div>
                        {(featuredProject.projectName || featuredProject.productName || featuredProject.companyName) && (
                          <div className="mt-1 text-sm text-white/70 truncate" title={`${featuredProject.projectName || featuredProject.productName || '-'}${featuredProject.companyName ? ` (${featuredProject.companyName})` : ''}`}>
                            {featuredProject.projectName || featuredProject.productName || '-'}
                            {featuredProject.companyName ? ` (${featuredProject.companyName})` : ''}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-white/50 whitespace-nowrap">
                        최근 수정 · {formatDate(featuredProject.updatedAt)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-white/60">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                        진행율 {featuredProject.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, featuredProject.progress))}%` }}
                      />
                    </div>
                  </button>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-xs text-white/40">
                    현재 할당된 시험이 없습니다.
                  </div>
                )}
                {otherProjects.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[11px] text-white/50 mb-2">최근 수정 순</div>
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
                                ? 'border-purple-400/70 bg-white/15 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)]'
                                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                            }`}
                          >
                            <div className="text-xs text-white/50 mb-1">시험번호</div>
                            <div className="font-semibold tracking-wide">{project.testNumber}</div>
                            <div className="mt-1 text-sm text-white/70 truncate" title={`${project.projectName || project.productName || '-'}${project.companyName ? ` (${project.companyName})` : ''}`}>
                              {project.projectName || project.productName || '-'}
                              {project.companyName ? ` (${project.companyName})` : ''}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
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
                          className="w-9 shrink-0 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
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
                      <div className="text-sm font-semibold text-white/90">사용자 선택 필요</div>
                      <div className="mt-1 text-xs text-white/60">
                        시험 목록은 사용자 선택 후 확인할 수 있습니다.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          <div className="space-y-6">
            {flowMode === 'create' && (
            <div className="mb-2">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-indigo-300/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-100">2단계</span>
                  시험 번호 입력 후 저장
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.testNumber ? 'border-emerald-300/50 text-emerald-200' : 'border-white/20 text-white/50'}`}>
                  {sectionDone.testNumber ? '완료' : '미완료'}
                </span>
              </div>
              <div className="h-11 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                <List size={16} className="text-white/50" />
                <input
                  className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
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
                        ? 'border-purple-300/60 bg-purple-500/20 text-white hover:bg-purple-500/30'
                        : 'border-white/10 text-white/30 cursor-not-allowed'
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

            {flowMode === 'create' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-white/70 block">
                  <span className="mr-2 inline-flex rounded-md border border-indigo-300/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-100">5단계</span>
                  시험 합의서 업로드
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.agreement ? 'border-emerald-300/50 text-emerald-200' : 'border-white/20 text-white/50'}`}>
                  {sectionDone.agreement ? '완료' : '미완료'}
                </span>
              </div>
              <div className="min-h-[230px] border border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                <UploadCloud size={28} className="text-white/60" />
                <div className="text-sm font-semibold text-white/80">시험 합의서</div>
                <div className="text-xs text-white/50">드래그 파일을 업로드하세요.</div>
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
                    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] text-white/70">
                      {statusLabel}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAgreementDeleteConfirmOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 hover:text-white"
                      title="시험 합의서 삭제"
                      aria-label="시험 합의서 삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                  <div className="text-xs text-white/50 mb-1 flex justify-between">
                    <span>{agreementParsed?.parseStatus === 'pending' ? '분석 중' : '대기'}</span>
                    <span>{hasAgreementDoc ? '업로드됨' : '미업로드'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                      style={{ width: agreementParsed?.parseStatus === 'pending' ? '60%' : '20%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            )}

            {flowMode === 'existing' ? (
              <div className="mt-5 relative">
                {!currentUserId && (
                  <div className="absolute inset-0 z-10 rounded-2xl bg-[var(--overlay-backdrop)] backdrop-blur-[2px] flex items-center justify-center text-center px-4">
                    <div>
                      <div className="text-sm font-semibold text-white/90">사용자 선택 필요</div>
                      <div className="mt-1 text-xs text-white/60">
                        시험 정보 확인은 사용자 선택 후 가능합니다.
                      </div>
                    </div>
                  </div>
                )}
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm text-white/70">
                    <span className="mr-2 inline-flex rounded-md border border-indigo-300/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-100">3단계</span>
                    시험 정보 확인
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.info ? 'border-emerald-300/50 text-emerald-200' : 'border-white/20 text-white/50'}`}>
                    {sectionDone.info ? '완료' : '미완료'}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="text-[11px] text-white/50">시험번호</div>
                    <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3">
                      <input
                        className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                        value={selectedProject?.testNumber || trimmedTestNumber || ''}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-white/50">담당 PL</div>
                    <div className="h-11 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                      <Building2 size={16} className="text-white/50" />
                      <select
                        value={plId}
                        onChange={(e) => onChangePlId(e.target.value)}
                        className="h-full bg-transparent w-full text-sm text-white/80 focus:outline-none"
                      >
                        <option value="" className="text-gray-900">담당 PL 선택</option>
                        {plDirectory.map((pl) => (
                          <option key={pl.id} value={pl.id} className="text-gray-900">
                            {pl.name} {pl.role ? `(${pl.role})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      
                      <CalendarInput label="시작일" value={scheduleStartDate} onChange={onChangeScheduleStartDate} />
                    </div>
                    <div className="space-y-1">
                      
                      <CalendarInput label="종료일" value={scheduleEndDate} onChange={onChangeScheduleEndDate} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-[11px] text-white/50">제품명</div>
                      <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                        <input
                          className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                          placeholder="제품명"
                          value={projectName}
                          onChange={(e) => onUpdateManualInfo({ projectName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-white/50">업체명</div>
                      <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                        <input
                          className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                          placeholder="업체명"
                          value={companyName}
                          onChange={(e) => onUpdateManualInfo({ companyName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-white/50">담당자</div>
                      <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                        <input
                          className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                          placeholder="담당자"
                          value={companyContactName}
                          onChange={(e) => onUpdateManualInfo({ companyContactName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-white/50">연락처</div>
                      <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                        <input
                          className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                          placeholder="연락처"
                          value={companyContactPhone}
                          onChange={(e) => onUpdateManualInfo({ companyContactPhone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <div className="text-[11px] text-white/50">이메일</div>
                      <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                        <input
                          className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                          placeholder="이메일"
                          value={companyContactEmail}
                          onChange={(e) => onUpdateManualInfo({ companyContactEmail: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-white/70">
                  <span className="mr-2 inline-flex rounded-md border border-indigo-300/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-100">6단계</span>
                  시험 정보 입력
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sectionDone.info ? 'border-emerald-300/50 text-emerald-200' : 'border-white/20 text-white/50'}`}>
                  {sectionDone.info ? '완료' : '미완료'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <input
                    className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                    placeholder="제품명"
                    value={projectName}
                    onChange={(e) => onUpdateManualInfo({ projectName: e.target.value })}
                  />
                </div>
                <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <input
                    className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                    placeholder="업체명"
                    value={companyName}
                    onChange={(e) => onUpdateManualInfo({ companyName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <input
                    className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                    placeholder="담당자"
                    value={companyContactName}
                    onChange={(e) => onUpdateManualInfo({ companyContactName: e.target.value })}
                  />
                </div>
                <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <input
                    className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                    placeholder="연락처"
                    value={companyContactPhone}
                    onChange={(e) => onUpdateManualInfo({ companyContactPhone: e.target.value })}
                  />
                </div>
                <div className="h-11 md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <input
                    className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                    placeholder="이메일"
                    value={companyContactEmail}
                    onChange={(e) => onUpdateManualInfo({ companyContactEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
            )}

            {agreementParsed?.parseStatus === 'parsed' && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white/80">시험환경 정보</div>
                  <button
                    type="button"
                    onClick={() => {
                      setAgreementModalStatus('parsed');
                      setAgreementModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:text-white hover:bg-white/20"
                  >
                    <Eye size={12} />
                    상세 보기
                  </button>
                </div>

                <div>
                  <div className="text-[11px] text-white/50 mb-2">기본 정보</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">시험신청번호</div>
                      <div className={`text-xs ${agreementParsed.applicationNumber ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.applicationNumber || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">계약 유형</div>
                      <div className={`text-xs ${agreementParsed.contractType ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.contractType || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">인증 유형</div>
                      <div className={`text-xs ${agreementParsed.certificationType ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.certificationType || '미추출'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-white/50 mb-2">시험 정보</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">시험 대상</div>
                      <div className={`text-xs ${agreementParsed.testTarget ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.testTarget || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">시험 소요일</div>
                      <div className={`text-xs ${agreementParsed.workingDays ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.workingDays ? `${agreementParsed.workingDays}일` : '미추출'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-white/50 mb-2">시험환경</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">서버 유무</div>
                      <div className={`text-xs ${agreementParsed.hasServer ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.hasServer || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">필요 장비 수</div>
                      <div className={`text-xs ${agreementParsed.requiredEquipmentCount ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.requiredEquipmentCount || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">운영체제</div>
                      <div className={`text-xs ${agreementParsed.operatingSystem ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.operatingSystem || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">하드웨어 사양</div>
                      <div className={`text-xs ${agreementParsed.hardwareSpec ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.hardwareSpec || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">네트워크 환경</div>
                      <div className={`text-xs ${agreementParsed.networkEnvironment ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.networkEnvironment || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/40">기타 환경</div>
                      <div className={`text-xs ${agreementParsed.otherEnvironment ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.otherEnvironment || '미추출'}
                      </div>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <div className="text-[10px] text-white/40">장비 준비</div>
                      <div className={`text-xs ${agreementParsed.equipmentPreparation ? 'text-white/80' : 'text-white/30'}`}>
                        {agreementParsed.equipmentPreparation || '미추출'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  className="w-full max-w-xs rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/20"
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
                  className={`w-full max-w-xs rounded-xl py-3 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_20px_rgba(88,120,255,0.6)] transition ${
                    canProceed ? 'hover:opacity-90' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  시험 시작
                </button>
              </div>
              {!canProceed && (
                <div className="text-xs text-white/60">
                  필수 입력: {missingFields.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AccessDeniedModal
        open={accessDeniedOpen && !!accessDeniedInfo}
        onClose={() => setAccessDeniedOpen(false)}
        testerName={accessDeniedInfo?.testerName ?? ''}
        plName={accessDeniedInfo?.plName ?? ''}
      />

      {agreementModalOpen && agreementModalStatus === 'parsed' && agreementParsed && (
        <AgreementVerifyModal
          open
          onClose={() => setAgreementModalOpen(false)}
          parsed={agreementParsed}
          onSave={onVerifiedSave}
        />
      )}

      <AgreementFailedModal
        open={agreementModalOpen && agreementModalStatus === 'failed'}
        onClose={() => setAgreementModalOpen(false)}
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
        onSelectProject={(testNumber) => {
          onSelectProject(testNumber);
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
