import { Building2 } from 'lucide-react';
import { CalendarInput } from './CalendarInput';

interface PlEntry {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface TestInfoCardProps {
  testNumber: string;
  plId: string;
  scheduleStartDate: string;
  scheduleEndDate: string;
  productName: string;
  companyName: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  plDirectory: PlEntry[];
  agreementStatus?: 'pending' | 'parsed' | 'failed';
  onChangePlId: (v: string) => void;
  onChangeStartDate: (v: string) => void;
  onChangeEndDate: (v: string) => void;
  onChangeField: (field: string, value: string) => void;
}

export function TestInfoCard({
  testNumber,
  plId,
  scheduleStartDate,
  scheduleEndDate,
  productName,
  companyName,
  managerName,
  managerPhone,
  managerEmail,
  plDirectory,
  agreementStatus,
  onChangePlId,
  onChangeStartDate,
  onChangeEndDate,
  onChangeField
}: TestInfoCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/80">시험 정보</div>
        {agreementStatus === 'parsed' && (
          <span className="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-200">
            추출완료
          </span>
        )}
        {agreementStatus === 'failed' && (
          <span className="rounded-full border border-rose-300/50 bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-rose-200">
            추출실패
          </span>
        )}
        {agreementStatus === 'pending' && (
          <span className="rounded-full border border-amber-300/50 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200">
            추출 중
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 시험번호 — 읽기 전용 */}
        <div className="space-y-1">
          <div className="text-[11px] text-white/50">시험번호</div>
          <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3">
            <input
              className="h-full bg-transparent w-full text-sm text-white/80 focus:outline-none"
              value={testNumber}
              readOnly
            />
          </div>
        </div>

        {/* 담당 PL — 드롭다운 */}
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

        {/* 시작일 */}
        <CalendarInput label="시작일" value={scheduleStartDate} onChange={onChangeStartDate} />

        {/* 종료일 */}
        <CalendarInput label="종료일" value={scheduleEndDate} onChange={onChangeEndDate} />
      </div>

      <div className="border-t border-white/10" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 제품명 */}
        <div className="space-y-1">
          <div className="text-[11px] text-white/50">제품명</div>
          <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
            <input
              className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
              placeholder="제품명"
              value={productName}
              onChange={(e) => onChangeField('projectName', e.target.value)}
            />
          </div>
        </div>

        {/* 업체명 */}
        <div className="space-y-1">
          <div className="text-[11px] text-white/50">업체명</div>
          <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
            <input
              className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
              placeholder="업체명"
              value={companyName}
              onChange={(e) => onChangeField('companyName', e.target.value)}
            />
          </div>
        </div>

        {/* 담당자 */}
        <div className="space-y-1">
          <div className="text-[11px] text-white/50">담당자</div>
          <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
            <input
              className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
              placeholder="담당자"
              value={managerName}
              onChange={(e) => onChangeField('companyContactName', e.target.value)}
            />
          </div>
        </div>

        {/* 연락처 */}
        <div className="space-y-1">
          <div className="text-[11px] text-white/50">연락처</div>
          <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
            <input
              className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
              placeholder="연락처"
              value={managerPhone}
              onChange={(e) => onChangeField('companyContactPhone', e.target.value)}
            />
          </div>
        </div>

        {/* 이메일 — 전체 너비 */}
        <div className="space-y-1 md:col-span-2">
          <div className="text-[11px] text-white/50">이메일</div>
          <div className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:ring-2 focus-within:ring-purple-500/60">
            <input
              className="h-full bg-transparent w-full text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
              placeholder="이메일"
              value={managerEmail}
              onChange={(e) => onChangeField('companyContactEmail', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
