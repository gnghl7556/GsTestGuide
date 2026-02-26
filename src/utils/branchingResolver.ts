import type { BranchingRule } from '../lib/content/mergeOverrides';
import type { QuickAnswer, QuickQuestion } from '../types';

/**
 * 현재 답변 상태와 분기 규칙으로 건너뛸 질문 인덱스를 계산한다.
 * 분기 규칙이 없으면 빈 Set을 반환 (레거시 동작에는 영향 없음).
 */
export function computeSkippedIndices(
  questions: QuickQuestion[],
  answers: Record<string, QuickAnswer>,
  branchingRules?: BranchingRule[],
): Set<number> {
  const skipped = new Set<number>();
  if (!branchingRules || branchingRules.length === 0) return skipped;

  for (const rule of branchingRules) {
    const sourceQ = questions[rule.sourceIndex];
    if (!sourceQ) continue;

    if (answers[sourceQ.id] === rule.triggerAnswer) {
      for (const idx of rule.skipIndices) {
        if (idx >= 0 && idx < questions.length) {
          skipped.add(idx);
        }
      }
    }
  }

  return skipped;
}

/**
 * 현재 인덱스 이후 첫 번째 활성(건너뛰지 않은) 질문의 인덱스를 반환한다.
 * 없으면 -1.
 */
export function findNextActiveIndex(
  currentIdx: number,
  totalQuestions: number,
  skippedIndices: Set<number>,
): number {
  for (let i = currentIdx + 1; i < totalQuestions; i++) {
    if (!skippedIndices.has(i)) return i;
  }
  return -1;
}

/**
 * 현재 인덱스 이전 첫 번째 활성(건너뛰지 않은) 질문의 인덱스를 반환한다.
 * 없으면 -1.
 */
export function findPrevActiveIndex(
  currentIdx: number,
  skippedIndices: Set<number>,
): number {
  for (let i = currentIdx - 1; i >= 0; i--) {
    if (!skippedIndices.has(i)) return i;
  }
  return -1;
}
