# Admin Data Sync — Design Document

> **Feature**: admin-data-sync
> **Plan Reference**: `docs/01-plan/features/admin-data-sync.plan.md`
> **Date**: 2026-02-28
> **Status**: Finalized

---

## 1. Target File

`src/features/admin/components/MaterialManagement.tsx` (1개 파일만 수정)

---

## 2. FR-01: 라벨 변경 시 Storage 파일 이동

### 2.1 신규 유틸 함수: `moveStorageFolder`

```typescript
/** Storage 폴더 내 파일을 새 경로로 복사 후 원본 삭제 */
const moveStorageFolder = async (oldLabel: string, newLabel: string) => {
  if (!storage) return;
  const folders = ['checklist-previews', 'sample-downloads'];

  for (const folder of folders) {
    const oldRef = ref(storage, `${folder}/${oldLabel}`);
    const result = await listAll(oldRef).catch(() => ({ items: [] as never[] }));

    for (const item of result.items) {
      // 1. 원본 파일 다운로드 (getBytes)
      const bytes = await getBytes(item);
      // 2. 새 경로에 업로드
      const newPath = `${folder}/${newLabel}/${item.name}`;
      await uploadBytes(ref(storage, newPath), bytes);
      // 3. 원본 삭제
      await deleteObject(item);
    }
  }
};
```

**Import 추가**: `getBytes` from `firebase/storage`

### 2.2 `handleEditSave` 수정

**현재 코드 (lines 148-170)**:
```typescript
// 현재: 라벨 변경 시 파일 유실
if (newLabel !== oldLabel) {
  await deleteDoc(doc(db, 'docMaterials', docId(oldLabel)));
}
await setDoc(doc(db, 'docMaterials', docId(newLabel)), {
  label: newLabel,
  kind: snapshot.kind,
  description: snapshot.description.trim(),
  linkedSteps: snapshot.linkedSteps,
  updatedAt: serverTimestamp(),
});
```

**수정 후**:
```typescript
const handleEditSave = async () => {
  if (!editingLabel || !db) return;
  const oldLabel = editingLabel;
  const newLabel = form.label.trim();
  if (!newLabel) return;
  const snapshot = { ...form };
  setBusy(true);

  try {
    if (newLabel !== oldLabel) {
      // 1. Storage 파일 이동 (복사 → 삭제)
      await moveStorageFolder(oldLabel, newLabel);
      // 2. 이전 Firestore 문서 삭제
      await deleteDoc(doc(db, 'docMaterials', docId(oldLabel)));
      // 3. 새 Firestore 문서 생성
      await setDoc(doc(db, 'docMaterials', docId(newLabel)), {
        label: newLabel,
        kind: snapshot.kind,
        description: snapshot.description.trim(),
        linkedSteps: snapshot.linkedSteps,
        updatedAt: serverTimestamp(),
      });
      // 4. fileState 캐시 갱신
      setFileState((prev) => {
        const next = { ...prev };
        if (next[oldLabel]) {
          next[newLabel] = { ...next[oldLabel], loaded: false };
          delete next[oldLabel];
        }
        return next;
      });
    } else {
      // 라벨 미변경: merge로 안전하게 업데이트
      await setDoc(doc(db, 'docMaterials', docId(newLabel)), {
        label: newLabel,
        kind: snapshot.kind,
        description: snapshot.description.trim(),
        linkedSteps: snapshot.linkedSteps,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  } finally {
    setBusy(false);
    setEditingLabel((cur) => (cur === oldLabel ? null : cur));
    setForm((cur) => (cur.label === newLabel ? emptyForm : cur));
  }
};
```

### 2.3 파일 이동 안전성

| 단계 | 실패 시 | 결과 |
|------|---------|------|
| 파일 복사 | 중단 | 원본 유지, 신규 일부 생성 (재시도 가능) |
| 원본 삭제 | 중단 | 양쪽 모두 존재 (데이터 안전) |
| Firestore 문서 삭제 | 중단 | 이전 문서 유지 (정합성 유지) |

원칙: **복사 완료 후에만 삭제** → 데이터 유실 불가

---

## 3. FR-02: handleEditSave merge 방식 적용

라벨 미변경 시 `setDoc(..., { merge: true })` 적용 (위 2.2 else 분기).

이미 `handleDelete`에서 사용 중인 패턴과 동일:
```typescript
// handleDelete (line 182) — 기존 정상 패턴
await setDoc(docRef, { label, hidden: true, updatedAt: serverTimestamp() }, { merge: true });
```

---

## 4. FR-03: 파일 경로 메타데이터 Firestore 저장 (선택)

> 우선순위 Medium — FR-01/02 적용만으로 버그 해결 가능. 구조적 개선 목적.

### 4.1 현재 흐름

```
업로드: handleFileUpload → uploadBytes(storage, path) → loadFilesForDoc(label)
표시: CenterDisplay → listAll(`checklist-previews/${label}`) → getDownloadURL
```

파일 경로가 Firestore에 기록되지 않음 → 라벨 기반 폴더 조회에 전적 의존.

### 4.2 개선: 업로드 시 메타데이터 기록

`handleFileUpload` 수정:
```typescript
const handleFileUpload = async (file: File, label: string, type: 'preview' | 'sample') => {
  if (!storage || !db) return;
  const folder = type === 'preview' ? 'checklist-previews' : 'sample-downloads';
  const path = `${folder}/${label}/${file.name}`;
  setUploading(`${label}-${type}`);
  try {
    await uploadBytes(ref(storage, path), file);
    // 메타데이터 기록
    const fieldKey = type === 'preview' ? 'previewPaths' : 'samplePaths';
    const docRef = doc(db, 'docMaterials', docId(label));
    await setDoc(docRef, {
      [fieldKey]: arrayUnion(path),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await loadFilesForDoc(label);
  } catch (e) {
    console.error('Upload failed:', e);
  }
  setUploading(null);
};
```

`handleFileDelete` 수정:
```typescript
const handleFileDelete = async (fullPath: string, label: string) => {
  if (!storage || !db) return;
  try {
    await deleteObject(ref(storage, fullPath));
    // 메타데이터에서 제거
    const isPreview = fullPath.startsWith('checklist-previews/');
    const fieldKey = isPreview ? 'previewPaths' : 'samplePaths';
    const docRef = doc(db, 'docMaterials', docId(label));
    await setDoc(docRef, {
      [fieldKey]: arrayRemove(fullPath),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await loadFilesForDoc(label);
  } catch (e) {
    console.error('Delete failed:', e);
  }
};
```

**Import 추가**: `arrayUnion`, `arrayRemove` from `firebase/firestore`

### 4.3 라벨 변경 시 메타데이터 갱신

`moveStorageFolder` 반환값으로 새 경로 목록을 받아 Firestore에 기록:
```typescript
// moveStorageFolder에서 새 경로 수집
const movedPaths: { previewPaths: string[]; samplePaths: string[] } = { ... };

// 새 Firestore 문서에 포함
await setDoc(doc(db, 'docMaterials', docId(newLabel)), {
  ...fields,
  previewPaths: movedPaths.previewPaths,
  samplePaths: movedPaths.samplePaths,
});
```

---

## 5. DocMaterial 타입 확장

```typescript
type DocMaterial = {
  label: string;
  kind: string;
  description: string;
  linkedSteps: string[];
  hidden?: boolean;
  previewPaths?: string[];   // ← 추가
  samplePaths?: string[];    // ← 추가
};
```

---

## 6. Implementation Order

1. `getBytes` import 추가
2. `moveStorageFolder` 함수 추가
3. `handleEditSave` 수정 (FR-01 + FR-02)
4. `DocMaterial` 타입에 `previewPaths`, `samplePaths` 추가
5. `arrayUnion`, `arrayRemove` import 추가
6. `handleFileUpload` 수정 (FR-03)
7. `handleFileDelete` 수정 (FR-03)
8. `moveStorageFolder`에서 새 경로 반환 + Firestore 기록

---

## 7. Test Scenarios

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| T-01 | 라벨 변경 없이 설명만 수정 | 기존 파일 유지, 설명 업데이트 |
| T-02 | 라벨 변경 (파일 있음) | 파일이 새 라벨 폴더로 이동, 정상 표시 |
| T-03 | 라벨 변경 (파일 없음) | Firestore 문서만 갱신, 에러 없음 |
| T-04 | 파일 업로드 후 라벨 변경 | 업로드된 파일이 새 라벨에서 정상 표시 |
| T-05 | 파일 삭제 | Storage + Firestore 메타데이터 동시 제거 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-28 | Finalized design | Claude |
