import type { QuestionImportance } from '../../../../types';
import type { BranchingRule } from '../../../../lib/content/mergeOverrides';

export type { BranchingRule };

export type EditingState = {
  reqId: string;
  title: string;
  description: string;
  checkpoints: Record<number, string>; // body only (without [ref:~])
  checkpointRefs: Record<number, string[]>; // refs per checkpoint
  checkpointImportances: Record<number, QuestionImportance>;
  checkpointDetails: Record<number, string>;
  checkpointEvidences: Record<number, number[]>;
  evidenceExamples: string[];
  testSuggestions: string[];
  passCriteria: string;
  branchingRules: BranchingRule[];
};

const REF_PATTERN = /\s*\[ref:\s*(.+?)\]\s*$/;

/** body text from checkpoint text, splitting off [ref:~] suffix */
export const splitRef = (text: string): { body: string; refSuffix: string; refs: string[] } => {
  const match = text.match(REF_PATTERN);
  if (!match) return { body: text, refSuffix: '', refs: [] };
  const refs = match[1].split(',').map((r) => r.trim()).filter(Boolean);
  return {
    body: text.replace(REF_PATTERN, '').trim(),
    refSuffix: match[0],
    refs,
  };
};

/** refs array to [ref:~] suffix */
export const buildRefSuffix = (refs: string[]): string =>
  refs.length > 0 ? ` [ref: ${refs.join(', ')}]` : '';

/** combine edited body + refs array */
export const joinRef = (body: string, refs: string[]): string =>
  `${body.trim()}${buildRefSuffix(refs)}`;
