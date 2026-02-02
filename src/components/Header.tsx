import { ShieldCheck, CheckCircle2, AlertCircle, Clock, FileDown, Download, Upload } from 'lucide-react';
import { CATEGORY_THEMES, type ReviewData } from '../data/constants';
import { type ChecklistItem } from '../utils/checklistGenerator';

interface HeaderProps { 
  reviewData: Record<string, ReviewData>; 
  activeCategory: string;
  onExportReport: () => void;
  checklist: ChecklistItem[];
  onExportProject: () => void;
  onImportProject: () => void;
  onOpenPlDirectory: () => void;
  onOpenTestSetup: () => void;
  showBack: boolean;
  onBack: () => void;
  testInfo: {
    testNumber: string;
    plName: string;
    plPhone: string;
    plEmail: string;
    testerName: string;
    testerPhone: string;
    testerEmail: string;
    companyContactName: string;
    companyContactPhone: string;
    companyContactEmail: string;
    scheduleWorkingDays: string;
    scheduleStartDate: string;
    scheduleDefect1: string;
    scheduleDefect2: string;
    schedulePatchDate: string;
    scheduleEndDate: string;
  };
  onTestInfoChange: (field: string, value: string) => void;
}

type InfoFieldProps = {
  label?: string;
  value: string;
  field: string;
  placeholder?: string;
  onChange: (field: string, value: string) => void;
};

function InfoField({ label, value, field, placeholder, onChange }: InfoFieldProps) {
  return (
    <label className="block text-[11px] font-semibold text-slate-500">
      {label ? <span className="block mb-1">{label}</span> : null}
      <input
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder || '미등록'}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
      />
    </label>
  );
}

export function Header({
  reviewData,
  activeCategory,
  onExportReport,
  checklist,
  onExportProject,
  onImportProject,
  onOpenPlDirectory,
  onOpenTestSetup,
  showBack,
  onBack,
  testInfo,
  onTestInfoChange
}: HeaderProps) {
  const theme = CATEGORY_THEMES[activeCategory as keyof typeof CATEGORY_THEMES] || CATEGORY_THEMES['BEFORE'];
  const applicableItems = checklist.filter(item => item.status !== 'Not_Applicable');
  const stats = applicableItems.reduce(
    (acc, item) => {
      const status = reviewData[item.id]?.status ?? 'None';
      if (status === 'Verified') acc.verified += 1;
      else if (status === 'Cannot_Verify') acc.cannot += 1;
      else if (status === 'Hold') acc.hold += 1;
      else acc.none += 1;
      return acc;
    },
    { verified: 0, cannot: 0, hold: 0, none: 0 }
  );

  return (
    <header className="mb-3 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
      {/* 1열: 타이틀 및 통계 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${theme.bg}`}><ShieldCheck className={`w-5 h-5 ${theme.text}`} /></div>
          <div><h1 className="text-lg font-bold text-gray-900 leading-tight">GS 시험 가이드</h1></div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 flex items-center gap-1"><CheckCircle2 size={12} /> {stats.verified}</span>
          <span className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 flex items-center gap-1"><AlertCircle size={12} /> {stats.cannot}</span>
          <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100 flex items-center gap-1"><Clock size={12} /> {stats.hold}</span>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">미검토 {stats.none}</span>
          <button
            onClick={showBack ? onBack : onOpenPlDirectory}
            className="ml-2 px-3 py-1 rounded-md text-xs font-bold border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 bg-white transition-colors inline-flex items-center gap-1"
          >
            {showBack ? '돌아가기' : 'PL 담당자 관리'}
          </button>
          <button
            onClick={onOpenTestSetup}
            className="px-3 py-1 rounded-md text-xs font-bold border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 bg-white transition-colors inline-flex items-center gap-1"
          >
            시험 식별
          </button>
          <button
            onClick={onExportReport}
            className="px-3 py-1 rounded-md text-xs font-bold border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 bg-white transition-colors inline-flex items-center gap-1"
          >
            <FileDown size={12} />
            보고서 내보내기
          </button>
          <button
            onClick={onExportProject}
            className="px-2 py-1 rounded-md text-xs font-bold border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white transition-colors inline-flex items-center gap-1"
            aria-label="프로젝트 내보내기"
            title="프로젝트 내보내기"
          >
            <Download size={12} />
          </button>
          <button
            onClick={onImportProject}
            className="px-2 py-1 rounded-md text-xs font-bold border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white transition-colors inline-flex items-center gap-1"
            aria-label="프로젝트 불러오기"
            title="프로젝트 불러오기"
          >
            <Upload size={12} />
          </button>
        </div>
      </div>

      {/* 시험 정보 요약 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr] gap-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-600 mb-1">시험 번호</div>
          <InfoField onChange={onTestInfoChange} label="" value={testInfo.testNumber} field="testNumber" placeholder="미등록" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-600 mb-1">담당 PL</div>
          <div className="grid grid-cols-1 gap-1">
            <InfoField onChange={onTestInfoChange} label="성명" value={testInfo.plName} field="plName" />
            <InfoField onChange={onTestInfoChange} label="연락처" value={testInfo.plPhone} field="plPhone" />
            <InfoField onChange={onTestInfoChange} label="이메일" value={testInfo.plEmail} field="plEmail" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-600 mb-1">담당 시험원</div>
          <div className="grid grid-cols-1 gap-1">
            <InfoField onChange={onTestInfoChange} label="성명" value={testInfo.testerName} field="testerName" />
            <InfoField onChange={onTestInfoChange} label="연락처" value={testInfo.testerPhone} field="testerPhone" />
            <InfoField onChange={onTestInfoChange} label="이메일" value={testInfo.testerEmail} field="testerEmail" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-600 mb-1">업체 담당자</div>
          <div className="grid grid-cols-1 gap-1">
            <InfoField onChange={onTestInfoChange} label="성명" value={testInfo.companyContactName} field="companyContactName" />
            <InfoField onChange={onTestInfoChange} label="연락처" value={testInfo.companyContactPhone} field="companyContactPhone" />
            <InfoField onChange={onTestInfoChange} label="이메일" value={testInfo.companyContactEmail} field="companyContactEmail" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 lg:col-span-2">
          <div className="text-[11px] font-semibold text-slate-600 mb-1">시험 일정(Working day)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            <InfoField onChange={onTestInfoChange} label="시험일수" value={testInfo.scheduleWorkingDays} field="scheduleWorkingDays" />
            <InfoField onChange={onTestInfoChange} label="시작일" value={testInfo.scheduleStartDate} field="scheduleStartDate" />
            <InfoField onChange={onTestInfoChange} label="1차 결함" value={testInfo.scheduleDefect1} field="scheduleDefect1" />
            <InfoField onChange={onTestInfoChange} label="2차 결함" value={testInfo.scheduleDefect2} field="scheduleDefect2" />
            <InfoField onChange={onTestInfoChange} label="패치일" value={testInfo.schedulePatchDate} field="schedulePatchDate" />
            <InfoField onChange={onTestInfoChange} label="종료일" value={testInfo.scheduleEndDate} field="scheduleEndDate" />
          </div>
        </div>
      </div>
    </header>
  );
}
