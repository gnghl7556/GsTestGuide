# 가이드 통합 Planning Document

> **Summary**: 참조 가이드(체크리스트형)와 작성 가이드(문서형)를 통합된 가이드 시스템으로 일원화
>
> **Project**: GsTestGuide
> **Version**: 1.0
> **Author**: Claude
> **Date**: 2026-03-14
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 참조 가이드(Firestore+마크다운, 체크리스트형)와 작성 가이드(하드코딩 정적 데이터, 문서형)가 완전히 별개 시스템으로 존재하여 관리 비용 이중화, UX 단절 발생 |
| **Solution** | 콘텐츠 소스를 마크다운 + Firestore 오버라이드 패턴으로 통일하고, 통합 가이드 뷰어 컴포넌트를 구축하여 두 카테고리(참조/작성)를 단일 UI에서 접근 가능하게 함 |
| **Function/UX Effect** | 시험원이 시험 수행 중 어느 단계에서든 참조 가이드와 작성 가이드를 한 곳에서 검색·열람 가능. Admin이 모든 가이드를 하나의 관리 화면에서 CRUD 가능 |
| **Core Value** | 콘텐츠 관리 일원화로 유지보수 비용 절감, 시험원의 정보 접근성 향상으로 시험 품질 개선 |

---

## 1. Overview

### 1.1 Purpose

현재 프로젝트에는 두 개의 독립된 가이드 시스템이 존재한다:

1. **참조 가이드** — 시험 수행 시 참조하는 체크리스트형 가이드
   - 데이터: `content/references/` 마크다운 + Firestore `referenceGuides` 컬렉션 오버라이드
   - 뷰어: `ReferenceGuideModal` (체크리스트 수행 중 모달)
   - 관리: `ReferenceGuideManagement` (Admin CRUD)
   - 현재 2개 항목: 업체 응대 가이드(REF-01), 물리적 마무리(REF-02)

2. **작성 가이드** — 기능명세/TC 등 산출물 작성 요령
   - 데이터: `src/features/design/data/guideContent.ts` (TypeScript 하드코딩)
   - 뷰어: `GuideView` + `DesignPage` (/design 페이지 전용)
   - 관리: 코드 수정만 가능 (Admin UI 없음)
   - 현재 6개 항목: 기능명세, TC, 결함리포트, Invicti 보안, OS모니터링, 원격접속

이 두 시스템을 통합하여 콘텐츠 관리와 사용자 접근을 일원화한다.

### 1.2 Background

- 작성 가이드는 TypeScript 파일에 하드코딩되어 있어 Admin이 수정할 수 없음
- 참조 가이드는 체크리스트 모달에서만 접근 가능하고, 작성 가이드는 /design 페이지에서만 접근 가능
- 두 가이드 모두 "시험원이 업무 중 참조하는 문서"라는 동일한 역할을 수행
- 콘텐츠 관리가 이원화되어 일관성 유지에 비용 발생

### 1.3 Related Documents

- `content/references/` — 참조 가이드 마크다운 소스
- `src/features/design/data/guideContent.ts` — 작성 가이드 하드코딩 데이터
- `vite-plugin-content.ts` — 마크다운 → 가상 모듈 변환 플러그인
- `src/hooks/useReferenceGuides.ts` — 마크다운+Firestore 병합 로직

---

## 2. Scope

### 2.1 In Scope

- [ ] 작성 가이드 6개 항목을 마크다운 콘텐츠로 마이그레이션 (`content/guides/`)
- [ ] 가이드 타입 통합: `category: 'reference' | 'writing'` 카테고리 구분
- [ ] 통합 가이드 뷰어 컴포넌트 구축 (기존 `GuideView` + `ReferenceGuideModal` 통합)
- [ ] Admin 통합 가이드 관리 화면 (참조+작성 가이드 모두 CRUD)
- [ ] 기존 접근 경로 유지: /design 페이지, 체크리스트 모달 모두에서 통합 뷰어 사용
- [ ] Firestore 오버라이드 패턴을 작성 가이드에도 적용

### 2.2 Out of Scope

- 가이드 콘텐츠 자체의 추가/개선 (기존 8개 항목 그대로 마이그레이션)
- 가이드 검색 기능 (향후 고도화 항목)
- 가이드 즐겨찾기/최근 열람 기능
- 가이드 인쇄/내보내기 기능

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 작성 가이드 6개 항목을 `content/guides/` 마크다운으로 마이그레이션 | High | Pending |
| FR-02 | `vite-plugin-content.ts`에 `guides` 가상 모듈 생성 로직 추가 | High | Pending |
| FR-03 | 통합 가이드 데이터 훅 `useGuides()` — 카테고리별 필터링 지원 | High | Pending |
| FR-04 | 통합 가이드 뷰어 컴포넌트 (카테고리 탭 + 목록 + 상세) | High | Pending |
| FR-05 | `/design` 페이지에서 통합 뷰어의 작성 가이드 카테고리 표시 | Medium | Pending |
| FR-06 | 체크리스트 모달에서 통합 뷰어의 참조 가이드 카테고리 표시 | Medium | Pending |
| FR-07 | Admin 통합 관리 화면 — 카테고리별 가이드 CRUD | Medium | Pending |
| FR-08 | Firestore `guides` 컬렉션으로 통합 (기존 `referenceGuides` 마이그레이션) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 가이드 목록 로딩 200ms 이내 | 개발자 도구 Network 탭 |
| 호환성 | 기존 `referenceGuides` Firestore 데이터 무손실 마이그레이션 | 데이터 비교 검증 |
| 유지보수 | 새 가이드 추가 시 마크다운 파일 1개 + (선택) Firestore 오버라이드만으로 완료 | 추가 절차 검증 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 기존 `guideContent.ts` 하드코딩 데이터가 마크다운으로 완전 마이그레이션됨
- [ ] `/design` 페이지에서 작성 가이드 6개가 기존과 동일하게 표시됨
- [ ] 체크리스트 모달에서 참조 가이드 2개가 기존과 동일하게 표시됨
- [ ] Admin에서 참조+작성 가이드 모두 편집 가능
- [ ] `guideContent.ts` 파일 삭제 가능 (의존 제거 완료)

### 4.2 Quality Criteria

- [ ] ESLint 경고 0건
- [ ] 빌드 성공
- [ ] 기존 기능 회귀 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 마크다운 포맷이 기존 TS 구조와 다름 — 섹션/하위항목 매핑 불일치 | Medium | Medium | 마크다운 frontmatter에 `sections` 배열을 메타데이터로 포함하거나, 본문 `## heading` 파싱 활용 |
| Firestore 컬렉션명 변경 시 기존 데이터 유실 | High | Low | 마이그레이션 스크립트 작성, 기존 `referenceGuides` → `guides` 복사 후 검증 |
| `/design` 페이지 UX 변경으로 사용자 혼란 | Low | Low | 기존 사이드바+콘텐츠 레이아웃 유지, 카테고리 필터만 추가 |
| `vite-plugin-content.ts` 수정 시 기존 `virtual:content/references` 호환성 깨짐 | High | Medium | 기존 `references` 가상 모듈은 유지하면서 `guides` 모듈을 별도 추가, 점진적 마이그레이션 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation, microservices | Complex architectures | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 콘텐츠 소스 | A) 전부 마크다운 / B) 전부 Firestore / C) 마크다운+오버라이드 | C) 마크다운 + Firestore 오버라이드 | 기존 참조 가이드 패턴 그대로 확장. 기본 콘텐츠는 Git 관리, 수정분만 Firestore |
| 가상 모듈 전략 | A) 기존 `references` 확장 / B) 새 `guides` 모듈 추가 | B) 새 `guides` 모듈 추가 | 기존 호환성 유지하면서 점진적 마이그레이션 가능 |
| 카테고리 구분 | A) 별도 디렉터리 / B) frontmatter `category` 필드 | B) frontmatter `category` | 유연한 분류, 단일 로더 함수로 처리 가능 |
| Firestore 컬렉션 | A) 기존 `referenceGuides` 유지 / B) 새 `guides`로 통합 | A) 기존 유지 + 별명 | 무중단 마이그레이션 — 기존 데이터 건드리지 않음 |
| 뷰어 컴포넌트 | A) 기존 2개 유지 / B) 통합 뷰어 1개 | B) 통합 뷰어 | 코드 중복 제거, 일관된 UX |

### 6.3 데이터 흐름 설계

```
콘텐츠 소스:
┌─────────────────────────────────────────────────┐
│ content/guides/                                  │
│   ├── reference/                                 │
│   │   ├── 업체-응대-가이드.md  (기존 REF-01)     │
│   │   └── 물리적-마무리.md     (기존 REF-02)     │
│   └── writing/                                   │
│       ├── 기능명세-작성법.md                     │
│       ├── 테스트케이스-작성법.md                  │
│       ├── 결함리포트-작성법.md                    │
│       ├── invicti-보안점검.md                    │
│       ├── os-모니터링.md                         │
│       └── 원격접속-가이드.md                     │
└─────────────────┬───────────────────────────────┘
                  │ vite-plugin-content.ts
                  ▼
         virtual:content/guides  ← 빌드 타임 가상 모듈
                  │
                  ▼
        useGuides() 훅  ← Firestore 오버라이드 병합
                  │
          ┌───────┴───────┐
          ▼               ▼
   /design 페이지    체크리스트 모달
   (작성 가이드)     (참조 가이드)
```

### 6.4 마크다운 구조 설계

```markdown
---
id: GUIDE-W-01
title: 기능명세 작성법
category: writing
icon: 📋
description: 기능 목록 구성, 입력 항목, 작성 팁
order: 1
---

## 기능명세란?
기능명세서는 시험 대상 소프트웨어의 ...

## 기능 목록 구성
대분류 → 중분류 → 소분류(기능) 3단계로 ...

## 입력 항목
각 기능에 대해 다음 항목을 작성합니다 ...

## 작성 팁
• 사용자 관점에서 작성 ...
```

참조 가이드는 기존 구조 유지 (`checkPoints` 배열, `tip`):

```markdown
---
id: REF-01
title: 업체 응대 가이드
category: reference
order: 1
---

## 설명
공식 시험 시작일에 업체를 맞이하고 ...

## 체크포인트
- [ ] 업체의 방문 인원과 시간을 확인했는가?
...

## TIP
> PL의 시험 설명은 반드시 ...
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration (`eslint.config.js`)
- [x] TypeScript configuration (`tsconfig.json`)
- [x] 시맨틱 토큰 사용 규칙 (color-token-guard ESLint rule)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **마크다운 가이드 포맷** | 참조 가이드만 존재 | 작성 가이드용 마크다운 구조 정의 | High |
| **가이드 ID 체계** | REF-01, REF-02 (참조만) | 통합 ID: `REF-XX` (참조), `WRITE-XX` (작성) | High |
| **카테고리 체계** | 없음 | `reference` / `writing` 2개 카테고리 | High |
| **Firestore 스키마** | `referenceGuides` 컬렉션 | 통합 or 호환 결정 | Medium |

### 7.3 Environment Variables Needed

추가 환경변수 불필요 — 기존 Firebase 환경변수로 충분

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`guide-integration.design.md`)
2. [ ] 마크다운 콘텐츠 마이그레이션 (guideContent.ts → content/guides/)
3. [ ] vite-plugin-content.ts 수정 (guides 가상 모듈)
4. [ ] 통합 훅 및 뷰어 컴포넌트 구현
5. [ ] Admin 관리 화면 통합
6. [ ] 기존 코드 정리 (guideContent.ts 삭제, 레거시 import 제거)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-14 | Initial draft | Claude |
