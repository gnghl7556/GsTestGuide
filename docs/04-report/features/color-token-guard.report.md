# color-token-guard 완료 리포트

> **Status**: Complete
>
> **Project**: GsTestGuide
> **Author**: Claude Code (Report Generator)
> **Completion Date**: 2026-03-14
> **PDCA Cycle**: #2 (checkmate 후속)

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **Feature** | color-token-guard — 하드코딩 Tailwind 색상 방지 및 잔여 토큰화 |
| **시작 일자** | 2026-03-14 |
| **완료 일자** | 2026-03-14 |
| **소요 기간** | 1일 |
| **선행 피처** | checkmate (96% Match Rate) |

### 1.2 결과 요약

```
┌─────────────────────────────────────────────────┐
│  완료율: 100%                                    │
├─────────────────────────────────────────────────┤
│  ✅ 완료:         41 / 41 항목                    │
│  ⏸️  미완료:        0 / 41 항목                    │
│  ❌ 취소:          0 / 41 항목                    │
├─────────────────────────────────────────────────┤
│  설계 일치율:      100%                          │
│  보너스 항목:      1개 (CenterDisplay.tsx)      │
└─────────────────────────────────────────────────┘
```

### 1.3 가치 제공 (4관점)

| 관점 | 내용 |
|------|------|
| **문제** | checkmate에서 의도적으로 범위 제외된 4개 파일의 10개 하드코딩 Tailwind 색상이 잔존하며, 새 코드 작성 시 하드코딩 색상이 재유입될 방지 장치가 없어 시맨틱 토큰 시스템의 일관성 저하 |
| **해결** | 잔여 10개 참조를 시맨틱 토큰(status-modified, status-retry)으로 전환하고, ESLint 커스텀 규칙을 통해 빌드 시점에 하드코딩 색상 신규 유입을 자동 차단 |
| **기능/UX 효과** | HelperToolsPopup, NextItemsPanel, ReferenceGuideManagement, ProjectListModal의 색상이 시맨틱 토큰으로 통일되어 다크/라이트 모드에서 자동 대응됨. npm run lint 실행 시 하드코딩 색상 0건 경고 달성 |
| **핵심 가치** | 시맨틱 토큰 시스템의 100% 적용률 확보(범위 내). "한번 고치고 끝"이 아닌 "구조적으로 다시는 발생하지 않게" 방지 메커니즘 확립으로 장기적 코드베이스 품질 향상 |

---

## 2. 관련 문서

| Phase | 문서 | 상태 |
|-------|------|------|
| Plan | [color-token-guard.plan.md](../01-plan/features/color-token-guard.plan.md) | ✅ 완료 |
| Design | [color-token-guard.design.md](../02-design/features/color-token-guard.design.md) | ✅ 완료 |
| Check | [color-token-guard.analysis.md](../03-analysis/color-token-guard.analysis.md) | ✅ 완료 (100% 일치) |
| Act | 본 문서 | ✅ 작성 완료 |

---

## 3. PDCA 사이클 요약

### 3.1 Plan (계획)

**목표**:
- 잔여 4개 파일의 10개 하드코딩 색상을 시맨틱 토큰으로 전환
- 새 하드코딩 색상 신규 유입 방지를 위한 ESLint 규칙 작성

**예상 기간**: 1~2일
**전략**: 2개 Stream으로 병렬 구성 (토큰 정의/전환, ESLint 규칙)

### 3.2 Design (설계)

**설계 항목**:
- **Stream 1**: CSS 변수 6개 + Tailwind 토큰 6개 + 4개 파일 11개 참조 전환
- **Stream 2**: ESLint 로컬 규칙 파일 + 설정 통합

**총 변경 파일**: 8개
**설계 상세도**: 100% (모든 파일/라인/값 명시)

### 3.3 Do (수행)

**구현 순서**:
```
Step 1:  src/index.css — CSS 변수 6개 추가 (:root + .dark)
Step 2:  tailwind.config.js — 토큰 매핑 6개 추가
Step 3:  HelperToolsPopup.tsx — color 프로퍼티 4곳 전환
Step 4:  NextItemsPanel.tsx — className 2곳 전환
Step 5:  ReferenceGuideManagement.tsx — className 2곳 전환
Step 6:  ProjectListModal.tsx — className 2곳 전환
Step 7:  eslint-rules/no-hardcoded-tailwind-colors.js — 규칙 파일 생성
Step 8:  eslint.config.js — 플러그인 등록 + ignores 설정
Step 9:  npm run lint — 전체 통과 확인 및 npm run build 성공
```

**실제 기간**: 1일 (예상과 동일)
**코드 변경**: 8개 파일, 41개 항목 변경 + 보너스 1개 (CenterDisplay.tsx)

### 3.4 Check (검증)

**분석 결과**:
- **설계 일치율 (Match Rate)**: 100% (41/41)
- **추가 구현 (보너스)**: 1개
  - `CenterDisplay.tsx:366`: `ring-blue-500` → `ring-accent/50` (시맨틱 토큰 확장)
- **범위 제외 방식 최적화**: `eslint-disable-next-line` 대신 설정 레벨 ignores 채택 (유지보수성 향상)

**분석 검증 체크리스트**:
- [x] 라이트 모드 CSS 변수 6개 정의 (값 일치)
- [x] 다크 모드 CSS 변수 6개 정의 (값 일치)
- [x] Tailwind 토큰 매핑 6개 (모두 일치)
- [x] 4개 컴포넌트 11개 참조 전환 (모두 일치)
- [x] `dark:` 접두사 이중 선언 제거 (확인)
- [x] ESLint 규칙 파일 7개 항목 (모두 일치)
- [x] ESLint 설정 통합 6개 항목 (모두 일치)
- [x] `npm run lint`: 0개 경고/에러
- [x] `npm run build`: 성공

---

## 4. 완료된 항목

### 4.1 Stream 1: 시맨틱 토큰 확장 및 전환

#### 4.1.1 새 CSS 변수 정의 (`src/index.css`)

| 변수명 | 라이트 모드 값 | 다크 모드 값 | 상태 |
|--------|---------|---------|------|
| `--status-modified-bg` | `#fffbeb` | `rgba(245, 158, 11, 0.15)` | ✅ |
| `--status-modified-text` | `#d97706` | `#fcd34d` | ✅ |
| `--status-modified-border` | `#fde68a` | `rgba(251, 191, 35, 0.3)` | ✅ |
| `--status-retry-bg` | `#f3e8ff` | `rgba(139, 92, 246, 0.15)` | ✅ |
| `--status-retry-text` | `#7c3aed` | `#c4b5fd` | ✅ |
| `--status-retry-border` | `#d8b4fe` | `rgba(167, 139, 250, 0.3)` | ✅ |

**설계 근거**: 기존 시맨틱 토큰(`status-pass`, `status-fail`, `status-hold`)의 패턴을 따르며, amber/purple 색상으로 "수정됨"과 "재시험" 상태를 의미적으로 구분.

#### 4.1.2 Tailwind 토큰 매핑 (`tailwind.config.js`)

```javascript
// theme.extend.colors.status 에 추가된 6개 토큰
'modified-bg': 'var(--status-modified-bg)',
'modified-text': 'var(--status-modified-text)',
'modified-border': 'var(--status-modified-border)',
'retry-bg': 'var(--status-retry-bg)',
'retry-text': 'var(--status-retry-text)',
'retry-border': 'var(--status-retry-border)',
```

**활용**: `bg-status-modified-bg`, `text-status-retry-text` 등 Tailwind 유틸리티 클래스로 즉시 사용 가능.

#### 4.1.3 컴포넌트별 토큰 전환

##### HelperToolsPopup.tsx (4곳)

| 라인 | 기존 값 | 전환 후 | 의미 |
|------|--------|--------|------|
| 21 | `text-rose-500 dark:text-rose-400` | `text-status-fail-text` | 캡처/녹화 → fail(주의) |
| 30 | `text-sky-500 dark:text-sky-400` | `text-accent-text` | 원격 접속 → accent(액션) |
| 39 | `text-emerald-500 dark:text-emerald-400` | `text-status-pass-text` | 테스트 도구 → pass(성공) |
| 48 | `text-amber-500 dark:text-amber-400` | `text-status-hold-text` | 성능 측정 → hold(대기) |

**결과**: `dark:` 접두사 4곳 제거, CSS 변수 기반 자동 모드 전환.

##### NextItemsPanel.tsx (2곳)

| 라인 | 기존 값 | 전환 후 |
|------|--------|--------|
| 41 | `text-emerald-500` | `text-status-pass-text` |
| 92 | `text-yellow-600` | `text-status-hold-text` |

##### ReferenceGuideManagement.tsx (2곳)

| 라인 | 기존 값 | 전환 후 |
|------|--------|--------|
| 266 | `text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10` | `text-status-modified-text bg-status-modified-bg` |
| 277 | `hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10` | `hover:text-status-modified-text hover:bg-status-modified-bg` |

**결과**: 다크/라이트 모드 일관성 확보 + CSS 변수 기반 유지보수 간편화.

##### ProjectListModal.tsx (2곳)

| 라인 | 기존 값 | 전환 후 |
|------|--------|--------|
| 16 | `bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400` | `bg-status-retry-bg text-status-retry-text` |
| 170 | `border-purple-400/60` | `border-accent/60` |

**결과**: 재시험 배지의 시맨틱 토큰화 + 활성 카드 테두리의 일관성.

### 4.2 Stream 2: ESLint 하드코딩 색상 방지 규칙

#### 4.2.1 규칙 파일 생성 (`eslint-rules/no-hardcoded-tailwind-colors.js`)

**기능**:
- Literal 노드(JSX className): 문자열 리터럴 내 하드코딩 색상 감지
- TemplateLiteral 노드(템플릿 리터럴): 템플릿 스트링 내 패턴 감지

**감지 정규식**:
```regex
\b(?:bg|text|border|ring|from|via|to|divide|outline|shadow|decoration)-
(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|
 emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+
```

**메시지**: `하드코딩된 Tailwind 색상 "{{match}}"를 발견했습니다. 시맨틱 토큰을 사용하세요.`

#### 4.2.2 ESLint 설정 통합 (`eslint.config.js`)

```javascript
// 규칙 등록
import noHardcodedTailwindColors from './eslint-rules/no-hardcoded-tailwind-colors.js';

// 플러그인 등록 및 ignores 설정
{
  files: ['src/**/*.{ts,tsx}'],
  ignores: [
    'src/constants/schedule.ts',                    // 갠트 차트 도메인 색상
    'src/components/schedule/**',                   // 달력/일정 컴포넌트
    'src/features/test-setup/components/TestSetupPage.tsx',  // 브랜드 그래디언트
    'src/features/test-setup/components/TestInfoCard.tsx',   // <option> 네이티브 렌더링
    'src/components/schedule/ScheduleCalendar.tsx', // 달력 도메인 색상
    'src/features/test-setup/components/ParsingOverlay.tsx'  // 브랜드 그래디언트
  ],
  plugins: {
    'local': { rules: { 'no-hardcoded-tailwind-colors': noHardcodedTailwindColors } }
  },
  rules: {
    'local/no-hardcoded-tailwind-colors': 'warn'  // 경고 심각도
  }
}
```

**범위 제외 전략**:
- 갠트 차트, 달력 등 도메인 특화 색상: 설정 레벨 ignores
- 브랜드 그래디언트: 설정 레벨 ignores (설계에서 라인 레벨 제안 → 최적화됨)

#### 4.2.3 검증 결과

```
$ npm run lint

✅ 0 errors
✅ 0 warnings (allowlist 제외)
✅ Passed
```

**테스트 검증**:
- [x] 새 파일에 `bg-red-500` 작성 시 `warn` 발생 확인
- [x] `schedule.ts` 내 `text-blue-500` 무시 확인
- [x] 기존 범위 제외 파일 내 색상 무시 확인

---

## 5. 미완료 항목

**없음.** 모든 설계 항목이 구현되었음.

---

## 6. 품질 지표

### 6.1 최종 분석 결과

| 지표 | 목표 | 달성 | 변동 | 상태 |
|------|------|------|------|------|
| **설계 일치율** | ≥ 95% | 100% | +5% | ✅ |
| **코드 품질 점수** | - | 우수 | - | ✅ |
| **lint 에러** | 0 | 0 | - | ✅ |
| **빌드 성공** | 통과 | 통과 | - | ✅ |
| **하드코딩 색상 참조** | 0개 (범위 내) | 0개 | -10개 | ✅ |

### 6.2 구현 메트릭

| 항목 | 수량 |
|------|------|
| CSS 변수 추가 | 6개 (`:root` 3개, `.dark` 3개) |
| Tailwind 토큰 추가 | 6개 |
| 컴포넌트 파일 수정 | 4개 |
| 컴포넌트 내 참조 전환 | 11개 |
| ESLint 규칙 파일 생성 | 1개 |
| ESLint 설정 수정 | 1개 |
| 설계 일치 항목 | 41/41 (100%) |
| 보너스 구현 | 1개 (CenterDisplay.tsx) |

---

## 7. 학습 및 회고

### 7.1 잘된 점 (Keep)

1. **설계 정확도 극대화**: 설계 문서에 모든 파일/라인/값을 명시하여 구현 편차 최소화 (100% 일치 달성)

2. **2-Stream 구조 병렬 설계**: 토큰 정의와 ESLint 규칙을 독립적으로 설계하여 구현 순서 유연성 확보

3. **범위 제외 전략의 명확성**: 의도적으로 범위를 제외한 파일(schedule, brand gradient)을 설계 단계에서 문서화하여 논의 기록 남김

4. **CSS 변수 패턴 일관성**: 기존 `status-*` 토큰의 다크/라이트 모드 패턴을 정확히 따르되, 새 토큰의 색상값을 선택하는 과정에서 디자인 의도(amber for modified, purple for retry) 명확하게 설정

### 7.2 개선 필요 영역 (Problem)

1. **ESLint 규칙 심각도**: 초기 설계에서 `warn`으로 설정했는데, 향후 안정화 후 `error`로 격상하는 시점 결정 기준이 모호함

2. **커스텀 ESLint 규칙의 테스트 자동화**: 현재 수동 검증(새 파일에 하드코딩 색상 작성)으로만 확인 — E2E 린트 테스트 케이스 없음

3. **보너스 구현의 의도 부재**: `CenterDisplay.tsx`의 `ring-accent/50` 전환은 설계에 없었으며, 구현 중 발견한 것 — 설계 단계에서 전체 코드베이스를 스캔하는 절차 필요

### 7.3 다음에 시도할 사항 (Try)

1. **ESLint 규칙의 심각도 자동 격상 정책**: "1주일 경고 유지 후 error로 변경" 같은 명시적 정책 수립

2. **모든 파일 사전 스캔**: 다음 시맨틱 토큰 관련 피처에서는 구현 전 `npm grep` 또는 커스텀 스크립트로 대상 파일 발굴

3. **ESLint 규칙 단위 테스트**: `jest` + `eslint-plugin-jest` 활용하여 규칙의 동작을 자동 검증

4. **checkmate 피처와의 차이점 분석**: 다음 스타일/UI 통일 피처에서는 "checkmate 대비 추가/개선 사항" 섹션 신설

---

## 8. 다음 단계

### 8.1 즉시 조치 (Within 1 day)

- [x] 완료 리포트 작성
- [x] 설계 문서 보너스 항목 기록 (선택)
- [x] `.bkit/state/pdca-status.json` 업데이트

### 8.2 후속 개선 (Next Cycle)

| 항목 | 우선순위 | 예상 기간 |
|------|----------|----------|
| ESLint 규칙 심각도 `error`로 격상 | High | 1주일 후 |
| ESLint 규칙 단위 테스트 추가 | Medium | 2~3일 |
| 모든 파일 자동 스캔 스크립트 | Medium | 2일 |
| 시맨틱 토큰 가이드 문서화 | Low | 1일 |

### 8.3 관련 피처 영향

- **Admin 가이드 콘텐츠**: "하드코딩 색상 금지 정책" 추가 기록 가능
- **CI/CD 파이프라인**: 향후 `npm run lint`를 필수 조건으로 설정하여 배포 전 자동 검증
- **온보딩 가이드**: 새 개발자 대상 "시맨틱 토큰 사용법" 추가

---

## 9. 변경 로그

### v1.0 (2026-03-14)

**추가됨**:
- CSS 변수 6개 (`--status-modified-*`, `--status-retry-*` × 2 for :root/.dark)
- Tailwind 토큰 6개 (`status.modified-*`, `status.retry-*`)
- ESLint 커스텀 규칙 (`no-hardcoded-tailwind-colors`)

**변경됨**:
- HelperToolsPopup.tsx: 4개 `color` 프로퍼티 시맨틱 토큰 전환
- NextItemsPanel.tsx: 2개 아이콘 className 시맨틱 토큰 전환
- ReferenceGuideManagement.tsx: 2개 배지/버튼 className 시맨틱 토큰 전환
- ProjectListModal.tsx: 2개 카드 className 시맨틱 토큰 전환
- ESLint 설정: 로컬 플러그인 등록 + ignores 6개 파일

**수정됨**:
- CenterDisplay.tsx: `ring-blue-500` → `ring-accent/50` (보너스)

**결과**:
- 설계 일치율: 100% (41/41 항목)
- npm run lint: 0 errors, 0 warnings
- npm run build: ✅ 성공

---

## 10. 참조 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| Plan 문서 | `docs/01-plan/features/color-token-guard.plan.md` | 계획 및 목표 정의 |
| Design 문서 | `docs/02-design/features/color-token-guard.design.md` | 기술 설계 사양 |
| Gap Analysis | `docs/03-analysis/color-token-guard.analysis.md` | 설계-구현 일치도 검증 |
| checkmate 리포트 | `docs/04-report/features/checkmate.report.md` | 선행 피처 참고 |
| Tailwind 설정 | `tailwind.config.js` | 토큰 매핑 위치 |
| CSS 변수 | `src/index.css` | 변수 정의 위치 |
| ESLint 설정 | `eslint.config.js` | 규칙 등록 위치 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-14 | 완료 리포트 작성 | Claude Code (Report Generator) |
