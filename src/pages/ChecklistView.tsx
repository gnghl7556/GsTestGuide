import { NavSidebar } from '../components/NavSidebar';
import { CenterDisplay } from '../components/CenterDisplay';
import { RightActionPanel } from '../components/RightActionPanel';
import type { ChecklistItem } from '../utils/checklistGenerator';
import type {
  QuickAnswer,
  QuickModeItem,
  QuickQuestionId,
  QuickReviewAnswer
} from '../utils/quickMode';
import type { ReviewData } from '../data/constants';

type QuickInputValues = NonNullable<QuickReviewAnswer['inputValues']>;
type QuickInputValue = QuickInputValues[string];

type ChecklistViewProps = {
  checklist: ChecklistItem[];
  reviewData: Record<string, ReviewData>;
  quickReviewById: Record<string, QuickReviewAnswer>;
  selectedReqId: string | null;
  setSelectedReqId: (id: string | null) => void;
  activeItem?: ChecklistItem;
  activeIndex: number;
  quickModeItem?: QuickModeItem;
  quickAnswers: Record<string, QuickAnswer>;
  quickInputValues: QuickInputValues;
  onQuickAnswer: (itemId: string, questionId: QuickQuestionId, value: QuickAnswer) => void;
  onInputChange: (itemId: string, fieldId: string, value: QuickInputValue) => void;
  onSelectQuestion: (itemId: string, questionId: QuickQuestionId) => void;
  onOpenFeatureManager: () => void;
  onOpenTestCaseManager: () => void;
  updateReviewData: (id: string, field: keyof ReviewData, value: ReviewData[keyof ReviewData]) => void;
  recommendation: QuickReviewAnswer['autoRecommendation'];
  canReview: boolean;
};

export function ChecklistView({
  checklist,
  reviewData,
  quickReviewById,
  selectedReqId,
  setSelectedReqId,
  activeItem,
  activeIndex,
  quickModeItem,
  quickAnswers,
  quickInputValues,
  onQuickAnswer,
  onInputChange,
  onSelectQuestion,
  onOpenFeatureManager,
  onOpenTestCaseManager,
  updateReviewData,
  recommendation,
  canReview
}: ChecklistViewProps) {
  return (
    <div className="flex-1 grid grid-cols-[2.7fr_6.3fr_3fr] gap-4 min-h-0 pb-2">
      <div className="h-full overflow-hidden">
        <NavSidebar
          checklist={checklist}
          reviewData={reviewData}
          quickReviewById={quickReviewById}
          selectedReqId={selectedReqId}
          setSelectedReqId={setSelectedReqId}
          activeCategory={activeItem?.category || 'BEFORE'}
          onSelectQuestion={onSelectQuestion}
          onOpenFeatureManager={onOpenFeatureManager}
          onOpenTestCaseManager={onOpenTestCaseManager}
        />
      </div>

      <div className="h-full overflow-hidden">
        <CenterDisplay
          activeItem={activeItem}
          displayIndex={activeIndex}
          quickModeItem={quickModeItem}
          quickAnswers={quickAnswers}
          onQuickAnswer={onQuickAnswer}
          inputValues={quickInputValues}
          onInputChange={onInputChange}
        />
      </div>

      <div className="h-full overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        <RightActionPanel
          activeItem={activeItem}
          reviewData={reviewData}
          updateReviewData={updateReviewData}
          evidenceChips={quickModeItem?.evidenceChips || []}
          recommendation={recommendation}
          canReview={canReview}
        />
      </div>
    </div>
  );
}
