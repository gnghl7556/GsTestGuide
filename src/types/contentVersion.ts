import type { Timestamp } from 'firebase/firestore';
import type { QuestionImportance } from './checklist';
import type { BranchingRule } from '../lib/content/mergeOverrides';

/** 콘텐츠의 전체 스냅샷 (패치가 아닌 완전한 상태) */
export interface ContentSnapshot {
  title: string;
  description: string;
  checkpoints: string[];
  checkpointImportances: Record<number, QuestionImportance>;
  checkpointDetails: Record<number, string>;
  checkpointEvidences: Record<number, number[]>;
  checkpointOrder: number[];
  evidenceExamples: string[];
  testSuggestions: string[];
  passCriteria: string;
  branchingRules: BranchingRule[];
  sourceFingerprint?: string;
}

export type VersionAction = 'create' | 'edit' | 'rollback';

/** 필드 단위 변경 정보 */
export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

/** contentVersions/{reqId}/versions/{v} 서브컬렉션 문서 */
export interface ContentVersionDoc {
  version: number;
  content: ContentSnapshot;
  editor: string;
  editorId: string;
  editedAt: Timestamp | null;
  note: string;
  action: VersionAction;
  diff?: FieldDiff[];
}

/** contentVersions/{reqId} 루트 문서 */
export interface ContentVersionRoot {
  currentVersion: number;
  content: ContentSnapshot;
  updatedAt: Timestamp | null;
  updatedBy: string;
}
