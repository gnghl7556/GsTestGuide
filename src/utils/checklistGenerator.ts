// ✅ requirements 파일을 정확히 import 해야 합니다.
import { REQUIREMENTS_DB, type Requirement } from '../data/requirements';

// ✅ export interface 필수
export interface UserProfile {
  productType: 'SaMD' | 'Embedded';
  hasAI: boolean;
  hasPatientData: boolean;
  hasUI: boolean;
}

// ✅ export interface 필수
export interface ChecklistItem extends Requirement {
  status: 'Applicable' | 'Not_Applicable';
  autoReason?: string;
}

// ✅ export function 필수
export function generateChecklist(profile: UserProfile): ChecklistItem[] {
  return REQUIREMENTS_DB.map((req) => {
    let status: ChecklistItem["status"] = "Applicable";
    let autoReason: string | undefined;

    const setNA = (reason: string) => {
      if (status === "Applicable") {
        status = "Not_Applicable";
        autoReason = reason;
      }
    };

    // 1) 제외 로직 (우선순위 높음)
    if (req.excludeConditions?.isSaMD && profile.productType === "SaMD") {
      setNA("소프트웨어 의료기기(SaMD)는 물리적 하드웨어 통제가 불가능하므로 미적용");
    }
    if (req.excludeConditions?.noUserInterface && !profile.hasUI) {
      setNA("사용자 인터페이스(UI)가 없어 적용 불가");
    }

    // 2) 포함 로직 (조건 미충족 시 제외)
    if (req.includeConditions?.isAI && !profile.hasAI) {
      setNA("인공지능(AI) 기술이 적용되지 않음");
    }
    if (req.includeConditions?.hasPatientData && !profile.hasPatientData) {
      setNA("개인/환자 데이터가 없으므로 미적용");
    }

    return { ...req, status, ...(autoReason ? { autoReason } : {}) };
  });
}