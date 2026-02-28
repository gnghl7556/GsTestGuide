# Showcase Website Design Document

> **Feature**: showcase-website
> **Plan Reference**: `docs/01-plan/features/showcase-website.plan.md`
> **Date**: 2026-02-28 (Updated from 2026-02-20 draft)
> **Status**: Finalized

---

## 1. Architecture Overview

### 1.1 Project Structure

```
website/
├── src/
│   ├── components/
│   │   ├── Hero.tsx        # Full viewport hero section
│   │   ├── Features.tsx    # 4-card feature grid
│   │   ├── Workflow.tsx    # 3-phase timeline
│   │   ├── TechStack.tsx   # Tech icon grid
│   │   └── Footer.tsx      # CTA banner + credits
│   ├── hooks/
│   │   └── useReveal.ts    # IntersectionObserver hook
│   ├── App.tsx             # Root: scroll observer + section composition
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles, animations, utility classes
├── index.html
├── package.json
├── vite.config.ts          # base: './' for relative paths
├── tailwind.config.js
└── tsconfig.json
```

### 1.2 Rendering Flow

```
App.tsx
  ├─ useEffect: IntersectionObserver for all `.reveal` elements
  │   threshold: 0.1, rootMargin: '0px 0px -40px 0px'
  │   → adds `.visible` class, then unobserves
  │
  └─ <div min-h-screen bg-[#0a0a0f]>
       ├─ <Hero />
       ├─ <Features />   ← uses useReveal() hook
       ├─ <Workflow />    ← uses useReveal() hook
       ├─ <TechStack />   ← uses useReveal() hook
       └─ <Footer />
```

---

## 2. Component Design

### 2.1 App.tsx

- Root container: `min-h-screen bg-[#0a0a0f]`
- Global IntersectionObserver: threshold `0.1`, rootMargin `0px 0px -40px 0px`
- `.reveal` → `.visible` 전환 후 unobserve (1회성)
- 5개 섹션 순차 렌더링: Hero → Features → Workflow → TechStack → Footer

### 2.2 Hero.tsx

| Spec | Value |
|------|-------|
| Height | `min-h-screen` |
| Background | `dot-grid` pattern (32px grid, white 4% opacity) |
| Glow 1 | center, 800×800px, `blue-500/[0.07]`, blur 120px |
| Glow 2 | top-1/3 right-1/4, 400×400px, `purple-500/[0.05]`, blur 100px |

- **Badge**: `glass` pill, emerald pulse dot, "GS 인증 시험 보조 도구" text
- **Heading**: responsive font (5xl → 8xl), "시험의 모든 순간을" (white) + "체계적으로" (gradient-text)
- **Subtitle**: "GS(Good Software) 인증 시험의 준비부터 종료까지, 13개 점검항목을 순차적으로 가이드합니다."
- **CTA**:
  - Primary: white bg, "시작하기" + arrow → `tta-gs-test-guide.web.app`
  - Secondary: glass + glass-hover, GitHub icon + "GitHub" → repo
- **Scroll indicator**: mouse-wheel shape with pulse dot, `animate-float`
- **Animation**: `animate-fade-in` (badge), `animate-slide-up` (heading, subtitle, CTA with staggered delays 0/0.15s/0.3s)

### 2.3 Features.tsx

| Spec | Value |
|------|-------|
| Padding | `py-32 px-6` |
| Max width | `max-w-6xl` |
| Grid | 1 col mobile → 2 col `md:` |
| Reveal | `useReveal()` hook on section |

- **Section header**: "Core Features" tag (blue-400), heading "시험 수행에 필요한 / 모든 기능을 하나에" (gradient-text)
- **4 Feature Cards**:

| # | Title | Accent gradient | Description |
|---|-------|-----------------|-------------|
| 1 | 체크리스트 기반 점검 | blue-500 → cyan-400 | 13개 항목 순차 가이드, 게이트 로직 |
| 2 | 실시간 진행률 추적 | purple-500 → pink-400 | 사이드바 미니 도트 상태 표시 |
| 3 | 결함 분류 가이드 | amber-500 → orange-400 | 품질특성별 결함 유형/등급 참조 |
| 4 | 담당자 즉시 연동 | emerald-500 → teal-400 | 관리자 페이지 실시간 업데이트 |

- **Card styling**: `glass glass-hover rounded-2xl p-8`, hover `scale-[1.02]`
- **Icon**: 12×12 gradient bg rounded-xl, inline SVG (Heroicons outline)
- **Hover glow**: full-card gradient overlay, opacity 0 → 0.03 on hover
- **Stagger**: `.reveal-delay-{1..4}` (0.1s increments)

### 2.4 Workflow.tsx

| Spec | Value |
|------|-------|
| Padding | `py-32 px-6` |
| Max width | `max-w-6xl` |
| Grid | 1 col mobile → 3 col `lg:` |
| Background | vertical gradient via `blue-500/[0.02]` |

- **Section header**: "Workflow" tag (purple-400), heading "3단계 프로세스" (gradient-text-warm), subtitle
- **3 Phase Cards**:

| Step | Title | Color | Items |
|------|-------|-------|-------|
| 01 | 시험준비 | blue-400/500 | 5개 (시험 확인, 자리/장비, OS·SW, 네트워크, 서버) |
| 02 | 시험수행 | purple-400/500 | 6개 (기능리스트, 패치전결함, 패치전보고, 패치, 패치후결함, 패치후보고) |
| 03 | 시험종료 | emerald-400/500 | 2개 (최종 시험품, 최종 산출물) |

- **Step indicator**: 16×16 rounded-2xl gradient bg, bold step number, bottom dot with ring-4
- **Horizontal connector** (desktop only): `timeline-connector` gradient line (blue → purple → emerald), opacity 0.3
- **Items list**: dot-grid layout, colored dot + text-slate-300

### 2.5 TechStack.tsx

| Spec | Value |
|------|-------|
| Padding | `py-32 px-6` |
| Max width | `max-w-4xl` |
| Layout | flex-wrap, gap-8, center |

- **Section header**: "Tech Stack" tag (emerald-400), "검증된 기술로 구축", subtitle
- **5 Tech items**: React, TypeScript, Vite, Tailwind CSS, Firebase
- **Card**: 20×20 rounded-2xl `glass glass-hover`, inline SVG icon
- **Hover**: text-slate-400 → text-white transition

### 2.6 Footer.tsx

| Spec | Value |
|------|-------|
| Padding | `py-16 px-6` |
| Border | `border-t border-white/5` |

- **CTA banner**: rounded-3xl, triple-gradient overlay (blue/purple/emerald 20% each), glass bg
  - Heading: "지금 바로 시작하세요"
  - CTA button: white bg, "앱 바로가기" → `tta-gs-test-guide.web.app`
- **Bottom bar**: flex row, "GS Test Guide · TTA GS 인증 시험 보조 도구" / "GitHub · Built with Claude Code"

---

## 3. Custom Hook

### 3.1 useReveal

```typescript
function useReveal<T extends HTMLElement>(): RefObject<T>
```

- IntersectionObserver: threshold `0.15`, rootMargin `0px 0px -40px 0px`
- Target element에 `.visible` class 추가 후 unobserve
- Features, Workflow, TechStack 섹션에서 사용

---

## 4. Styling System

### 4.1 Global Styles (index.css)

| Class | Purpose | Key Values |
|-------|---------|------------|
| `.dot-grid` | 배경 패턴 | radial-gradient, 32px grid, white 4% |
| `.gradient-text` | 텍스트 그라디언트 | blue-400 → purple-400 → emerald-400 (135deg) |
| `.gradient-text-warm` | 웜 텍스트 그라디언트 | pink-400 → orange-400 → yellow-400 (135deg) |
| `.glow` | 글로우 효과 | box-shadow 60px, blue-250 25% |
| `.glow-sm` | 작은 글로우 | box-shadow 30px, blue-250 15% |
| `.glass` | 글래스모피즘 | bg white 3%, blur 16px, border white 6% |
| `.glass-hover:hover` | 호버 강조 | bg white 6%, border white 12% |
| `.reveal` | 초기 상태 | opacity 0, translateY 40px |
| `.reveal.visible` | 노출 상태 | opacity 1, translateY 0, cubic-bezier(0.16,1,0.3,1) 0.8s |
| `.reveal-delay-{1..4}` | 지연 | 0.1s ~ 0.4s |
| `.gradient-border` | 그라디언트 테두리 | pseudo-element, mask-composite |
| `.timeline-connector` | 타임라인 연결선 | blue → purple → emerald (90deg) |

### 4.2 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| bg base | `#0a0a0f` | 전체 배경 |
| text primary | `#e2e8f0` (slate-200) | body 텍스트 |
| text heading | `#ffffff` | 제목 |
| text secondary | `#94a3b8` (slate-400) | 부제목, 설명 |
| text muted | `#64748b` (slate-500) | 라벨, 하단 텍스트 |
| accent blue | `#60a5fa` → `#22d3ee` | Feature 1 |
| accent purple | `#a855f7` → `#f472b6` | Feature 2 |
| accent amber | `#f59e0b` → `#fb923c` | Feature 3 |
| accent emerald | `#10b981` → `#2dd4bf` | Feature 4, TechStack |

### 4.3 Typography

- Font family: `'Inter', system-ui, -apple-system, sans-serif`
- Heading: `font-black` (900), tracking-tight, responsive (5xl → 8xl)
- Body: `text-sm` ~ `text-lg`, `leading-relaxed`
- Tags: `text-xs`, `tracking-[0.2em]`, `uppercase`, `font-bold`

### 4.4 Responsive Breakpoints

| Breakpoint | Usage |
|------------|-------|
| `sm:` (640px) | Hero heading 6xl, subtitle br visible |
| `md:` (768px) | Hero heading 7xl, Features 2-col grid |
| `lg:` (1024px) | Hero heading 8xl, Workflow 3-col + connector |
| (default) | 1-col stacked layout |

---

## 5. Animation System

### 5.1 Scroll Reveal

- **Dual mechanism**: App.tsx 전역 observer + useReveal() per-section hook
- **Initial**: opacity 0, translateY 40px
- **Visible**: opacity 1, translateY 0
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` — ease-out-expo feel
- **Duration**: 0.8s
- **Stagger**: `.reveal-delay-{1..4}` via transition-delay (0.1s increments)

### 5.2 CSS Animations (Tailwind extend)

| Animation | Usage | Behavior |
|-----------|-------|----------|
| `animate-fade-in` | Hero badge | opacity 0 → 1 |
| `animate-slide-up` | Hero heading/subtitle/CTA | translateY + opacity with stagger |
| `animate-float` | Scroll indicator | subtle up/down float |
| `animate-pulse` | Badge dot, scroll dot | opacity pulse |

### 5.3 Hover Transitions

- Cards: `hover:scale-[1.02]`, duration-500
- CTA buttons: `hover:scale-105`, duration-300
- Icons: color transition, duration-300
- Glass: bg/border-color transition

---

## 6. Build Configuration

| Config | Value |
|--------|-------|
| Builder | Vite |
| Base path | `'./'` (relative) |
| Output | `website/dist/` |
| Plugins | `@vitejs/plugin-react` |
| Assets | 인라인 SVG only (no external image files) |

---

## 7. Implementation Order

1. ~~Vite + React + Tailwind 프로젝트 초기화~~ ✅
2. ~~index.css (글로벌 스타일, 애니메이션)~~ ✅
3. ~~useReveal.ts (공통 훅)~~ ✅
4. ~~Hero.tsx~~ ✅
5. ~~Features.tsx~~ ✅
6. ~~Workflow.tsx~~ ✅
7. ~~TechStack.tsx~~ ✅
8. ~~Footer.tsx~~ ✅
9. ~~App.tsx (조합 + 전역 스크롤 옵저버)~~ ✅
10. ~~빌드 + 상대경로 확인~~ ✅

---

## 8. FR Mapping

| FR ID | Requirement | Component | Status |
|-------|-------------|-----------|--------|
| FR-01 | Hero 섹션 | Hero.tsx | ✅ Implemented |
| FR-02 | Features 섹션 | Features.tsx | ✅ Implemented |
| FR-03 | Workflow 섹션 | Workflow.tsx | ✅ Implemented |
| FR-04 | Tech Stack 섹션 | TechStack.tsx | ✅ Implemented |
| FR-05 | 반응형 레이아웃 | All components (sm/md/lg) | ✅ Implemented |
| FR-06 | 스크롤 애니메이션 | App.tsx + useReveal + index.css | ✅ Implemented |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial draft | Claude |
| 1.0 | 2026-02-28 | Finalized: full implementation specs | Claude |
