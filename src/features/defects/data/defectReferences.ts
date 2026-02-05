export type DefectReference = {
  summary: string;
  description: string;
  severity: 'H' | 'M' | 'L';
  frequency: 'A' | 'I';
};

// 기능별 결함 사례 데이터베이스
// 불필요한 경로는 제거하고, 핵심 내용만 정제됨

export const DEFECT_REFERENCES = {
  기능적합성: [
    {
      summary: '가상 PC 할당 기능 오류',
      description: '사용자 그룹 관리 메뉴를 통한 가상 PC 할당 시도 시, 할당이 불가능하고 아무런 반응이 없음.',
      severity: 'H',
      frequency: 'A',
    },
    {
      summary: '선택 기능 오류',
      description: '개인 전용 PC 사양 변경 팝업창에서 항목을 선택하려 해도 선택 기능이 동작하지 않음.',
      severity: 'H',
      frequency: 'A',
    },
    {
      summary: '수정 기능 오류',
      description: "기 입력된 값을 삭제하고 공백 상태에서 '확인' 버튼 클릭 시, 수정 완료 메시지는 뜨지만 실제로는 값이 수정되지 않고 기존 값이 유지됨.",
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '상태정보 요청 기능 오류',
      description: "'상태정보 요청' 버튼 클릭 시, 센서의 현재 상태 값이 갱신되어 제공되어야 하지만 갱신되지 않음.",
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '임계치 값 설정 기능 미제공',
      description: '활동지수(관심, 위험, 심각 단계)의 센서별 임계치 값을 사용자가 직접 변경할 수 있는 설정 기능이 제공되지 않음.',
      severity: 'M',
      frequency: 'A',
    },
  ],
  성능효율성: [
    {
      summary: '응답시간 지연',
      description: '보안정책 허용/차단 기능 실행 시, 정책이 실제 적용되기까지의 응답시간이 과도하게 지연됨 (기준 시간 초과).',
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '파일 다운로드 응답시간 지연',
      description: '설치 파일 다운로드 시, 파일 저장이 완료되기까지 약 15초 이상 소요되어 사용자 경험을 저해함.',
      severity: 'M',
      frequency: 'A',
    },
  ],
  사용성: [
    {
      summary: '안내 메시지 미제공',
      description: '입력 필드에 형식에 맞지 않는 값(예: 잘못된 전화번호 형식)을 입력하고 등록해도, 오류에 대한 안내 메시지가 제공되지 않음.',
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '잘못된 오류 메시지 제공',
      description: "지원하지 않는 파일 형식을 등록 시, '파일 형식이 올바르지 않습니다' 같은 안내가 아닌 시스템 오류 메시지(Java Exception 등)가 노출됨.",
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '매뉴얼과 프로그램 불일치',
      description: "매뉴얼에는 'type' 설정 기능에 대한 설명이 있으나, 실제 프로그램 화면에서는 해당 기능이 존재하지 않음.",
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '단위 정보 미제공',
      description: "입력 필드 옆에 단위(초, 분, 시 등)가 표시되지 않아, 사용자가 어떤 단위로 입력해야 하는지 명확하지 않음.",
      severity: 'M',
      frequency: 'A',
    },
  ],
  신뢰성: [
    {
      summary: '프로그램 비정상 중지 (특수문자)',
      description: '입력 필드에 유효하지 않은 값(예: <script>, 특수문자 등) 입력 시, 예외 처리가 되지 않아 프로그램이 비정상적으로 종료됨.',
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '프로그램 비정상 중지 (데이터 타입)',
      description: "숫자만 입력해야 하는 '순번' 필드에 텍스트를 입력하고 저장 시, 프로그램이 멈추거나 강제 종료됨.",
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '팝업창 비정상 중지',
      description: "팝업창에서 '취소' 또는 'X' 버튼을 클릭하여 닫을 때, 자연스럽게 닫히지 않고 오류가 발생하며 비정상 종료됨.",
      severity: 'M',
      frequency: 'A',
    },
  ],
  보안성: [
    {
      summary: '암호화 되지 않은 개인정보 저장',
      description: '사용자의 민감한 개인정보(예: 고유식별정보, 비밀번호 등)가 시스템 로그 파일에 암호화되지 않은 평문 상태로 저장됨.',
      severity: 'H',
      frequency: 'A',
    },
    {
      summary: 'XSS 취약점 (스크립트 실행)',
      description: "입력 필드에 스크립트(<script>alert('XSS')</script>)를 입력하여 저장하면, 해당 페이지 조회 시 스크립트가 실행됨.",
      severity: 'H',
      frequency: 'A',
    },
    {
      summary: 'SameSite 쿠키 설정 미흡',
      description: "CSRF 공격 방지를 위해 쿠키의 'SameSite' 속성이 'Strict' 또는 'Lax'로 설정되어야 하나, 설정이 누락되어 있음.",
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '비밀번호 확인 절차 부재',
      description: '비밀번호 변경 시, 현재 비밀번호를 확인하는 과정 없이 새 비밀번호 입력만으로 변경이 가능함.',
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '반복된 인증시도 제한 기능 미흡',
      description: '로그인 시 비밀번호를 5회 이상 틀려도 계정 잠금이나 지연 시간 등의 제한 조치가 동작하지 않음.',
      severity: 'M',
      frequency: 'A',
    },
  ],
  유지보수성: [
    {
      summary: '문제 진단정보 미제공',
      description: '프로그램 구동 중 오류가 발생했을 때, 문제의 원인을 파악할 수 있는 로그나 진단 정보가 제공되지 않음.',
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '문제 해결 정보 미제공 (매뉴얼)',
      description: '사용자 매뉴얼에 오류 발생 시 증상별 조치 방법이나 FAQ 정보가 제공되지 않음.',
      severity: 'M',
      frequency: 'A',
    },
  ],
  이식성: [
    {
      summary: '프로그램 중복 설치 오류',
      description: '프로그램이 이미 실행 중인 상태에서도 설치 파일을 실행하면 중복해서 설치가 진행됨 (실행 중 설치 차단 필요).',
      severity: 'M',
      frequency: 'A',
    },
  ],
  '일반적 요구사항': [
    {
      summary: '제품 유지보수 정보 미제공',
      description: '매뉴얼에 무상 유지보수 기간이나 범위에 대한 정보가 명시되어 있지 않음.',
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '제품 지원 정보 미제공',
      description: '제품 사용 중 문의할 수 있는 고객지원센터 연락처나 웹사이트 정보가 매뉴얼에 누락됨.',
      severity: 'M',
      frequency: 'A',
    },
    {
      summary: '목차 페이지 번호 정보 오류',
      description: '매뉴얼 목차에 표시된 페이지 번호와 실제 내용이 있는 페이지 번호가 일치하지 않음.',
      severity: 'M',
      frequency: 'A',
    },
  ],
  호환성: [],
};