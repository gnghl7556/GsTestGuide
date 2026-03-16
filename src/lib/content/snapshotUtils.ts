import type { Requirement, QuestionImportance } from '../../types';
import type { ContentSnapshot, FieldDiff } from '../../types/contentVersion';
import type { ContentOverride, BranchingRule } from './mergeOverrides';

/**
 * Requirement + (선택적) ContentOverride → ContentSnapshot 변환.
 * 마크다운 원본과 오버라이드를 병합하여 완전한 스냅샷을 생성한다.
 */
export function requirementToSnapshot(
  req: Requirement,
  override?: ContentOverride,
): ContentSnapshot {
  const baseCheckpoints = req.checkPoints ?? [];
  const cpCount = baseCheckpoints.length;

  // 체크포인트: 오버라이드 패치 적용
  let checkpoints = [...baseCheckpoints];
  if (override?.checkpoints) {
    checkpoints = checkpoints.map((cp, i) =>
      override.checkpoints![i] != null ? override.checkpoints![i] : cp,
    );
  }

  const checkpointImportances: Record<number, QuestionImportance> = {};
  for (let i = 0; i < cpCount; i++) {
    checkpointImportances[i] =
      override?.checkpointImportances?.[i] ??
      req.checkpointImportances?.[i] ??
      'MUST';
  }

  const checkpointDetails: Record<number, string> = {};
  for (let i = 0; i < cpCount; i++) {
    const detail = override?.checkpointDetails?.[i] ?? req.checkpointDetails?.[i];
    if (detail) checkpointDetails[i] = detail;
  }

  const checkpointEvidences: Record<number, number[]> = {};
  const evSource = override?.checkpointEvidences ?? req.checkpointEvidences ?? {};
  for (const [k, v] of Object.entries(evSource)) {
    if (v.length > 0) checkpointEvidences[Number(k)] = [...v];
  }

  const defaultOrder = Array.from({ length: cpCount }, (_, i) => i);
  const checkpointOrder = override?.checkpointOrder ?? defaultOrder;

  return {
    title: override?.title ?? req.title,
    description: override?.description ?? req.description,
    checkpoints,
    checkpointImportances,
    checkpointDetails,
    checkpointEvidences,
    checkpointOrder,
    evidenceExamples: override?.evidenceExamples ?? req.evidenceExamples ?? [],
    testSuggestions: override?.testSuggestions ?? req.testSuggestions ?? [],
    passCriteria: override?.passCriteria ?? req.passCriteria ?? '',
    branchingRules: override?.branchingRules ?? req.branchingRules ?? [],
  };
}

/**
 * ContentSnapshot → Requirement에 적용.
 * base Requirement의 비-콘텐츠 필드(id, category, keywords 등)는 유지하고,
 * 콘텐츠 필드만 스냅샷 값으로 대체한다.
 * checkpointOrder에 따라 재정렬 + branchingRules 인덱스 재매핑 포함.
 */
export function applySnapshotToRequirement(
  base: Requirement,
  snapshot: ContentSnapshot,
): Requirement {
  const order = snapshot.checkpointOrder;
  const reorderedCheckpoints = order.map((origIdx) => snapshot.checkpoints[origIdx]);

  // 재정렬된 메타데이터
  const reorderedImportances: Record<number, QuestionImportance> = {};
  order.forEach((origIdx, newIdx) => {
    if (snapshot.checkpointImportances[origIdx] != null) {
      reorderedImportances[newIdx] = snapshot.checkpointImportances[origIdx];
    }
  });

  const reorderedDetails: Record<number, string> = {};
  order.forEach((origIdx, newIdx) => {
    if (snapshot.checkpointDetails[origIdx] != null) {
      reorderedDetails[newIdx] = snapshot.checkpointDetails[origIdx];
    }
  });

  const reorderedEvidences: Record<number, number[]> = {};
  order.forEach((origIdx, newIdx) => {
    if (snapshot.checkpointEvidences[origIdx] != null) {
      reorderedEvidences[newIdx] = snapshot.checkpointEvidences[origIdx];
    }
  });

  // branchingRules 인덱스 재매핑
  const indexMap = new Map<number, number>();
  order.forEach((origIdx, newIdx) => indexMap.set(origIdx, newIdx));

  const reorderedBranchingRules: BranchingRule[] = snapshot.branchingRules.map((rule) => ({
    ...rule,
    sourceIndex: indexMap.get(rule.sourceIndex) ?? rule.sourceIndex,
    skipIndices: rule.skipIndices
      .map((i) => indexMap.get(i) ?? i)
      .sort((a, b) => a - b),
  }));

  return {
    ...base,
    title: snapshot.title,
    description: snapshot.description,
    checkPoints: reorderedCheckpoints,
    checkpointImportances: reorderedImportances,
    checkpointDetails: Object.keys(reorderedDetails).length > 0 ? reorderedDetails : undefined,
    checkpointEvidences: Object.keys(reorderedEvidences).length > 0 ? reorderedEvidences : undefined,
    evidenceExamples: snapshot.evidenceExamples,
    testSuggestions: snapshot.testSuggestions,
    passCriteria: snapshot.passCriteria,
    branchingRules: reorderedBranchingRules.length > 0 ? reorderedBranchingRules : undefined,
  };
}

/**
 * 두 스냅샷 간 FieldDiff[] 생성.
 */
export function computeSnapshotDiff(
  before: ContentSnapshot,
  after: ContentSnapshot,
): FieldDiff[] {
  const diffs: FieldDiff[] = [];

  if (before.title !== after.title) {
    diffs.push({ field: 'title', before: before.title, after: after.title });
  }
  if (before.description !== after.description) {
    diffs.push({ field: 'description', before: before.description, after: after.description });
  }

  // 체크포인트 비교
  const maxCp = Math.max(before.checkpoints.length, after.checkpoints.length);
  for (let i = 0; i < maxCp; i++) {
    const b = before.checkpoints[i] ?? '';
    const a = after.checkpoints[i] ?? '';
    if (b !== a) {
      diffs.push({ field: `checkpoint:${i}`, before: b, after: a });
    }
  }

  // 중요도 비교
  const allImpKeys = new Set([
    ...Object.keys(before.checkpointImportances),
    ...Object.keys(after.checkpointImportances),
  ]);
  for (const k of allImpKeys) {
    const idx = Number(k);
    const b = before.checkpointImportances[idx] ?? '';
    const a = after.checkpointImportances[idx] ?? '';
    if (b !== a) {
      diffs.push({ field: `importance:${idx}`, before: b, after: a });
    }
  }

  // 상세 비교
  const allDetailKeys = new Set([
    ...Object.keys(before.checkpointDetails),
    ...Object.keys(after.checkpointDetails),
  ]);
  for (const k of allDetailKeys) {
    const idx = Number(k);
    const b = before.checkpointDetails[idx] ?? '';
    const a = after.checkpointDetails[idx] ?? '';
    if (b !== a) {
      diffs.push({ field: `detail:${idx}`, before: b, after: a });
    }
  }

  if (before.passCriteria !== after.passCriteria) {
    diffs.push({ field: 'passCriteria', before: before.passCriteria, after: after.passCriteria });
  }

  const bEv = before.evidenceExamples.join('\n');
  const aEv = after.evidenceExamples.join('\n');
  if (bEv !== aEv) {
    diffs.push({ field: 'evidenceExamples', before: bEv, after: aEv });
  }

  const bTs = before.testSuggestions.join('\n');
  const aTs = after.testSuggestions.join('\n');
  if (bTs !== aTs) {
    diffs.push({ field: 'testSuggestions', before: bTs, after: aTs });
  }

  if (JSON.stringify(before.branchingRules) !== JSON.stringify(after.branchingRules)) {
    diffs.push({
      field: 'branchingRules',
      before: JSON.stringify(before.branchingRules),
      after: JSON.stringify(after.branchingRules),
    });
  }

  if (JSON.stringify(before.checkpointOrder) !== JSON.stringify(after.checkpointOrder)) {
    diffs.push({
      field: 'checkpointOrder',
      before: JSON.stringify(before.checkpointOrder),
      after: JSON.stringify(after.checkpointOrder),
    });
  }

  if (JSON.stringify(before.checkpointEvidences) !== JSON.stringify(after.checkpointEvidences)) {
    diffs.push({
      field: 'checkpointEvidences',
      before: JSON.stringify(before.checkpointEvidences),
      after: JSON.stringify(after.checkpointEvidences),
    });
  }

  return diffs;
}
