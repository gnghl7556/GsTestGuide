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
  {
    id: 'remote-access',
    title: '제품 유형별 원격 접속',
    icon: '🔌',
    description: '제품 환경에 따른 서버 접속·관리 방법 가이드',
    sections: [
      {
        heading: '개요',
        content:
          'GS 인증 시험 대상 제품은 단순 로컬 설치형부터 클라우드(AWS/Azure) 기반, 컨테이너(Docker/Kubernetes) 환경까지 다양합니다. 제품 유형에 따라 서버 접속 방법과 관리 도구가 달라지므로, 시험 환경 구성 시 적절한 접속 방법을 숙지해야 합니다.\n\n사전 준비:\n• 시험 합의서에서 제품 유형(웹/CS/모바일)과 서버 환경(온프레미스/클라우드) 확인\n• 업체에 접속에 필요한 정보(IP, 포트, 계정, 키 파일 등)를 시험 시작 전 요청\n• TTA 시험실 IP 대역을 업체에 전달하여 방화벽/보안 그룹 허용 요청\n• 접속 도구(Putty, DB 클라이언트 등)를 사전에 설치\n\n환경별 접속 흐름:\n로컬 설치형 → 직접 설치 후 실행\n웹 제품 → 브라우저 접속 (아래 "웹 제품" 참고)\n서버 포함 → SSH 접속 (아래 "Linux 서버" 참고)\n클라우드 → 키 기반 접속 (아래 "클라우드 환경" 참고)\nDocker/K8s → 컨테이너 접속 (아래 "Docker/Kubernetes" 참고)',
      },
      {
        heading: '웹 제품 (브라우저 접속)',
        content:
          '접속 방법: 브라우저에서 제품 URL로 직접 접속\n\n접속 전 확인:\n• 접속 URL과 포트 번호를 업체로부터 수령 (예: http://192.168.1.100:8080)\n• 합의서에 명시된 브라우저 종류·버전 확인 (예: Chrome 최신, IE 11 등)\n• 서버 PC에서 웹 서비스(Apache, Nginx, Tomcat 등)가 구동 중인지 확인\n\n접속 절차:\n1. 브라우저 주소창에 URL 입력\n2. 로그인 페이지 정상 표시 확인\n3. 테스트 계정으로 로그인 테스트\n4. 주요 페이지 이동 및 기능 정상 작동 확인\n\n접속 불가 시 체크리스트:\n• ping [서버IP] → 네트워크 연결 확인\n• 서버 PC에서 netstat -tlnp | grep [포트] → 서비스 구동 확인\n• 방화벽 포트 개방 여부 확인 (Windows: 방화벽 설정, Linux: iptables/firewalld)\n• HTTPS인 경우 인증서 경고 → "고급" → "계속 진행"으로 우회 (시험 환경 한정)\n\n멀티 브라우저 테스트:\n합의서에 여러 브라우저가 명시된 경우, 각 브라우저별로 접속·기능 테스트를 수행합니다. 브라우저별 호환성 결함은 별도로 기록하세요.',
      },
      {
        heading: 'CS(Client-Server) 제품',
        content:
          '접속 방법: 전용 클라이언트 프로그램을 시험 PC에 설치한 후 서버에 연결\n\n설정 절차:\n1. 업체 제공 클라이언트 설치 파일(.exe, .msi 등)을 시험 PC에 설치\n2. 설치 완료 후 서버 연결 설정 화면에서 접속 정보 입력\n   - 서버 IP 또는 호스트명\n   - 포트 번호 (업체 지정)\n   - DB 접속 정보 (필요 시)\n3. 테스트 계정으로 로그인\n4. 클라이언트-서버 간 통신 정상 여부 확인\n\n접속 불가 시 체크리스트:\n• 클라이언트 버전과 서버 버전이 일치하는지 확인 (버전 불일치 시 통신 오류 빈발)\n• 방화벽에서 클라이언트가 사용하는 포트가 개방되어 있는지 확인\n• .NET Framework, Java Runtime 등 필수 런타임이 설치되어 있는지 확인\n• 관리자 권한으로 클라이언트를 실행해야 하는 경우가 있음 (우클릭 → 관리자 권한 실행)\n\n주의사항:\n• 설치 경로를 기본값으로 유지하면 문제 발생 시 업체 지원이 수월합니다\n• 클라이언트 설정 파일(config, ini 등)의 위치를 파악해두면 접속 정보 변경 시 유용합니다',
      },
      {
        heading: 'Linux 서버 (SSH 접속)',
        content:
          '도구: Putty (가장 보편적), MobaXterm (파일 전송 통합), Windows Terminal\n\n[Putty 접속 절차]\n1. Session 탭: Host Name에 서버 IP 입력, Port에 22 (또는 업체 지정 포트) 입력\n2. Connection Type: SSH 선택\n3. (선택) Connection → Data → Auto-login username에 계정 입력\n4. (선택) Session 탭에서 Saved Sessions에 이름 입력 후 Save (재접속 시 편리)\n5. Open 클릭 → 처음 접속 시 호스트 키 확인 팝업 → Accept\n6. 계정/비밀번호 입력 (비밀번호 입력 시 화면에 표시되지 않음 — 정상)\n\n[키 기반 인증 시 (.pem → .ppk 변환)]\n1. PuttyGen 실행 → Load → .pem 파일 선택\n2. Save private key → .ppk 파일 저장\n3. Putty → Connection → SSH → Auth → Private key file에 .ppk 파일 지정\n\n[MobaXterm 장점]\n• SSH 접속과 SFTP(파일 전송)가 한 화면에 통합\n• 좌측 패널에서 파일 드래그&드롭으로 업로드/다운로드 가능\n• 탭 기반으로 여러 서버 동시 접속 관리\n\n[자주 사용하는 명령어]\n서비스 관리:\n• systemctl status [서비스명] — 서비스 상태 확인\n• systemctl restart [서비스명] — 서비스 재시작\n• journalctl -u [서비스명] -f — 서비스 실시간 로그\n\n로그 확인:\n• tail -f /var/log/[로그파일] — 실시간 로그 출력\n• tail -100 /var/log/[로그파일] — 최근 100줄 확인\n• grep "error" /var/log/[로그파일] — 에러 로그 검색\n\n시스템 상태:\n• df -h — 디스크 사용량 확인\n• free -m — 메모리 사용량 확인\n• top — CPU/메모리 실시간 모니터링 (q로 종료)\n• ps aux | grep [프로세스명] — 특정 프로세스 확인\n• netstat -tlnp — 열린 포트 확인',
      },
      {
        heading: 'DB 접속',
        content:
          '도구 추천:\n• DBeaver (무료, 다중 DB 지원) — 가장 범용적\n• HeidiSQL (무료, MySQL/MariaDB/PostgreSQL)\n• MySQL Workbench (MySQL 전용)\n• pgAdmin (PostgreSQL 전용)\n• SQL Server Management Studio (MSSQL 전용)\n• SQL Developer (Oracle 전용)\n\n접속 정보 (업체 제공):\n• Host: DB 서버 IP (클라우드의 경우 엔드포인트 주소)\n• Port: DB 종류별 기본 포트\n  - MySQL/MariaDB: 3306\n  - PostgreSQL: 5432\n  - Oracle: 1521\n  - MSSQL: 1433\n  - MongoDB: 27017\n• Database: 스키마명 또는 DB명\n• 계정/비밀번호\n\n[DBeaver 접속 절차]\n1. 좌측 상단 플러그 아이콘(새 연결) 클릭\n2. DB 종류 선택 (MySQL, PostgreSQL 등)\n3. 접속 정보(Host, Port, Database, 계정, 비밀번호) 입력\n4. Test Connection으로 연결 확인 → 드라이버 자동 다운로드\n5. Finish로 연결 저장\n\n시험 시 유용한 쿼리:\n• SELECT COUNT(*) FROM [테이블명]; — 데이터 건수 확인\n• SHOW TABLES; (MySQL) / \\dt (PostgreSQL) — 테이블 목록\n• DESC [테이블명]; (MySQL) / \\d [테이블명] (PostgreSQL) — 테이블 구조\n\n주의사항:\n• 시험용 DB 계정은 읽기 권한(SELECT) 위주로 요청하세요\n• 데이터 INSERT/UPDATE/DELETE가 필요한 시험은 업체에 사전 협의\n• 접속 후 테이블 구조와 데이터 건수를 먼저 파악해두면 결함 발견 시 원인 분석에 도움됩니다\n• DB 접속 정보는 환경구성 시트에 반드시 기록 (비밀번호 제외)',
      },
      {
        heading: '클라우드 환경 (AWS)',
        content:
          '[EC2 (가상 서버) 접속]\n업체로부터 수령할 정보: 퍼블릭 IP, SSH 키 페어(.pem 파일), 계정명(보통 ec2-user 또는 ubuntu)\n\n접속 절차:\n1. .pem → .ppk 변환 (PuttyGen 사용, "Linux 서버" 섹션 참고)\n2. Putty → Host Name에 퍼블릭 IP 입력\n3. Connection → SSH → Auth → Private key file에 .ppk 지정\n4. Connection → Data → Auto-login username에 계정명 입력\n5. Open으로 접속\n\n또는 Windows Terminal에서:\nssh -i "키파일.pem" ec2-user@퍼블릭IP\n\n[RDS (관리형 DB) 접속]\n업체로부터 수령할 정보: 엔드포인트 주소, 포트, DB명, 계정/비밀번호\n\n• 엔드포인트 형태: mydb.abc123.ap-northeast-2.rds.amazonaws.com\n• DB 클라이언트(DBeaver 등)에 엔드포인트를 Host로 입력하여 접속\n• RDS는 직접 SSH 접속이 불가하므로 반드시 DB 클라이언트 사용\n\n[S3 (파일 스토리지)]\n• 파일 업로드/다운로드 기능이 있는 제품은 S3를 사용하는 경우가 많음\n• AWS 콘솔에서 버킷 내용 확인 가능 (IAM 계정 필요)\n\n[보안 그룹 설정 — 업체에 요청]\n• EC2/RDS 접속을 위해 TTA IP 대역을 보안 그룹 인바운드 규칙에 추가 필요\n• 요청 형태: "IP 210.104.181.xxx에서 포트 22(SSH), 3306(MySQL) 접근 허용 요청"\n• 시험 종료 후 해당 규칙 제거를 업체에 안내',
      },
      {
        heading: '클라우드 환경 (Azure)',
        content:
          '[VM (가상 머신) 접속]\n업체로부터 수령할 정보: 퍼블릭 IP, 계정명, 비밀번호 또는 SSH 키\n\nLinux VM:\n• Putty 또는 ssh 명령어로 접속 (Linux 서버 접속과 동일)\n• ssh [계정명]@[퍼블릭IP]\n\nWindows VM:\n• 원격 데스크톱 연결(mstsc) 사용\n• 실행(Win+R) → mstsc → 컴퓨터에 퍼블릭 IP 입력 → 연결\n• 계정/비밀번호 입력\n\n[Azure SQL Database 접속]\n업체로부터 수령할 정보: 서버명, DB명, 계정/비밀번호\n\n• 서버명 형태: myserver.database.windows.net\n• SSMS(SQL Server Management Studio) 또는 DBeaver로 접속\n• 서버명에 전체 주소 입력, 인증 방식은 "SQL Server 인증" 선택\n\n[App Service (웹 앱)]\n• 업체가 App Service에 배포한 웹 제품은 URL로 바로 접속\n• URL 형태: https://myapp.azurewebsites.net\n• 커스텀 도메인이 설정된 경우 해당 도메인으로 접속\n\n[NSG (네트워크 보안 그룹) — 업체에 요청]\n• Azure도 AWS 보안 그룹과 유사하게 NSG에서 접속 허용 필요\n• 요청 형태: "IP 210.104.181.xxx에서 포트 22, 1433 접근 허용 요청"\n• Azure Portal → VM → 네트워킹에서 규칙 확인 가능 (계정 있는 경우)',
      },
      {
        heading: 'Docker 환경',
        content:
          'Docker란: 애플리케이션을 컨테이너 단위로 격리하여 실행하는 기술. 하나의 서버에서 여러 서비스(웹, DB, 캐시 등)를 각각의 컨테이너로 운영합니다.\n\n[기본 명령어]\n컨테이너 관리:\n• docker ps — 실행 중인 컨테이너 목록\n• docker ps -a — 중지된 컨테이너 포함 전체 목록\n• docker start [컨테이너명] — 컨테이너 시작\n• docker stop [컨테이너명] — 컨테이너 중지\n• docker restart [컨테이너명] — 컨테이너 재시작\n\n로그 확인:\n• docker logs [컨테이너명] — 전체 로그\n• docker logs -f [컨테이너명] — 실시간 로그 (Ctrl+C로 종료)\n• docker logs --tail 100 [컨테이너명] — 최근 100줄\n\n컨테이너 내부 접속:\n• docker exec -it [컨테이너명] /bin/bash — bash 셸 접속\n• docker exec -it [컨테이너명] /bin/sh — bash 없는 경우 sh로 접속\n• exit — 컨테이너에서 나오기 (컨테이너는 계속 실행됨)\n\n[docker-compose 환경]\n여러 컨테이너를 한꺼번에 관리하는 도구:\n• docker-compose ps — 서비스 목록 및 상태\n• docker-compose logs -f [서비스명] — 특정 서비스 로그\n• docker-compose restart [서비스명] — 특정 서비스 재시작\n• docker-compose down && docker-compose up -d — 전체 재시작\n\n주의사항:\n• 컨테이너 재시작 시 내부 데이터가 초기화될 수 있음 (볼륨 마운트 여부 확인)\n• docker-compose.yml 파일 위치를 파악해두면 서비스 구성 이해에 도움\n• 컨테이너 내부에서 수정한 파일은 재시작 시 사라질 수 있으므로 주의',
      },
      {
        heading: 'Kubernetes 환경',
        content:
          'Kubernetes(K8s)란: 여러 서버에 걸쳐 컨테이너를 자동으로 배포·관리하는 오케스트레이션 도구. 대규모 서비스에서 주로 사용합니다.\n\n[사전 설정]\n1. kubectl 설치 (업체 또는 공식 문서 참고)\n2. 업체로부터 kubeconfig 파일 수령\n3. 환경변수 설정: set KUBECONFIG=C:\\경로\\kubeconfig.yaml (Windows)\n   또는 파일을 ~/.kube/config에 복사\n4. kubectl get nodes로 클러스터 연결 확인\n\n[기본 명령어]\n리소스 조회:\n• kubectl get pods — Pod(컨테이너) 목록\n• kubectl get pods -n [네임스페이스] — 특정 네임스페이스의 Pod\n• kubectl get svc — 서비스(접속 포인트) 목록\n• kubectl get all — 모든 리소스 조회\n\n로그 확인:\n• kubectl logs [Pod명] — Pod 로그\n• kubectl logs -f [Pod명] — 실시간 로그\n• kubectl logs [Pod명] -c [컨테이너명] — 멀티 컨테이너 Pod에서 특정 컨테이너 로그\n\nPod 접속:\n• kubectl exec -it [Pod명] -- /bin/bash — Pod 내부 접속\n• kubectl exec -it [Pod명] -- /bin/sh — bash 없는 경우\n\n상태 확인:\n• kubectl describe pod [Pod명] — Pod 상세 정보 (이벤트, 에러 등)\n• kubectl get events --sort-by=.lastTimestamp — 최근 이벤트\n\n[자주 겪는 상황]\n• Pod 상태가 CrashLoopBackOff → 로그 확인 후 업체에 전달\n• Pod 상태가 Pending → 리소스 부족, 업체에 스케일 요청\n• 서비스 접속 불가 → kubectl get svc로 외부 IP/포트 확인\n\n주의사항:\n• K8s 환경은 업체가 직접 관리하는 경우가 대부분이므로, 시험원은 조회 권한만 요청\n• kubectl delete 등 삭제 명령은 사용하지 않도록 주의\n• 네임스페이스가 여러 개인 경우 -n 옵션으로 정확한 네임스페이스 지정',
      },
      {
        heading: '원격 패치 (RemoteView)',
        content:
          '용도: 업체가 TTA 시험실에 직접 방문하지 않고 원격으로 제품을 패치할 때 사용하는 원격 데스크톱 도구\n\n[사전 설정 절차]\n1. RemoteView 공식 사이트에서 에이전트(Agent) 다운로드\n2. 시험 PC에 에이전트 설치\n3. 설치 시 생성된 접속 ID와 비밀번호를 기록\n4. 접속 정보(ID, 비밀번호)를 업체에 이메일로 전달\n\n[패치 당일 절차]\n1. 패치 예정 시간 전에 시험 PC의 RemoteView 에이전트가 실행 중인지 확인\n2. 업체 접속 시 화면에 원격 접속 알림 표시됨 → 확인\n3. 패치 진행 중에는 해당 PC에서 다른 작업 금지\n4. 패치 완료 후 업체가 접속 종료\n5. RemoteView 접속 상태가 "연결 끊김"으로 변경되었는지 확인\n\n[패치 후 확인 사항]\n• 제품 버전이 변경되었는지 확인 (About, 정보 메뉴 등)\n• 기존 테스트 데이터가 유지되는지 확인\n• 주요 기능 간단 점검 (로그인, 핵심 기능 1~2개)\n• 패치 전후 버전 정보를 환경구성 시트에 기록\n\n주의사항:\n• 패치 가능 시간: 오전 9시 ~ 오후 6시 (TTA 근무 시간)\n• 시간 외 패치가 필요한 경우 PL과 사전 협의\n• 패치 중 PC 재부팅이 필요할 수 있으므로 중요 작업은 미리 저장\n• RemoteView가 방화벽에 의해 차단되는 경우 IP 담당자에게 문의',
      },
      {
        heading: '접속 문제 해결 가이드',
        content:
          '공통 트러블슈팅 순서:\n1. 네트워크 연결 확인: ping [서버IP]\n2. 포트 개방 확인: telnet [서버IP] [포트] (또는 Test-NetConnection)\n3. 서비스 구동 확인: 서버에서 해당 서비스 상태 확인\n4. 방화벽 확인: 클라이언트/서버 양쪽 방화벽 규칙 확인\n5. 계정 확인: 계정/비밀번호 재확인, 권한 범위 확인\n\n자주 발생하는 문제:\n\n[연결 시간 초과 (Connection Timeout)]\n• 원인: IP가 틀리거나, 방화벽에서 차단, 서비스 미구동\n• 해결: ping으로 네트워크 확인 → 포트 확인 → 업체에 방화벽 허용 요청\n\n[연결 거부 (Connection Refused)]\n• 원인: 포트가 열려있지만 서비스가 해당 포트에서 구동되지 않음\n• 해결: 서버에서 서비스 상태 확인 후 재시작\n\n[인증 실패 (Authentication Failed)]\n• 원인: 계정/비밀번호 오류, 키 파일 불일치, 권한 부족\n• 해결: 계정 정보 재확인, 비밀번호 변경 후 재시도, 업체에 권한 확인 요청\n\n[SSL/TLS 인증서 경고]\n• 원인: 자체 서명 인증서 사용 (시험 환경에서 흔함)\n• 해결: 브라우저에서 "고급" → "계속 진행", DB 클라이언트에서 SSL 검증 비활성화\n\n문제 해결이 안 되는 경우: 에러 메시지를 캡처하여 업체에 전달하세요.',
      },
    ],
  },
];
