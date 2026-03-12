import type { Timestamp } from 'firebase/firestore';

export type UserRank = '전임' | '선임' | '책임' | '수석';
export type UserRole = 'PL' | 'Tester' | 'Admin';

export type ProjectStatus = '대기' | '진행' | '중단' | '완료' | '재시험';
export type DefectSeverity = 'H' | 'M' | 'L';
export type DefectFrequency = 'A' | 'I';
export type DefectStatus = '신규' | '확인' | '수정' | '보류' | '종료';
export type DefectReportVersion = 1 | 2 | 3 | 4;
export type ExecutionPhase = 'INITIAL' | 'PATCH1_REGRESSION' | 'PATCH2_FINAL';
export type FeatureRegressionStatus = 'PENDING' | 'PASS' | 'DERIVED_FOUND';

export type ExecutionGateState = {
  phase: ExecutionPhase;
  featureRegressionStatus: FeatureRegressionStatus;
  allowSecurityPerformance: boolean;
  derivedFoundInFeatureRegression: boolean;
  finalizedAt?: Timestamp | number | null;
};

export type User = {
  id: string;
  name: string;
  rank: UserRank;
  email: string;
  phone: string;
  role?: UserRole;
  password?: string;
};

export type UserCreateInput = Omit<User, 'id'> & { id?: string };
export type UserUpdateInput = Partial<Omit<User, 'id'>>;

export type Project = {
  id: string;
  testNumber: string;
  projectYear?: number;
  projectNumber?: number;
  projectName?: string;
  productName?: string;
  status?: ProjectStatus;
  startDate?: Timestamp;
  endDate?: Timestamp;
  contractType?: string;
  operatingEnvironment?: string;
  companyName?: string;
  companyContactName?: string;
  companyContactEmail?: string;
  companyContactPhone?: string;
  plId?: string;
  plName?: string;
  plPhone?: string;
  plEmail?: string;
  testerId?: string;
  testerName?: string;
  testerPhone?: string;
  testerEmail?: string;
  scheduleWorkingDays?: string;
  scheduleStartDate?: string;
  scheduleDefect1?: string;
  scheduleDefect2?: string;
  schedulePatchDate?: string;
  scheduleEndDate?: string;
  agreementDocUrl?: string;
  manualDocUrl?: string;
  createdBy?: string | null;
  updatedAt?: Timestamp | number | null;
  executionState?: ExecutionGateState;
  projectColor?: string;
  customMilestones?: Array<{ id: string; label: string; date: string; color: string }>;
  milestoneOrder?: string[];
};


export type Defect = {
  defectId: string;
  defectNumber?: number;
  linkedTestCaseId?: string;
  reportVersion: DefectReportVersion;
  isDerived: boolean;
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
};

