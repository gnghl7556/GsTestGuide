# 가이드 통합 Design Document

> **Summary**: 참조 가이드와 작성 가이드를 마크다운 + Firestore 오버라이드 패턴으로 통합하는 기술 설계
>
> **Project**: GsTestGuide
> **Version**: 1.0
> **Author**: Claude
> **Date**: 2026-03-14
> **Status**: Draft
> **Planning Doc**: [guide-integration.plan.md](../../01-plan/features/guide-integration.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **콘텐츠 소스 통일**: 작성 가이드 6개를 `guideContent.ts` 하드코딩에서 마크다운 파일로 마이그레이션
2. **가상 모듈 확장**: `vite-plugin-content.ts`에 `virtual:content/guides` 가상 모듈 추가
3. **통합 데이터 훅**: `useGuides()` 훅으로 카테고리별(참조/작성) 필터링 제공
4. **통합 뷰어 컴포넌트**: 기존 `GuideView`와 `ReferenceGuideModal`의 기능을 하나로 통합
5. **Admin 관리 통합**: 참조+작성 가이드를 단일 관리 화면에서 CRUD
6. **하위 호환성 유지**: 기존 `virtual:content/references` 모듈은 그대로 유지 (점진적 제거)

### 1.2 Design Principles

- **기존 패턴 재사용**: 참조 가이드에서 검증된 "마크다운 + Firestore 오버라이드" 패턴을 작성 가이드에도 동일하게 적용
- **점진적 마이그레이션**: 기존 코드를 한번에 제거하지 않고, 통합 모듈 구축 → 기존 import 전환 → 레거시 제거 순서
- **Feature-First 구조 준수**: 통합 가이드 관련 코드는 `src/features/guide/`에 집중

---

## 2. Architecture

### 2.1 데이터 흐름 다이어그램

```
                    ┌── content/guides/reference/*.md ──┐
                    │                                    │
빌드 타임           │── content/guides/writing/*.md ─────┤
                    │                                    ▼
                    │                      vite-plugin-content.ts
                    │                        generateGuidesModule()
                    │                                    │
                    │                                    ▼
                    │                      virtual:content/guides
                    │                        (GUIDES 배열 export)
                    └────────────────────────────────────┘
                                                         │
런타임                                                   ▼
                                              useGuides() 훅
                                          ┌────────────────────┐
                                          │ 마크다운 기본 데이터  │
                                          │ + Firestore 오버라이드│
                                          │ + 카테고리별 필터     │
                                          └─────────┬──────────┘
                                                    │
                                     ┌──────────────┼──────────────┐
                                     ▼              ▼              ▼
                              /design 페이지   체크리스트 모달   Admin 관리
                             (writing 필터)   (reference 필터)  (전체)
```

### 2.2 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `generateGuidesModule()` | `vite-plugin-content.ts`, `content/guides/` | 빌드 타임 마크다운 → JS 변환 |
| `useGuides()` | `virtual:content/guides`, Firestore `referenceGuides` | 런타임 데이터 병합 |
| `UnifiedGuideView` | `useGuides()` | 통합 뷰어 UI |
| `DesignPage` | `UnifiedGuideView` | /design 라우트 |
| `ReferenceGuideModal` | `useGuides()` | 체크리스트 모달 |
| `GuideManagement` | `useGuides()`, Firestore | Admin CRUD |

---

## 3. Data Model

### 3.1 마크다운 Frontmatter 스키마

**작성 가이드 (writing)**:
```markdown
---
id: WRITE-01
title: 기능명세 작성법
category: writing
icon: 📋
description: 기능 목록 구성, 입력 항목, 작성 팁
order: 1
---

## 기능명세란?
(본문 — `## heading`으로 섹션 분리)

## 기능 목록 구성
...
```

**참조 가이드 (reference)** — 기존 구조 유지 + `category`, `order` 추가:
```markdown
---
id: REF-01
title: 업체 응대 가이드
category: reference
order: 1
---

## 설명
...

## 체크포인트
- [ ] 항목1
- [ ] 항목2

## TIP
> 팁 내용
```

### 3.2 TypeScript 타입 정의

```typescript
// src/types/guide.ts

/** 가이드 카테고리 */
export type GuideCategory = 'reference' | 'writing';

/** 가이드 섹션 (본문 ## heading 파싱 결과) */
export interface GuideSection {
  heading: string;
  content: string;
}

/** 통합 가이드 엔티티 */
export interface Guide {
  id: string;
  title: string;
  category: GuideCategory;
  icon: string;
  description: string;
  order: number;
  sections: GuideSection[];
  /** reference 카테고리 전용 — 체크포인트 목록 */
  checkPoints?: string[];
  /** reference 카테고리 전용 — TIP 내용 */
  tip?: string;
}

/** 데이터 소스 추적 */
export type GuideWithSource = Guide & {
  source: 'markdown' | 'firestore';
};
```

### 3.3 가상 모듈 출력 형태

```typescript
// virtual:content/guides (빌드 타임 생성)
export interface Guide { ... }
export const GUIDES: Guide[] = [
  {
    id: 'REF-01',
    title: '업체 응대 가이드',
    category: 'reference',
    icon: '',
    description: '...',
    order: 1,
    sections: [{ heading: '설명', content: '...' }, ...],
    checkPoints: ['항목1', '항목2'],
    tip: '...',
  },
  {
    id: 'WRITE-01',
    title: '기능명세 작성법',
    category: 'writing',
    icon: '📋',
    description: '...',
    order: 1,
    sections: [{ heading: '기능명세란?', content: '...' }, ...],
  },
  // ...
];
```

### 3.4 Firestore 스키마 (기존 유지)

기존 `referenceGuides` 컬렉션을 그대로 사용한다. 작성 가이드의 Firestore 오버라이드도 동일 컬렉션에 저장하며, `category` 필드로 구분한다.

| 컬렉션 | 문서 ID | 필드 |
|--------|---------|------|
| `referenceGuides` | `{guideId}` | `title`, `description`, `category`, `icon`, `order`, `sections[]`, `checkPoints[]`, `tip`, `updatedAt` |

> 컬렉션 이름은 변경하지 않는다. 기존 데이터와의 호환성을 위해 `referenceGuides`를 유지하되, 실질적으로 모든 가이드의 오버라이드를 저장하는 통합 컬렉션으로 활용한다.

---

## 4. 구현 상세

### 4.1 마크다운 콘텐츠 마이그레이션

**디렉터리 구조**:
```
content/guides/
├── reference/
│   ├── 업체-응대-가이드.md      (기존 content/references/에서 이동)
│   └── 물리적-마무리.md         (기존 content/references/에서 이동)
└── writing/
    ├── 기능명세-작성법.md        (guideContent.ts에서 변환)
    ├── 테스트케이스-작성법.md    (guideContent.ts에서 변환)
    ├── 결함리포트-작성법.md      (guideContent.ts에서 변환)
    ├── invicti-보안점검.md       (guideContent.ts에서 변환)
    ├── os-모니터링.md            (guideContent.ts에서 변환)
    └── 원격접속-가이드.md        (guideContent.ts에서 변환)
```

**ID 매핑**:

| 기존 ID | 새 ID | 카테고리 |
|---------|-------|---------|
| `REF-01` | `REF-01` (유지) | reference |
| `REF-02` | `REF-02` (유지) | reference |
| `feature-spec` | `WRITE-01` | writing |
| `test-case` | `WRITE-02` | writing |
| `defect-report` | `WRITE-03` | writing |
| `invicti-security` | `WRITE-04` | writing |
| `os-monitoring` | `WRITE-05` | writing |
| `remote-access` | `WRITE-06` | writing |

### 4.2 vite-plugin-content.ts 수정

**새 함수 `generateGuidesModule()`**:

```typescript
function generateGuidesModule(rootDir: string): string {
  const guidesDir = path.join(rootDir, CONTENT_DIR, 'guides');
  const files = readContentFiles(guidesDir);

  const items = files.map((file) => {
    const { data, content } = matter(file.content);
    if (!data.id) return null;

    const sections = extractSections(content);
    const category = (data.category as string) || 'reference';

    const guide: Record<string, unknown> = {
      id: data.id,
      title: data.title ?? '',
      category,
      icon: data.icon ?? '',
      description: data.description ?? '',
      order: data.order ?? 99,
      sections: sections.map(s => ({ heading: s.heading, content: s.content })),
    };

    // reference 카테고리: checkPoints, tip 파싱
    if (category === 'reference') {
      guide.checkPoints = parseCheckboxList(
        findSection(sections, '체크포인트')?.content ?? ''
      );
      guide.tip = findSection(sections, 'TIP')?.content?.trim() ?? '';
    }

    return guide;
  }).filter(Boolean);

  // order로 정렬
  items.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));

  return `export const GUIDES = ${JSON.stringify(items, null, 2)};`;
}
```

**플러그인 등록** (`load` 함수에 추가):
```typescript
if (id === '\0virtual:content/guides') {
  return generateGuidesModule(rootDir);
}
```

**HMR 지원** (`handleHotUpdate`에 추가):
```typescript
const moduleIds = [
  // ... 기존 모듈들
  '\0virtual:content/guides',
];
```

**타입 선언** (`src/types/virtual-content.d.ts` 또는 기존 선언 파일에 추가):
```typescript
declare module 'virtual:content/guides' {
  import type { Guide } from '../types/guide';
  export const GUIDES: Guide[];
}
```

### 4.3 통합 데이터 훅 `useGuides()`

**파일**: `src/hooks/useGuides.ts`

```typescript
import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GUIDES } from 'virtual:content/guides';
import type { Guide, GuideCategory, GuideWithSource } from '../types/guide';

interface UseGuidesOptions {
  category?: GuideCategory;
}

export function useGuides(options?: UseGuidesOptions): GuideWithSource[] {
  const [dbGuides, setDbGuides] = useState<Record<string, Partial<Guide>>>({});

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'referenceGuides'), (snap) => {
      const result: Record<string, Partial<Guide>> = {};
      snap.forEach((d) => {
        result[d.id] = d.data() as Partial<Guide>;
      });
      setDbGuides(result);
    });
    return () => unsub();
  }, []);

  return useMemo(() => {
    const mdIds = new Set(GUIDES.map((g) => g.id));

    // 마크다운 기본 + Firestore 오버라이드 병합
    let merged: GuideWithSource[] = GUIDES.map((g) => {
      const override = dbGuides[g.id];
      if (!override) return { ...g, source: 'markdown' as const };
      return { ...g, ...override, id: g.id, source: 'firestore' as const };
    });

    // Firestore에만 존재하는 가이드 추가
    for (const [id, guide] of Object.entries(dbGuides)) {
      if (!mdIds.has(id)) {
        merged.push({
          id,
          title: guide.title ?? '',
          category: guide.category ?? 'reference',
          icon: guide.icon ?? '',
          description: guide.description ?? '',
          order: guide.order ?? 99,
          sections: guide.sections ?? [],
          checkPoints: guide.checkPoints,
          tip: guide.tip,
          source: 'firestore' as const,
        });
      }
    }

    // 카테고리 필터
    if (options?.category) {
      merged = merged.filter((g) => g.category === options.category);
    }

    // order 정렬
    merged.sort((a, b) => a.order - b.order);

    return merged;
  }, [dbGuides, options?.category]);
}
```

### 4.4 통합 뷰어 컴포넌트

**파일 구조**:
```
src/features/guide/
├── components/
│   ├── UnifiedGuideView.tsx      # 통합 뷰어 (사이드바 + 콘텐츠)
│   ├── GuideListSidebar.tsx      # 카테고리별 가이드 목록
│   ├── WritingGuideContent.tsx   # 작성 가이드 콘텐츠 (섹션 기반)
│   └── ReferenceGuideContent.tsx # 참조 가이드 콘텐츠 (체크포인트 기반)
└── index.ts                      # 공개 API export
```

**UnifiedGuideView.tsx** — 핵심 레이아웃:
```
┌─ GuideListSidebar ─┬─── Content Area ──────────────┐
│ [카테고리 탭]       │                                │
│ ┌─참조 가이드──┐   │  WritingGuideContent            │
│ │ 업체 응대    │   │  또는                            │
│ │ 물리적 마무리│   │  ReferenceGuideContent           │
│ └──────────────┘   │                                │
│ ┌─작성 가이드──┐   │  (카테고리에 따라 다른 렌더링)   │
│ │ 기능명세     │   │                                │
│ │ TC 작성법    │   │                                │
│ │ 결함리포트   │   │                                │
│ │ Invicti      │   │                                │
│ │ OS모니터링   │   │                                │
│ │ 원격접속     │   │                                │
│ └──────────────┘   │                                │
└─────────────────────┴────────────────────────────────┘
```

**Props 설계**:
```typescript
interface UnifiedGuideViewProps {
  /** 특정 카테고리만 표시 (미지정 시 전체) */
  category?: GuideCategory;
  /** 초기 선택 가이드 ID */
  initialGuideId?: string;
  /** 사이드바 숨김 (모달 사용 시) */
  hideSidebar?: boolean;
  /** 컴팩트 모드 (모달 내 표시 시) */
  compact?: boolean;
}
```

### 4.5 기존 컴포넌트 연결

**DesignPage.tsx 수정**:
- 기존: `guideContent` import → `GuideView` 사용
- 변경: `UnifiedGuideView` import, `category="writing"` 전달
- 사이드바 렌더링을 `UnifiedGuideView` 내부로 위임

```typescript
// 변경 전
import { guideContent } from '../data/guideContent';
import { GuideView } from '../components/GuideView';

// 변경 후
import { UnifiedGuideView } from '../../guide';

// content 영역에서:
<UnifiedGuideView category="writing" />
```

**ReferenceGuideModal.tsx 수정**:
- 기존: `useReferenceGuides()` → 자체 카드 렌더링
- 변경: `useGuides({ category: 'reference' })` → 기존 카드 UI 유지 (UX 변경 최소화)

```typescript
// 변경 전
import { useReferenceGuides } from '../../../hooks/useReferenceGuides';

// 변경 후
import { useGuides } from '../../../hooks/useGuides';
const guides = useGuides({ category: 'reference' });
```

### 4.6 Admin 관리 통합

**ReferenceGuideManagement.tsx 수정**:
- 카테고리 탭 추가 (참조 / 작성 / 전체)
- 작성 가이드에 대해서도 Firestore 오버라이드 생성/편집 가능
- 컴포넌트명을 `GuideManagement`로 변경 고려 (또는 기존 이름 유지)

**편집 폼 확장**:
```typescript
type GuideForm = {
  id: string;
  title: string;
  category: GuideCategory;
  icon: string;
  description: string;
  order: number;
  // reference 전용
  checkPoints: string[];
  tip: string;
  // writing 전용
  sections: { heading: string; content: string }[];
};
```

---

## 5. UI/UX Design

### 5.1 /design 페이지 레이아웃 (변경 최소화)

```
기존:
┌─ 사이드바 ──────────┬── 콘텐츠 ───────────────────┐
│ 가이드 (label)       │                              │
│  📋 기능명세 작성법  │  [GuideView 콘텐츠]           │
│  🧪 TC 작성법        │                              │
│  🐛 결함리포트       │                              │
│  🛡️ Invicti         │                              │
│  📊 OS모니터링       │                              │
│  🔌 원격접속         │                              │
└──────────────────────┴──────────────────────────────┘

변경 후: (동일 레이아웃, 데이터 소스만 변경)
┌─ 사이드바 ──────────┬── 콘텐츠 ───────────────────┐
│ 작성 가이드 (label)  │                              │
│  📋 기능명세 작성법  │  [UnifiedGuideView 콘텐츠]    │
│  🧪 TC 작성법        │                              │
│  🐛 결함리포트       │  (기존과 시각적으로 동일)     │
│  🛡️ Invicti         │                              │
│  📊 OS모니터링       │                              │
│  🔌 원격접속         │                              │
└──────────────────────┴──────────────────────────────┘
```

### 5.2 체크리스트 참조 가이드 모달 (변경 최소화)

기존 `ReferenceGuideModal`의 UI는 그대로 유지하되, 데이터 소스만 `useGuides({ category: 'reference' })`로 전환.

### 5.3 Admin 가이드 관리 (카테고리 탭 추가)

```
┌─────────────────────────────────────────────────────┐
│ 가이드 관리                                          │
│                                                      │
│ [전체] [참조 가이드] [작성 가이드]    [+ 새 가이드]   │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ REF-01  업체 응대 가이드    [참조]  [편집]      │  │
│ │ REF-02  물리적 마무리       [참조]  [편집]      │  │
│ │ WRITE-01 기능명세 작성법    [작성]  [편집]      │  │
│ │ WRITE-02 TC 작성법          [작성]  [편집]      │  │
│ │ ...                                            │  │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 6. Error Handling

| 시나리오 | 처리 방법 |
|---------|----------|
| `content/guides/` 디렉터리 미존재 | `generateGuidesModule()`에서 빈 배열 반환 (`GUIDES = []`) |
| 마크다운 frontmatter에 `id` 누락 | 해당 파일 무시 (`filter(Boolean)`) |
| Firestore 연결 실패 | 마크다운 기본 데이터만 표시 (기존 `useReferenceGuides` 패턴과 동일) |
| `category` 필드 누락 | `'reference'`로 기본값 처리 (기존 참조 가이드 호환) |
| 가이드 0건 (필터 결과 비어있음) | "가이드가 없습니다" 빈 상태 메시지 표시 |

---

## 7. Security Considerations

- [x] 기존 Firestore 보안 규칙 유지 (인증된 사용자만 읽기/쓰기)
- [x] Admin 권한 체크 유지 (가이드 CRUD는 Admin만 가능)
- [x] XSS 방지: 마크다운 콘텐츠는 빌드 타임 정적 변환, 사용자 입력 아님
- [ ] Firestore 오버라이드 데이터의 HTML 이스케이프 확인 (기존과 동일 수준)

---

## 8. Test Plan

### 8.1 검증 범위

| Type | Target | Method |
|------|--------|--------|
| 빌드 검증 | `virtual:content/guides` 모듈 정상 생성 | `npm run build` |
| 데이터 검증 | 8개 가이드 항목 누락 없이 로딩 | 브라우저 콘솔에서 GUIDES 배열 확인 |
| UI 검증 | /design 페이지 — 작성 가이드 6개 표시 | 수동 확인 |
| UI 검증 | 체크리스트 모달 — 참조 가이드 2개 표시 | 수동 확인 |
| UI 검증 | Admin — 전체 가이드 8개 CRUD | 수동 확인 |
| 호환성 | 기존 `virtual:content/references` 모듈 정상 작동 | 기존 import 점 확인 |

### 8.2 Key Test Cases

- [ ] Happy path: /design 페이지에서 작성 가이드 6개가 기존과 동일 내용으로 표시됨
- [ ] Happy path: 체크리스트 모달에서 참조 가이드 2개가 체크포인트+TIP과 함께 표시됨
- [ ] Happy path: Admin에서 작성 가이드를 편집하면 Firestore에 저장되고, /design에서 반영됨
- [ ] Edge case: Firestore 오프라인 시 마크다운 기본 데이터만 정상 표시됨
- [ ] Regression: `npm run build` 성공, `npm run lint` 경고 0건

---

## 9. Clean Architecture — Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `Guide`, `GuideCategory` 타입 | Domain | `src/types/guide.ts` |
| `useGuides()` | Application | `src/hooks/useGuides.ts` |
| `generateGuidesModule()` | Infrastructure | `vite-plugin-content.ts` |
| `UnifiedGuideView` | Presentation | `src/features/guide/components/` |
| `GuideListSidebar` | Presentation | `src/features/guide/components/` |
| `WritingGuideContent` | Presentation | `src/features/guide/components/` |
| `ReferenceGuideContent` | Presentation | `src/features/guide/components/` |
| `DesignPage` (수정) | Presentation | `src/features/design/routes/` |
| `ReferenceGuideModal` (수정) | Presentation | `src/features/checklist/components/` |
| `ReferenceGuideManagement` (수정) | Presentation | `src/features/admin/components/` |

---

## 10. Coding Convention Reference

### 10.1 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| 컴포넌트 naming | PascalCase (`UnifiedGuideView.tsx`) |
| 파일 구조 | Feature-First (`src/features/guide/`) |
| 스타일링 | 시맨틱 토큰 (bg-surface-base, text-tx-primary 등) |
| 타입 정의 | `src/types/guide.ts` → `index.ts`에서 re-export |
| 가이드 ID | `REF-XX` (참조), `WRITE-XX` (작성) |
| 마크다운 | frontmatter: `id`, `title`, `category`, `icon`, `description`, `order` |

---

## 11. Implementation Guide

### 11.1 File Structure (최종)

```
content/guides/
├── reference/
│   ├── 업체-응대-가이드.md
│   └── 물리적-마무리.md
└── writing/
    ├── 기능명세-작성법.md
    ├── 테스트케이스-작성법.md
    ├── 결함리포트-작성법.md
    ├── invicti-보안점검.md
    ├── os-모니터링.md
    └── 원격접속-가이드.md

src/
├── types/
│   ├── guide.ts                              (NEW)
│   └── index.ts                              (UPDATE — re-export)
├── hooks/
│   ├── useGuides.ts                          (NEW)
│   └── useReferenceGuides.ts                 (DEPRECATED → useGuides로 대체)
├── features/
│   ├── guide/                                (NEW 피처 디렉터리)
│   │   ├── components/
│   │   │   ├── UnifiedGuideView.tsx
│   │   │   ├── GuideListSidebar.tsx
│   │   │   ├── WritingGuideContent.tsx
│   │   │   └── ReferenceGuideContent.tsx
│   │   └── index.ts
│   ├── design/
│   │   ├── routes/DesignPage.tsx             (UPDATE — UnifiedGuideView 사용)
│   │   ├── components/GuideView.tsx          (DEPRECATED)
│   │   └── data/guideContent.ts             (DELETE — 마크다운으로 이전)
│   ├── checklist/
│   │   └── components/ReferenceGuideModal.tsx (UPDATE — useGuides 사용)
│   └── admin/
│       └── components/ReferenceGuideManagement.tsx (UPDATE — 카테고리 탭 추가)
└── vite-plugin-content.ts                    (UPDATE — generateGuidesModule 추가)
```

### 11.2 Implementation Order

1. [ ] **Phase 1 — 타입 정의**: `src/types/guide.ts` 생성, `index.ts` re-export
2. [ ] **Phase 2 — 마크다운 콘텐츠 생성**: `content/guides/writing/` 6개 파일 작성 (guideContent.ts 변환)
3. [ ] **Phase 3 — 참조 가이드 이동**: `content/references/` → `content/guides/reference/` (frontmatter에 `category`, `order` 추가)
4. [ ] **Phase 4 — Vite 플러그인 확장**: `generateGuidesModule()` 구현, `virtual:content/guides` 등록
5. [ ] **Phase 5 — 가상 모듈 타입 선언**: `virtual:content/guides` 타입 선언
6. [ ] **Phase 6 — 통합 훅 구현**: `useGuides()` 구현
7. [ ] **Phase 7 — 통합 뷰어 컴포넌트**: `src/features/guide/` 디렉터리 + 4개 컴포넌트
8. [ ] **Phase 8 — 기존 컴포넌트 연결**: DesignPage, ReferenceGuideModal 수정
9. [ ] **Phase 9 — Admin 관리 통합**: ReferenceGuideManagement 카테고리 탭 추가
10. [ ] **Phase 10 — 레거시 정리**: guideContent.ts 삭제, useReferenceGuides.ts deprecated 처리, 기존 `virtual:content/references` 유지 (향후 제거)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-14 | Initial draft | Claude |
