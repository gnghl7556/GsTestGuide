---
id: WRITE-04
title: Invicti 보안 테스트
category: writing
icon: "\U0001F6E1\uFE0F"
description: Invicti 도구 개요, 스캔 설정, 결과 해석
order: 4
---

## Invicti란?
Invicti(구 Netsparker)는 웹 애플리케이션 보안 취약점을 자동으로 탐지하는 DAST(Dynamic Application Security Testing) 도구입니다. GS 인증의 보안성 시험에서 웹 취약점 점검 도구로 활용됩니다.

## 스캔 설정
1. 대상 URL 등록: 시험 대상 웹 애플리케이션 URL 입력
2. 인증 설정: 로그인이 필요한 경우 계정 정보 및 로그인 매크로 설정
3. 스캔 정책 선택:
   • Full Scan: 모든 취약점 검사 (권장)
   • OWASP Top 10: 주요 10대 취약점 집중 검사
   • Custom: 특정 취약점만 선택 검사
4. 크롤링 범위: 스캔 대상 경로 포함/제외 설정
5. 스캔 실행 및 대기 (규모에 따라 수 시간 소요)

## 결과 해석
취약점 등급:
• Critical: 즉시 조치 필요 (SQL Injection, RCE 등)
• High: 심각한 보안 위협 (XSS, 인증 우회 등)
• Medium: 잠재적 위협 (정보 노출, 설정 오류 등)
• Low/Info: 권고사항 (헤더 누락, 버전 노출 등)

GS 인증 기준: Critical/High 취약점은 반드시 조치 필요. Medium은 조치 권장.

## 보고서 활용
• Executive Summary: 전체 취약점 현황 요약 → 경영진 보고용
• Technical Report: 취약점별 상세 내용 → 개발자 조치용
• Compliance Report: OWASP 등 표준 준수 여부

GS 시험 제출 시:
1. 조치 전 스캔 결과 (최초 보고서)
2. 취약점 조치 내역서
3. 조치 후 재스캔 결과 (최종 보고서)
세 가지를 함께 제출합니다.
