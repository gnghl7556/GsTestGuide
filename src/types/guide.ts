/** 가이드 카테고리 */
export type GuideCategory = 'reference' | 'writing';

/** 가이드 섹션 (마크다운 ## heading 파싱 결과) */
export interface GuideSection {
  heading: string;
  content: string;
}

/** 통합 가이드 엔티티 */
export interface Guide {
  id: string;
  title: string;
  category: GuideCategory;
  icon: string;
  description: string;
  order: number;
  sections: GuideSection[];
  /** reference 카테고리 전용 — 체크포인트 목록 */
  checkPoints?: string[];
  /** reference 카테고리 전용 — TIP 내용 */
  tip?: string;
}

/** 데이터 소스 추적 */
export type GuideWithSource = Guide & {
  source: 'markdown' | 'firestore';
};
