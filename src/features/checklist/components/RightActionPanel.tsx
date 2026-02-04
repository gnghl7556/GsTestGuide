import { useState } from 'react';
import type { ChecklistItem, ReviewData, QuickDecision } from '../../../types';
import { Check, AlertCircle, Clock, FileText, ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';

interface RightActionPanelProps {
  activeItem: ChecklistItem | undefined;
  reviewData: Record<string, ReviewData>;
  updateReviewData: (id: string, field: keyof ReviewData, value: ReviewData[keyof ReviewData]) => void;
  evidenceChips: string[];
  recommendation: QuickDecision;
  canReview: boolean;
}

type StatusButtonProps = {
  type: ReviewData['status'];
  label: string;
  icon: LucideIcon;
  activeClass: string;
  isDisabled: boolean;
  currentStatus: ReviewData['status'];
  recommendation: QuickDecision;
  onSelect: (next: ReviewData['status']) => void;
};

function StatusButton({
  type,
  label,
  icon: Icon,
  activeClass,
  isDisabled,
  currentStatus,
  recommendation,
  onSelect
}: StatusButtonProps) {
  const isActive = currentStatus === type;
  const isRecommended =
    (recommendation === 'PASS' && type === 'Verified') ||
    (recommendation === 'FAIL' && type === 'Cannot_Verify') ||
    (recommendation === 'HOLD' && type === 'Hold');
  const recommendClass: Record<ReviewData['status'], string> = {
    Verified: 'border-2 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.25)]',
    Cannot_Verify: 'border-2 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.25)]',
    Hold: 'border-2 border-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
    None: 'border-2 border-gray-300'
  };

  return (
    <button
      disabled={isDisabled}
      onClick={() => onSelect(isActive ? 'None' : type)}
      className={`flex-1 py-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
        isDisabled ? 'opacity-40 cursor-not-allowed bg-gray-50' : ''
      } ${
        isActive
          ? activeClass
          : `bg-white text-gray-400 hover:bg-gray-50 ${isRecommended ? recommendClass[type] : 'border-gray-200'}`
      }`}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

export function RightActionPanel({ activeItem, reviewData, updateReviewData, evidenceChips, recommendation, canReview }: RightActionPanelProps) {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(true);
  
  if (!activeItem) return <div className="lg:col-span-3" />;
  
  const currentReview = reviewData[activeItem.id] || { docName: '', page: '', status: 'None', comment: '' };
  const isDisabled = activeItem.status === 'Not_Applicable' || !canReview;
  const recommendationLabel: Record<QuickDecision, string> = {
    PASS: '적합',
    FAIL: '불가',
    HOLD: '보류'
  };
  const recommendationClass: Record<QuickDecision, string> = {
    PASS: 'bg-green-50 text-green-700 border-green-100',
    FAIL: 'bg-red-50 text-red-600 border-red-100',
    HOLD: 'bg-yellow-50 text-yellow-700 border-yellow-100'
  };

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-extrabold text-gray-800 tracking-wider flex items-center gap-2 mb-2">
          검토 결과 판정
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="필수" />
        </h3>
        <div className={`inline-flex items-center gap-2 text-[10px] font-bold px-2 py-1 rounded border mb-3 ${recommendationClass[recommendation]}`}>
          추천: {recommendationLabel[recommendation]}
        </div>
        {!canReview && (
          <div className="mb-2 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            질문에 대한 답변을 모두 입력한 후 판정할 수 있습니다.
          </div>
        )}
        <div className="flex gap-2">
          <StatusButton
            type="Verified"
            label="적합"
            icon={Check}
            activeClass="bg-green-600 border-green-600 text-white shadow-md shadow-green-200"
            isDisabled={isDisabled}
            currentStatus={currentReview.status}
            recommendation={recommendation}
            onSelect={(next) => updateReviewData(activeItem.id, 'status', next)}
          />
          <StatusButton
            type="Cannot_Verify"
            label="불가"
            icon={AlertCircle}
            activeClass="bg-red-50 border-red-500 text-red-600 ring-1 ring-red-200"
            isDisabled={isDisabled}
            currentStatus={currentReview.status}
            recommendation={recommendation}
            onSelect={(next) => updateReviewData(activeItem.id, 'status', next)}
          />
          <StatusButton
            type="Hold"
            label="보류"
            icon={Clock}
            activeClass="bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-200"
            isDisabled={isDisabled}
            currentStatus={currentReview.status}
            recommendation={recommendation}
            onSelect={(next) => updateReviewData(activeItem.id, 'status', next)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 의견 작성란 */}
        <div>
           <label className="text-sm font-extrabold text-gray-800 tracking-wider mb-1.5 flex items-center gap-2">
             검토 의견 / 메모
             <span className="h-2 w-2 rounded-full bg-gray-300" aria-label="선택" />
           </label>
           <textarea 
             disabled={isDisabled}
             value={currentReview.comment} 
             onChange={(e) => updateReviewData(activeItem.id, 'comment', e.target.value)} 
             placeholder={isDisabled ? "미적용 항목입니다." : "검토 의견을 입력하세요..."}
             className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none bg-white min-h-[120px] resize-none transition-all disabled:bg-gray-100" 
           />
        </div>

        {/* 증빙 자료 섹션 */}
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
           <button onClick={() => setIsEvidenceOpen(!isEvidenceOpen)} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b border-gray-100">
             <div className="flex items-center gap-2">
               <FileText size={14} className="text-gray-500" />
               <span className="font-extrabold text-gray-800 text-sm tracking-wider">증빙 문서 매핑</span>
               <span className="h-2 w-2 rounded-full bg-gray-300" aria-label="선택" />
             </div>
             {isEvidenceOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
           </button>
           
           {isEvidenceOpen && (
             <div className="p-3 space-y-2 animate-in slide-in-from-top-1">
              {evidenceChips.length > 0 && (
                <div className={`flex flex-wrap gap-2 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  {evidenceChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const next = currentReview.docName
                          ? currentReview.docName.includes(chip)
                            ? currentReview.docName
                            : `${currentReview.docName}, ${chip}`
                          : chip;
                        updateReviewData(activeItem.id, 'docName', next);
                      }}
                      className="text-[10px] font-semibold px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 bg-white"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
               <input 
                 disabled={isDisabled}
                 type="text" value={currentReview.docName} 
                 onChange={(e) => updateReviewData(activeItem.id, 'docName', e.target.value)} 
                 placeholder="문서명 (예: SRS)" 
                 className="w-full text-xs p-2.5 border border-gray-200 rounded outline-none focus:border-blue-500 transition-all disabled:bg-gray-100" 
               />
               <input 
                 disabled={isDisabled}
                 type="text" value={currentReview.page} 
                 onChange={(e) => updateReviewData(activeItem.id, 'page', e.target.value)} 
                 placeholder="페이지/섹션 (예: p.42)" 
                 className="w-full text-xs p-2.5 border border-gray-200 rounded outline-none focus:border-blue-500 transition-all disabled:bg-gray-100" 
               />
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
