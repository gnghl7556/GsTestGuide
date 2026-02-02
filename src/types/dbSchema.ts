import type { Timestamp } from 'firebase/firestore';

export type FeatureChangeType = '신규' | '수정' | '삭제' | '유지';
export type TestCaseStatus = '대기' | 'Pass' | 'Fail' | 'Skip';
export type DefectSeverity = 'H' | 'M' | 'L';
export type DefectFrequency = 'A' | 'I';
export type DefectStatus = '신규' | '확인' | '수정' | '보류' | '종료';

export interface SchemaTestEquipment {
  equipmentId: string;
  order: number;
  role: string;
  os: string;
  cpu: string;
  gpu?: string;
  memory: string;
  storage: string;
  ipAddress?: string;
  prerequisites?: string[];
}

export interface SchemaFeature {
  featureId: string;
  version: number;
  category1: string;
  category2: string;
  category3: string;
  category4?: string;
  description: string;
  changeType?: FeatureChangeType;
}

export interface SchemaTestCase {
  testCaseId: string;
  featureId: string;
  scenario: string;
  preCondition?: string;
  steps: string[];
  expectedResult: string;
  status: TestCaseStatus;
  version: number;
}

export interface SchemaDefect {
  defectId: string;
  defectNumber?: number;
  linkedTestCaseId?: string;
  summary: string;
  testEnvironment: string;
  severity: DefectSeverity;
  frequency: DefectFrequency;
  qualityCharacteristic: string;
  accessPath: string;
  stepsToReproduce?: string[];
  description: string;
  ttaComment?: string;
  status: DefectStatus;
  reportedBy: string;
  reportedAt: Timestamp;
}
