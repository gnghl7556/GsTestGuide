import type { Requirement } from '../types';

// ✅ export const가 반드시 있어야 합니다.
export const REQUIREMENTS_DB: Requirement[] = [
  {
    id: 'ENV-01',
    category: 'SETUP',
    title: '자리 배정',
    description: '자리 배정 여부와 시험에 필요한 장비·공간 확보 상태를 확인한다.',
    requiredDocs: [
      {
        label: '시험 합의서',
        kind: 'file',
        description: '시험 범위와 조건이 명시된 합의서를 확인하세요.',
        storagePath: 'previews/doc-agreement-preview.png'
      },
      {
        label: '자리 배정표',
        kind: 'external',
        description: '시험 자리 배정 내역을 확인하세요.',
        storagePath: 'previews/doc-seat-plan-preview.png',
        showRelatedInfo: true
      }
    ],
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
      '시험 배정 후, 시험 자리가 이미 배정되었나요?',
      '시험에 필요한 장비 및 공간을 확인했나요?'
    ],
    evidenceExamples: ['시험 합의서', '자리 배정표', '현장 배치 사진'],
    testSuggestions: ['시험 시작 전 현장 배치 확인 및 체크리스트 점검'],
    passCriteria: '시험 자리 배정이 완료되었고 시험 수행에 적합한 공간이 확보되었다.'
  },
  {
    id: 'ENV-02',
    category: 'SETUP',
    title: '시험환경설정',
    description: '시험에 필요한 장비가 배정되고 정상 동작 상태인지 확인한다.',
    keywords: ['환경 구성', '시험 장비', '장비 점검'],
    checkPoints: [
      '시험 장비 목록이 확정되고 배정이 완료되었는가?',
      '장비별 사양과 역할이 문서화되어 있는가?',
      '장비 전원/네트워크 설정이 기본 상태로 준비되었는가?'
    ],
    evidenceExamples: ['장비 배정표', '장비 사양서', '장비 구성 사진'],
    testSuggestions: ['시험 시작 전 장비 점검 로그 확인'],
    passCriteria: '시험 장비가 배정되고 정상 상태로 준비되어 시험 수행이 가능하다.'
  },
  {
    id: 'DUR-PLAN-01',
    category: 'DESIGN',
    title: '기능리스트',
    description: '시험 대상 기능 리스트가 최신이며 시험 범위를 반영하는지 확인한다.',
    checkPoints: ['기능 목록이 최신인가?', '시험 범위에 포함되는가?', '누락된 기능이 없는가?'],
    passCriteria: '기능리스트가 최신이며 시험 범위를 충실히 반영한다.'
  },
  {
    id: 'DUR-DESIGN-01',
    category: 'DESIGN',
    title: '테스트케이스',
    description: '시험 수행 중 테스트케이스가 최신이며 시험 범위를 충분히 커버하는지 확인한다.',
    checkPoints: ['테스트케이스가 최신인가?', '시험 범위를 커버하는가?', '중요 시나리오가 포함되었는가?'],
    passCriteria: '테스트케이스가 최신이며 시험 범위를 충분히 커버한다.'
  },
  {
    id: 'DUR-EXEC-01',
    category: 'EXECUTION',
    title: '기능 테스트',
    description: '기능 테스트가 계획대로 수행되고 결과가 기록되는지 확인한다.',
    checkPoints: ['기능 테스트가 수행되었는가?', '결과가 기록되었는가?', '이슈가 추적되는가?'],
    passCriteria: '기능 테스트가 정상적으로 수행되고 결과가 기록되었다.'
  },
  {
    id: 'DUR-EXEC-02',
    category: 'EXECUTION',
    title: '성능 테스트',
    description: '성능 테스트가 계획대로 수행되고 결과가 기록되는지 확인한다.',
    checkPoints: ['성능 테스트가 수행되었는가?', '결과가 기록되었는가?', '기준 대비 결과가 확인되었는가?'],
    passCriteria: '성능 테스트가 정상적으로 수행되고 결과가 기록되었다.'
  },
  {
    id: 'DUR-EXEC-03',
    category: 'EXECUTION',
    title: '회귀 테스트',
    description: '회귀 테스트가 계획대로 수행되고 결과가 기록되는지 확인한다.',
    checkPoints: ['회귀 테스트가 수행되었는가?', '결과가 기록되었는가?', '재발 이슈가 관리되는가?'],
    passCriteria: '회귀 테스트가 정상적으로 수행되고 결과가 기록되었다.'
  },
  {
    id: 'DUR-EXEC-04',
    category: 'EXECUTION',
    title: '보안 테스트',
    description: '보안 테스트가 계획대로 수행되고 결과가 기록되는지 확인한다.',
    checkPoints: ['보안 테스트가 수행되었는가?', '취약점 조치 여부가 기록되었는가?', '결과가 공유되었는가?'],
    passCriteria: '보안 테스트 결과가 정상적으로 기록되고 조치 내역이 관리된다.'
  },
  {
    id: 'DUR-EXEC-05',
    category: 'EXECUTION',
    title: '패치 전/후 형상 캡처',
    description: '패치 전/후 SW 제품의 기능 화면 및 형상 증빙이 캡처되어 있는지 확인한다.',
    checkPoints: [
      '패치 전 화면/기능 상태가 캡처되어 있는가?',
      '패치 후 화면/기능 상태가 캡처되어 있는가?',
      '캡처 파일에 날짜/버전 등 식별 정보가 포함되어 있는가?'
    ],
    evidenceExamples: ['기능 화면 캡처', '버전 정보 화면', '패치 전/후 비교 이미지'],
    passCriteria: '패치 전/후 형상 캡처가 완료되어 비교 검증이 가능하다.'
  },
  {
    id: 'COMP-01',
    category: 'COMPLETION',
    title: '시험 산출물 정리',
    description: '시험 결과 산출물이 정리되어 최종 제출 준비가 완료되었는지 확인한다.',
    checkPoints: ['최종 산출물이 정리되었는가?', '제출 형식이 충족되는가?', '최신본이 반영되었는가?'],
    passCriteria: '시험 산출물이 정리되어 제출 준비가 완료되었다.'
  },
  {
    id: 'COMP-02',
    category: 'COMPLETION',
    title: '시험 종료 및 반입/반출 확인',
    description: '시험 종료 후 장비/자료 반입·반출 및 정리가 완료되었는지 확인한다.',
    checkPoints: ['장비 반입/반출 기록이 남았는가?', '현장 정리가 완료되었는가?', '종료 체크가 완료되었는가?'],
    passCriteria: '시험 종료 및 반입/반출 확인이 완료되었다.'
  }
];
