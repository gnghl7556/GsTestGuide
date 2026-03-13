---
id: WRITE-05
title: OS별 성능 모니터링
category: writing
icon: "\U0001F4CA"
description: Windows/Linux/macOS 모니터링 도구, 측정 항목
order: 5
---

## 성능 모니터링 개요
GS 인증의 성능효율성 시험에서는 CPU, 메모리, 디스크 등 시스템 자원 사용량을 측정합니다. OS에 내장된 모니터링 도구를 활용하여 시험 중 자원 사용량을 기록합니다.

## Windows
도구: 성능 모니터 (perfmon)

실행: Win+R → perfmon 입력

주요 카운터:
• \Processor(_Total)\% Processor Time — CPU 사용률
• \Memory\Available MBytes — 가용 메모리
• \Memory\% Committed Bytes In Use — 메모리 사용률
• \PhysicalDisk(_Total)\% Disk Time — 디스크 사용률
• \Network Interface(*)\Bytes Total/sec — 네트워크 처리량

데이터 수집: 데이터 수집기 세트 생성 → 카운터 추가 → 샘플 간격 1초 → 시작

## Linux
도구: top, vmstat, iostat, sar

주요 명령어:
• top -b -n 60 -d 1 > perf.log — 1초 간격 60회 CPU/메모리 기록
• vmstat 1 60 — 1초 간격 가상 메모리 통계
• iostat -x 1 60 — 1초 간격 디스크 I/O 통계
• sar -u -r -d 1 60 — CPU, 메모리, 디스크 통합 기록

측정 항목:
• %CPU, %MEM — 프로세스별 자원 사용
• us, sy, id, wa — CPU 상태 (user, system, idle, wait)
• free, buff, cache — 메모리 상태

## macOS
도구: 활성 상태 보기 (Activity Monitor), top, vm_stat

주요 명령어:
• top -l 60 -s 1 > perf.log — 1초 간격 60회 기록
• vm_stat 1 — 1초 간격 가상 메모리 통계
• iostat -w 1 -c 60 — 디스크 I/O 통계

활성 상태 보기 사용:
1. Spotlight → "활성 상태 보기" 검색
2. CPU / 메모리 / 디스크 탭 확인
3. 시험 중 스크린샷으로 자원 사용량 기록

## 측정 항목 정리
GS 시험에서 주로 측정하는 항목:

• CPU 사용률 (%): 시험 시나리오 수행 중 피크 및 평균
• 메모리 사용량 (MB): 시험 전후 비교, 메모리 누수 확인
• 디스크 I/O: 읽기/쓰기 속도, 대기 시간
• 네트워크 처리량: 요청/응답 크기, 처리 속도
• 응답 시간: 기능별 응답 시간 (일반적으로 3초 이내 권장)

기록 방식: 시험 시작 전 → 시험 중 → 시험 종료 후, 3단계로 측정하여 비교합니다.
