# Design: 번들 최적화 (bundle-optimization)

> 작성일: 2026-03-14
> Feature: bundle-optimization
> Phase: Design
> Plan 참조: `docs/01-plan/features/bundle-optimization.plan.md`

---

## 1. 설계 개요

index 청크(780KB)의 500KB 초과 경고를 해소하기 위해 Rollup `manualChunks`로 vendor 코드를 분리하고, `ScheduleWizard`를 동적 import로 전환한다.

### 1.1 Plan 분석 결과 반영

- **FR-01 (manualChunks)**: 핵심 — 3개 vendor 청크로 분리
- **FR-02 (ScheduleWizard lazy)**: 보조 — @dnd-kit 코드를 메인 번들에서 제거
- **FR-03 (콘텐츠 모듈 분리)**: **범위 제외** — 분석 결과 `useGuides`는 이미 lazy 경로(ExecutionPage → NavSidebar → GuideModal)에서만 사용되어 별도 청크(`useGuides-*.js` 30KB)로 자동 분리됨
- **FR-04 (빌드 검증)**: 유지

---

## 2. 변경 파일 목록

| # | 파일 | 변경 유형 | 목적 |
|---|------|---------|------|
| 1 | `vite.config.ts` | **수정** | manualChunks 설정 추가 |
| 2 | `src/features/checklist/components/ScheduleModal.tsx` | **수정** | ScheduleWizard를 lazy import로 전환 |
| 3 | `src/features/test-setup/components/modals/TestDetailModal.tsx` | **수정** | ScheduleWizard를 lazy import로 전환 |

---

## 3. 상세 설계

### 3.1 FR-01: manualChunks 설정 (`vite.config.ts`)

#### Before

```typescript
export default defineConfig({
  plugins: [react(), contentPlugin()],
})
```

#### After

```typescript
export default defineConfig({
  plugins: [react(), contentPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Firebase SDK → 별도 청크
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase';
            }
            // React 코어 → 별도 청크
            if (id.includes('react-dom') || id.includes('react-router') || id.match(/\/react\//)) {
              return 'vendor-react';
            }
            // UI 라이브러리 → 별도 청크
            if (id.includes('@dnd-kit') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
})
```

#### manualChunks 매칭 규칙

| 조건 | 청크명 | 포함 대상 | 예상 크기 |
|------|--------|---------|---------|
| `firebase` 또는 `@firebase` | `vendor-firebase` | Firebase Auth/Firestore/Storage/Functions | ~300KB |
| `react-dom`, `react-router`, `/react/` | `vendor-react` | React, ReactDOM, React Router | ~170KB |
| `@dnd-kit`, `lucide-react` | `vendor-ui` | DnD Kit, Lucide 아이콘 | ~120KB |
| 그 외 node_modules | index (기본) | gray-matter 등 소형 라이브러리 | ~30KB |
| 앱 코드 | index (기본) | providers, hooks, layouts | ~40KB |

#### 예상 결과

| 청크 | Before | After |
|------|--------|-------|
| `index-*.js` | **780KB** | **~70KB** |
| `vendor-firebase-*.js` | - | ~300KB |
| `vendor-react-*.js` | - | ~170KB |
| `vendor-ui-*.js` | - | ~120KB |
| 기타 lazy 청크 | 변동 없음 | 변동 없음 |

> **주의**: `id.match(/\/react\//)` 패턴은 `react` 패키지만 정확히 매칭하기 위함. `react-` 접두사 패키지가 `react-dom`/`react-router` 외에도 있을 수 있으므로 별도 조건 사용.

### 3.2 FR-02: ScheduleWizard 동적 Import

#### 대상 파일 1: `ScheduleModal.tsx`

**Before:**
```typescript
import { ScheduleWizard } from '../../../components/schedule/ScheduleWizard';
```

**After:**
```typescript
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const ScheduleWizard = lazy(() =>
  import('../../../components/schedule/ScheduleWizard').then(m => ({ default: m.ScheduleWizard }))
);
```

사용부에 Suspense 래퍼 추가:
```tsx
<Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-tx-muted" /></div>}>
  <ScheduleWizard ... />
</Suspense>
```

#### 대상 파일 2: `TestDetailModal.tsx`

동일 패턴 적용. `ScheduleWizard`를 lazy import + Suspense 래퍼.

#### 효과

- ScheduleWizard 자체 코드가 별도 청크로 분리
- @dnd-kit는 이미 `vendor-ui`로 분리되므로, ScheduleWizard 청크는 순수 앱 코드만 포함
- 일정 관리 모달을 열 때만 해당 코드 로딩

---

## 4. 예상 빌드 출력

### 4.1 최종 청크 구조

```
dist/assets/
├── index-*.js              ~70KB   (앱 코드 + 소형 라이브러리)
├── vendor-firebase-*.js    ~300KB  (Firebase SDK, 캐시 장기화 가능)
├── vendor-react-*.js       ~170KB  (React 생태계, 캐시 장기화 가능)
├── vendor-ui-*.js          ~120KB  (Lucide + @dnd-kit, 캐시 장기화 가능)
├── ScheduleWizard-*.js     ~15KB   (일정 관리 모달 전용)
├── ExecutionPage-*.js      ~107KB  (기존 유지)
├── useGuides-*.js          ~30KB   (기존 유지)
├── ... (기타 lazy 청크)
└── index-*.css             ~68KB   (기존 유지)
```

### 4.2 성공 기준 달성 예측

| 지표 | 현재 | 목표 | 예측 |
|------|------|------|------|
| index 청크 | 780KB | < 500KB | **~70KB** ✅ |
| Vite 빌드 경고 | 1건 | 0건 | **0건** ✅ |
| 총 JS (gzip) | ~330KB | 동일 | ~330KB ✅ |
| 기능 회귀 | - | 0건 | 0건 ✅ |

---

## 5. 테스트 계획

| # | 테스트 항목 | 검증 방법 | 합격 기준 |
|---|-----------|---------|---------|
| T-01 | 빌드 성공 | `npm run build` | 에러 0건 |
| T-02 | index 청크 500KB 미만 | 빌드 출력 확인 | `(!) Some chunks...` 경고 없음 |
| T-03 | vendor 청크 3개 생성 | 빌드 출력에서 vendor-firebase/react/ui 확인 | 3개 청크 존재 |
| T-04 | Dashboard 라우트 정상 | 브라우저에서 `/dashboard` 진입 | 에러 없음, 정상 렌더 |
| T-05 | Execution 라우트 정상 | `/execution` 진입 | 체크리스트 정상 동작 |
| T-06 | 일정 모달 정상 | 일정 관리 버튼 클릭 | ScheduleWizard 로딩 후 정상 표시 |
| T-07 | Admin 라우트 정상 | `/admin` 진입 | 모든 관리 페이지 정상 |

---

## 6. 구현 순서

| # | 체크포인트 | 파일 | 커밋 단위 |
|---|-----------|------|---------|
| 1 | `vite.config.ts`에 manualChunks 추가 | `vite.config.ts` | 1커밋 |
| 2 | ScheduleModal의 ScheduleWizard lazy import | `ScheduleModal.tsx` | ↑ 동일 커밋 |
| 3 | TestDetailModal의 ScheduleWizard lazy import | `TestDetailModal.tsx` | ↑ 동일 커밋 |
| 4 | 빌드 검증 (`npm run build`) | - | ↑ 동일 커밋 |
| 5 | 최종 확인: 경고 해소 + 청크 구조 확인 | - | ↑ 동일 커밋 |

> **단일 커밋**: 변경 파일 3개뿐이므로 1커밋으로 진행.

---

## 7. 아키텍처 결정

### AD-01: vendor 청크 개수를 3개로 제한

**결정**: Firebase / React / UI 3개 vendor 청크만 생성
**근거**: HTTP/2 환경에서 병렬 로딩이 가능하지만, 과도한 청크 분리는 요청 오버헤드 증가. 3개는 의미 단위 분리와 캐시 효율의 균형점.
**대안 고려**: 단일 vendor 청크 → 캐시 무효화 범위가 너무 넓어 기각

### AD-02: ScheduleWizard만 lazy 전환 (content 모듈 제외)

**결정**: ScheduleWizard만 동적 import, content 모듈은 현행 유지
**근거**: `useGuides` 분석 결과 이미 lazy 경로에서만 사용되어 자동 분리됨. 추가 작업 불필요.
**대안 고려**: content 모듈도 동적 import → 불필요한 복잡성 추가로 기각
