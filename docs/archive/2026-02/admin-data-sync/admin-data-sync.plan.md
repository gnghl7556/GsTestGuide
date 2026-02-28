# Admin Data Sync — 관리자 페이지 자료/컨텐츠/담당자 동기화 수정

> **Feature**: admin-data-sync
> **Project**: GS Test Guide
> **Date**: 2026-02-28
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

관리자 페이지에서 자료(DocMaterial) 이름 변경 시 업로드된 파일이 사라지는 버그를 수정하고, 컨텐츠/담당자 데이터의 동기화 안정성을 개선한다.

### 1.2 Background

- 관리자가 자료 라벨을 변경하면, Firebase Storage의 파일은 이전 라벨 폴더에 남아있으나 앱은 새 라벨 폴더에서 파일을 찾으므로 파일이 사라진 것처럼 보임
- `handleEditSave`가 `setDoc()` 전체 덮어쓰기를 사용하여 기존 필드가 유실됨
- Storage 파일 경로가 Firestore에 메타데이터로 저장되지 않아, 라벨 기반 폴더 조회에 전적으로 의존

---

## 2. Root Cause Analysis

### 2.1 핵심 버그: 라벨 변경 시 파일 유실

**파일**: `src/features/admin/components/MaterialManagement.tsx` (lines 148-170)

```
[현재 동작]
1. 관리자가 자료 라벨 "시험 합의서" → "시험합의서" 변경
2. handleEditSave 실행:
   - deleteDoc('docMaterials/시험-합의서')  ← 이전 문서 삭제
   - setDoc('docMaterials/시험합의서', { label, kind, description, linkedSteps })
     ← 새 문서 생성 (파일 경로 정보 없음)
3. Storage 파일 위치: checklist-previews/시험 합의서/ ← 그대로 남아있음
4. 앱이 checklist-previews/시험합의서/ 에서 파일 조회 → 폴더 없음 → 파일 사라짐
```

### 2.2 근본 원인 3가지

| # | 원인 | 위치 | 영향 |
|---|------|------|------|
| 1 | **Storage 파일 미이동**: 라벨 변경 시 Storage 폴더명이 갱신되지 않음 | MaterialManagement.tsx `handleEditSave` | 파일 유실 |
| 2 | **setDoc 전체 덮어쓰기**: `merge: true` 미사용으로 기존 필드 유실 가능 | MaterialManagement.tsx `handleEditSave` | 데이터 유실 |
| 3 | **파일 경로 메타데이터 미저장**: Firestore에 storagePath 없이 라벨 기반 폴더 조회에만 의존 | MaterialManagement.tsx `handleFileUpload` | 취약한 구조 |

### 2.3 대조: 정상 동작하는 패턴

- `handleDelete`는 `setDoc(..., { merge: true })`를 사용하여 기존 필드를 보존함 ✅
- 프로젝트 파일 업로드(`agreements/`, `defects/`)는 경로 메타데이터를 Firestore에 저장 ✅

---

## 3. Scope

### 3.1 In Scope

| ID | Requirement | Priority | 설명 |
|----|-------------|----------|------|
| FR-01 | 라벨 변경 시 Storage 파일 이동 | **Critical** | 이전 라벨 폴더 → 새 라벨 폴더로 파일 복사 후 원본 삭제 |
| FR-02 | handleEditSave merge 방식 적용 | **High** | 라벨 미변경 시 `updateDoc` 또는 `setDoc merge:true` 사용 |
| FR-03 | 파일 경로 메타데이터 Firestore 저장 | **Medium** | 업로드 시 `previewPath`, `samplePath` 필드를 docMaterials에 기록 |

### 3.2 Out of Scope

- ContentOverrideManagement 구조 변경 (현재 정상 동작)
- ContactManagement 구조 변경 (현재 정상 동작)
- Storage 마이그레이션 스크립트 (기존 데이터 일괄 변환)

---

## 4. Solution Design

### 4.1 FR-01: Storage 파일 이동

```
handleEditSave 수정:
1. newLabel !== oldLabel 인 경우:
   a. checklist-previews/{oldLabel}/ 의 모든 파일을 listAll()로 조회
   b. 각 파일을 checklist-previews/{newLabel}/ 으로 복사 (getBytes → uploadBytes)
   c. sample-downloads/{oldLabel}/ 도 동일하게 처리
   d. 원본 파일 삭제 (deleteObject)
   e. 이전 Firestore 문서 삭제
   f. 새 Firestore 문서 생성 (메타데이터 포함)
```

### 4.2 FR-02: Merge 방식 적용

```
라벨 변경 없는 경우:
  - setDoc(docRef, updates, { merge: true })
  - 또는 updateDoc(docRef, updates)

라벨 변경 있는 경우:
  - 이전 문서의 전체 데이터를 먼저 getDoc으로 읽기
  - 파일 이동 완료 후 새 문서 생성 시 기존 필드 병합
```

### 4.3 FR-03: 파일 경로 메타데이터 저장

```typescript
// 업로드 시 Firestore에 경로 기록
await setDoc(docRef, {
  previewFiles: ['checklist-previews/{label}/preview.png'],
  sampleFiles: ['sample-downloads/{label}/sample.pdf'],
}, { merge: true });
```

---

## 5. Affected Files

| File | 변경 내용 |
|------|----------|
| `src/features/admin/components/MaterialManagement.tsx` | handleEditSave 수정, handleFileUpload에 메타데이터 저장 추가 |

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|:----------:|:------:|------------|
| Storage 파일 복사 중 실패 | Low | High | 복사 완료 확인 후에만 원본 삭제 |
| 대용량 파일 이동 시 시간 지연 | Low | Medium | 로딩 상태 표시, 비동기 처리 |
| 기존 orphaned 파일 | Medium | Low | 별도 정리 필요 시 관리자 도구 추가 가능 |

---

## 7. Success Criteria

- [x] 라벨 변경 후에도 업로드된 파일이 정상 표시
- [x] 라벨 미변경 시 기존 데이터 유실 없음
- [x] 새 업로드 시 Firestore에 파일 경로 메타데이터 기록
- [x] TypeScript 빌드 에러 없음

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-28 | Initial draft with root cause analysis | Claude |
