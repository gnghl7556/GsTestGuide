# Plan: 반응형 디자인 개선 (responsive-design)

> 작성일: 2026-03-14
> Feature: responsive-design
> Phase: Plan
> 참조: `docs/BRAINSTORM_2026-03-14.md` §2.8 C-1

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 데스크톱 중심 설계로 태블릿/모바일에서 Admin 사이드바 고정 너비(w-56), 체크리스트 3패널 레이아웃, 콘텐츠 관리 좌측 패널 고정(w-72) 등이 화면을 벗어나거나 사용 불가 |
| **솔루션** | 3단계 점진적 개선 — Phase 1: Admin 레이아웃 모바일 대응(햄버거 메뉴), Phase 2: 체크리스트 뷰 태블릿 최적화(md 브레이크포인트 추가), Phase 3: 콘텐츠 관리 좌우 분할을 수직 스택 전환 |
| **기능/UX 효과** | 768px 이상 태블릿에서 모든 핵심 기능 사용 가능. 시험원이 현장에서 태블릿으로 체크리스트 수행 및 Admin 관리 가능 |
| **핵심 가치** | 기기 독립적 접근성 확보, 현장 시험원의 태블릿 활용 시나리오 지원, 전문 도구로서의 완성도 향상 |

---

## 1. 현황 분석

### 1.1 현재 반응형 지원 범위

| 화면 크기 | 범위 | 상태 | 문제 |
|-----------|------|:----:|------|
| 모바일 (xs) | < 640px | ❌ | Admin 사이드바 고정, 체크리스트 단일 열 |
| 태블릿 세로 (sm) | 640~768px | ⚠️ | 헤더 정보 숨김, 일부 레이아웃 붕괴 |
| 태블릿 가로 (md) | 768~1024px | ⚠️ | 체크리스트 여전히 1열, Admin 사이드바 과점유 |
| 데스크톱 (lg) | 1024~1280px | ✅ | 완전 레이아웃 |
| 와이드 (xl/2xl) | > 1280px | ✅ | 3열 레이아웃 |

### 1.2 핵심 문제 파일

| 파일 | 문제 | 심각도 |
|------|------|:------:|
| `AdminLayout.tsx` | `w-56` 고정 사이드바, 반응형 처리 없음 | 🔴 높음 |
| `ContentOverrideManagement.tsx` | `w-72` 고정 좌측 패널 | 🔴 높음 |
| `ChecklistView.tsx` | `lg:grid-cols-[280px_...]` — md 브레이크포인트 없음 | 🔴 높음 |
| `CenterDisplay.tsx` | `grid-cols-[7fr_3fr]` 고정 비율 | 🟡 중간 |
| `ProcessLayout.tsx` | 사이드바 `hidden md:block`, 패널 `hidden lg:block` | 🟡 중간 |
| `GlobalProcessHeader.tsx` | sm 미만에서 프로젝트명/회사명 숨김 | 🟢 낮음 |

### 1.3 잘 구현된 부분 (변경 불필요)

- `DashboardWidgets.tsx` — `grid-cols-1 md:grid-cols-3` 반응형 그리드 ✅
- `ProjectManagement.tsx` — `grid-cols-1 md:grid-cols-3` ✅
- `WorkspaceLayout.tsx` — `grid-cols-1 sm:grid-cols-2` ✅
- 시맨틱 CSS 토큰 시스템 — 다크/라이트 자동 대응 ✅
- `GlobalProcessHeader.tsx` — `h-14 sm:h-16`, `px-3 sm:px-6` 반응형 ✅

---

## 2. 기능 요구사항

### FR-01: Admin 레이아웃 모바일 대응

**현재**: `AdminLayout.tsx`의 사이드바가 `w-56` 고정 → 모바일에서 화면 50% 이상 차지

**변경**:
- md 미만: 사이드바 숨김 + 햄버거 메뉴 버튼 표시
- md 이상: 기존 사이드바 유지
- 모바일 사이드바: 오버레이(backdrop) + 슬라이드인 패널
- 메뉴 항목 클릭 시 자동 닫힘

```
데스크톱 (md+)           모바일 (<md)
┌────┬──────────┐       ┌──────────────┐
│사이│          │       │☰ Admin       │
│드  │ 콘텐츠    │       ├──────────────┤
│바  │          │       │              │
│w-56│          │       │   콘텐츠      │
│    │          │       │              │
└────┴──────────┘       └──────────────┘
```

### FR-02: 콘텐츠 관리 페이지 반응형 전환

**현재**: `ContentOverrideManagement.tsx`의 좌측 패널 `w-72` 고정

**변경**:
- lg 미만: 좌우 분할 → 수직 스택 (섹션 목록이 위, 편집 영역이 아래)
- lg 이상: 기존 좌우 분할 유지
- 수직 스택 시 섹션 목록은 가로 스크롤 탭 또는 접힌 드롭다운으로 변환

### FR-03: 체크리스트 뷰 태블릿 최적화

**현재**: `ChecklistView.tsx`가 `lg:grid-cols-[280px_...]` — md~lg 범위에서 단일 열

**변경**:
- md 브레이크포인트 추가: `md:grid-cols-[240px_minmax(0,1fr)]`
- 사이드 네비게이션 너비를 md에서 240px로 축소
- 우측 패널은 lg 이상에서만 유지 (현행 유지)

### FR-04: 체크리스트 센터 디스플레이 반응형

**현재**: `CenterDisplay.tsx`의 `grid-cols-[7fr_3fr]` 고정 비율

**변경**:
- md 미만: 단일 열 (수직 스택)
- md 이상: 기존 `7fr_3fr` 유지

### FR-05: 모달 모바일 대응

**현재**: `BaseModal.tsx`의 `max-w-*` 고정

**변경**:
- sm 미만: 모달을 `w-full h-full` 또는 `bottom-sheet` 스타일로 전환
- 모달 내부 패딩 축소: `p-4 → p-3` (sm 미만)
- 스크롤 가능한 콘텐츠 영역 보장

---

## 3. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| **최소 지원 해상도** | 768px (태블릿 세로) — 이 해상도에서 모든 핵심 기능 사용 가능해야 함 |
| **브레이크포인트** | Tailwind 기본값 사용 (sm:640, md:768, lg:1024, xl:1280, 2xl:1536) |
| **터치 친화성** | 터치 타겟 최소 44px × 44px (WCAG 2.5.5) |
| **성능** | 미디어 쿼리 전환 시 레이아웃 시프트 방지 (CSS-only 전환 선호) |
| **다크 모드** | 반응형 변경이 다크 모드에서도 동일하게 동작 |
| **기존 UX 유지** | 데스크톱(lg+)에서의 기존 레이아웃은 변경하지 않음 |

---

## 4. 범위 제외

| 제외 항목 | 사유 |
|----------|------|
| 640px 미만 모바일 최적화 | 시험 도구 특성상 태블릿이 최소 사용 기기, 스마트폰 대응은 ROI 낮음 |
| PWA / 오프라인 지원 | Firestore persistence 변경 필요, 별도 피처 |
| 터치 제스처 (스와이프 등) | 현재 DnD 라이브러리와 충돌 가능, 복잡도 대비 효과 낮음 |
| ProcessLayout 사이드바 모바일 토글 | ProcessLayout은 시험 수행 전용이라 md 이상에서만 사용 가정 |
| 인쇄 스타일시트 | 별도 피처로 분리 |

---

## 5. 구현 전략

### Step 1: AdminLayout 모바일 사이드바 (FR-01)

`src/features/admin/components/AdminLayout.tsx` 수정
- 모바일 상태 관리: `useState<boolean>(false)` for sidebar open/close
- md 미만: 햄버거 버튼 + 오버레이 사이드바
- md 이상: 기존 `w-56` 사이드바 유지

### Step 2: ContentOverrideManagement 수직 스택 (FR-02)

`src/features/admin/components/ContentOverrideManagement.tsx` 수정
- `flex flex-col lg:flex-row` 전환
- 좌측 패널: `w-full lg:w-72`
- 모바일에서 섹션 목록을 가로 스크롤 칩/탭으로 변환

### Step 3: ChecklistView md 브레이크포인트 (FR-03)

`src/features/checklist/routes/ChecklistView.tsx` 수정
- 그리드: `grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_clamp(280px,24vw,380px)]`

### Step 4: CenterDisplay 반응형 (FR-04)

`src/features/checklist/components/CenterDisplay.tsx` 수정
- `grid-cols-1 md:grid-cols-[7fr_3fr]`

### Step 5: BaseModal 모바일 대응 (FR-05)

`src/components/ui/BaseModal.tsx` 수정
- sm 미만: fullscreen 또는 bottom-sheet 패턴 적용
- 패딩/마진 반응형 조정

---

## 6. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Admin 사이드바 상태 관리 복잡도 증가 | 중 | 단순 useState + CSS transition으로 최소화 |
| 체크리스트 DnD와 터치 이벤트 충돌 | 중 | DnD는 데스크톱 전용, 터치 영역 분리 |
| 기존 데스크톱 레이아웃 회귀 | 높 | lg 이상 클래스 변경 금지, 추가만 허용 |
| 콘텐츠 관리 수직 전환 시 UX 저하 | 낮 | Admin은 주로 데스크톱 사용, 모바일은 보조 |

---

## 7. 성공 기준

| 지표 | 현재 | 목표 |
|------|------|------|
| 768px에서 Admin 페이지 사용 가능 | ❌ (사이드바 과점유) | ✅ 햄버거 메뉴로 전환 |
| 768px에서 체크리스트 수행 가능 | ❌ (단일 열만) | ✅ 2열 레이아웃 |
| 768px에서 콘텐츠 관리 가능 | ❌ (좌측 패널 과점유) | ✅ 수직 스택 전환 |
| 데스크톱(1024px+) 기존 레이아웃 유지 | ✅ | ✅ 회귀 0건 |
| 수정 파일 수 | - | 5개 이하 |
