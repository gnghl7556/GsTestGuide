// ✅ export type이 반드시 있어야 합니다.
export type RequirementCategory = 'BEFORE' | 'DURING' | 'AFTER';

// ✅ export interface가 반드시 있어야 합니다.
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

// ✅ export const가 반드시 있어야 합니다.
export const REQUIREMENTS_DB: Requirement[] = [
  {
    id: 'ENV-01',
    category: 'BEFORE',
    title: '자리 배정',
    description: '시험 자리 배정이 완료되고 시험 수행에 적합한 공간인지 확인한다.',
    keywords: ['시험 자리', '공간 적합성'],
    relatedInfo: [
      {
        label: '자리 배정 담당자',
        value: '이예정 전임'
      },
      {
        label: '연락처',
        value: '010-5110-4917'
      },
      {
        label: '이메일',
        value: 'yeijeong@tta.or.kr'
      },
      {
        label: '자리 배치 확인 링크',
        value: '구글 스프레드 시트',
        href: 'https://docs.google.com/spreadsheets/d/159J439Hl5l25-PmP_uX-s-TTkqR8l6aE3uUhUUtydEU/edit?usp=sharing'
      }
    ],
    checkPoints: [
      '서류상 사용 가능 자리와 실제 사용 가능 자리가 일치하는가?',
      '시험 시 동작 시나리오에 필요한 공간(이동반경 포함)이 확보되었는가?',
      '소음/동선 등 주변 시험에 영향을 주지 않는 공간인지 확인했는가?'
    ],
    evidenceExamples: ['시험 합의서', '자리 배정표', '현장 배치 사진'],
    testSuggestions: ['시험 시작 전 현장 배치 확인 및 체크리스트 점검'],
    passCriteria: '시험 자리 배정이 완료되었고 시험 수행에 적합한 공간이 확보되었다.'
  },
  {
    id: 'ENV-02',
    category: 'BEFORE',
    title: '시험환경설정',
    description: '시험에 필요한 장비가 배정되고 정상 동작 상태인지 확인한다.',
    keywords: ['환경 구성', '시험 장비', '장비 점검'],
    checkPoints: [
      '시험 장비 목록이 확정되고 배정이 완료되었는가?',
      '장비별 사양과 역할이 문서화되어 있는가?',
      '장비 전원/네트워크/보안 설정이 기본 상태로 준비되었는가?'
    ],
    evidenceExamples: ['장비 배정표', '장비 사양서', '장비 구성 사진'],
    testSuggestions: ['시험 시작 전 장비 점검 로그 확인'],
    passCriteria: '시험 장비가 배정되고 정상 상태로 준비되어 시험 수행이 가능하다.'
  },
  {
    id: 'PLAN-01',
    category: 'BEFORE',
    title: '품질특성별 제품 정보 기재사항',
    description: '시험에 필요한 제품 정보가 품질특성 기준에 맞게 정리되어 있는지 확인한다.',
    keywords: ['계획', '제품 정보', '품질특성'],
    checkPoints: [
      '제품 개요/기능/구성 정보가 최신으로 정리되어 있는가?',
      '품질특성별 요구사항과 제품 정보가 매핑되어 있는가?',
      '기업 측 제공 자료의 버전과 제출 일자가 기록되어 있는가?'
    ],
    evidenceExamples: ['제품 정보서', '품질특성 매핑표', '제출자료 목록'],
    testSuggestions: ['제품 정보 문서 최신 버전 여부 확인'],
    passCriteria: '품질특성별 제품 정보가 최신 자료 기준으로 정리되어 있고 제출 준비가 완료되었다.'
  }
  ,
  {
    id: 'DUR-PLAN-01',
    category: 'DURING',
    title: '시험환경구성도',
    description: '시험 수행 중 환경 구성도가 최신으로 유지되고 실제 환경과 일치하는지 확인한다.',
    checkPoints: ['구성도 버전이 최신인가?', '실제 환경과 구성도가 일치하는가?', '변경 사항이 반영되었는가?'],
    passCriteria: '시험환경구성도가 최신이며 실제 환경과 일치한다.'
  },
  {
    id: 'DUR-PLAN-02',
    category: 'DURING',
    title: '시험계획서',
    description: '시험 계획서가 최신이며 시험 범위/일정/절차가 명확히 정의되어 있는지 확인한다.',
    checkPoints: ['시험 범위가 명확한가?', '일정과 절차가 정의되어 있는가?', '승인된 최신본인가?'],
    passCriteria: '시험계획서가 최신이며 시험 수행에 필요한 정보가 충분하다.'
  },
  {
    id: 'DUR-PLAN-03',
    category: 'DURING',
    title: '품질특성별 제품 정보 기재사항',
    description: '시험 수행 중 품질특성별 제품 정보가 최신으로 유지되는지 확인한다.',
    checkPoints: ['제품 정보가 최신인가?', '품질특성별 매핑이 유지되는가?', '변경 이력 기록이 있는가?'],
    passCriteria: '품질특성별 제품 정보가 최신 상태로 유지된다.'
  },
  {
    id: 'DUR-PLAN-04',
    category: 'DURING',
    title: '기능리스트',
    description: '시험 대상 기능 리스트가 최신이며 시험 범위를 반영하는지 확인한다.',
    checkPoints: ['기능 목록이 최신인가?', '시험 범위에 포함되는가?', '누락된 기능이 없는가?'],
    passCriteria: '기능리스트가 최신이며 시험 범위를 충실히 반영한다.'
  },
  {
    id: 'DUR-DESIGN-01',
    category: 'DURING',
    title: '점검표',
    description: '시험 수행 중 점검표가 최신이며 실제 점검 항목과 일치하는지 확인한다.',
    checkPoints: ['점검 항목이 최신인가?', '현장 점검과 일치하는가?', '누락 항목이 없는가?'],
    passCriteria: '점검표가 최신이며 실제 점검 항목과 일치한다.'
  },
  {
    id: 'DUR-DESIGN-02',
    category: 'DURING',
    title: '테스트케이스',
    description: '시험 수행 중 테스트케이스가 최신이며 시험 범위를 충분히 커버하는지 확인한다.',
    checkPoints: ['테스트케이스가 최신인가?', '시험 범위를 커버하는가?', '중요 시나리오가 포함되었는가?'],
    passCriteria: '테스트케이스가 최신이며 시험 범위를 충분히 커버한다.'
  },
  {
    id: 'DUR-EXEC-01',
    category: 'DURING',
    title: '기능 테스트',
    description: '기능 테스트가 계획대로 수행되고 결과가 기록되는지 확인한다.',
    checkPoints: ['기능 테스트가 수행되었는가?', '결과가 기록되었는가?', '이슈가 추적되는가?'],
    passCriteria: '기능 테스트가 정상적으로 수행되고 결과가 기록되었다.'
  },
  {
    id: 'DUR-EXEC-02',
    category: 'DURING',
    title: '보안성 테스트',
    description: '보안성 테스트가 계획대로 수행되고 결과가 기록되는지 확인한다.',
    checkPoints: ['보안성 테스트가 수행되었는가?', '결과가 기록되었는가?', '취약점이 관리되는가?'],
    passCriteria: '보안성 테스트가 정상적으로 수행되고 결과가 기록되었다.'
  },
  {
    id: 'DUR-EXEC-03',
    category: 'DURING',
    title: '성능 테스트',
    description: '성능 테스트가 계획대로 수행되고 결과가 기록되는지 확인한다.',
    checkPoints: ['성능 테스트가 수행되었는가?', '결과가 기록되었는가?', '기준 대비 결과가 확인되었는가?'],
    passCriteria: '성능 테스트가 정상적으로 수행되고 결과가 기록되었다.'
  },
  {
    id: 'DUR-EXEC-04',
    category: 'DURING',
    title: '회귀 테스트',
    description: '회귀 테스트가 계획대로 수행되고 결과가 기록되는지 확인한다.',
    checkPoints: ['회귀 테스트가 수행되었는가?', '결과가 기록되었는가?', '재발 이슈가 관리되는가?'],
    passCriteria: '회귀 테스트가 정상적으로 수행되고 결과가 기록되었다.'
  }
];
