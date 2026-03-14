# bundle-optimization Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: GsTestGuide
> **Analyst**: Claude Code (gap-detector)
> **Date**: 2026-03-14
> **Design Doc**: [bundle-optimization.design.md](../02-design/features/bundle-optimization.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

`bundle-optimization` 설계 문서(Design)와 실제 구현 코드 간의 일치도를 검증한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/bundle-optimization.design.md`
- **Implementation Files**:
  - `vite.config.ts`
  - `src/features/checklist/components/ScheduleModal.tsx`
  - `src/features/test-setup/components/modals/TestDetailModal.tsx`
- **Analysis Date**: 2026-03-14

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 FR-01: manualChunks 설정 (vite.config.ts)

| 항목 | Design | Implementation | Status |
|------|--------|----------------|--------|
| `build.rollupOptions.output.manualChunks` 함수 추가 | O | O | ✅ Match |
| `node_modules` 가드 조건 | `id.includes('node_modules')` | `id.includes('node_modules')` | ✅ Match |
| Firebase 매칭: `firebase` \| `@firebase` | `vendor-firebase` | `vendor-firebase` | ✅ Match |
| React 매칭: `react-dom` \| `react-router` \| `/react/` | `vendor-react` | `vendor-react` | ✅ Match |
| `/react/` 정규식 패턴 | `id.match(/\/react\//)` | `id.match(/\/react\//)` | ✅ Match |
| UI 매칭: `@dnd-kit` \| `lucide-react` | `vendor-ui` | `vendor-ui` | ✅ Match |
| 매칭 순서 (firebase -> react -> ui) | 순서대로 | 순서대로 | ✅ Match |

**FR-01 판정: 100% 일치**

### 2.2 FR-02: ScheduleWizard 동적 Import

#### 대상 파일 1: ScheduleModal.tsx

| 항목 | Design | Implementation | Status |
|------|--------|----------------|--------|
| `lazy` import from `react` | O | O | ✅ Match |
| `Suspense` import from `react` | O | O | ✅ Match |
| `Loader2` import from `lucide-react` | O | O | ✅ Match |
| `lazy(() => import(...).then(m => ({ default: m.ScheduleWizard })))` | O | O | ✅ Match |
| import 경로: `'../../../components/schedule/ScheduleWizard'` | O | O | ✅ Match |
| Suspense fallback에 Loader2 스피너 | O | O | ✅ Match |
| fallback 클래스: `flex items-center justify-center py-8` | O | O | ✅ Match |
| Loader2 props: `size={20} className="animate-spin text-tx-muted"` | O | O | ✅ Match |

**ScheduleModal.tsx 판정: 100% 일치**

#### 대상 파일 2: TestDetailModal.tsx

| 항목 | Design | Implementation | Status |
|------|--------|----------------|--------|
| `lazy` + `Suspense` import | O | O | ✅ Match |
| `Loader2` import | O | O | ✅ Match |
| lazy import 패턴 (동일 `.then(m => ...)`) | O | O | ✅ Match |
| import 경로: `'../../../../components/schedule/ScheduleWizard'` | O (상대경로 조정) | O | ✅ Match |
| Suspense fallback 동일 패턴 | O | O | ✅ Match |

**TestDetailModal.tsx 판정: 100% 일치**

### 2.3 FR-03: Content Module Separation (Scope Excluded)

| 항목 | Design | Implementation | Status |
|------|--------|----------------|--------|
| 범위 제외 결정 | "작업 불필요" | 미구현 (의도적) | ✅ Match |

**FR-03 판정: 해당 없음 (범위 제외) -- 설계대로 미구현**

### 2.4 FR-04: Build Verification

| 지표 | Design 목표 | 실제 결과 | Status |
|------|------------|----------|--------|
| index 청크 | < 500KB | 117KB | ✅ Pass |
| vendor-firebase 청크 생성 | ~300KB | 364KB | ✅ Pass |
| vendor-react 청크 생성 | ~170KB | 228KB | ✅ Pass |
| vendor-ui 청크 생성 | ~120KB | 63KB | ✅ Pass |
| ScheduleWizard 별도 청크 | ~15KB | 15KB | ✅ Pass |
| Vite 500KB 경고 | 0건 | 0건 | ✅ Pass |

> **참고**: vendor-firebase(364KB vs 300KB), vendor-react(228KB vs 170KB)는 설계 예상치보다 크고, vendor-ui(63KB vs 120KB)는 작다. 이는 설계 시점의 추정치이므로 기능적 차이는 아니다. 모든 청크가 500KB 미만이므로 성공 기준을 충족한다.

**FR-04 판정: 100% 달성**

---

## 3. Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100%                    |
+---------------------------------------------+
|  FR-01 manualChunks:    7/7  items  (100%)   |
|  FR-02 ScheduleWizard: 13/13 items  (100%)   |
|  FR-03 Content Module:  Excluded (N/A)       |
|  FR-04 Build Verify:    6/6  items  (100%)   |
+---------------------------------------------+
|  Total: 26/26 items matched                  |
+---------------------------------------------+
```

---

## 4. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | ✅ |
| Architecture Compliance | 100% | ✅ |
| Convention Compliance | 100% | ✅ |
| **Overall** | **100%** | ✅ |

---

## 5. Differences Found

### Missing Features (Design O, Implementation X)

없음.

### Added Features (Design X, Implementation O)

없음.

### Changed Features (Design != Implementation)

없음.

---

## 6. Design Document Accuracy

### 6.1 Size Estimation Accuracy

| 청크 | 설계 예상 | 실제 | 오차 |
|------|----------|------|------|
| index | ~70KB | 117KB | +67% |
| vendor-firebase | ~300KB | 364KB | +21% |
| vendor-react | ~170KB | 228KB | +34% |
| vendor-ui | ~120KB | 63KB | -47% |
| ScheduleWizard | ~15KB | 15KB | 0% |

> 크기 예측의 오차는 존재하지만, 모든 청크가 500KB 미만이라는 핵심 목표를 달성했으므로 기능적 영향 없음.

---

## 7. Recommended Actions

설계와 구현이 100% 일치하므로 즉시 조치 사항 없음.

### Documentation Update (Optional)

- [ ] 설계 문서 Section 4의 "예상 크기"를 실제 빌드 결과 수치로 업데이트 (선택 사항)

---

## 8. Next Steps

- [x] Gap 분석 완료
- [ ] 완료 리포트 작성 (`bundle-optimization.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-14 | Initial gap analysis | Claude Code |
