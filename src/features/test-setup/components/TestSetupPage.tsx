import { useEffect, useMemo, useRef, useState } from 'react';
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

interface TestSetupPageProps {
  testNumber: string;
  plId: string;
  scheduleStartDate: string;
  scheduleEndDate: string;
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
  onUploadAgreementDoc: (file: File) => void | Promise<void>;
  onDeleteAgreementDoc: () => void | Promise<void>;
  showAgreementModal: boolean;
  isParsingAgreement: boolean;
  parsingTestNumber: string | null;
  onAgreementModalConsumed: () => void;
  onStartProject: () => Promise<{ ok: boolean; reason?: string }>;
  canProceed: boolean;
}

export function TestSetupPage({
  testNumber,
  plId,
  scheduleStartDate,
  scheduleEndDate,
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
  onUploadAgreementDoc,
  onDeleteAgreementDoc,
  showAgreementModal,
  isParsingAgreement,
  parsingTestNumber,
  onAgreementModalConsumed,
  onStartProject,
  canProceed
}: TestSetupPageProps) {
  const trimmedTestNumber = testNumber.trim();
  const hasTestNumber = Boolean(trimmedTestNumber);
  const availableDocs = useMemo(() => docs.filter((item) => item.docType && (item.fileName || item.url)), [docs]);
  const normalizeUpdatedAt = (value: Project['updatedAt']) => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return value.toDate().getTime();
    }
    return 0;
  };
  const visibleProjects = useMemo(
    () =>
      projects
        .filter((project) => project.testerId === currentUserId || project.createdBy === currentUserId)
        .map((project) => ({
          ...project,
          progress: progressByTestNumber[project.testNumber] ?? 0
        }))
        .sort((a, b) => normalizeUpdatedAt(b.updatedAt) - normalizeUpdatedAt(a.updatedAt)),
    [projects, currentUserId, progressByTestNumber]
  );
  const canSaveTestNumber = Boolean(
    trimmedTestNumber &&
      currentUserId &&
      !visibleProjects.some((project) => project.testNumber === trimmedTestNumber)
  );
  const featuredProject = visibleProjects[0];
  const otherProjects = visibleProjects.slice(1);
  const formatDate = (value?: Project['updatedAt']) => {
    const millis = normalizeUpdatedAt(value ?? 0);
    if (!millis) return '미기록';
    const date = new Date(millis);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const agreementDoc = useMemo(
    () => docs.find((item) => item.docType === '시험 합의서' && (item.fileName || item.url)),
    [docs]
  );
  const missingFields = [
    !trimmedTestNumber ? '시험번호' : null,
    !plId ? '담당 PL' : null,
    !currentUserId ? '시험원' : null
  ].filter(Boolean) as string[];
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [agreementModalStatus, setAgreementModalStatus] = useState<'parsed' | 'failed' | null>(null);
  const prevStatusRef = useRef<AgreementParsed['parseStatus']>(undefined);
  const [agreementDeleteConfirmOpen, setAgreementDeleteConfirmOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState<{
    name: string;
    rank: UserRank | '';
    email: string;
    phone: string;
  }>({
    name: '',
    rank: '',
    email: '',
    phone: ''
  });
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [manageUsersOpen, setManageUsersOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);
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
    <div className="relative h-full w-full bg-gradient-to-br from-[#0a0f1f] via-[#0b1230] to-[#1a0f3a] flex items-center justify-center p-6">
      <div
        className="pointer-events-none absolute inset-0 blur-[120px] opacity-70 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/20"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-10 text-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            GS 인증 시험 시작
          </h1>
          <p className="mt-2 text-sm text-white/60">GS 인증 시험 시작을 확인하고 시작하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="text-sm text-white/70 mb-2 block">사용자 선택</label>
              {users.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4">
                  <p className="text-xs text-white/60">
                    등록된 사용자가 없습니다. 먼저 사용자 등록이 필요합니다.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <User size={16} className="text-white/50" />
                  <select
                    value={currentUserId}
                    onChange={(e) => onChangeUserId(e.target.value)}
                    className="bg-transparent w-full text-sm text-white/80 focus:outline-none"
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
            <div>
              <label className="text-sm text-white/70 mb-2 block">시험번호 선택</label>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-[11px] text-white/50 mb-2">
                  <List size={14} className="text-white/50" />
                  최근 작업 시험
                </div>
                {featuredProject ? (
                  <button
                    type="button"
                    onClick={() => onSelectProject(featuredProject.testNumber)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      trimmedTestNumber === featuredProject.testNumber
                        ? 'border-purple-400/80 bg-white/15 text-white shadow-[0_0_30px_rgba(124,58,237,0.35)]'
                        : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-white/50 mb-1">시험번호</div>
                        <div className="text-lg font-semibold tracking-wide">{featuredProject.testNumber}</div>
                      </div>
                      <div className="text-right text-[11px] text-white/50">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {otherProjects.map((project) => {
                        const isActive = trimmedTestNumber === project.testNumber;
                        return (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => onSelectProject(project.testNumber)}
                            className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                              isActive
                                ? 'border-purple-400/70 bg-white/15 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)]'
                                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                            }`}
                          >
                            <div className="text-xs text-white/50 mb-1">시험번호</div>
                            <div className="font-semibold tracking-wide">{project.testNumber}</div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                              <span>진행율 {project.progress}%</span>
                              <span>{formatDate(project.updatedAt)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">시험 일정</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CalendarInput label="시작일" value={scheduleStartDate} onChange={onChangeScheduleStartDate} />
                <CalendarInput label="종료일" value={scheduleEndDate} onChange={onChangeScheduleEndDate} />
              </div>
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">담당 PL</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-purple-500/60">
                <Building2 size={16} className="text-white/50" />
                <select
                  value={plId}
                  onChange={(e) => onChangePlId(e.target.value)}
                  className="bg-transparent w-full text-sm text-white/80 focus:outline-none"
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
          </div>

            <div>
              <div className="mb-5">
                <label className="text-sm text-white/70 mb-2 block">시험 번호</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-purple-500/60">
                  <List size={16} className="text-white/50" />
                  <input
                    className="bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                    placeholder="예: GS-A-25-0226"
                    value={trimmedTestNumber}
                    onChange={(e) => onChangeTestNumber(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => onSaveTestNumber(trimmedTestNumber)}
                    disabled={!canSaveTestNumber}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${
                      canSaveTestNumber
                        ? 'border-purple-300/60 bg-purple-500/20 text-white hover:bg-purple-500/30'
                        : 'border-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    저장
                  </button>
                </div>
                {visibleProjects.length === 0 && (
                  <div className="mt-2 text-[11px] text-white/40">
                    진행 중인 시험이 없습니다. 새 시험번호를 입력 후 저장하세요.
                  </div>
                )}
              </div>
              <label className="text-sm text-white/70 mb-2 block">시험 합의서</label>
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
                <div className="absolute top-3 right-3 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] text-white/70">
                  {statusLabel}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                <div className="text-xs text-white/50 mb-1 flex justify-between">
                  <span>{agreementParsed?.parseStatus === 'pending' ? '분석 중' : '대기'}</span>
                  <span>{agreementDoc ? '업로드됨' : '미업로드'}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                    style={{ width: agreementDoc ? '100%' : agreementParsed?.parseStatus === 'pending' ? '60%' : '20%' }}
                  />
                </div>
              </div>
            </div>

            {availableDocs.length > 0 && agreementParsed?.parseStatus && (
              <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-white/60">추출된 정보</div>
                  <button
                    type="button"
                    onClick={() => setAgreementDeleteConfirmOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/60 hover:text-white"
                    title="시험 합의서 삭제"
                    aria-label="시험 합의서 삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {agreementParsed.parseStatus === 'parsed' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>시험신청번호: <span className="font-semibold text-white">{agreementParsed.applicationNumber || '-'}</span></div>
                    <div>계약 유형: <span className="font-semibold text-white">{agreementParsed.contractType || '-'}</span></div>
                    <div>인증 유형: <span className="font-semibold text-white">{agreementParsed.certificationType || '-'}</span></div>
                    <div>제품명: <span className="font-semibold text-white">{agreementParsed.productNameKo || '-'}</span></div>
                    <div>업체명: <span className="font-semibold text-white">{agreementParsed.companyName || '-'}</span></div>
                    <div>업무 담당자: <span className="font-semibold text-white">{agreementParsed.managerName || '-'}</span></div>
                    <div>연락처: <span className="font-semibold text-white">{agreementParsed.managerMobile || '-'}</span></div>
                    <div>이메일: <span className="font-semibold text-white">{agreementParsed.managerEmail || '-'}</span></div>
                  </div>
                ) : agreementParsed.parseStatus === 'failed' ? (
                  <div className="text-red-300">합의서 내용을 추출하지 못했습니다.</div>
                ) : (
                  <div className="text-white/60">추출 중입니다.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!canProceed) {
                window.alert(`필수 항목을 입력해주세요: ${missingFields.join(', ')}`);
                return;
              }
              const result = await onStartProject();
              if (!result.ok) {
                window.alert(`프로젝트 시작 실패: ${result.reason || '알 수 없는 오류'}`);
              }
            }}
            className={`w-full max-w-xs rounded-xl py-3 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_20px_rgba(88,120,255,0.6)] transition ${
              canProceed ? 'hover:opacity-90' : 'opacity-60 cursor-not-allowed'
            }`}
          >
            프로젝트 시작
          </button>
          {!canProceed && (
            <div className="text-xs text-white/60">
              필수 입력: {missingFields.join(', ')}
            </div>
          )}
        </div>
      </div>

      {agreementModalOpen && agreementModalStatus && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 p-6">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-extrabold text-slate-900">
                {agreementModalStatus === 'parsed' ? '합의서 추출 완료' : '합의서 추출 실패'}
              </div>
              <button
                type="button"
                onClick={() => setAgreementModalOpen(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                닫기
              </button>
            </div>
            <div className="px-5 py-4 text-sm text-slate-700">
              {agreementModalStatus === 'parsed' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>시험신청번호: <span className="font-semibold text-slate-900">{agreementParsed?.applicationNumber || '-'}</span></div>
                  <div>계약 유형: <span className="font-semibold text-slate-900">{agreementParsed?.contractType || '-'}</span></div>
                  <div>인증 유형: <span className="font-semibold text-slate-900">{agreementParsed?.certificationType || '-'}</span></div>
                  <div>제품명: <span className="font-semibold text-slate-900">{agreementParsed?.productNameKo || '-'}</span></div>
                  <div>업체명: <span className="font-semibold text-slate-900">{agreementParsed?.companyName || '-'}</span></div>
                  <div>업무 담당자: <span className="font-semibold text-slate-900">{agreementParsed?.managerName || '-'}</span></div>
                  <div>연락처: <span className="font-semibold text-slate-900">{agreementParsed?.managerMobile || '-'}</span></div>
                  <div>이메일: <span className="font-semibold text-slate-900">{agreementParsed?.managerEmail || '-'}</span></div>
                </div>
              ) : (
                <div className="text-sm text-red-600">합의서 내용을 추출하지 못했습니다. 파일을 다시 업로드하거나 형식을 확인해주세요.</div>
              )}
            </div>
            <div className="border-t border-slate-200 px-5 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setAgreementModalOpen(false)}
                className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {agreementDeleteConfirmOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/60 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-extrabold text-slate-900">시험 합의서 삭제</div>
              <button
                type="button"
                onClick={() => setAgreementDeleteConfirmOpen(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                닫기
              </button>
            </div>
            <div className="px-5 py-5 text-sm text-slate-700">
              기존 시험 합의서 파일을 삭제하시겠습니까?
              <span className="block mt-2 text-xs text-slate-500">(삭제 시, 추출한 정보가 초기화됩니다.)</span>
            </div>
            <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAgreementDeleteConfirmOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreementDeleteConfirmOpen(false);
                  onDeleteAgreementDoc();
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {createUserOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a] shadow-xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-extrabold">사용자 추가</div>
              <button
                type="button"
                onClick={() => {
                  setCreateUserOpen(false);
                  setCreateUserError(null);
                }}
                className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-white/60 hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-white/60 block mb-1">이름</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1">직급</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  value={newUserForm.rank}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, rank: e.target.value as UserRank | '' }))}
                  placeholder="선임"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1">이메일</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1">연락처</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                />
              </div>
              {createUserError && <div className="text-xs text-red-300">{createUserError}</div>}
            </div>
            <div className="border-t border-white/10 px-5 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateUserOpen(false);
                  setCreateUserError(null);
                }}
                className="rounded-md border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
              >
                취소
              </button>
              <button
                type="button"
                disabled={createUserLoading}
                onClick={async () => {
                  if (!newUserForm.name.trim()) {
                    setCreateUserError('이름을 입력해주세요.');
                    return;
                  }
                  if (hasDuplicateUser({ name: newUserForm.name, email: newUserForm.email })) {
                    setCreateUserError('이미 등록된 사용자입니다. 이름 또는 이메일을 확인해주세요.');
                    return;
                  }
                  setCreateUserError(null);
                  setCreateUserLoading(true);
                  const createdId = await onCreateUser({
                    name: newUserForm.name.trim(),
                    rank: (newUserForm.rank.trim() || '전임') as UserRank,
                    email: newUserForm.email.trim(),
                    phone: newUserForm.phone.trim()
                  });
                  setCreateUserLoading(false);
                  if (!createdId) {
                    setCreateUserError('사용자 생성에 실패했습니다.');
                    return;
                  }
                  onChangeUserId(createdId);
                  setCreateUserOpen(false);
                  setNewUserForm({ name: '', rank: '', email: '', phone: '' });
                }}
                className="rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(88,120,255,0.4)]"
              >
                {createUserLoading ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {manageUsersOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/70 p-6">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f172a] shadow-xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-extrabold">사용자 관리</div>
              <button
                type="button"
                onClick={() => setManageUsersOpen(false)}
                className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-white/60 hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="text-xs text-white/70">
                    <div className="text-sm font-semibold text-white/90">
                      {user.name} {user.rank ? `(${user.rank})` : ''}
                    </div>
                    <div>{user.email || '이메일 미등록'}</div>
                    <div>{user.phone || '연락처 미등록'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditUserForm({
                          id: user.id,
                          name: user.name || '',
                          rank: user.rank || '',
                          email: user.email || '',
                          phone: user.phone || ''
                        });
                        setEditUserError(null);
                        setEditUserOpen(true);
                      }}
                      className="rounded-md border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTargetUser({ id: user.id, name: user.name });
                        setDeleteUserConfirmOpen(true);
                      }}
                      className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/20"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-xs text-white/50">등록된 사용자가 없습니다.</div>
              )}
            </div>
            <div className="border-t border-white/10 px-5 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setCreateUserOpen(true)}
                className="rounded-md border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/20"
              >
                사용자 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {editUserOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a] shadow-xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-extrabold">사용자 수정</div>
              <button
                type="button"
                onClick={() => setEditUserOpen(false)}
                className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-white/60 hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-white/60 block mb-1">이름</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1">직급</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  value={editUserForm.rank}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, rank: e.target.value as UserRank | '' }))}
                />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1">이메일</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1">연락처</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              {editUserError && <div className="text-xs text-red-300">{editUserError}</div>}
            </div>
            <div className="border-t border-white/10 px-5 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditUserOpen(false)}
                className="rounded-md border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
              >
                취소
              </button>
              <button
                type="button"
                disabled={editUserLoading}
                onClick={async () => {
                  if (!editUserForm.name.trim()) {
                    setEditUserError('이름을 입력해주세요.');
                    return;
                  }
                  if (
                    hasDuplicateUser({
                      id: editUserForm.id,
                      name: editUserForm.name,
                      email: editUserForm.email
                    })
                  ) {
                    setEditUserError('이미 등록된 사용자입니다. 이름 또는 이메일을 확인해주세요.');
                    return;
                  }
                  setEditUserError(null);
                  setEditUserLoading(true);
                  const ok = await onUpdateUser(editUserForm.id, {
                    name: editUserForm.name.trim(),
                    rank: editUserForm.rank.trim() ? (editUserForm.rank.trim() as UserRank) : undefined,
                    email: editUserForm.email.trim(),
                    phone: editUserForm.phone.trim()
                  });
                  setEditUserLoading(false);
                  if (!ok) {
                    setEditUserError('사용자 수정에 실패했습니다.');
                    return;
                  }
                  setEditUserOpen(false);
                }}
                className="rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(88,120,255,0.4)]"
              >
                {editUserLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUserConfirmOpen && deleteTargetUser && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a] shadow-xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-extrabold">사용자 삭제</div>
              <button
                type="button"
                onClick={() => setDeleteUserConfirmOpen(false)}
                className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-white/60 hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="px-5 py-5 text-sm text-white/80">
              {deleteTargetUser.name} 사용자를 삭제하시겠습니까?
            </div>
            <div className="border-t border-white/10 px-5 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteUserConfirmOpen(false)}
                className="rounded-md border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await onDeleteUser(deleteTargetUser.id);
                  if (!ok) return;
                  setDeleteUserConfirmOpen(false);
                  setDeleteTargetUser(null);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {isParsing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] shadow-xl text-white">
            <div className="px-5 py-6 text-center space-y-3">
              <div className="text-sm font-extrabold">시험 합의서 분석 중</div>
              <div className="text-xs text-white/70">
                분석이 완료될 때까지 다른 작업이 잠시 제한됩니다.
              </div>
              <div className="mt-2 space-y-3 text-left">
                <div className="text-[11px] text-white/50">추출 단계 진행</div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                    style={{ width: `${parsingProgress}%` }}
                  />
                </div>
                <div className="text-[11px] text-white/40">
                  {parsingProgress}% 완료
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-white/50">
                  <span>1) 시험신청번호</span>
                  <span>2) 계약/인증 유형</span>
                  <span>3) 국문명/업체명</span>
                  <span>4) 담당자/연락처</span>
                </div>
              </div>
              <div className="text-[11px] text-white/50">허용 가능한 최대 시간: 약 3분</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
