import { useMemo, useState } from 'react';
import { ClipboardList, RefreshCw, X, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavSidebar } from '../components/NavSidebar';
import { CenterDisplay } from '../components/CenterDisplay';
import { ProgressDashboard } from '../components/ProgressDashboard';
import { RightActionPanel } from '../components/RightActionPanel';
import { HelperToolsPopup } from '../components/HelperToolsPopup';
import { ShortcutHelpOverlay } from '../components/ShortcutHelpOverlay';
import { DefectRefBoardModal } from '../../defects/components/DefectRefBoardModal';
import { DefectReportModal } from '../../defects/components/DefectReportModal';
import type {
  ChecklistItem,
  ExecutionItemGate,
  QuickAnswer,
  QuickModeItem,
  QuickReviewAnswer,
  ReviewData
} from '../../../types';

type QuickInputValues = NonNullable<QuickReviewAnswer['inputValues']>;
type QuickInputValue = QuickInputValues[string];

const CATEGORY_QUALITY_MAP: Record<string, string> = {
  SETUP: '시험환경',
  EXECUTION: '기능적합성',
  COMPLETION: '기능적합성'
};
const categoryToQuality = (category: string) => CATEGORY_QUALITY_MAP[category] || '';

type ChecklistViewProps = {
  checklist: ChecklistItem[];
  reviewData: Record<string, ReviewData>;
  quickReviewById: Record<string, QuickReviewAnswer>;
  quickModeById: Record<string, QuickModeItem>;
  selectedReqId: string | null;
  setSelectedReqId: (id: string | null) => void;
  activeItem?: ChecklistItem;
  activeIndex: number;
  quickModeItem?: QuickModeItem;
  quickAnswers: Record<string, QuickAnswer>;
  quickInputValues: QuickInputValues;
  onQuickAnswer: (itemId: string, questionId: string, value: QuickAnswer) => void;
  onInputChange: (itemId: string, fieldId: string, value: QuickInputValue) => void;
  itemGates: Record<string, ExecutionItemGate>;
  isFinalized: boolean;
  updateReviewData: (id: string, field: keyof ReviewData, value: ReviewData[keyof ReviewData]) => void;
  recommendation: QuickReviewAnswer['autoRecommendation'];
  canReview: boolean;
  activeQuestionIdx: number;
  onActiveQuestionChange: (idx: number) => void;
  showShortcutHelp: boolean;
  onDismissShortcutHelp: () => void;
  showDefectModal: boolean;
  onCloseDefectModal: () => void;
  currentTestNumber: string;
  contentUpdateNotice?: boolean;
  onDismissContentNotice?: () => void;
};

export function ChecklistView({
  checklist,
  reviewData,
  quickReviewById,
  quickModeById,
  selectedReqId,
  setSelectedReqId,
  activeItem,
  activeIndex,
  quickModeItem,
  quickAnswers,
  quickInputValues,
  onQuickAnswer,
  onInputChange,
  itemGates,
  isFinalized,
  updateReviewData,
  recommendation,
  canReview,
  activeQuestionIdx,
  onActiveQuestionChange,
  showShortcutHelp,
  onDismissShortcutHelp,
  showDefectModal,
  onCloseDefectModal,
  currentTestNumber,
  contentUpdateNotice,
  onDismissContentNotice
}: ChecklistViewProps) {
  const [showDefectBoard, setShowDefectBoard] = useState(false);
  const navigate = useNavigate();

  const finalizedStats = useMemo(() => {
    if (!isFinalized) return null;
    const total = checklist.length;
    const applicable = checklist.filter(i => i.status !== 'Not_Applicable').length;
    let pass = 0, fail = 0, hold = 0;
    for (const item of checklist) {
      const s = reviewData[item.id]?.status;
      if (s === 'Verified') pass++;
      else if (s === 'Cannot_Verify') fail++;
      else if (s === 'Hold') hold++;
    }
    return { total, applicable, pass, fail, hold };
  }, [isFinalized, checklist, reviewData]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {finalizedStats && (
        <div className="mb-3 rounded-xl border border-status-pass-border bg-status-pass-bg/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-status-pass-text shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-status-pass-text">검토 완료</h3>
                <p className="text-[11px] text-tx-secondary mt-0.5">최종 검토가 확정되었습니다. 읽기 전용 모드입니다.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/report')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ln bg-surface-base px-3 py-1.5 text-xs font-semibold text-tx-secondary hover:bg-surface-raised transition-colors"
            >
              <FileText size={13} />
              리포트 보기
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-surface-base/80 px-3 py-2 text-center">
              <div className="text-lg font-extrabold text-tx-primary">{finalizedStats.applicable}</div>
              <div className="text-[10px] text-tx-tertiary font-medium">점검 항목</div>
            </div>
            <div className="rounded-lg bg-surface-base/80 px-3 py-2 text-center">
              <div className="text-lg font-extrabold text-emerald-600">{finalizedStats.pass}</div>
              <div className="text-[10px] text-tx-tertiary font-medium flex items-center justify-center gap-1">
                <CheckCircle2 size={10} /> 적합
              </div>
            </div>
            <div className="rounded-lg bg-surface-base/80 px-3 py-2 text-center">
              <div className="text-lg font-extrabold text-red-500">{finalizedStats.fail}</div>
              <div className="text-[10px] text-tx-tertiary font-medium flex items-center justify-center gap-1">
                <AlertCircle size={10} /> 부적합
              </div>
            </div>
            <div className="rounded-lg bg-surface-base/80 px-3 py-2 text-center">
              <div className="text-lg font-extrabold text-yellow-600">{finalizedStats.hold}</div>
              <div className="text-[10px] text-tx-tertiary font-medium flex items-center justify-center gap-1">
                <Clock size={10} /> 보류
              </div>
            </div>
          </div>
        </div>
      )}
      {contentUpdateNotice && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-subtle px-3 py-2 text-xs text-accent-text animate-in slide-in-from-top-2 duration-200">
          <RefreshCw size={13} className="shrink-0" />
          <span className="flex-1 font-medium">관리자가 점검 항목 내용을 업데이트했습니다. 변경사항이 자동 반영되었습니다.</span>
          <button type="button" onClick={onDismissContentNotice} className="shrink-0 rounded p-0.5 hover:bg-accent/10 transition-colors">
            <X size={13} />
          </button>
        </div>
      )}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_clamp(280px,24vw,380px)] gap-5 min-h-0 pb-2">
      <div className="h-full overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <NavSidebar
            checklist={checklist}
            reviewData={reviewData}
            quickReviewById={quickReviewById}
            quickModeById={quickModeById}
            selectedReqId={selectedReqId}
            setSelectedReqId={setSelectedReqId}
            activeCategory={activeItem?.category || 'SETUP'}
            itemGates={itemGates}
          />
        </div>
        <div className="shrink-0 pt-2 space-y-1.5">
          <button
            type="button"
            onClick={() => setShowDefectBoard(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold border bg-surface-base text-tx-secondary border-ln hover:border-ln-strong hover:bg-surface-raised transition-all w-full"
          >
            <ClipboardList size={13} />
            결함 분류 기준표
          </button>
          <HelperToolsPopup />
        </div>
      </div>
      <DefectRefBoardModal open={showDefectBoard} onClose={() => setShowDefectBoard(false)} />

      <div className="h-full overflow-hidden">
        {activeItem ? (
          <CenterDisplay
            activeItem={activeItem}
            displayIndex={activeIndex}
            quickModeItem={quickModeItem}
            quickAnswers={quickAnswers}
            onQuickAnswer={onQuickAnswer}
            inputValues={quickInputValues}
            onInputChange={onInputChange}
            itemGate={itemGates[activeItem.id]}
            isFinalized={isFinalized}
            activeQuestionIdx={activeQuestionIdx}
            onActiveQuestionChange={onActiveQuestionChange}
          />
        ) : (
          <ProgressDashboard
            checklist={checklist}
            reviewData={reviewData}
            setSelectedReqId={setSelectedReqId}
          />
        )}
      </div>

      <div className="h-full overflow-hidden lg:col-span-2 2xl:col-span-1">
        <RightActionPanel
          activeItem={activeItem}
          reviewData={reviewData}
          updateReviewData={updateReviewData}
          evidenceChips={quickModeItem?.evidenceChips || []}
          recommendation={recommendation}
          canReview={canReview}
        />
      </div>
      {showShortcutHelp && <ShortcutHelpOverlay onDismiss={onDismissShortcutHelp} />}
      {showDefectModal && currentTestNumber && (
        <DefectReportModal
          open={showDefectModal}
          projectId={currentTestNumber}
          testCaseId={activeItem?.id || ''}
          onClose={onCloseDefectModal}
          initialContext={activeItem ? {
            linkedTestCaseId: activeItem.id,
            qualityCharacteristic: categoryToQuality(activeItem.category),
            accessPath: activeItem.title
          } : undefined}
        />
      )}
      </div>
    </div>
  );
}
