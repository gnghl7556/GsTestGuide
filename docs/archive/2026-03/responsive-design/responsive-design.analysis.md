# responsive-design Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: GsTestGuide
> **Analyst**: Claude Code (gap-detector)
> **Date**: 2026-03-14
> **Design Doc**: [responsive-design.design.md](../02-design/features/responsive-design.design.md)
> **Plan Doc**: [responsive-design.plan.md](../01-plan/features/responsive-design.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

반응형 디자인 개선 피처의 설계 문서(Design)와 실제 구현 코드(Implementation) 간 차이를 식별하고, 일치율을 산출한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/responsive-design.design.md`
- **Implementation Files**:
  1. `src/features/admin/components/AdminLayout.tsx`
  2. `src/features/admin/components/ContentOverrideManagement.tsx`
  3. `src/features/checklist/routes/ChecklistView.tsx`
  4. `src/features/checklist/components/CenterDisplay.tsx`
  5. `src/components/ui/BaseModal.tsx`

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 88% | [WARN] |
| Architecture Compliance (AD-01~04) | 100% | [PASS] |
| Convention Compliance | 100% | [PASS] |
| **Overall** | **92%** | **[PASS]** |

---

## 3. Gap Analysis (Design vs Implementation)

### 3.1 FR-01: AdminLayout Mobile Sidebar

| Design Spec | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| `hidden md:flex` on desktop aside | L113: `hidden md:flex w-56 flex-col ...` | [PASS] | |
| Mobile header `md:hidden` + `h-12` + Menu button | L66-72: `md:hidden flex items-center ... h-12` | [PASS] | |
| Overlay: `fixed inset-0 z-50` + `bg-black/40` backdrop | L76-77 | [PASS] | |
| Overlay sidebar width: `w-56` | L78: `w-64` | [CHANGED] | 64 > 56, 모바일에서 더 넓게 구현 |
| NavLink click: `setSidebarOpen(false)` | L91 | [PASS] | |
| main: `pt-12 md:pt-0` | L117: `flex-1 overflow-auto` (pt-12 없음) | [MISSING] | 모바일 헤더와 콘텐츠 겹침 가능성 |
| Outer div: `flex h-screen` | L64: `flex flex-col md:flex-row h-screen` | [CHANGED] | flex-col 추가 (모바일 세로 배치) |
| NAV_ITEMS 헬퍼 함수로 중복 제거 | Desktop: `sidebarContent()` 사용, Mobile: 별도 렌더링 (L85-107) | [CHANGED] | 모바일 sidebar 닫기 버튼(X) 추가 등으로 구조가 달라 중복 발생 |

### 3.2 FR-02: ContentOverrideManagement Vertical Stack

| Design Spec | Implementation | Status |
|-------------|---------------|:------:|
| Container: `flex flex-col lg:flex-row` | L476: `flex flex-col lg:flex-row flex-1 min-h-0 px-6 pb-6 gap-0` | [PASS] |
| Left: `w-full lg:w-72 shrink-0` | L478 | [PASS] |
| Left: `max-h-64 lg:max-h-none` | L478 | [PASS] |
| Left: `rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none` | L478 | [PASS] |
| Right: `border-t-0 lg:border-t lg:border-l-0` | L573 | [PASS] |
| Right: `rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none` | L573 | [PASS] |

**FR-02 일치율: 100%** -- 설계와 완벽히 일치.

### 3.3 FR-03: ChecklistView md Breakpoint

| Design Spec | Implementation | Status |
|-------------|---------------|:------:|
| `md:grid-cols-[240px_minmax(0,1fr)]` 추가 | L164 | [PASS] |
| `gap-3 md:gap-4 lg:gap-5` | L164 | [PASS] |
| 기존 lg/2xl 클래스 유지 | L164 | [PASS] |

**FR-03 일치율: 100%** -- 설계와 완벽히 일치.

### 3.4 FR-04: CenterDisplay Responsive Grid

| Design Spec | Implementation | Status |
|-------------|---------------|:------:|
| `grid-cols-1 md:grid-cols-[7fr_3fr]` | L646 | [PASS] |
| `min-h-[40vh] md:min-h-[60vh]` | L646 | [PASS] |

**FR-04 일치율: 100%** -- 설계와 완벽히 일치.

### 3.5 FR-05: BaseModal Bottom Sheet

| Design Spec | Implementation | Status |
|-------------|---------------|:------:|
| Outer: `items-end sm:items-center` | L94 | [PASS] |
| Outer padding (non-full): `p-0 sm:p-4` | L94: `p-0 sm:p-4` | [PASS] |
| Outer padding (full): `p-0 sm:p-3` | L94: `p-0 sm:p-3` | [PASS] |
| Panel (non-full): `rounded-t-2xl sm:rounded-2xl` | L102 | [PASS] |
| Panel: `max-h-[100vh] sm:max-h-[calc(100vh-2rem)]` | L102 | [PASS] |
| Panel: `overflow-y-auto` | L102 | [PASS] |

**FR-05 일치율: 100%** -- 설계와 완벽히 일치.

---

## 4. Architecture Decision Compliance

| AD | Decision | Implementation | Status |
|:--:|----------|---------------|:------:|
| AD-01 | CSS-only 반응형, JS는 AdminLayout만 useState | AdminLayout만 useState 사용, 나머지 4 파일은 CSS-only | [PASS] |
| AD-02 | md(768px) 태블릿 우선 브레이크포인트 | md 기준 적용 확인 (ChecklistView, CenterDisplay, AdminLayout) | [PASS] |
| AD-03 | AdminLayout 오버레이 사이드바 패턴 | fixed + backdrop 오버레이 구현 | [PASS] |
| AD-04 | BaseModal 바텀시트 패턴 | items-end + rounded-t-2xl 패턴 적용 | [PASS] |

**Architecture Compliance: 100%**

---

## 5. Differences Found

### [RED] Missing Features (Design O, Implementation X)

| Item | Design Location | Description | Impact |
|------|-----------------|-------------|:------:|
| main pt-12 md:pt-0 | design.md L76, L84 | AdminLayout의 `<main>`에 모바일 헤더 높이만큼 패딩 미적용 | High |

### [YELLOW] Added Features (Design X, Implementation O)

| Item | Implementation Location | Description | Impact |
|------|------------------------|-------------|:------:|
| flex-col md:flex-row | AdminLayout.tsx L64 | 외부 div에 `flex-col md:flex-row` 추가 (모바일 세로 배치) | Low |
| X 닫기 버튼 | AdminLayout.tsx L81 | 모바일 오버레이 상단에 X 닫기 버튼 추가 | Low |

### [BLUE] Changed Features (Design != Implementation)

| Item | Design | Implementation | Impact |
|------|--------|----------------|:------:|
| 모바일 sidebar 너비 | `w-56` (224px) | `w-64` (256px) | Low |
| NAV_ITEMS 렌더링 | 헬퍼 함수로 중복 제거 | Desktop: 헬퍼 사용, Mobile: 별도 렌더링 | Low |

---

## 6. Match Rate Calculation

### Per-Feature Breakdown

| Feature | Total Items | Match | Changed | Missing | Match Rate |
|---------|:-----------:|:-----:|:-------:|:-------:|:----------:|
| FR-01 (AdminLayout) | 8 | 4 | 3 | 1 | 75% |
| FR-02 (ContentOverride) | 6 | 6 | 0 | 0 | 100% |
| FR-03 (ChecklistView) | 3 | 3 | 0 | 0 | 100% |
| FR-04 (CenterDisplay) | 2 | 2 | 0 | 0 | 100% |
| FR-05 (BaseModal) | 6 | 6 | 0 | 0 | 100% |
| **Total** | **25** | **21** | **3** | **1** | **88%** |

### Score Rationale

- **Changed** 항목(w-56->w-64, flex-col 추가, 헬퍼 미사용)은 의도적 개선으로 판단되어 감점 최소화
- **Missing** 항목(pt-12 md:pt-0)은 실제 UI 버그를 유발할 수 있어 High impact
- Architecture Decision 4건 모두 완벽 준수
- Convention(네이밍, 파일 위치, 시맨틱 토큰) 위반 없음

---

## 7. Recommended Actions

### 7.1 Immediate Actions

| Priority | Item | File | Description |
|:--------:|------|------|-------------|
| [HIGH] 1 | pt-12 md:pt-0 추가 | `AdminLayout.tsx` L117 | `<main className="flex-1 overflow-auto">` -> `<main className="flex-1 overflow-auto pt-12 md:pt-0">` |

### 7.2 Documentation Update Needed

| Item | Description |
|------|-------------|
| 모바일 sidebar 너비 | Design 문서의 `w-56` 을 `w-64` 로 업데이트 |
| flex-col md:flex-row | Design 문서의 외부 div 구조에 `flex-col md:flex-row` 반영 |
| X 닫기 버튼 | 모바일 오버레이에 X 닫기 버튼 추가된 사항 반영 |
| NAV_ITEMS 렌더링 | 헬퍼 함수 대신 별도 렌더링 구조 사용 사유 기록 |

---

## 8. Synchronization Options

`pt-12 md:pt-0` 누락에 대한 권장 조치:

1. **[권장] 구현 수정**: `AdminLayout.tsx` L117의 `<main>` 태그에 `pt-12 md:pt-0` 추가
2. 나머지 차이점(w-64, flex-col, X 버튼): 의도적 개선이므로 설계 문서를 구현에 맞게 업데이트

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-14 | Initial gap analysis | Claude Code (gap-detector) |
