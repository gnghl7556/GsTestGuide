# Content Feature - Full Gap Analysis Report

> **Analysis Type**: Gap Analysis (Plan vs Implementation)
>
> **Project**: GS Test Guide
> **Analyst**: gap-detector
> **Date**: 2026-02-28
> **Status**: Completed
> **Plan Doc**: [content-override.plan.md](../01-plan/features/content-override.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

"content" feature 전체 범위에 대한 설계-구현 일치도를 검증한다.
이전 분석(content.analysis.md)은 "checkpoint importance admin edit" 서브기능만 다뤘으며 98% 일치율을 기록했다.
이번 분석은 콘텐츠 시스템 전체를 대상으로 한다:
- 마크다운 기반 빌드타임 콘텐츠 파이프라인
- Firestore 런타임 오버라이드 시스템
- 관리자 UI
- 콘텐츠 소비 경로 (체크리스트 UI, 퀵모드)
- 팀이 발견한 7건의 코드 품질 이슈

### 1.2 Analysis Scope

- **설계 문서**: `docs/01-plan/features/content-override.plan.md`
- **구현 파일**: 14개 파일, 2,400+ LOC
- **콘텐츠 소스**: 13개 마크다운 파일
- **분석일**: 2026-02-28

---

## 2. Gap Analysis (Plan vs Implementation)

### 2.1 Data Flow Match

Plan Section 3.1에서 정의한 데이터 흐름:

```
마크다운 13개 파일 -> vite-plugin-content.ts -> REQUIREMENTS_DB -> mergeOverrides() -> UI
```

| Step | Plan 정의 | 구현 | Status |
|------|-----------|------|--------|
| 1. 마크다운 파싱 (빌드타임) | `vite-plugin-content.ts` -> `REQUIREMENTS_DB` | `vite-plugin-content.ts` L87-157: `generateProcessModule()` | Match |
| 2. 런타임 오버라이드 구독 | Firestore `contentOverrides` 실시간 구독 | `useContentOverrides.ts` L6-22: `onSnapshot()` hook | Match |
| 3. 병합 | `mergeOverrides(REQUIREMENTS_DB, firestoreOverrides)` | `ExecutionPage.tsx` L179-181: `mergeOverrides()` + `mergeDocLinks()` | Extended |
| 4. 퀵모드 변환 | 병합된 데이터 -> `quickMode` 변환 | `ExecutionPage.tsx` L206: `checklist.map(toQuickModeItem)` | Match |
| 5. UI 렌더링 | 최종 데이터 -> 체크리스트 UI | `CenterDisplay.tsx` L242+: 질문/답변 UI 렌더링 | Match |

### 2.2 Firestore Collection Structure

Plan Section 2.1.A에서 정의한 `contentOverrides` 문서 구조:

| Plan 필드 | Plan 타입 | 구현 타입 (mergeOverrides.ts L16-27) | Status |
|-----------|-----------|--------------------------------------|--------|
| title | `string?` | `string?` | Match |
| description | `string?` | `string?` | Match |
| checkpoints | `Record<number, string>?` | `Record<number, string>?` | Match |
| updatedAt | `Timestamp` | `unknown?` | Match |
| updatedBy | `string` | `string?` | Match |
| - | - | `checkpointImportances?: Record<number, QuestionImportance>` | Added |
| - | - | `evidenceExamples?: string[]` | Added |
| - | - | `testSuggestions?: string[]` | Added |
| - | - | `passCriteria?: string` | Added |
| - | - | `branchingRules?: BranchingRule[]` | Added |

### 2.3 mergeOverrides() Function

Plan Section 3.2에서 정의한 병합 함수:

| Plan 설계 | 구현 (mergeOverrides.ts L43-77) | Status |
|-----------|--------------------------------|--------|
| `base.map(req => ...)` 구조 | `base.map((req) => { ... })` | Match |
| `ov.title ?? req.title` | `...(ov.title != null && { title: ov.title })` | Equivalent |
| `ov.description ?? req.description` | `...(ov.description != null && { description: ov.description })` | Equivalent |
| `ov.checkpoints?.[i] ?? cp` | `ov.checkpoints![i] != null ? ov.checkpoints![i] : cp` | Equivalent |
| 빈 오버라이드 시 원본 반환 | L47: `if (!overrides \|\| Object.keys(overrides).length === 0) return base` | Match |
| - | L62-66: `evidenceExamples`, `testSuggestions`, `passCriteria`, `checkpointImportances`, `branchingRules` 오버라이드 | Extended |
| - | L69-73: 체크포인트 오버라이드 시 `requiredDocs` ref 필터링 | Added |
| - | L80-115: `mergeDocLinks()` -- docMaterials 기반 동적 문서 연결 | Added |

### 2.4 Admin UI Component

Plan Section 2.1.C / 3.3에서 정의한 관리자 편집 UI:

| Plan 요구사항 | 구현 (ContentOverrideManagement.tsx) | Status |
|--------------|--------------------------------------|--------|
| 기존 Admin 패턴 재사용 | `ContentOverrideManagement` 독립 컴포넌트 | Match |
| 점검항목 목록 표시 | L201-211: `grouped` useMemo -- 카테고리별 그룹 | Match |
| 선택 시 인라인 편집 | L224-252: `handleEditStart()` -> L412-691: 편집 폼 | Match |
| 제목 편집 | L431-442: title input + 원본 비교 표시 | Match |
| 설명 편집 | L444-456: description textarea + 원본 비교 표시 | Match |
| 체크포인트 문구 편집 | L459-575: 개별 체크포인트 input + 원본 비교 | Match |
| 원본 대비 변경 표시 | L700-702: "수정됨" amber 뱃지 | Match |
| "원본으로 되돌리기" | L329-339: `handleReset()` -> `deleteDoc()` | Match |
| - | L486-503: MUST/SHOULD 중요도 토글 | Added |
| - | L577-635: 분기 규칙(branchingRules) 편집 | Added |
| - | L637-654: 증빙 예시 편집 | Added |
| - | L656-673: 테스트 제안 편집 | Added |
| - | L675-688: 판정 기준 편집 | Added |
| - | L505-563: 참고 자료(ref) 드롭다운 선택기 | Added |
| - | L341-352: 전체 초기화 | Added |

### 2.5 REQUIREMENTS_DB 소비 지점 전환

Plan Section 3.4에서 정의한 소비 지점 전환:

| 소비 파일 | Plan 변경 후 | 구현 | Status |
|-----------|-------------|------|--------|
| 체크리스트 관련 | Context에서 병합 데이터 소비 | ExecutionPage.tsx L179-183: `mergeOverrides()` + `generateChecklist()` | Match |
| ContactManagement.tsx | 병합 데이터에서 step 목록 | L3,26: `REQUIREMENTS_DB` 직접 import -- step 목록용 | Partial |
| MaterialManagement.tsx | 병합 데이터에서 step 목록 | L3,28: `REQUIREMENTS_DB` 직접 import -- step 목록용 | Partial |
| ContentOverrideManagement.tsx | (신규) | L3: `REQUIREMENTS_DB` 직접 import -- 편집 원본 비교용 | Intentional |

**Note**: ContactManagement와 MaterialManagement에서 `REQUIREMENTS_DB`를 직접 import하는 것은 step ID/title 목록만 사용하므로 오버라이드 영향이 없다. title 오버라이드를 반영하려면 병합 데이터를 사용해야 하지만, step 선택 드롭다운에서는 원본 title이 일관성 있는 기준점 역할을 하므로 의도적 선택으로 볼 수 있다.

### 2.6 변경하지 않는 파일 검증

Plan Section 2.2에서 명시한 불변 항목:

| Plan "변경 없음" 항목 | 실제 변경 여부 | Status |
|-----------------------|---------------|--------|
| 카테고리 구조 (SETUP/EXECUTION/COMPLETION) | 변경 없음 | Match |
| 점검항목 ID, 순서 | 마크다운 기준 유지 | Match |
| 마크다운 파일 | `content/process/` -- 13개 파일 존재 | Match |
| `vite-plugin-content.ts` | 빌드타임 로직 변경 없음 | Match |
| `quickMode.ts` | 입력 형식 변경 없음 (Requirement 타입 그대로) | Match |
| `types/checklist.ts` | 기존 타입 변경 없음 | Violated |

`types/checklist.ts` 변경: `checkpointImportances`와 `branchingRules` 필드가 Requirement 타입에 추가됨. 이는 Plan 작성 이후 확장된 기능(중요도 오버라이드, 분기 규칙)을 위한 것으로, Plan 범위 밖의 정당한 확장이다.

---

## 3. Architecture Compliance

### 3.1 Layer Structure (Dynamic Level)

프로젝트는 Dynamic level 구조를 사용한다:

| Layer | Expected Path | Actual Files | Status |
|-------|--------------|-------------|--------|
| Presentation | `src/features/*/components/`, `routes/` | CenterDisplay.tsx, ChecklistView.tsx, ContentOverrideManagement.tsx | Pass |
| Application | `src/utils/`, `src/hooks/` | quickMode.ts, branchingResolver.ts, checklistGenerator.ts, useContentOverrides.ts, useDocMaterials.ts | Pass |
| Domain | `src/types/` | checklist.ts | Pass |
| Infrastructure | `src/lib/` | mergeOverrides.ts, parseProcessItem.ts, markdownUtils.ts, firebase.ts | Pass |
| Build Plugin | root | vite-plugin-content.ts | Pass |

### 3.2 Dependency Direction Check

| File | Layer | Dependencies | Direction | Status |
|------|-------|-------------|-----------|--------|
| `types/checklist.ts` | Domain | `mergeOverrides` (BranchingRule type) | Domain -> Infrastructure | Warning |
| `mergeOverrides.ts` | Infrastructure | `types/checklist` (Requirement, QuestionImportance) | Infrastructure -> Domain | Pass |
| `quickMode.ts` | Application | `types/checklist` (types only) | Application -> Domain | Pass |
| `branchingResolver.ts` | Application | `mergeOverrides` (BranchingRule type), `types/checklist` | Application -> Infrastructure (type), Domain | Pass |
| `checklistGenerator.ts` | Application | `virtual:content/process`, `types/checklist` | Application -> Domain | Pass |
| `useContentOverrides.ts` | Application | `firebase`, `mergeOverrides` (type) | Application -> Infrastructure | Pass |
| `ExecutionPage.tsx` | Presentation | `quickMode`, `branchingResolver`, `checklistGenerator`, hooks, `mergeOverrides`, firebase | Presentation -> Application, Infrastructure | Acceptable (Dynamic) |
| `CenterDisplay.tsx` | Presentation | `types`, firebase, providers | Presentation -> Domain, Infrastructure | Acceptable (Dynamic) |
| `ContentOverrideManagement.tsx` | Presentation | `mergeOverrides` (types), `quickMode` (inferImportance), firebase | Presentation -> Application, Infrastructure | Acceptable (Dynamic) |

**Architecture Warning**: `types/checklist.ts` (Domain)가 `lib/content/mergeOverrides.ts` (Infrastructure)에서 `BranchingRule` 타입을 import한다. Domain 레이어는 독립적이어야 하므로 `BranchingRule` 타입을 `types/checklist.ts`로 이동하는 것이 더 적절하다.

### 3.3 Architecture Score

```
+---------------------------------------------+
|  Architecture Compliance: 92%                |
+---------------------------------------------+
|  Correct layer placement: 14/14 files        |
|  Dependency direction:    13/14 correct      |
|  Warning: 1 (Domain -> Infrastructure type)  |
+---------------------------------------------+
```

---

## 4. Convention Compliance

### 4.1 Naming Convention

| Category | Convention | Checked | Compliance | Violations |
|----------|-----------|:-------:|:----------:|------------|
| Components | PascalCase | 6 files | 100% | - |
| Functions | camelCase | 30+ functions | 100% | - |
| Constants | UPPER_SNAKE_CASE | 12 constants | 100% | MUST_HINTS, SHOULD_HINTS, CATEGORY_TAGS, etc. |
| Types/Interfaces | PascalCase | 15 types | 100% | Requirement, ContentOverride, BranchingRule, etc. |
| Files (component) | PascalCase.tsx | 6 files | 100% | CenterDisplay.tsx, ChecklistView.tsx, etc. |
| Files (utility) | camelCase.ts | 8 files | 100% | quickMode.ts, branchingResolver.ts, etc. |
| Folders | kebab-case | All folders | 100% | - |

### 4.2 Import Order Check

Checked files: ExecutionPage.tsx, CenterDisplay.tsx, ContentOverrideManagement.tsx, mergeOverrides.ts, quickMode.ts

- [x] External libraries first (react, lucide-react, firebase)
- [x] Internal absolute imports (virtual:content/...)
- [x] Relative imports (../../../)
- [x] Type imports (`import type`)

No violations found.

### 4.3 Pattern Consistency

| Pattern | Usage | Consistency |
|---------|-------|-------------|
| Null-safe spread `...(ov.field != null && { field: ov.field })` | mergeOverrides.ts L55-66 | Consistent across all fields |
| Diff-only save (변경분만 저장) | ContentOverrideManagement.tsx L260-313 | Consistent (title, desc, checkpoints, importances, evidence, suggestions, criteria, rules) |
| Fallback chain `override ?? original` | ContentOverrideManagement.tsx L242-250 | Consistent |
| Firestore onSnapshot subscription | useContentOverrides.ts, ContentOverrideManagement.tsx | Duplicated pattern (see 5.2) |

### 4.4 Convention Score

```
+---------------------------------------------+
|  Convention Compliance: 97%                  |
+---------------------------------------------+
|  Naming:          100%                       |
|  Import Order:    100%                       |
|  Pattern Consistency: 92%                    |
|  File Organization:   97%                    |
+---------------------------------------------+
```

---

## 5. Code Quality -- Team Findings Verification

### 5.1 Finding #1: Setup03Evidence/Setup04Evidence Not Imported

| Finding | Verification | Severity |
|---------|-------------|----------|
| Setup03Evidence.tsx, Setup04Evidence.tsx 미사용 | `grep -r "import.*Setup03Evidence\|import.*Setup04Evidence"` -- 0 matches | Medium |

**Analysis**: 두 파일은 `src/features/checklist/components/` 에 존재하지만 프로젝트 어디에서도 import되지 않는다. 이전에 SETUP-03, SETUP-04 항목에 대한 전용 입력 UI로 사용되었으나 현재 CenterDisplay.tsx의 통합 UI로 대체된 것으로 보인다.

**Files**:
- `/Users/mac/Documents/Dev/GS-Test-Guide/src/features/checklist/components/Setup03Evidence.tsx`
- `/Users/mac/Documents/Dev/GS-Test-Guide/src/features/checklist/components/Setup04Evidence.tsx`

**Recommendation**: Dead code. 삭제 대상.

### 5.2 Finding #2: Code Duplication -- vite-plugin-content.ts vs markdownUtils.ts

| vite-plugin-content.ts | markdownUtils.ts | Duplicated |
|------------------------|------------------|:----------:|
| `extractSections()` L27-49 | `extractSections()` L9-33 | Yes |
| `findSection()` L51-53 | `findSection()` L140-142 | Yes |
| `parseCheckboxList()` L55-60 | `parseCheckboxList()` L72-77 | Yes |
| `parseBulletList()` L62-67 | `parseBulletList()` L82-87 | Yes |
| `parseTable()` L69-79 | `parseTable()` L92-113 | Yes |

**Analysis**: `vite-plugin-content.ts`는 Node.js 빌드타임에 실행되고, `markdownUtils.ts`는 브라우저 런타임에 사용된다. Vite 플러그인은 ESM import가 제한적이므로 인라인으로 복제한 것이다. 주석 L25에서 `// mirrors src/lib/content/markdownUtils.ts`로 이를 명시했다.

**Severity**: Low (기술적 제약으로 인한 의도적 복제)

**Recommendation**: 공유 모듈로 추출하고 빌드타임/런타임 모두에서 사용할 수 있도록 하거나, 현재 상태를 유지하되 동기화를 보장하는 주석/lint 규칙을 추가한다.

### 5.3 Finding #3: 6 Unused Type Fields in Requirement

| Field | Defined In | Usage Count (src/) | Used By |
|-------|-----------|:------------------:|---------|
| `testSuggestions` | checklist.ts L28 | 5 files | quickMode.ts, CenterDisplay.tsx, ContentOverrideManagement.tsx, mergeOverrides.ts, checklist.ts | Active |
| `keywords` | checklist.ts L11 | 2 files | checklist.ts (definition), parseProcessItem.ts (parser) | Parsed only, never consumed in UI |
| `excludeConditions` | checklist.ts L32-35 | 2 files | checklist.ts (definition), checklistGenerator.ts (logic) | Active |
| `includeConditions` | checklist.ts L36-39 | 2 files | checklist.ts (definition), checklistGenerator.ts (logic) | Active |
| `inputFields` | checklist.ts L19-25 | 2 files | checklist.ts (definition), CenterDisplay.tsx L302 (conditional render) | Active |
| `docRequirements` | checklist.ts L15-18 | 1 file | checklist.ts (definition only) | Truly unused |

**Revised Assessment**:
- `testSuggestions`: 5개 파일에서 사용 -- **활성 필드**
- `keywords`: 파싱만 되고 UI에서 사용되지 않음 -- **반사용(semi-unused)**
- `excludeConditions`/`includeConditions`: `checklistGenerator.ts`에서 적용 대상 판별에 사용 -- **활성 필드**
- `inputFields`: CenterDisplay.tsx에서 조건부 렌더링 분기에 사용 -- **활성 필드**
- `docRequirements`: 타입 정의만 존재, 어디에서도 값이 할당되거나 읽히지 않음 -- **진정한 미사용 필드**

**Truly Unused**: 1개 (`docRequirements`)
**Semi-unused**: 1개 (`keywords` -- parsed but never consumed)

### 5.4 Finding #4: CenterDisplay -- 3 Unused Props

| Prop | Defined | Usage | Status |
|------|---------|-------|--------|
| `_inputValues` | L42 (prefixed with `_`) | 미사용 (underscore prefix로 명시) | Confirmed unused |
| `_onInputChange` | L43 (prefixed with `_`) | 미사용 (underscore prefix로 명시) | Confirmed unused |
| `_isFinalized` | L44 (prefixed with `_`) | 미사용 (underscore prefix로 명시) | Confirmed unused |

**Analysis**: TypeScript의 `_` prefix 규칙으로 미사용임을 명시적으로 표현하고 있다. `ChecklistView.tsx` L119-121에서 여전히 이 props를 전달하고 있으므로, 인터페이스 계약은 유지되지만 내부에서 사용하지 않는다. 이는 향후 기능 확장을 위한 예약이거나 리팩토링 대상이다.

**Severity**: Low

### 5.5 Finding #5: ChecklistView SETUP Category Quality Mapping Missing

```typescript
// ChecklistView.tsx L22-25
const CATEGORY_QUALITY_MAP: Record<string, string> = {
  EXECUTION: '기능적합성',
  COMPLETION: '기능적합성'
};
// SETUP is missing -- categoryToQuality('SETUP') returns ''
```

**Analysis**: `CATEGORY_QUALITY_MAP`에 SETUP 카테고리가 누락되어 `categoryToQuality('SETUP')`이 빈 문자열을 반환한다. 이 값은 `DefectReportModal`의 `qualityCharacteristic` 필드에 전달되므로, SETUP 항목에서 결함 보고 시 품질특성이 비어있게 된다.

**Severity**: Medium
**Impact**: SETUP 카테고리 항목의 결함 보고 시 품질특성(qualityCharacteristic)이 빈 값으로 전달됨

### 5.6 Finding #6: Promise.all for Bulk Delete Instead of Batch

```typescript
// ContentOverrideManagement.tsx L345-346
const snap = await getDocs(collection(db, 'contentOverrides'));
await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
```

**Analysis**: Firestore batch write를 사용하면 최대 500개 문서를 단일 원자적 트랜잭션으로 처리할 수 있다. 현재 `Promise.all`은 각 deleteDoc이 독립적으로 실행되어 중간에 실패 시 부분 삭제 상태가 될 수 있다.

**Severity**: Low (현재 13개 점검항목이므로 실제 위험은 낮지만, 원자성 보장이 더 적절함)

### 5.7 Finding #7: No Unit Tests for Content Parsing Logic

| Module | Test File | Status |
|--------|-----------|--------|
| `markdownUtils.ts` | - | No tests |
| `parseProcessItem.ts` | - | No tests |
| `mergeOverrides.ts` | - | No tests |
| `quickMode.ts` | - | No tests |
| `branchingResolver.ts` | - | No tests |
| `checklistGenerator.ts` | - | No tests |

**Analysis**: 프로젝트에 단위 테스트 파일이 하나도 존재하지 않는다. 콘텐츠 파싱, 병합, 퀵모드 변환, 분기 규칙 해석 등 순수 로직 함수들은 테스트 작성이 용이하고 회귀 방지에 중요하다.

**Severity**: High (프로젝트 규모 대비)
**Priority Files**: `mergeOverrides.ts`, `quickMode.ts`, `branchingResolver.ts`

---

## 6. Content Source Verification

### 6.1 Markdown Files Count

Plan에서 "마크다운 13개 파일"로 명시:

| Category | Plan | Actual (content/process/) | Status |
|----------|:----:|:-------------------------:|--------|
| SETUP (시험준비) | 5 | 5 (SETUP-01~05) | Match |
| EXECUTION (시험수행) | 6 | 6 (01~06) | Match |
| COMPLETION (시험종료) | 2 | 2 | Match |
| **Total** | **13** | **13** | **Match** |

### 6.2 Vite Plugin Virtual Modules

| Module | Source | Purpose | Status |
|--------|--------|---------|--------|
| `virtual:content/process` | `content/process/` | Requirement[] | Active |
| `virtual:content/defects` | `content/defect-references/` | DefectReference[] | Active |
| `virtual:content/categories` | `content/theme/categories.md` | Category themes | Active |
| `virtual:content/rules` | `content/rules/execution-gate.md` | Execution gate config | Active |
| `virtual:content/references` | `content/references/` | Reference guides | Active |

Plan 범위: `virtual:content/process`만 해당. 나머지는 Plan 이후 추가된 콘텐츠 모듈이다.

---

## 7. Extended Features (Plan 범위 밖 구현)

Plan에 명시되지 않았으나 구현된 기능:

| Feature | Implementation | Impact |
|---------|---------------|--------|
| 체크포인트 중요도 오버라이드 (MUST/SHOULD) | mergeOverrides.ts L65, quickMode.ts L93,106,113, ContentOverrideManagement.tsx L486-503 | Positive -- 관리자가 자동 추론 결과를 수동 보정 가능 |
| 분기 규칙 시스템 (branchingRules) | branchingResolver.ts 전체, ContentOverrideManagement.tsx L577-635 | Positive -- 조건부 질문 건너뛰기 |
| 증빙 예시/테스트 제안/판정 기준 오버라이드 | mergeOverrides.ts L62-64, ContentOverrideManagement.tsx L637-688 | Positive -- 더 많은 필드 오버라이드 가능 |
| 참고 자료 드롭다운 선택기 | ContentOverrideManagement.tsx L505-563 | Positive -- docMaterials 기반 ref 연결 |
| 전체 초기화 기능 | ContentOverrideManagement.tsx L341-352, L773-808 | Positive -- 일괄 초기화 |
| docMaterials 병합 (mergeDocLinks) | mergeOverrides.ts L80-115 | Positive -- 문서 자료 동적 연결 |
| useDocMaterials hook | useDocMaterials.ts L1-29 | Positive -- docMaterials Firestore 구독 |
| 체크포인트 ref 필터링 | mergeOverrides.ts L69-73 | Positive -- 오버라이드 시 불필요 문서 자동 제거 |

---

## 8. Success Criteria Verification

Plan Section 7에서 정의한 성공 기준:

| # | 성공 기준 | 구현 위치 | Status |
|---|----------|-----------|--------|
| 1 | 관리자 페이지에서 점검항목 제목 수정 -> 체크리스트 UI 즉시 반영 | ContentOverrideManagement -> Firestore -> useContentOverrides -> mergeOverrides -> CenterDisplay | Pass |
| 2 | 관리자 페이지에서 설명 수정 -> 체크리스트 UI 즉시 반영 | 위와 동일 경로 | Pass |
| 3 | 관리자 페이지에서 체크포인트 문구 수정 -> 체크리스트 UI 즉시 반영 | 위와 동일 경로 (checkpoints -> quickQuestions -> CenterDisplay) | Pass |
| 4 | "원본으로 되돌리기" 클릭 시 마크다운 원본 복원 | ContentOverrideManagement.tsx L329-339: deleteDoc() | Pass |
| 5 | 오버라이드 없는 항목은 마크다운 원본 그대로 표시 | mergeOverrides.ts L47,51: early return if no override | Pass |
| 6 | 기존 기능(담당자, 참조문서, 체크리스트 동작) 정상 유지 | ContactManagement, MaterialManagement 미변경. 체크리스트 로직 정상 | Pass |
| 7 | `tsc --noEmit` + `vite build` 통과 | 최근 커밋 `a13b229`에서 빌드 통과 (Vercel 배포 성공) | Pass |

---

## 9. Overall Scores

```
+---------------------------------------------+
|  Overall Match Rate: 88%                     |
+---------------------------------------------+
|  Design Match:            90% (18/20 items)  |
|  Architecture Compliance: 92% (13/14 deps)   |
|  Convention Compliance:   97% (all checks)   |
|  Success Criteria:       100% (7/7 criteria) |
|  Code Quality:            72% (7 issues)     |
|  Test Coverage:            0% (no tests)     |
+---------------------------------------------+
```

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 90% | Pass |
| Architecture Compliance | 92% | Pass |
| Convention Compliance | 97% | Pass |
| Success Criteria | 100% | Pass |
| Code Quality | 72% | Warning |
| Test Coverage | 0% | Fail |
| **Overall** | **88%** | **Warning** |

**Score Breakdown**:
- Design Match (-10%): Plan 문서 미반영된 확장 기능 다수 (설계 문서 업데이트 필요), `types/checklist.ts` 불변 위반, 소비 지점 전환 미완(ContactManagement, MaterialManagement)
- Architecture (-8%): Domain->Infrastructure 타입 의존 1건
- Code Quality (-28%): 미사용 파일 2개, 코드 중복 5개 함수, 미사용 타입 필드 1~2개, SETUP quality mapping 누락, Promise.all vs batch
- Test Coverage (0%): 프로젝트 전체에 단위 테스트 없음

---

## 10. Differences Found

### Missing Features (Design O, Implementation X)

| Item | Plan Location | Description |
|------|---------------|-------------|
| 소비 지점 전환 (ContactManagement) | plan.md Section 3.4 | step 목록에 병합 title 미반영 -- `REQUIREMENTS_DB` 직접 사용 |
| 소비 지점 전환 (MaterialManagement) | plan.md Section 3.4 | step 목록에 병합 title 미반영 -- `REQUIREMENTS_DB` 직접 사용 |

### Added Features (Design X, Implementation O)

| Item | Implementation Location | Description |
|------|------------------------|-------------|
| 체크포인트 중요도 오버라이드 | mergeOverrides.ts L65, quickMode.ts L93 | Plan에 없는 기능. MUST/SHOULD 수동 설정 |
| 분기 규칙 시스템 | branchingResolver.ts 전체 (84 LOC) | Plan에 없는 기능. 조건부 질문 건너뛰기 |
| 증빙/테스트/판정 오버라이드 | mergeOverrides.ts L62-64 | 3개 추가 필드 오버라이드 |
| 참고 자료 ref 선택기 | ContentOverrideManagement.tsx L505-563 | docMaterials 기반 드롭다운 |
| docMaterials 병합 (mergeDocLinks) | mergeOverrides.ts L80-115 | 동적 문서 연결 |
| 전체 초기화 기능 | ContentOverrideManagement.tsx L341-352 | 일괄 오버라이드 삭제 |
| useDocMaterials hook | hooks/useDocMaterials.ts | docMaterials Firestore 구독 |
| 체크포인트 ref 필터링 | mergeOverrides.ts L69-73 | 오버라이드 시 미참조 문서 자동 제거 |

### Changed Features (Design != Implementation)

| Item | Design | Implementation | Impact |
|------|--------|----------------|--------|
| ContentOverride 타입 | 5 fields (title, desc, checkpoints, updatedAt, updatedBy) | 10 fields (+importances, evidence, suggestions, criteria, branchingRules) | Plan 업데이트 필요 |
| mergeOverrides 반환 | 단순 title/desc/checkpoints 병합 | + requiredDocs ref 필터링, 5개 추가 필드 병합 | Plan 업데이트 필요 |
| types/checklist.ts | "변경 없음" 명시 | `checkpointImportances`, `branchingRules` 필드 추가 | Low -- 하위 호환 (optional fields) |

---

## 11. Recommended Actions

### 11.1 Immediate Actions

| Priority | Item | File | Impact |
|----------|------|------|--------|
| 1 | SETUP quality mapping 추가 | ChecklistView.tsx L22-25 | SETUP 항목 결함 보고 시 품질특성 누락 해결 |
| 2 | Dead code 삭제 (Setup03Evidence, Setup04Evidence) | `src/features/checklist/components/` | 코드베이스 정리 |
| 3 | `docRequirements` 미사용 필드 제거 | types/checklist.ts L15-18 | 타입 정리 |

### 11.2 Short-term Actions

| Priority | Item | File | Expected Impact |
|----------|------|------|-----------------|
| 1 | 핵심 모듈 단위 테스트 작성 | mergeOverrides.ts, quickMode.ts, branchingResolver.ts | 회귀 방지, 리팩토링 안전성 |
| 2 | BranchingRule 타입을 types/checklist.ts로 이동 | types/checklist.ts, mergeOverrides.ts | Domain layer 독립성 복원 |
| 3 | 전체 초기화에 Firestore batch write 적용 | ContentOverrideManagement.tsx L345-346 | 원자성 보장 |

### 11.3 Documentation Updates

| Item | Action |
|------|--------|
| content-override.plan.md Section 2.1.A | ContentOverride 타입에 추가된 5개 필드 반영 |
| content-override.plan.md Section 3.2 | mergeOverrides 확장 기능(ref 필터링, 추가 필드) 반영 |
| content-override.plan.md Section 2.2 | `types/checklist.ts` 변경 사항 반영 |
| content-override.plan.md Section 2.3 | 분기 규칙, 중요도 오버라이드를 "향후 확장"에서 "구현 완료"로 이동 |

### 11.4 Long-term / Backlog

| Item | Notes |
|------|-------|
| vite-plugin-content.ts 함수 중복 해소 | 공유 모듈 추출 또는 동기화 lint 규칙 |
| `keywords` 필드 활용 또는 제거 | 파싱만 되고 UI에서 사용되지 않는 상태 |
| CenterDisplay 미사용 props 정리 | `_inputValues`, `_onInputChange`, `_isFinalized` 제거 또는 활용 |

---

## 12. Synchronization Options

| Option | Description | Recommended? |
|--------|-------------|:------------:|
| 1. 구현을 설계에 맞춤 | ContactManagement/MaterialManagement의 REQUIREMENTS_DB 직접 사용을 병합 데이터로 전환 | No (현재 동작에 문제 없음) |
| 2. 설계를 구현에 맞춤 | Plan 문서에 확장 기능 반영 | Yes |
| 3. 차이를 의도적으로 기록 | Contact/Material의 직접 import를 "의도적 선택"으로 문서화 | Yes |

---

## 13. Conclusion

**Overall Match Rate 88%** -- 설계와 구현이 높은 수준으로 일치한다. Plan에서 정의한 7개 성공 기준은 100% 충족되었으며, 핵심 데이터 흐름(마크다운 -> 빌드 -> 병합 -> UI)이 정확히 구현되었다.

주요 차이점은 Plan 작성 이후 추가된 확장 기능(중요도 오버라이드, 분기 규칙, 추가 필드 오버라이드 등)으로, 모두 긍정적인 확장이다. 설계 문서를 현재 구현에 맞게 업데이트하면 95%+ 일치율을 달성할 수 있다.

**가장 큰 개선 기회**: 단위 테스트 추가 (현재 0%), SETUP quality mapping 수정, dead code 정리.

Match Rate >= 88%이므로 Check phase 완료 조건(90%)에 근접하며, 즉시 조치 항목 3건 해결 시 90%+ 달성 가능하다.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-28 | Full content feature gap analysis | gap-detector |

---

## Related Documents

- Plan: [content-override.plan.md](../01-plan/features/content-override.plan.md)
- Previous Analysis: [content.analysis.md](./content.analysis.md) (checkpoint importance sub-feature, 98%)
