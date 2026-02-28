# Showcase Website Planning Document

> **Summary**: GS Test Guide 프로젝트를 소개하는 Awwwards 수준의 정적 쇼케이스 웹사이트
>
> **Project**: GS Test Guide
> **Author**: Claude
> **Date**: 2026-02-20
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

GS(Good Software) 인증 시험 가이드 도구를 외부에 소개하는 독립 정적 웹사이트를 제작한다. 프로젝트의 목적, 핵심 기능, 워크플로우를 시각적으로 전달하여 도구의 가치를 효과적으로 전달한다.

### 1.2 Background

- GS Test Guide는 TTA GS 인증 시험 프로세스를 체계적으로 가이드하는 웹앱
- 현재 도구 자체는 완성되어 있으나, 이를 소개하는 별도 페이지가 없음
- Awwwards 수준의 디자인으로 프로젝트의 전문성과 완성도를 어필

### 1.3 Related Documents

- 메인 프로젝트: https://tta-gs-test-guide.web.app
- GitHub: https://github.com/gnghl7556/GsTestGuide.git

---

## 2. Scope

### 2.1 In Scope

- [x] Hero 섹션 (프로젝트 대표 문구 + 비주얼)
- [x] Features 섹션 (핵심 기능 소개)
- [x] Workflow 섹션 (시험준비→시험수행→시험종료 프로세스)
- [x] Tech Stack 섹션
- [x] CTA / Footer
- [x] 다크 테마 기반 디자인
- [x] 정적 빌드 (모든 assets `./` 상대경로)

### 2.2 Out of Scope

- 백엔드 / API 연동
- 다국어 지원
- CMS 연동
- 도메인 / 호스팅 설정

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Hero 섹션: 프로젝트명 + 대표 문구 + CTA 버튼 | High | Pending |
| FR-02 | Features 섹션: 핵심 기능 카드 (체크리스트, 결함관리, 실시간 진행률 등) | High | Pending |
| FR-03 | Workflow 섹션: 3단계 프로세스 시각화 | High | Pending |
| FR-04 | Tech Stack 섹션: 사용 기술 스택 표시 | Medium | Pending |
| FR-05 | 반응형 레이아웃 (Desktop / Tablet / Mobile) | High | Pending |
| FR-06 | 스크롤 기반 애니메이션 (Intersection Observer) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Lighthouse Performance > 90 | Lighthouse |
| Build | 정적 빌드, `./` 상대경로 | 빌드 결과 확인 |
| Design | Awwwards 수준 시각 완성도 | 주관적 평가 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] 모든 섹션 구현 완료
- [x] 정적 빌드 성공
- [x] 모든 assets `./` 상대경로 참조
- [x] 반응형 대응

### 4.2 Quality Criteria

- [x] Zero build errors
- [x] 다크 테마 기반 트렌디 디자인

---

## 5. Architecture Considerations

### 5.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| **Starter** | ✅ |

### 5.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Framework | React (Vite) | 메인 프로젝트와 동일 스택 |
| Styling | Tailwind CSS | 빠른 스타일링 + 메인 프로젝트 일관성 |
| Animation | CSS + Intersection Observer | 외부 의존성 최소화 |
| Build | Vite (base: './') | 상대경로 정적 빌드 |

### 5.3 Folder Structure

```
website/
├── src/
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Workflow.tsx
│   │   ├── TechStack.tsx
│   │   └── Footer.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── dist/          ← 빌드 결과물
```

---

## 6. Design Direction

### 6.1 Visual Theme

- **Base**: 다크 테마 (deep navy/charcoal)
- **Accent**: Gradient (blue → purple / cyan → emerald)
- **Typography**: 대형 타이포, bold weight, letter-spacing
- **Effects**: Glassmorphism, subtle grid/dot pattern, glow effects
- **Motion**: Scroll-triggered fade-in / slide-up

### 6.2 Section Layout

```
┌─────────────────────────────────────────┐
│ HERO: 대형 타이포 + 그라디언트 배경       │
│       CTA 버튼 → 앱 바로가기             │
├─────────────────────────────────────────┤
│ FEATURES: 3~4 기능 카드 (글래스모피즘)    │
├─────────────────────────────────────────┤
│ WORKFLOW: 시험준비 → 시험수행 → 시험종료  │
│          타임라인/스텝 시각화             │
├─────────────────────────────────────────┤
│ TECH STACK: 기술 아이콘 + 라벨           │
├─────────────────────────────────────────┤
│ FOOTER: 링크 + 크레딧                    │
└─────────────────────────────────────────┘
```

---

## 7. Next Steps

1. [x] Plan 문서 작성
2. [ ] Design 문서 작성
3. [ ] 구현
4. [ ] 빌드 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial draft | Claude |
