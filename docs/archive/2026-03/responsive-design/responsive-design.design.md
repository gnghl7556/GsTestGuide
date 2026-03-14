# Design: 반응형 디자인 개선 (responsive-design)

> 작성일: 2026-03-14
> Feature: responsive-design
> Phase: Design
> Plan 참조: `docs/01-plan/features/responsive-design.plan.md`

---

## 1. 변경 파일 목록

| # | 파일 | 작업 | 예상 변경량 |
|:-:|------|:----:|:---------:|
| 1 | `src/features/admin/components/AdminLayout.tsx` | 수정 | ~30줄 추가 |
| 2 | `src/features/admin/components/ContentOverrideManagement.tsx` | 수정 | ~10줄 변경 |
| 3 | `src/features/checklist/routes/ChecklistView.tsx` | 수정 | ~3줄 변경 |
| 4 | `src/features/checklist/components/CenterDisplay.tsx` | 수정 | ~1줄 변경 |
| 5 | `src/components/ui/BaseModal.tsx` | 수정 | ~5줄 변경 |

**새 파일 없음.** 기존 파일 수정만으로 구현.

---

## 2. 구현 순서

### Step 1: AdminLayout 모바일 사이드바 (FR-01)

**파일**: `src/features/admin/components/AdminLayout.tsx`

**현재 코드** (L24-57):
```tsx
<div className="flex h-screen bg-surface-raised">
  <aside className="flex w-56 flex-col bg-admin-sidebar-bg text-admin-sidebar-text">
    ...
  </aside>
  <main className="flex-1 overflow-auto">
    <Outlet />
  </main>
</div>
```

**변경 내용**:

1. `useState` import 추가, `Menu`, `X` 아이콘 import 추가
2. 모바일 사이드바 상태: `const [sidebarOpen, setSidebarOpen] = useState(false)`
3. 기존 `<aside>` 에 `hidden md:flex` 추가 (데스크톱 전용)
4. 모바일 전용 요소 추가:
   - 상단 헤더 바: `md:hidden` — 햄버거 버튼 + "관리자 메뉴" 타이틀
   - 오버레이 사이드바: `sidebarOpen` 시 표시, backdrop 클릭으로 닫힘
5. NavLink 클릭 시 `setSidebarOpen(false)` 호출

**변경 후 구조**:
```tsx
<div className="flex h-screen bg-surface-raised">
  {/* 모바일 헤더 */}
  <div className="md:hidden fixed top-0 left-0 right-0 z-40 ...">
    <button onClick={() => setSidebarOpen(true)}><Menu /></button>
    <span>관리자 메뉴</span>
  </div>

  {/* 모바일 오버레이 사이드바 */}
  {sidebarOpen && (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
      <aside className="relative w-56 h-full ...">
        {/* 동일한 NAV_ITEMS 렌더링 + 클릭 시 닫힘 */}
      </aside>
    </div>
  )}

  {/* 데스크톱 사이드바 (기존) */}
  <aside className="hidden md:flex w-56 flex-col ...">
    ...
  </aside>

  <main className="flex-1 overflow-auto pt-12 md:pt-0">
    <Outlet />
  </main>
</div>
```

**핵심 규칙**:
- 데스크톱(md+) 레이아웃은 현재와 완전 동일하게 유지
- 모바일 헤더 높이 `h-12` (48px) → main에 `pt-12 md:pt-0` 패딩 추가
- NAV_ITEMS 배열은 공유, 중복 렌더링 로직을 헬퍼 함수로 추출

### Step 2: ContentOverrideManagement 수직 스택 (FR-02)

**파일**: `src/features/admin/components/ContentOverrideManagement.tsx`

**현재 코드** (L476):
```tsx
<div className="flex flex-1 min-h-0 px-6 pb-6 gap-0">
  <div className="w-72 shrink-0 flex flex-col border border-ln rounded-l-xl ...">
  <div className="flex-1 flex flex-col border border-l-0 border-ln rounded-r-xl ...">
```

**변경 내용**:

1. 외부 컨테이너: `flex` → `flex flex-col lg:flex-row`
2. 좌측 패널: `w-72 shrink-0` → `w-full lg:w-72 shrink-0`
   - 모바일: 전체 너비, 최대 높이 제한 `max-h-64 lg:max-h-none`
   - 둥근 모서리: `rounded-l-xl` → `rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none`
3. 우측 패널: `border-l-0 rounded-r-xl` → 조건부 border/radius 조정
   - `border-t-0 lg:border-t lg:border-l-0`
   - `rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none`

**변경 후 코드**:
```tsx
<div className="flex flex-col lg:flex-row flex-1 min-h-0 px-6 pb-6 gap-0">
  {/* 좌측 → 모바일에서는 상단 */}
  <div className="w-full lg:w-72 shrink-0 flex flex-col border border-ln
    rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none
    max-h-64 lg:max-h-none bg-surface-base overflow-hidden">
    ...
  </div>
  {/* 우측 → 모바일에서는 하단 */}
  <div className="flex-1 flex flex-col border border-t-0 lg:border-t border-ln
    lg:border-l-0 rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none
    bg-surface-base overflow-hidden">
    ...
  </div>
</div>
```

### Step 3: ChecklistView md 브레이크포인트 (FR-03)

**파일**: `src/features/checklist/routes/ChecklistView.tsx`

**현재 코드** (L164):
```tsx
<div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_clamp(280px,24vw,380px)] gap-5 min-h-0 pb-2">
```

**변경 내용**: md 브레이크포인트 추가 + gap 반응형

```tsx
<div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_clamp(280px,24vw,380px)] gap-3 md:gap-4 lg:gap-5 min-h-0 pb-2">
```

**변경 요점**:
- `md:grid-cols-[240px_minmax(0,1fr)]` 추가 — 태블릿에서 2열 레이아웃
- 사이드바 너비: md=240px, lg=280px, 2xl=300px (점진적 확대)
- gap: `gap-5` → `gap-3 md:gap-4 lg:gap-5` (모바일에서 간격 축소)

### Step 4: CenterDisplay 반응형 그리드 (FR-04)

**파일**: `src/features/checklist/components/CenterDisplay.tsx`

**현재 코드** (L646):
```tsx
<div className="grid grid-cols-[7fr_3fr] gap-0 min-h-[60vh]" ...>
```

**변경 내용**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-0 min-h-[40vh] md:min-h-[60vh]" ...>
```

**변경 요점**:
- `grid-cols-1 md:grid-cols-[7fr_3fr]` — 모바일에서 수직 스택
- `min-h-[40vh] md:min-h-[60vh]` — 모바일에서 최소 높이 축소

### Step 5: BaseModal 모바일 대응 (FR-05)

**파일**: `src/components/ui/BaseModal.tsx`

**현재 코드** (L92-107):
```tsx
<div className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] backdrop-blur-sm ${isFullSize ? 'p-3' : 'p-4'}`} ...>
  <div className={`w-full ${sizeClasses[size]} ${isFullSize ? 'rounded-xl' : 'rounded-2xl'} border border-ln bg-surface-overlay shadow-2xl ${className}`} ...>
```

**변경 내용**:

1. 외부 컨테이너 패딩: `p-4` → `p-2 sm:p-4`
2. 모달 패널에 `max-h` + `overflow-y-auto` 추가:
   - `max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto`
3. sm 미만에서 하단 정렬 옵션 (바텀시트 패턴):
   - 외부 컨테이너: `items-end sm:items-center` 추가
   - 모달 패널: `rounded-t-2xl rounded-b-none sm:rounded-2xl` 추가
   - sm 미만에서 하단 패딩 제거: `p-0 sm:p-0` (패딩은 children에서 처리)

**변경 후 코드**:
```tsx
<div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--overlay-backdrop)] backdrop-blur-sm ${isFullSize ? 'p-0 sm:p-3' : 'p-0 sm:p-4'}`} ...>
  <div className={`w-full ${sizeClasses[size]} ${isFullSize ? 'rounded-xl' : 'rounded-t-2xl sm:rounded-2xl'} border border-ln bg-surface-overlay shadow-2xl max-h-[100vh] sm:max-h-[calc(100vh-2rem)] overflow-y-auto ${className}`} ...>
```

---

## 3. Architecture Decisions

### AD-01: CSS-only 반응형 (JS 미니멀)

AdminLayout의 모바일 사이드바만 `useState` 사용. 나머지 4개 파일은 **Tailwind 반응형 클래스만**으로 처리하여 JS 복잡도 최소화.

**근거**: CSS 미디어 쿼리 기반 전환은 레이아웃 시프트 없이 즉시 적용되며, 리렌더링 비용이 없음.

### AD-02: md(768px) 기준 태블릿 우선

640px(sm) 미만 모바일은 범위 제외. 시험 도구 특성상 태블릿이 최소 기기이므로 md(768px)를 주요 전환점으로 사용.

**근거**: Plan §4에서 640px 미만 최적화를 범위 제외로 결정.

### AD-03: 모바일 사이드바는 오버레이 패턴

AdminLayout 모바일 사이드바를 drawer(오버레이) 패턴으로 구현. off-canvas slide-in 대신 단순 `fixed` + backdrop으로 처리.

**근거**: CSS transition만으로 구현 가능하고, 기존 NAV_ITEMS 배열 재사용으로 코드 중복 최소화.

### AD-04: BaseModal 바텀시트 패턴

모바일에서 모달을 `items-end` (하단 정렬) + `rounded-t-2xl`로 바텀시트처럼 표시. iOS/Android 네이티브 패턴과 일관성 유지.

**근거**: 모바일에서 중앙 모달은 키보드 표시 시 화면 밖으로 밀릴 수 있음. 하단 고정이 터치 UX에 더 적합.

---

## 4. 테스트 계획

| # | 테스트 항목 | 검증 방법 | 기대 결과 |
|:-:|------------|----------|----------|
| T-01 | Admin 768px에서 사이드바 숨김 | 브라우저 DevTools 768px | 햄버거 버튼 표시, 사이드바 숨김 |
| T-02 | Admin 햄버거 클릭 → 오버레이 사이드바 | 클릭 테스트 | 사이드바 슬라이드인, 메뉴 항목 표시 |
| T-03 | Admin 메뉴 항목 클릭 → 사이드바 닫힘 | 네비게이션 테스트 | 페이지 이동 + 사이드바 자동 닫힘 |
| T-04 | Admin 1024px에서 기존 레이아웃 유지 | DevTools 1024px | 좌측 사이드바 고정, 변경 없음 |
| T-05 | 콘텐츠 관리 768px 수직 스택 | DevTools 768px | 섹션 목록 상단, 편집 영역 하단 |
| T-06 | 콘텐츠 관리 1024px 좌우 분할 유지 | DevTools 1024px | 기존 레이아웃 동일 |
| T-07 | 체크리스트 768px 2열 표시 | DevTools 768px | 사이드바 240px + 콘텐츠 |
| T-08 | 체크리스트 1024px 기존 유지 | DevTools 1024px | 사이드바 280px + 콘텐츠 |
| T-09 | CenterDisplay 768px 미만 수직 스택 | DevTools 640px | 프리뷰와 상세가 세로 배치 |
| T-10 | 모달 640px 미만 바텀시트 | DevTools 375px | 하단 정렬, 상단만 둥근 모서리 |
| T-11 | 모달 640px 이상 중앙 배치 | DevTools 768px | 기존 중앙 모달 동일 |
| T-12 | 다크 모드 반응형 동작 | 다크 모드 전환 | 모든 반응형 변경이 다크 모드에서 정상 |

---

## 5. 구현 체크리스트

- [ ] Step 1: AdminLayout — `useState`, `Menu`/`X` import, 모바일 헤더 + 오버레이 사이드바
- [ ] Step 2: ContentOverrideManagement — `flex-col lg:flex-row`, 패널 너비/radius 조건부
- [ ] Step 3: ChecklistView — `md:grid-cols-[240px_...]` 추가, gap 반응형
- [ ] Step 4: CenterDisplay — `grid-cols-1 md:grid-cols-[7fr_3fr]`
- [ ] Step 5: BaseModal — `items-end sm:items-center`, `rounded-t-2xl sm:rounded-2xl`, max-h
- [ ] 빌드 검증: `npm run build` 0 에러
- [ ] 시각적 검증: DevTools에서 768px, 1024px, 1536px 확인
