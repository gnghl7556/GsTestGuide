# admin-data-sync Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: GS Test Guide
> **Analyst**: Claude (gap-detector)
> **Date**: 2026-02-28
> **Design Doc**: [admin-data-sync.design.md](../02-design/features/admin-data-sync.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the implementation of `admin-data-sync` (label rename with Storage file move, merge-safe edits, and file path metadata tracking) matches the finalized design document across all three functional requirements (FR-01, FR-02, FR-03).

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/admin-data-sync.design.md`
- **Implementation File**: `src/features/admin/components/MaterialManagement.tsx`
- **Analysis Date**: 2026-02-28

---

## 2. Overall Score

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **100%** | **PASS** |

```
Match Rate: 100%
Total Checkpoints: 10
Passed: 10
Failed: 0
Gaps: 0
```

---

## 3. Checkpoint Table

### FR-01: Label Change Triggers Storage File Move

| # | Design Requirement | Design Location | Implementation Location | Status |
|---|-------------------|-----------------|------------------------|--------|
| 1 | `moveStorageFolder` function exists with copy-then-delete pattern | design.md lines 20-40 | MaterialManagement.tsx lines 113-133 | PASS |
| 2 | Iterates `['checklist-previews', 'sample-downloads']` folders | design.md line 24 | MaterialManagement.tsx line 116 | PASS |
| 3 | Uses `getBytes` to download, `uploadBytes` to copy, `deleteObject` to remove | design.md lines 31-37 | MaterialManagement.tsx lines 123-126 | PASS |
| 4 | Copy completes before delete (safety guarantee) | design.md line 121 | MaterialManagement.tsx lines 123-126 (sequential await) | PASS |
| 5 | `handleEditSave` calls `moveStorageFolder` when label changes | design.md line 75 | MaterialManagement.tsx line 184 | PASS |
| 6 | Old Firestore doc deleted, new doc created with `previewPaths`/`samplePaths` from moved paths | design.md lines 77-85 | MaterialManagement.tsx lines 186-196 | PASS |
| 7 | `fileState` cache updated (old label removed, new label added with `loaded: false`) | design.md lines 87-94 | MaterialManagement.tsx lines 198-205 | PASS |
| 8 | `moveStorageFolder` returns `{ previewPaths: string[]; samplePaths: string[] }` | design.md lines 203-211 | MaterialManagement.tsx lines 114, 128-132 | PASS |

### FR-02: Merge-Safe Update When Label Unchanged

| # | Design Requirement | Design Location | Implementation Location | Status |
|---|-------------------|-----------------|------------------------|--------|
| 9 | `handleEditSave` uses `{ merge: true }` in else branch (label unchanged) | design.md lines 96-103 | MaterialManagement.tsx lines 206-214 | PASS |

### FR-03: File Path Metadata Tracking

| # | Design Requirement | Design Location | Implementation Location | Status |
|---|-------------------|-----------------|------------------------|--------|
| 10 | `handleFileUpload` saves path via `arrayUnion` | design.md lines 154-173 | MaterialManagement.tsx lines 280-299 | PASS |
| 11 | `handleFileDelete` removes path via `arrayRemove` | design.md lines 178-194 | MaterialManagement.tsx lines 301-317 | PASS |

### Type & Import Requirements

| # | Design Requirement | Design Location | Implementation Location | Status |
|---|-------------------|-----------------|------------------------|--------|
| 12 | `DocMaterial` type has `previewPaths?: string[]` and `samplePaths?: string[]` | design.md lines 219-228 | MaterialManagement.tsx lines 21-22 | PASS |
| 13 | `getBytes` imported from `firebase/storage` | design.md line 43 | MaterialManagement.tsx line 6 | PASS |
| 14 | `arrayUnion`, `arrayRemove` imported from `firebase/firestore` | design.md line 197 | MaterialManagement.tsx line 5 | PASS |

---

## 4. Detailed Verification

### 4.1 moveStorageFolder -- Copy-Then-Delete Safety

**Design** (Section 2.3):

| Step | On Failure | Result |
|------|-----------|--------|
| File copy | Abort | Original preserved, partial new files (retry safe) |
| Original delete | Abort | Both copies exist (data safe) |
| Firestore doc delete | Abort | Previous doc preserved (consistency maintained) |

**Implementation** (lines 122-126):
```typescript
const bytes = await getBytes(item);            // Step 1: download
const newPath = `${folder}/${newLabel}/${item.name}`;
await uploadBytes(ref(storage, newPath), bytes); // Step 2: copy
await deleteObject(item);                       // Step 3: delete (only after copy)
```

Each `await` enforces sequential execution. If `uploadBytes` throws, `deleteObject` never runs -- original file is preserved. Verified: PASS.

### 4.2 handleEditSave -- Label Change Branch

**Design** (Section 2.2, lines 73-94):
1. `moveStorageFolder(oldLabel, newLabel)` -- move files
2. `deleteDoc(...)` -- remove old Firestore doc
3. `setDoc(...)` -- create new doc with metadata including `movedPaths`
4. `setFileState(...)` -- update cache

**Implementation** (lines 182-205):
```typescript
if (newLabel !== oldLabel) {
  const movedPaths = await moveStorageFolder(oldLabel, newLabel);     // Step 1
  await deleteDoc(doc(db, 'docMaterials', docId(oldLabel)));          // Step 2
  await setDoc(doc(db, 'docMaterials', docId(newLabel)), {            // Step 3
    label: newLabel,
    kind: snapshot.kind,
    description: snapshot.description.trim(),
    linkedSteps: snapshot.linkedSteps,
    previewPaths: movedPaths.previewPaths,
    samplePaths: movedPaths.samplePaths,
    updatedAt: serverTimestamp(),
  });
  setFileState((prev) => {                                            // Step 4
    const next = { ...prev };
    if (next[oldLabel]) {
      next[newLabel] = { ...next[oldLabel], loaded: false };
      delete next[oldLabel];
    }
    return next;
  });
}
```

Line-for-line match with design. Verified: PASS.

### 4.3 handleEditSave -- No Label Change Branch

**Design** (Section 3, lines 96-103): Uses `{ merge: true }` to safely update without overwriting file metadata.

**Implementation** (lines 206-214):
```typescript
} else {
  await setDoc(doc(db, 'docMaterials', docId(newLabel)), {
    label: newLabel,
    kind: snapshot.kind,
    description: snapshot.description.trim(),
    linkedSteps: snapshot.linkedSteps,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
```

`{ merge: true }` ensures existing `previewPaths`/`samplePaths` fields are not overwritten. Verified: PASS.

### 4.4 handleFileUpload -- arrayUnion Metadata

**Design** (Section 4.2, lines 154-173):
```typescript
const fieldKey = type === 'preview' ? 'previewPaths' : 'samplePaths';
await setDoc(docRef, { [fieldKey]: arrayUnion(path), updatedAt: serverTimestamp() }, { merge: true });
```

**Implementation** (lines 288-293): Identical logic. Verified: PASS.

### 4.5 handleFileDelete -- arrayRemove Metadata

**Design** (Section 4.2, lines 178-194):
```typescript
const isPreview = fullPath.startsWith('checklist-previews/');
const fieldKey = isPreview ? 'previewPaths' : 'samplePaths';
await setDoc(docRef, { [fieldKey]: arrayRemove(fullPath), updatedAt: serverTimestamp() }, { merge: true });
```

**Implementation** (lines 306-312): Identical logic. Verified: PASS.

---

## 5. Gap List

No gaps found. All 14 checkpoints pass.

### Missing Features (Design exists, Implementation missing)

None.

### Added Features (Implementation exists, Design missing)

None.

### Changed Features (Design differs from Implementation)

None.

---

## 6. Implementation Order Verification

Design Section 6 specifies 8 implementation steps. All are present in the final code:

| # | Step | Status |
|---|------|--------|
| 1 | `getBytes` import added | PASS (line 6) |
| 2 | `moveStorageFolder` function added | PASS (lines 113-133) |
| 3 | `handleEditSave` modified (FR-01 + FR-02) | PASS (lines 173-221) |
| 4 | `DocMaterial` type extended with `previewPaths`, `samplePaths` | PASS (lines 21-22) |
| 5 | `arrayUnion`, `arrayRemove` imports added | PASS (line 5) |
| 6 | `handleFileUpload` modified (FR-03) | PASS (lines 280-299) |
| 7 | `handleFileDelete` modified (FR-03) | PASS (lines 301-317) |
| 8 | `moveStorageFolder` returns new paths + Firestore records them | PASS (lines 114, 128-132, 193-194) |

---

## 7. Summary

The implementation in `src/features/admin/components/MaterialManagement.tsx` is a 100% match against the design document `docs/02-design/features/admin-data-sync.design.md`. All three functional requirements (FR-01, FR-02, FR-03), all import additions, the type extension, and the safety guarantees specified in the design are faithfully implemented. No gaps, no missing features, no deviations.

| Metric | Value |
|--------|-------|
| Match Rate | 100% |
| Checkpoints Passed | 14 / 14 |
| Gaps Found | 0 |
| Recommended Actions | None |

---

## Related Documents

- Plan: [admin-data-sync.plan.md](../01-plan/features/admin-data-sync.plan.md)
- Design: [admin-data-sync.design.md](../02-design/features/admin-data-sync.design.md)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-28 | Initial gap analysis -- 100% match | Claude (gap-detector) |
