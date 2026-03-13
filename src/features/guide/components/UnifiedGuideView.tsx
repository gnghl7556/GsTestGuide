import { useState } from 'react';
import { useGuides } from '../../../hooks/useGuides';
import { GuideListSidebar } from './GuideListSidebar';
import { WritingGuideContent } from './WritingGuideContent';

interface UnifiedGuideViewProps {
  /** 초기 선택 가이드 ID */
  initialGuideId?: string;
  /** 사이드바 포함 여부 (false면 콘텐츠만 렌더링) */
  showSidebar?: boolean;
}

export function UnifiedGuideView({
  initialGuideId,
  showSidebar = true,
}: UnifiedGuideViewProps) {
  const guides = useGuides();
  const [activeGuideId, setActiveGuideId] = useState<string | null>(
    initialGuideId ?? guides[0]?.id ?? null
  );

  const activeGuide = guides.find((g) => g.id === activeGuideId) ?? guides[0] ?? null;

  if (guides.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-tx-muted">참고 가이드가 없습니다.</p>
      </div>
    );
  }

  const content = activeGuide ? (
    <WritingGuideContent guide={activeGuide} />
  ) : (
    <div className="h-full flex items-center justify-center p-6">
      <p className="text-sm text-tx-muted">참고 가이드를 선택해주세요.</p>
    </div>
  );

  if (!showSidebar) {
    return <div className="h-full">{content}</div>;
  }

  return (
    <div className="flex h-full">
      <div className="w-56 shrink-0 border-r border-ln overflow-y-auto">
        <GuideListSidebar
          guides={guides}
          activeGuideId={activeGuide?.id ?? null}
          onSelectGuide={setActiveGuideId}
        />
      </div>
      <div className="flex-1 min-w-0">{content}</div>
    </div>
  );
}
