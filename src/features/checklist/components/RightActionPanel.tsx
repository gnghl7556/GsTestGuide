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
    None: 'border-2 border-ln-strong'
  };

  return (
    <button
      disabled={isDisabled}
      onClick={() => onSelect(isActive ? 'None' : type)}
      className={`flex-1 py-2 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-all ${
        isDisabled ? 'opacity-40 cursor-not-allowed bg-surface-raised' : ''
      } ${
        isActive
          ? activeClass
          : `bg-surface-base text-tx-muted hover:bg-surface-raised ${isRecommended ? recommendClass[type] : 'border-ln'}`
      }`}
    >
      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[9px] font-bold">{label}</span>
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
    PASS: 'bg-status-pass-bg text-status-pass-text border-status-pass-border',
    FAIL: 'bg-status-fail-bg text-status-fail-text border-status-fail-border',
    HOLD: 'bg-status-hold-bg text-status-hold-text border-status-hold-border'
  };

  return (
    <div className="h-full bg-surface-base rounded-xl border border-ln shadow-sm flex flex-col overflow-hidden">
      <div className="px-3.5 py-3 border-b border-ln-subtle">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-tx-primary tracking-wide">검토 결과 판정</h3>
          <div className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${recommendationClass[recommendation]}`}>
            추천: {recommendationLabel[recommendation]}
          </div>
        </div>
        {!canReview && (
          <div className="mb-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-1 rounded-md">
            답변을 모두 입력한 후 판정할 수 있습니다.
          </div>
        )}
        <div className="flex gap-1.5">
          <StatusButton
            type="Verified"
            label="적합"
            icon={Check}
            activeClass="bg-green-600 border-green-600 text-white shadow-sm"
            isDisabled={isDisabled}
            currentStatus={currentReview.status}
            recommendation={recommendation}
            onSelect={(next) => updateReviewData(activeItem.id, 'status', next)}
          />
          <StatusButton
            type="Cannot_Verify"
            label="불가"
            icon={AlertCircle}
            activeClass="bg-red-50 dark:bg-red-500/15 border-red-500 text-red-600 dark:text-red-400"
            isDisabled={isDisabled}
            currentStatus={currentReview.status}
            recommendation={recommendation}
            onSelect={(next) => updateReviewData(activeItem.id, 'status', next)}
          />
          <StatusButton
            type="Hold"
            label="보류"
            icon={Clock}
            activeClass="bg-yellow-50 dark:bg-yellow-500/15 border-yellow-500 text-yellow-700 dark:text-yellow-400"
            isDisabled={isDisabled}
            currentStatus={currentReview.status}
            recommendation={recommendation}
            onSelect={(next) => updateReviewData(activeItem.id, 'status', next)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
        {/* 의견 작성란 */}
        <div>
           <label className="text-[10px] font-bold text-tx-muted uppercase tracking-wide mb-1 block">
             검토 의견
           </label>
           <textarea
             disabled={isDisabled}
             value={currentReview.comment}
             onChange={(e) => updateReviewData(activeItem.id, 'comment', e.target.value)}
             placeholder={isDisabled ? "미적용 항목입니다." : "검토 의견을 입력하세요..."}
             className="w-full text-xs p-2.5 border border-input-border rounded-md focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)]/20 outline-none bg-input-bg text-input-text placeholder-input-placeholder min-h-[90px] resize-none transition-all disabled:bg-surface-raised disabled:opacity-60"
           />
        </div>

        {/* 증빙 자료 섹션 */}
        <div className="border border-ln rounded-md bg-surface-base overflow-hidden">
           <button onClick={() => setIsEvidenceOpen(!isEvidenceOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-surface-sunken hover:bg-surface-raised transition-colors text-left border-b border-ln-subtle">
             <div className="flex items-center gap-1.5">
               <FileText size={12} className="text-tx-muted" />
               <span className="font-bold text-tx-secondary text-[11px]">증빙 문서 매핑</span>
             </div>
             {isEvidenceOpen ? <ChevronUp size={12} className="text-tx-muted" /> : <ChevronDown size={12} className="text-tx-muted" />}
           </button>

           {isEvidenceOpen && (
             <div className="p-2.5 space-y-2 animate-in slide-in-from-top-1">
              {evidenceChips.length > 0 && (
                <div className={`flex flex-wrap gap-1.5 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-ln text-tx-tertiary hover:border-ln-strong hover:text-tx-primary bg-surface-base transition-colors"
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
                 className="w-full text-[11px] px-2.5 py-1.5 border border-input-border rounded-md outline-none bg-input-bg text-input-text placeholder-input-placeholder focus:border-[var(--focus-ring)] transition-all disabled:bg-surface-raised disabled:opacity-60"
               />
               <input
                 disabled={isDisabled}
                 type="text" value={currentReview.page}
                 onChange={(e) => updateReviewData(activeItem.id, 'page', e.target.value)}
                 placeholder="페이지/섹션 (예: p.42)"
                 className="w-full text-[11px] px-2.5 py-1.5 border border-input-border rounded-md outline-none bg-input-bg text-input-text placeholder-input-placeholder focus:border-[var(--focus-ring)] transition-all disabled:bg-surface-raised disabled:opacity-60"
               />
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
