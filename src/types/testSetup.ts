export type DocEntry = { docType: string; fileName?: string; url?: string; source?: 'drive' | 'storage' };

export type AgreementParsed = {
  parseStatus?: 'pending' | 'parsed' | 'failed';
  parseProgress?: number;
  applicationNumber?: string;
  contractType?: string;
  certificationType?: string;
  productNameKo?: string;
  companyName?: string;
  managerName?: string;
  managerMobile?: string;
  managerEmail?: string;
  managerDepartment?: string;
  managerJobTitle?: string;
  workingDays?: string;
};

export type TestSetupState = {
  testNumber: string;
  plId: string;
  plName: string;
  plPhone: string;
  plEmail: string;
  testerName: string;
  testerPhone: string;
  testerEmail: string;
  companyContactName: string;
  companyContactPhone: string;
  companyContactEmail: string;
  companyName: string;
  scheduleWorkingDays: string;
  scheduleStartDate: string;
  scheduleDefect1: string;
  scheduleDefect2: string;
  schedulePatchDate: string;
  scheduleEndDate: string;
  projectName: string;
  docs: DocEntry[];
  agreementParsed?: AgreementParsed;
};
