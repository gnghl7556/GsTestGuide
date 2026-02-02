import type { Timestamp } from 'firebase/firestore';

export interface TestEquipment {
  id: string;
  role: string;
  os: string;
  cpu: string;
  gpu?: string;
  memory: string;
  storage: string;
  prerequisites?: string;
  ipAddress?: string;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: '대기' | '진행 중' | '완료' | '보류' | '실패';
  dueDate: Timestamp;
  stage: string;
  order: number;
}

export interface ChecklistItem {
  id: string;
  content: string;
  isCompleted: boolean;
  order: number;
}

export interface AttachedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: Timestamp;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}

export interface TestDocumentRecord {
  id: string;
  requirementId: string;
  docs: Array<{
    docType: string;
    fileName?: string;
    label?: string;
    url?: string;
    source?: 'drive' | 'storage';
  }>;
  updatedAt: Timestamp;
}

export interface AgreementDocumentRecord {
  id: string;
  testNumber: string;
  storagePath: string;
  fileName: string;
  uploadedAt: Timestamp;
  parseStatus?: 'pending' | 'parsed' | 'failed';
  parseError?: string;
  parsedAt?: Timestamp;
  parsed?: {
    applicationNumber?: string;
    contractType?: string;
    certificationType?: string;
    담당자?: string;
    연락처?: string;
  };
}

export interface TestDocumentBundle {
  id: string;
  testNumber: string;
  requiredDocs: string[];
  docs: Array<{
    docType: string;
    label?: string;
    url?: string;
    fileName?: string;
    source: 'drive' | 'storage';
  }>;
  updatedAt: Timestamp;
}

export interface TestArtifactBundle {
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
}
