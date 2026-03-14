# Plan: 번들 최적화 (bundle-optimization)

> 작성일: 2026-03-14
> Feature: bundle-optimization
> Phase: Plan
> 참조: BRAINSTORM_2026-03-14.md §2.2 B-3

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | index 청크가 780KB(gzip 239KB)로 Vite 500KB 경고 발생. Firebase SDK(~300KB), 콘텐츠 JSON(~150KB), @dnd-kit(~80KB)이 모두 메인 번들에 포함되어 초기 로딩 지연 |
| **솔루션** | Rollup manualChunks로 vendor 분리, ScheduleWizard/콘텐츠 모듈 동적 import, 불필요한 메인 번들 포함 제거 |
| **기능/UX 효과** | 초기 로딩 시 메인 청크 780KB → 300KB 이하로 축소, 첫 화면 로딩 체감 속도 개선 |
| **핵심 가치** | Vite 500KB 경고 해소, 느린 네트워크 환경에서의 사용자 경험 개선, 캐시 효율 향상 |

---

## 1. 현황 분석

### 1.1 현재 빌드 출력

| 청크 | 크기 | gzip | 비고 |
|------|------|------|------|
| `index-*.js` | **780KB** | 239KB | **500KB 초과 경고** |
| `ExecutionPage-*.js` | 107KB | 31KB | lazy-loaded, 적정 |
| `ContentOverrideManagement-*.js` | 40KB | 11KB | lazy-loaded |
| `index-*.css` | 68KB | 12KB | Tailwind, 적정 |
| 기타 라우트 청크 (20개) | 1~30KB | - | lazy-loaded, 적정 |

### 1.2 index 청크 구성 분석

| 구성 요소 | 예상 크기 | 분리 가능 여부 |
|-----------|---------|:---:|
| Firebase SDK (auth/firestore/storage/functions) | ~300KB | vendor 분리 |
| React + React-DOM | ~120KB | vendor 분리 |
| Content JSON (35개 마크다운 → virtual 모듈) | ~150KB | 동적 import |
| @dnd-kit (core/sortable/utilities) | ~80KB | 동적 import |
| react-router-dom | ~50KB | vendor 분리 |
| lucide-react | ~40KB | vendor 분리 |
| 앱 코드 (providers, hooks, layouts) | ~40KB | 유지 |

### 1.3 문제 원인

1. **vendor 분리 없음**: `vite.config.ts`에 `manualChunks` 미설정 → 모든 node_modules가 index에 번들
2. **@dnd-kit 메인 번들 포함**: `WorkspaceLayout` (non-lazy) → `ScheduleModal` → `ScheduleWizard` 체인으로 @dnd-kit가 메인 번들에 포함
3. **콘텐츠 모듈 즉시 로드**: `useGuides` 전역 hook이 `GUIDES` 데이터를 메인 번들에 포함시킴

---

## 2. 기능 요구사항

### FR-01: Vendor Chunk 분리 (manualChunks)

`vite.config.ts`에 `rollupOptions.output.manualChunks` 설정 추가:

| Vendor 청크 | 포함 패키지 | 예상 크기 |
|------------|-----------|---------|
| `vendor-firebase` | `firebase/*`, `@firebase/*` | ~300KB |
| `vendor-react` | `react`, `react-dom`, `react-router-dom` | ~170KB |
| `vendor-ui` | `lucide-react`, `@dnd-kit/*` | ~120KB |

**목표**: index 청크에서 vendor 코드 제거 → index 청크 **300KB 이하**

### FR-02: ScheduleWizard 동적 Import

`ScheduleModal.tsx`에서 `ScheduleWizard`를 `React.lazy()`로 동적 로드:
- @dnd-kit가 `vendor-ui` 청크로 분리되더라도, ScheduleWizard 자체 코드도 lazy 분리
- Suspense fallback으로 로딩 표시

### FR-03: 콘텐츠 모듈 Lazy 분리

`useGuides` hook이 메인 번들에 `GUIDES` 데이터를 포함시키는 문제 해결:
- `useGuides`를 `GuideModal` 내부에서만 사용하도록 이동
- 또는 `GUIDES` 데이터를 동적 import로 변경

### FR-04: 빌드 결과 검증

최적화 후 빌드 출력에서:
- [ ] index 청크 500KB 미만 (Vite 경고 해소)
- [ ] 기존 lazy-loaded 청크 정상 분리 유지
- [ ] 총 번들 크기(gzip) 동일하거나 감소
- [ ] 런타임 기능 정상 동작

---

## 3. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| **캐시 효율** | vendor 청크는 변경 빈도가 낮아 장기 캐시 가능 |
| **초기 로딩** | Critical Path에 필요한 코드만 index에 유지 |
| **하위 호환** | 기존 라우팅, lazy loading 동작 변경 없음 |
| **빌드 시간** | 유의미한 빌드 시간 증가 없음 (< 1초) |

---

## 4. 범위 제외

| 제외 항목 | 사유 |
|----------|------|
| TestSetupProvider 재설계 | 대규모 리팩토링 필요, 별도 피처로 진행 |
| Firebase SDK 대체 | 전체 아키텍처 변경 필요 |
| CSS 코드 스플리팅 | 68KB(gzip 12KB)로 적정 수준 |
| SSR / ISR | 현재 SPA 구조 유지 |

---

## 5. 구현 전략

### Step 1: manualChunks 설정 (핵심)

`vite.config.ts`에 vendor 분리 규칙 추가.

### Step 2: ScheduleWizard 동적 Import

`ScheduleModal.tsx`에서 lazy import 적용.

### Step 3: 콘텐츠 모듈 분리 검토

`useGuides` 사용 패턴 분석 후 필요 시 동적 import 적용.

### Step 4: 빌드 검증 + 수동 테스트

빌드 출력 확인, 각 라우트 진입 시 정상 동작 검증.

---

## 6. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| vendor 청크 과분리 → HTTP 요청 증가 | 중 | 3개 이하 vendor 청크로 제한 |
| lazy 로딩 시 깜빡임 UX | 낮 | Suspense fallback에 스켈레톤 적용 |
| 콘텐츠 모듈 분리 시 초기 렌더 지연 | 낮 | Critical path 콘텐츠만 유지 |

---

## 7. 성공 기준

| 지표 | 현재 | 목표 |
|------|------|------|
| index 청크 크기 | 780KB | **< 500KB** (경고 해소) |
| index gzip 크기 | 239KB | **< 150KB** |
| Vite 빌드 경고 | 1건 (500KB 초과) | **0건** |
| 총 JS gzip | ~330KB | 동일 (재분배) |
| 기능 회귀 | - | 0건 |
