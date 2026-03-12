export interface GuideSubSection {
  heading: string;
  content: string;
}

export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  sections: GuideSubSection[];
}

export const guideContent: GuideSection[] = [
  {
    id: 'feature-spec',
    title: '기능명세 작성법',
    icon: '📋',
    description: '기능 목록 구성, 입력 항목, 작성 팁',
    sections: [
      {
        heading: '기능명세란?',
        content:
          '기능명세서는 시험 대상 소프트웨어의 모든 기능을 체계적으로 정리한 문서입니다. GS 인증 시험에서는 이 문서를 기반으로 테스트 케이스를 도출하고, 시험 범위를 확정합니다.',
      },
      {
        heading: '기능 목록 구성',
        content:
          '대분류 → 중분류 → 소분류(기능) 3단계로 구성합니다.\n\n• 대분류: 시스템의 주요 모듈 단위 (예: 회원관리, 게시판)\n• 중분류: 모듈 내 업무 단위 (예: 회원가입, 로그인)\n• 소분류: 실제 테스트 가능한 기능 단위 (예: 이메일 중복 검사, 비밀번호 유효성 검증)\n\n소분류는 하나의 테스트 케이스로 검증 가능한 수준으로 작성합니다.',
      },
      {
        heading: '입력 항목',
        content:
          '각 기능에 대해 다음 항목을 작성합니다.\n\n• 기능 ID: 고유 식별자 (예: FN-USR-001)\n• 기능명: 간결하고 명확한 기능 이름\n• 기능 설명: 기능의 동작을 1~2문장으로 설명\n• 입력 데이터: 기능 수행에 필요한 입력값\n• 출력/결과: 기능 수행 후 기대되는 결과\n• 비고: 특이사항, 제약조건 등',
      },
      {
        heading: '작성 팁',
        content:
          '• 사용자 관점에서 작성: 내부 구현이 아닌 사용자가 경험하는 기능 중심\n• 동사로 시작: "조회한다", "등록한다", "삭제한다" 등 행위 중심 서술\n• 누락 방지: 화면 기준으로 기능을 나열한 후, 비기능(에러 처리, 권한 등) 추가\n• 버전 관리: 변경 이력을 기록하여 시험 중 추가/수정 사항 추적',
      },
    ],
  },
  {
    id: 'test-case',
    title: '테스트케이스 작성법',
    icon: '🧪',
    description: 'TC 구조, 사전조건/절차/기대결과, 작성 팁',
    sections: [
      {
        heading: '테스트케이스란?',
        content:
          '테스트케이스(TC)는 특정 기능이 올바르게 동작하는지 검증하기 위한 구체적인 시험 절차입니다. 기능명세서의 각 기능에 대해 1개 이상의 TC를 작성합니다.',
      },
      {
        heading: 'TC 구조',
        content:
          '하나의 테스트케이스는 다음 요소로 구성됩니다.\n\n• TC ID: 고유 식별자 (예: TC-USR-001-01)\n• TC명: 검증 목적을 명확히 표현\n• 관련 기능 ID: 대응하는 기능명세 ID\n• 우선순위: 상/중/하\n• 사전조건: 테스트 수행 전 충족해야 할 조건\n• 테스트 절차: 단계별 수행 동작\n• 기대결과: 각 절차에 대한 예상 결과\n• 실제결과: 시험 수행 후 기록 (시험 시 작성)',
      },
      {
        heading: '사전조건 · 절차 · 기대결과 작성',
        content:
          '사전조건 예시:\n"관리자 계정으로 로그인된 상태"\n"테스트용 게시글이 1건 이상 등록된 상태"\n\n테스트 절차 예시:\n1. 게시판 메뉴를 클릭한다\n2. 게시글 제목에 "테스트"를 입력한다\n3. 검색 버튼을 클릭한다\n\n기대결과 예시:\n"제목에 \'테스트\'가 포함된 게시글만 목록에 표시된다"',
      },
      {
        heading: '작성 팁',
        content:
          '• 정상/비정상 케이스 모두 작성: 정상 입력뿐 아니라 빈값, 특수문자, 경계값 등\n• 독립적으로 실행 가능하게: 다른 TC에 의존하지 않도록 사전조건 명시\n• 결과는 검증 가능하게: "정상 처리된다" 대신 구체적 변화를 기술\n• 기능당 TC 수: 단순 기능은 2~3개, 복잡한 기능은 5개 이상 권장',
      },
    ],
  },
  {
    id: 'defect-report',
    title: '결함리포트 작성법',
    icon: '🐛',
    description: '결함 보고 양식, 심각도/빈도, 재현 절차',
    sections: [
      {
        heading: '결함리포트란?',
        content:
          'GS 인증 시험 중 발견된 결함을 체계적으로 기록·보고하는 문서입니다. 결함 수정 및 재시험의 근거가 되며, 심각도에 따라 인증 합격 여부에 영향을 줍니다.',
      },
      {
        heading: '결함 보고 양식',
        content:
          '• 결함 ID: 고유 식별자 (예: DEF-001)\n• 결함 제목: 현상을 간결하게 요약\n• 관련 TC ID: 결함이 발견된 테스트케이스\n• 발견일: 결함 발견 날짜\n• 결함 설명: 현상에 대한 상세 설명\n• 재현 절차: 결함을 재현하는 단계별 절차\n• 기대결과 vs 실제결과: 비교 기술\n• 심각도/빈도: 아래 기준 참고\n• 첨부파일: 스크린샷, 로그 등',
      },
      {
        heading: '심각도와 빈도',
        content:
          '심각도 (Severity):\n• Critical: 시스템 중단, 데이터 손실\n• Major: 주요 기능 미작동, 우회 불가\n• Minor: 부분 기능 오류, 우회 가능\n• Trivial: UI 오타, 미관상 문제\n\n빈도 (Frequency):\n• Always: 항상 재현 (100%)\n• Often: 자주 재현 (50% 이상)\n• Sometimes: 간헐적 재현\n• Rare: 드물게 발생\n\nGS 인증에서 Critical/Major 결함은 반드시 수정 후 재시험이 필요합니다.',
      },
      {
        heading: '재현 절차 작성 팁',
        content:
          '• 환경 정보 포함: OS, 브라우저, 해상도 등 시험 환경 명시\n• 단계별 기술: 누구나 따라 할 수 있도록 구체적으로 작성\n• 스크린샷 첨부: 오류 화면, 에러 메시지 캡처\n• 로그 첨부: 서버/클라이언트 오류 로그가 있으면 함께 첨부\n• 재현율 기록: 10회 시도 중 몇 회 발생하는지 기록',
      },
    ],
  },
  {
    id: 'invicti-security',
    title: 'Invicti 보안 테스트',
    icon: '🛡️',
    description: 'Invicti 도구 개요, 스캔 설정, 결과 해석',
    sections: [
      {
        heading: 'Invicti란?',
        content:
          'Invicti(구 Netsparker)는 웹 애플리케이션 보안 취약점을 자동으로 탐지하는 DAST(Dynamic Application Security Testing) 도구입니다. GS 인증의 보안성 시험에서 웹 취약점 점검 도구로 활용됩니다.',
      },
      {
        heading: '스캔 설정',
        content:
          '1. 대상 URL 등록: 시험 대상 웹 애플리케이션 URL 입력\n2. 인증 설정: 로그인이 필요한 경우 계정 정보 및 로그인 매크로 설정\n3. 스캔 정책 선택:\n   • Full Scan: 모든 취약점 검사 (권장)\n   • OWASP Top 10: 주요 10대 취약점 집중 검사\n   • Custom: 특정 취약점만 선택 검사\n4. 크롤링 범위: 스캔 대상 경로 포함/제외 설정\n5. 스캔 실행 및 대기 (규모에 따라 수 시간 소요)',
      },
      {
        heading: '결과 해석',
        content:
          '취약점 등급:\n• Critical: 즉시 조치 필요 (SQL Injection, RCE 등)\n• High: 심각한 보안 위협 (XSS, 인증 우회 등)\n• Medium: 잠재적 위협 (정보 노출, 설정 오류 등)\n• Low/Info: 권고사항 (헤더 누락, 버전 노출 등)\n\nGS 인증 기준: Critical/High 취약점은 반드시 조치 필요. Medium은 조치 권장.',
      },
      {
        heading: '보고서 활용',
        content:
          '• Executive Summary: 전체 취약점 현황 요약 → 경영진 보고용\n• Technical Report: 취약점별 상세 내용 → 개발자 조치용\n• Compliance Report: OWASP 등 표준 준수 여부\n\nGS 시험 제출 시:\n1. 조치 전 스캔 결과 (최초 보고서)\n2. 취약점 조치 내역서\n3. 조치 후 재스캔 결과 (최종 보고서)\n세 가지를 함께 제출합니다.',
      },
    ],
  },
  {
    id: 'os-monitoring',
    title: 'OS별 성능 모니터링',
    icon: '📊',
    description: 'Windows/Linux/macOS 모니터링 도구, 측정 항목',
    sections: [
      {
        heading: '성능 모니터링 개요',
        content:
          'GS 인증의 성능효율성 시험에서는 CPU, 메모리, 디스크 등 시스템 자원 사용량을 측정합니다. OS에 내장된 모니터링 도구를 활용하여 시험 중 자원 사용량을 기록합니다.',
      },
      {
        heading: 'Windows',
        content:
          '도구: 성능 모니터 (perfmon)\n\n실행: Win+R → perfmon 입력\n\n주요 카운터:\n• \\Processor(_Total)\\% Processor Time — CPU 사용률\n• \\Memory\\Available MBytes — 가용 메모리\n• \\Memory\\% Committed Bytes In Use — 메모리 사용률\n• \\PhysicalDisk(_Total)\\% Disk Time — 디스크 사용률\n• \\Network Interface(*)\\Bytes Total/sec — 네트워크 처리량\n\n데이터 수집: 데이터 수집기 세트 생성 → 카운터 추가 → 샘플 간격 1초 → 시작',
      },
      {
        heading: 'Linux',
        content:
          '도구: top, vmstat, iostat, sar\n\n주요 명령어:\n• top -b -n 60 -d 1 > perf.log — 1초 간격 60회 CPU/메모리 기록\n• vmstat 1 60 — 1초 간격 가상 메모리 통계\n• iostat -x 1 60 — 1초 간격 디스크 I/O 통계\n• sar -u -r -d 1 60 — CPU, 메모리, 디스크 통합 기록\n\n측정 항목:\n• %CPU, %MEM — 프로세스별 자원 사용\n• us, sy, id, wa — CPU 상태 (user, system, idle, wait)\n• free, buff, cache — 메모리 상태',
      },
      {
        heading: 'macOS',
        content:
          '도구: 활성 상태 보기 (Activity Monitor), top, vm_stat\n\n주요 명령어:\n• top -l 60 -s 1 > perf.log — 1초 간격 60회 기록\n• vm_stat 1 — 1초 간격 가상 메모리 통계\n• iostat -w 1 -c 60 — 디스크 I/O 통계\n\n활성 상태 보기 사용:\n1. Spotlight → "활성 상태 보기" 검색\n2. CPU / 메모리 / 디스크 탭 확인\n3. 시험 중 스크린샷으로 자원 사용량 기록',
      },
      {
        heading: '측정 항목 정리',
        content:
          'GS 시험에서 주로 측정하는 항목:\n\n• CPU 사용률 (%): 시험 시나리오 수행 중 피크 및 평균\n• 메모리 사용량 (MB): 시험 전후 비교, 메모리 누수 확인\n• 디스크 I/O: 읽기/쓰기 속도, 대기 시간\n• 네트워크 처리량: 요청/응답 크기, 처리 속도\n• 응답 시간: 기능별 응답 시간 (일반적으로 3초 이내 권장)\n\n기록 방식: 시험 시작 전 → 시험 중 → 시험 종료 후, 3단계로 측정하여 비교합니다.',
      },
    ],
  },
];
