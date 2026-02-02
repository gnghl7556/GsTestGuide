import type { DocEntry, AgreementParsed } from './testSetup';

export type RequirementCategory = 'BEFORE' | 'DURING' | 'AFTER';

export interface Requirement {
  id: string;
  category: RequirementCategory;
  title: string;
  description: string;
  keywords?: string[];
  relatedInfo?: Array<{ label: string; value: string; href?: string }>;
  requiredDocs?: string[];
  docRequirements?: {
    must?: string[];
    multi?: string[];
  };
  inputFields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'equipmentList';
    placeholder?: string;
    helper?: string;
  }>;
  checkPoints?: string[];
  evidenceExamples?: string[];
  testSuggestions?: string[];
  passCriteria?: string;
  excludeConditions?: {
    isSaMD?: boolean;
    noUserInterface?: boolean;
  };
  includeConditions?: {
    isAI?: boolean;
    hasPatientData?: boolean;
  };
}

export type UserProfile = {
  productType: 'SaMD' | 'Embedded';
  hasAI: boolean;
  hasPatientData: boolean;
  hasUI: boolean;
};

export interface ChecklistItem extends Requirement {
  status: 'Applicable' | 'Not_Applicable';
  autoReason?: string;
}

export type ReviewStatus = 'Verified' | 'Cannot_Verify' | 'Hold' | 'None';

export interface ReviewData {
  docName: string;
  page: string;
  status: ReviewStatus;
  comment: string;
}

export type QuickAnswer = 'YES' | 'NO' | 'NA';
export type QuickDecision = 'PASS' | 'HOLD' | 'FAIL';
export type QuickQuestionId = 'Q1' | 'Q2' | 'Q3';
export type QuestionImportance = 'MUST' | 'SHOULD';

export interface QuickQuestion {
  id: QuickQuestionId;
  text: string;
  importance: QuestionImportance;
}

export interface ExpertDetails {
  description: string;
  checkPoints: string[];
  evidenceExamples: string[];
  testSuggestions: string[];
  passCriteria: string;
}

export interface QuickModeItem {
  requirementId: string;
  category: Requirement['category'];
  title: string;
  summary: string;
  targetTags: string[];
  quickQuestions: QuickQuestion[];
  evidenceChips: string[];
  expertDetails: ExpertDetails;
}

export type QuickInputValue =
  | string
  | number
  | { name: string; ip?: string }[]
  | DocEntry[]
  | AgreementParsed;

export interface QuickReviewAnswer {
  requirementId: string;
  answers: Record<QuickQuestionId, QuickAnswer>;
  answeredQuestions?: Partial<Record<QuickQuestionId, boolean>>;
  autoRecommendation: QuickDecision;
  finalDecision?: QuickDecision;
  note?: string;
  evidenceMappings?: { docName: string; page: string };
  lockedQuestions?: Partial<Record<QuickQuestionId, boolean>>;
  inputValues?: Record<string, QuickInputValue>;
}
