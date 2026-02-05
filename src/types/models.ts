import type { Timestamp } from 'firebase/firestore';
import type { AgreementParsed, DocEntry } from './testSetup';

export type UserRank = '전임' | '선임' | '책임' | '수석';
export type UserRole = 'PL' | 'Tester' | 'Admin';

export type ProjectStatus = '대기' | '진행' | '중단' | '완료' | '재시험';
export type ProjectMemberRole = 'PL' | '시험원';

export type FeatureChangeType = '신규' | '수정' | '삭제' | '유지';
export type TestCaseStatus = '대기' | 'Pass' | 'Fail' | 'Skip';
export type DefectSeverity = 'H' | 'M' | 'L';
export type DefectFrequency = 'A' | 'I';
export type DefectStatus = '신규' | '확인' | '수정' | '보류' | '종료';
export type DefectReportVersion = 1 | 2 | 3 | 4;

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
};

export type ProjectCreateInput = Omit<Project, 'id'> & { id?: string };
export type ProjectUpdateInput = Partial<Omit<Project, 'id'>>;

export type TestEquipment = {
  id: string;
  order: number;
  role: string;
  os: string;
  cpu: string;
  gpu?: string;
  memory: string;
  storage: string;
  ipAddress?: string;
  prerequisites?: string[];
};

export type ProjectMember = {
  memberId: string;
  role: ProjectMemberRole;
};

export type Feature = {
  featureId: string;
  version: number;
  category1: string;
  category2: string;
  category3: string;
  category4?: string;
  description: string;
  changeType?: FeatureChangeType;
};

export type TestCase = {
  testCaseId: string;
  featureId: string;
  scenario: string;
  preCondition?: string;
  steps: string[];
  expectedResult: string;
  status: TestCaseStatus;
  version: number;
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

export type AgreementDocument = {
  id: string;
  testNumber: string;
  storagePath: string;
  fileName: string;
  uploadedAt: Timestamp;
  parseStatus?: 'pending' | 'parsed' | 'failed';
  parseError?: string;
  parsedAt?: Timestamp;
  parsed?: AgreementParsed;
};

export type TestDocumentRecord = {
  id: string;
  requirementId: string;
  docs: DocEntry[];
  updatedAt: Timestamp;
};

export type TestDocumentBundle = {
  id: string;
  testNumber: string;
  requiredDocs: string[];
  docs: DocEntry[];
  updatedAt: Timestamp;
};

export type TestArtifactBundle = {
  id: string;
  testNumber: string;
  items: Array<{
    type: string;
    label: string;
    url?: string;
    fileName?: string;
    source: 'drive' | 'storage';
  }>;
  updatedAt: Timestamp;
};

export type AttachedFile = {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: Timestamp;
};

export type Comment = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
};
