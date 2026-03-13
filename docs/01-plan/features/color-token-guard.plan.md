# Plan: color-token-guard — 하드코딩 Tailwind 색상 방지 및 잔여 토큰화

> **Feature**: color-token-guard
> **Author**: Claude Code
> **Date**: 2026-03-14
> **Status**: Draft
> **Prior Art**: checkmate (공통 UI 스타일 통일, Match Rate 96%)

---

## Executive Summary

| 항목 | 값 |
|------|------|
| **Feature** | color-token-guard — 하드코딩 Tailwind 색상 방지 및 잔여 토큰화 |
| **예상 기간** | 1~2일 |
| **영향 범위** | 4개 파일 (토큰화) + ESLint 규칙 1개 + CI 연동 |
| **선행 피처** | checkmate (96% 완료) |

### Value Delivered (4 관점)

| 관점 | 내용 |
|------|------|
| **문제** | checkmate에서 의도적 범위 제외된 10개 하드코딩 색상이 4개 파일에 잔존하며, 새 코드 작성 시 하드코딩 색상이 재유입될 방지 장치가 없음 |
| **해결** | 잔여 10개 참조를 시맨틱 토큰으로 전환하고, ESLint 커스텀 규칙으로 하드코딩 색상 신규 유입을 빌드 시점에 차단 |
| **기능/UX 효과** | 다크/라이트 모드에서 HelperToolsPopup, NextItemsPanel, ReferenceGuideManagement, ProjectListModal의 색상 일관성 확보 |
| **핵심 가치** | 시맨틱 토큰 시스템의 100% 적용률 달성 (범위 내), "한번 고치고 끝" 대신 "다시는 발생하지 않게" 구조적 방지 |

---

## 1. 배경 및 동기

### 1.1 checkmate 피처 후속

checkmate 피처에서 21개 파일의 하드코딩 Tailwind 색상을 시맨틱 토큰으로 전환했으나 (Match Rate 96%), 다음 항목들이 후속 과제로 남았다:

| 파일 | 잔여 참조 | 이유 |
|------|-----------|------|
| `HelperToolsPopup.tsx` | 4개 (rose, sky, emerald, amber) | 도구 카테고리 아이콘 색상 |
| `NextItemsPanel.tsx` | 2개 (emerald, yellow) | 완료/보류 상태 아이콘 |
| `ReferenceGuideManagement.tsx` | 2개 (amber) | "수정됨" 배지 |
| `ProjectListModal.tsx` | 2개 (purple) | "재시험" 상태 배지 |

### 1.2 구조적 문제

코드베이스에 하드코딩 색상이 재유입되는 것을 방지하는 장치가 없다. `git grep`으로 수동 검사하는 것은 지속 가능하지 않으며, 새 개발자가 합류하면 동일 문제가 반복된다.

---

## 2. 목표

### 2.1 Must Have (필수)

- [ ] 잔여 4개 파일의 10개 하드코딩 색상을 시맨틱 토큰으로 전환
- [ ] 필요 시 새 시맨틱 토큰 정의 (`status-modified`, `status-retry` 등)
- [ ] ESLint 커스텀 규칙 작성 — `src/` 내 `.tsx` 파일에서 하드코딩 Tailwind 색상 감지

### 2.2 Should Have (권장)

- [ ] ESLint 규칙에 allowlist 지원 (범위 제외 파일/패턴)
- [ ] `npm run lint` 실행 시 자동 적용

### 2.3 Won't Do (범위 제외)

| 항목 | 이유 |
|------|------|
| `schedule.ts` / `ScheduleWizard.tsx` / `ScheduleCalendar.tsx` | 갠트 차트 도메인 색상 — 시맨틱 토큰과 독립적인 데이터 시각화 색상 |
| `TestSetupPage.tsx` 브랜드 그래디언트 | 의도적 브랜드 아이덴티티 |
| `<option>` 태그 `text-gray-900` | 브라우저 네이티브 렌더링 제약 |
| `TestSetupPage.tsx` 단계 배지 (sky 계열) | 정보 디자인 요소, 별도 토큰화 필요 시 후속 검토 |
| `ParsingOverlay.tsx` 그래디언트 | 브랜드 그래디언트 |

---

## 3. 구현 전략

### 3.1 Stream 1: 잔여 토큰 전환 (4개 파일)

#### 3.1.1 새 시맨틱 토큰 정의

**`src/index.css`** (CSS 변수) + **`tailwind.config.js`** (토큰 매핑)에 추가:

```
status-modified-bg    — 수정됨 배지 배경 (amber 계열)
status-modified-text  — 수정됨 배지 텍스트
status-retry-bg       — 재시험 배지 배경 (purple 계열)
status-retry-text     — 재시험 배지 텍스트
```

#### 3.1.2 파일별 전환 매핑

| 파일 | 현재 | 전환 후 |
|------|------|---------|
| `HelperToolsPopup.tsx:21` | `text-rose-500 dark:text-rose-400` | `text-status-fail-text` |
| `HelperToolsPopup.tsx:30` | `text-sky-500 dark:text-sky-400` | `text-accent-text` |
| `HelperToolsPopup.tsx:39` | `text-emerald-500 dark:text-emerald-400` | `text-status-pass-text` |
| `HelperToolsPopup.tsx:48` | `text-amber-500 dark:text-amber-400` | `text-status-hold-text` |
| `NextItemsPanel.tsx:41` | `text-emerald-500` | `text-status-pass-text` |
| `NextItemsPanel.tsx:92` | `text-yellow-600` | `text-status-hold-text` |
| `ReferenceGuideManagement.tsx:266` | `text-amber-600 bg-amber-50` | `text-status-modified-text bg-status-modified-bg` |
| `ReferenceGuideManagement.tsx:277` | `hover:text-amber-600 hover:bg-amber-50` | `hover:text-status-modified-text hover:bg-status-modified-bg` |
| `ProjectListModal.tsx:16` | `bg-purple-100 text-purple-700` | `bg-status-retry-bg text-status-retry-text` |
| `ProjectListModal.tsx:170` | `border-purple-400/60` | `border-accent/60` |

### 3.2 Stream 2: ESLint 커스텀 규칙

**목적**: `src/` 하위 `.tsx` 파일에서 하드코딩 Tailwind 색상 클래스를 감지하여 경고/에러 발생

**규칙 이름**: `no-hardcoded-tailwind-colors`

**감지 대상 패턴**:
```
(bg|text|border|ring|from|via|to|divide|outline|shadow|decoration)-
(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|
 emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-
[0-9]+
```

**allowlist** (무시할 파일):
- `src/constants/schedule.ts` — 갠트 차트 도메인 색상
- `src/components/schedule/**` — 달력/일정 컴포넌트
- `src/features/test-setup/components/TestSetupPage.tsx` — 브랜드 그래디언트 (주석으로 `// eslint-disable-next-line` 사용)

**구현 방식**:
- `eslint-plugin-local` 패턴 또는 `.eslintrc` 내 `no-restricted-syntax` 활용
- 별도 플러그인 패키지 생성 불필요 — 프로젝트 내 로컬 규칙으로 충분

### 3.3 구현 순서

```
1. index.css + tailwind.config.js — 새 토큰 정의 (status-modified, status-retry)
2. 4개 파일 토큰 전환
3. ESLint 규칙 작성 (no-hardcoded-tailwind-colors)
4. allowlist 설정 및 검증
5. npm run lint 통과 확인
```

---

## 4. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 새 토큰의 다크 모드 색상값 부적절 | 시각적 불일치 | 브라우저 DevTools로 라이트/다크 모두 검증 |
| ESLint 규칙 false positive | 개발 생산성 저하 | allowlist + `eslint-disable` 주석 지원 |
| 기존 범위 제외 파일에서 린트 에러 대량 발생 | CI 실패 | 규칙 적용 전 allowlist 먼저 설정 |

---

## 5. 성공 기준

| 기준 | 목표 |
|------|------|
| 잔여 하드코딩 참조 제거 | 4개 파일, 10개 참조 → 0개 |
| 새 토큰 다크/라이트 정상 동작 | 수동 검증 통과 |
| ESLint 규칙 동작 | 하드코딩 색상 신규 작성 시 lint error 발생 |
| `npm run lint` 통과 | 0 errors (allowlist 제외) |
| Match Rate | ≥ 95% |

---

## 6. 참조

| 문서 | 경로 |
|------|------|
| checkmate 분석 | `docs/03-analysis/checkmate.analysis.md` |
| checkmate 리포트 | `docs/04-report/features/checkmate.report.md` |
| 디자인 토큰 정의 | `src/index.css` (`:root` / `.dark`) |
| Tailwind 설정 | `tailwind.config.js` |
| ESLint 설정 | `eslint.config.js` |
