import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { NavSidebar } from '../components/NavSidebar';
import { CenterDisplay } from '../components/CenterDisplay';
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
  currentTestNumber
}: ChecklistViewProps) {
  const [showDefectBoard, setShowDefectBoard] = useState(false);
  return (
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
        <CenterDisplay
          activeItem={activeItem}
          displayIndex={activeIndex}
          quickModeItem={quickModeItem}
          quickAnswers={quickAnswers}
          onQuickAnswer={onQuickAnswer}
          inputValues={quickInputValues}
          onInputChange={onInputChange}
          itemGate={activeItem ? itemGates[activeItem.id] : undefined}
          isFinalized={isFinalized}
          activeQuestionIdx={activeQuestionIdx}
          onActiveQuestionChange={onActiveQuestionChange}
        />
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
  );
}
