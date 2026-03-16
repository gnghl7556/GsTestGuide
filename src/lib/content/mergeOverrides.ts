import type { Requirement, RequiredDoc, QuestionImportance } from '../../types';
import type { ContentSnapshot } from '../../types/contentVersion';
import { applySnapshotToRequirement } from './snapshotUtils';

export interface DocMaterial {
  label: string;
  kind: string;
  description: string;
  linkedSteps: string[];
}

export interface BranchingRule {
  sourceIndex: number;
  triggerAnswer: 'NO';
  skipIndices: number[];
}

/** @deprecated 마이그레이션 참조용으로 유지. 새 코드는 ContentSnapshot 사용. */
export interface ContentOverride {
  title?: string;
  description?: string;
  checkpoints?: Record<number, string>;
  checkpointImportances?: Record<number, QuestionImportance>;
  checkpointDetails?: Record<number, string>;
  checkpointEvidences?: Record<number, number[]>;
  checkpointOrder?: number[];
  evidenceExamples?: string[];
  testSuggestions?: string[];
  passCriteria?: string;
  branchingRules?: BranchingRule[];
  updatedAt?: unknown;
  updatedBy?: string;
}

/** docMaterials의 linkedSteps 기반으로 각 요구사항의 requiredDocs를 동적으로 구성 */
export function mergeDocLinks(
  base: Requirement[],
  materials: DocMaterial[],
): Requirement[] {
  if (!materials || materials.length === 0) return base;

  // stepId → 연결된 DocMaterial 목록
  const stepMap = new Map<string, DocMaterial[]>();
  for (const mat of materials) {
    for (const stepId of mat.linkedSteps) {
      const list = stepMap.get(stepId);
      if (list) list.push(mat);
      else stepMap.set(stepId, [mat]);
    }
  }

  return base.map((req) => {
    const linked = stepMap.get(req.id);
    if (!linked) return req;

    const existingLabels = new Set((req.requiredDocs ?? []).map((d) => d.label));
    const additions: RequiredDoc[] = [];
    for (const mat of linked) {
      if (!existingLabels.has(mat.label)) {
        additions.push({
          label: mat.label,
          kind: mat.kind === 'external' ? 'external' : 'file',
          description: mat.description,
        });
      }
    }

    if (additions.length === 0) return req;
    return { ...req, requiredDocs: [...(req.requiredDocs ?? []), ...additions] };
  });
}

export function applyVersionedContent(
  base: Requirement[],
  versionedContents: Record<string, ContentSnapshot>,
): Requirement[] {
  if (!versionedContents || Object.keys(versionedContents).length === 0) return base;

  return base.map((req) => {
    const snapshot = versionedContents[req.id];
    if (!snapshot) return req;
    return applySnapshotToRequirement(req, snapshot);
  });
}
