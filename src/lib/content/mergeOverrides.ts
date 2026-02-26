import type { Requirement, RequiredDoc, QuestionImportance } from '../../types';

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

export interface ContentOverride {
  title?: string;
  description?: string;
  checkpoints?: Record<number, string>;
  checkpointImportances?: Record<number, QuestionImportance>;
  evidenceExamples?: string[];
  testSuggestions?: string[];
  passCriteria?: string;
  branchingRules?: BranchingRule[];
  updatedAt?: unknown;
  updatedBy?: string;
}

const REF_PATTERN = /\[ref:\s*(.+?)\]\s*$/;

/** 체크포인트 텍스트들에서 참조되는 자료 라벨을 모두 수집 */
function collectActiveRefs(checkPoints: string[]): Set<string> {
  const refs = new Set<string>();
  for (const cp of checkPoints) {
    const match = cp.match(REF_PATTERN);
    if (match) {
      match[1].split(',').map((r) => r.trim()).filter(Boolean).forEach((r) => refs.add(r));
    }
  }
  return refs;
}

export function mergeOverrides(
  base: Requirement[],
  overrides: Record<string, ContentOverride>,
): Requirement[] {
  if (!overrides || Object.keys(overrides).length === 0) return base;

  return base.map((req) => {
    const ov = overrides[req.id];
    if (!ov) return req;

    const merged = {
      ...req,
      ...(ov.title != null && { title: ov.title }),
      ...(ov.description != null && { description: ov.description }),
      ...(ov.checkpoints != null && req.checkPoints && {
        checkPoints: req.checkPoints.map((cp, i) =>
          ov.checkpoints![i] != null ? ov.checkpoints![i] : cp,
        ),
      }),
      ...(ov.evidenceExamples != null && { evidenceExamples: ov.evidenceExamples }),
      ...(ov.testSuggestions != null && { testSuggestions: ov.testSuggestions }),
      ...(ov.passCriteria != null && { passCriteria: ov.passCriteria }),
      ...(ov.checkpointImportances != null && { checkpointImportances: ov.checkpointImportances }),
      ...(ov.branchingRules != null && { branchingRules: ov.branchingRules }),
    };

    // 체크포인트가 오버라이드된 경우, requiredDocs를 실제 ref 사용 현황에 맞춰 필터링
    if (ov.checkpoints != null && merged.checkPoints && merged.requiredDocs) {
      const activeRefs = collectActiveRefs(merged.checkPoints);
      merged.requiredDocs = merged.requiredDocs.filter((d) => activeRefs.has(d.label));
    }

    return merged;
  });
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
