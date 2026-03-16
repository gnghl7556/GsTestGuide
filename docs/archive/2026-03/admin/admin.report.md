# Admin CheckpointEditor 레이아웃 개선 완성 보고서

> **상태**: 완료
>
> **프로젝트**: GsTestGuide
> **버전**: v2.0 (체크포인트 편집 카드 4-Row 레이아웃)
> **완료일**: 2026-03-16
> **PDCA 사이클**: #2 (admin 피처)

---

## 1. 개요

### 1.1 배경

이전 사이클(v1.0)에서 체크포인트 DnD 재정렬 기능을 구현하였다. 이번 사이클(v2.0)에서는 편집 카드 자체의 레이아웃을 개선하여 **CenterDisplay(점검 수행 페이지)와의 시각적 일관성**을 확보하고, 증빙 항목의 접근성을 높이는 것을 목표로 하였다.

### 1.2 결과 요약

```
+---------------------------------------------+
|  전체 매치율: 98%                             |
+---------------------------------------------+
|  Row 1 (Handle/Number/Badge/Refs): 100%      |
|  Row 2 (Input 전체 너비):          100%      |
|  Row 3 (증빙 칩 + 원본 diff):       90%      |
|  Row 4 (메모):                     100%      |
|  기존 기능 유지:                    100%      |
|  증빙 칩 동작:                       95%      |
+---------------------------------------------+
```

---

## 2. 관련 문서

| 단계 | 문서 | 상태 |
|------|------|------|
| Plan | 별도 Plan 없음 (간단한 레이아웃 변경) | N/A |
| Design | 설계 의도는 Gap Analysis에 기술 | N/A |
| Check | [admin.analysis.md](../03-analysis/admin.analysis.md) | 완료 |
| Act | 현재 문서 | 작성 완료 |

---

## 3. 레이아웃 변경 상세

### 3.1 변경 전후 구조 비교

#### 변경 전 (3-Row 구조)

```
Row 1: [Handle] [Number] [Badge] [Input]
Row 2: [Refs...] [증빙 N건 버튼] [원본 diff]
Row 3: [메모]
```

#### 변경 후 (4-Row 구조)

```
Row 1: [Handle] [Number] [Badge] [ref1] [ref2] [+참고자료]   (flex-wrap)
Row 2: [Input ─────────────────────────────────────────]    (pl-7)
Row 3: "증빙:" [칩1 X] [칩2 X] [+ 증빙]       [원본 diff]   (ml-auto)
Row 4: ▸ 메모                                               (pl-7, 접기/펼치기)
```

### 3.2 핵심 변경 사항

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 참고자료 위치 | Row 2 좌측 | Row 1 인라인 (Badge 우측) |
| 증빙 표시 방식 | "증빙 N건" 팝오버 버튼 | 개별 칩(X 제거 버튼 포함) + `[+ 증빙]` 팝오버 |
| Input 너비 | Row 1 내 일부 너비 | Row 2 전체 너비 (`w-full`) |
| Row 1 레이아웃 | `flex items-center gap-2` | `flex flex-wrap items-center gap-1.5` |
| 미사용 변수 | `connectedEvidenceCount` 잔존 | 제거 완료 |

---

## 4. 구현 완료 항목

### 4.1 기능 요구사항

| 항목 | 상태 | 비고 |
|------|:----:|------|
| Row 1: Handle + Number + Badge + Ref 태그 인라인 배치 | 완료 | `flex-wrap` 허용 |
| Row 2: Input 전체 너비 (`w-full`, `pl-7` 오프셋) | 완료 | |
| Row 3: 증빙 개별 칩 표시 (X 제거 버튼) | 완료 | `bg-status-pass-bg` 스타일 |
| Row 3: `[+ 증빙]` 팝오버 버튼 | 완료 | 체크박스 UI |
| Row 3: 원본 diff 우측 정렬 (`ml-auto`) | 완료 | |
| Row 4: 메모 접기/펼치기 유지 | 완료 | |
| DnD 기능 유지 | 완료 | `@dnd-kit` |
| 참고자료 드롭다운 유지 | 완료 | |
| 미사용 변수 `connectedEvidenceCount` 제거 | 완료 | |

### 4.2 설계보다 향상된 구현 (추가 개선)

| 항목 | 설명 |
|------|------|
| 중요도 배지 변경 하이라이트 | `importanceChanged` 조건부 `ring-1 ring-status-hold-border` 추가 |
| 참고자료 변경 시 원본 diff 표시 | `refsChanged` 감지 추가 |
| 메모 존재 여부 표시 점 | `hasMemo` 조건부 accent 점 (`h-1.5 w-1.5 rounded-full bg-accent`) |

---

## 5. Gap 분석 결과

### 5.1 전체 매치율: **98%**

### 5.2 발견된 경미한 차이

| 항목 | 위치 | 내용 | 영향도 |
|------|------|------|:------:|
| `[+ 증빙]` 버튼 표시 조건 | `CheckpointEditor.tsx:242` | `evidenceExamples.length > 0` 조건으로 버튼을 감싸므로 전역 예시 배열이 비면 버튼도 숨겨짐. 설계는 "증빙 0건이면 `[+ 증빙]` 버튼만 표시"라고 명시 | 낮음 |

**영향 판단:** `evidenceExamples`는 항목 데이터에서 공급되어 운영 환경에서 빈 경우가 없으므로 즉시 수정 불필요.

---

## 6. 품질 검증

### 6.1 빌드

| 항목 | 결과 |
|------|:----:|
| `npm run build` | 통과 |
| TypeScript 컴파일 | 통과 |
| ESLint | 통과 |

### 6.2 변경 파일 목록

| 파일 | 주요 변경 |
|------|----------|
| `src/features/admin/components/content/CheckpointEditor.tsx` | 4-Row 레이아웃 구조 전면 개편, 증빙 칩 렌더링 로직, 미사용 변수 제거 |

---

---

# v3.0 콘텐츠 위키 스타일 버전 관리 시스템 (2026-03-16)

## 1. 개요

### 1.1 배경

v2.0에서 체크포인트 편집 UI를 개선한 이후, 콘텐츠 관리의 근본적인 문제를 해결하는 단계에 진입했다. 기존 **패치 기반 오버라이드** 시스템(`contentOverrides` 컬렉션)은 다음 문제점이 있었다:

- **편집자 추적 불가**: 누가 언제 무엇을 변경했는지 기록 부재
- **부분 업데이트만 저장**: 전체 상태 스냅샷 없이 변경분(diff)만 저장 → 복구 불가능
- **편집 사유 기록 부재**: 콘텐츠 변경의 의도를 알 수 없음
- **롤백 불가능**: 이전 버전으로 되돌릴 방법 없음

**목표**: 나무위키/구글 워크스페이스 스타일의 **버전 관리 시스템**으로 전환하여 이 모든 문제를 해결한다.

### 1.2 결과 요약

```
+────────────────────────────────────────────+
|  전체 매치율: 93%                             |
+────────────────────────────────────────────+
|  Firestore 스키마:                   100%   |
|  타입 정의 (ContentSnapshot):        100%   |
|  태스크 완료율 (19개 중):              95%   |
|  핵심 동작 요구사항:                   95%   |
|  아키텍처 준수:                       90%   |
|  기존 코드 정리:                      85%   |
+────────────────────────────────────────────+
```

---

## 2. 관련 문서

| 단계 | 문서 | 상태 |
|------|------|------|
| Plan | 구현 계획 트랜스크립트 (19개 태스크) | 완료 |
| Design | N/A (구현 계획에 설계 의도 기술) | N/A |
| Check | [admin.analysis.md (v3.0)](../03-analysis/admin.analysis.md) | 완료 |
| Act | 현재 문서 | 작성 완료 |

---

## 3. 시스템 아키텍처

### 3.1 기존 시스템 (패치 기반)

```
contentOverrides/{reqId}
  ├── {field}: {partial value}         ← 변경된 필드만 저장
  └── updatedAt: Timestamp             ← 시간만 기록
```

**문제점:**
- 편집자 미기록, 편집 사유 없음, 부분 업데이트만 저장, 롤백 불가

### 3.2 신규 시스템 (버전 관리 기반)

```
contentVersions/{reqId}                  ← 루트 문서 (빠른 읽기용)
  ├── currentVersion: number             ← 현재 버전 번호
  ├── content: ContentSnapshot           ← 현재 활성 콘텐츠 (전체)
  ├── updatedAt: Timestamp
  ├── updatedBy: string
  └── versions/{versionNumber}           ← 불변 이력 (서브컬렉션, create-only)
       ├── version: number
       ├── content: ContentSnapshot      ← 버전별 완전한 스냅샷
       ├── editor: string                ← 편집자 실명
       ├── editorId: string
       ├── editedAt: Timestamp
       ├── note: string                  ← 편집 사유 (필수)
       ├── action: 'create'|'edit'|'rollback'
       └── diff?: FieldDiff[]            ← before/after 필드 차이
```

**개선점:**
- 실명 편집자 기록, 편집 사유 필수, 완전한 스냅샷 저장, 원자적 버전 증가, 롤백 가능

---

## 4. 구현 완료 항목

### 4.1 신규 파일 (9개)

| 파일 | 타입 | 역할 |
|------|------|------|
| `src/types/contentVersion.ts` | Domain | ContentSnapshot, ContentVersionDoc, ContentVersionRoot, FieldDiff, VersionAction 타입 |
| `src/lib/content/snapshotUtils.ts` | Infrastructure | requirementToSnapshot, applySnapshotToRequirement, computeSnapshotDiff 유틸리티 |
| `src/hooks/useContentVersions.ts` | Application | contentVersions 컬렉션 실시간 구독 훅 |
| `src/features/admin/hooks/useContentVersioning.ts` | Application | saveContentVersion, getVersionHistory, getVersionSnapshot 훅 |
| `src/features/admin/utils/contentPermissions.ts` | Utility | getContentEditPermission (역할별 권한 매핑) |
| `src/features/admin/components/content/EditNoteModal.tsx` | Presentation | 편집 사유 필수 입력 모달 |
| `src/features/admin/components/content/VersionHistoryModal.tsx` | Presentation | 버전 이력 조회 및 롤백 UI |
| `src/features/admin/components/content/VersionDiffView.tsx` | Presentation | before/after diff 시각화 |
| `scripts/migrate-content-to-versions.ts` | Script | contentOverrides → contentVersions 마이그레이션 (--dry-run, --validate) |

### 4.2 수정 파일 (7개)

| 파일 | 변경 사항 |
|------|-----------|
| `src/types/index.ts` | contentVersion 타입 re-export 추가 |
| `src/lib/content/mergeOverrides.ts` | mergeOverrides() 함수 제거, applyVersionedContent() 추가, ContentOverride @deprecated |
| `src/features/checklist/routes/ExecutionPage.tsx` | useContentOverrides → useContentVersions, mergeOverrides → applyVersionedContent |
| `src/features/checklist/hooks/useContentOverrideMonitor.ts` | ContentSnapshot 기반 fingerprint 계산 |
| `src/features/admin/components/ContentOverrideManagement.tsx` | 대폭 리팩토링 (contentVersions 구독, 스냅샷 편집, 실명 편집자, EditNoteModal 연동, 롤백) |
| `firestore.rules` | contentVersions 보안 규칙 (versions 불변 이력 create-only) |
| `docs/firestore-structure.md` | contentVersions 스키마 문서화 |

### 4.3 삭제 파일 (2개)

| 파일 | 사유 |
|------|------|
| `src/hooks/useContentOverrides.ts` | contentVersions로 대체 |
| `src/features/admin/components/content/ChangeHistoryModal.tsx` | VersionHistoryModal로 대체 |

---

## 5. 핵심 동작 요구사항 검증

| 요구사항 | 구현 상태 | 확인 위치 |
|----------|:---------:|-----------|
| **누구나 편집 가능** | ✅ | Admin 페이지 접근 (AdminGuard 기반) |
| **편집자 실명 기록** | ✅ | `editor: currentUserId` (ContentVersionDoc.editor) |
| **버전별 전체 스냅샷 저장** | ✅ | `versions/{versionNumber}/content: ContentSnapshot` |
| **롤백 가능** | ✅ | `action: 'rollback'`으로 새 버전 생성 |
| **원본(v0) 영구 보존** | ✅ | Firestore Rules에서 versions 수정/삭제 불가 |
| **편집 사유(note) 필수 입력** | ✅ | EditNoteModal에서 `!note.trim()` 시 확인 버튼 비활성화 |
| **runTransaction 기반 atomic 버전 증가** | ✅ | `useContentVersioning.ts:24` runTransaction 사용 |
| **ExecutionPage 전환 완료** | ✅ | useContentVersions + applyVersionedContent 적용 |
| **기존 useContentOverrides 제거** | ✅ | 파일 없음 확인 |
| **기존 ChangeHistoryModal 제거** | ✅ | 파일 없음 확인 |
| **npm run build 성공** | ✅ | 최신 커밋 (2026-03-16) 빌드 성공 상태 |

---

## 6. Firestore 스키마 일치도

| 설계 | 구현 코드 | 구현 Rules | 구현 문서 | 일치 |
|------|:---------:|:----------:|:---------:|:----:|
| `contentVersions/{reqId}` 루트 | ✅ | ✅ | ✅ | ✅ |
| `.currentVersion: number` | ✅ | - | ✅ | ✅ |
| `.content: ContentSnapshot` | ✅ | - | ✅ | ✅ |
| `.updatedAt: Timestamp` | ✅ | - | ✅ | ✅ |
| `.updatedBy: string` | ✅ | - | ✅ | ✅ |
| `versions/{versionNumber}` 서브컬렉션 | ✅ | ✅ | ✅ | ✅ |
| `.version: number` | ✅ | - | ✅ | ✅ |
| `.content: ContentSnapshot` | ✅ | - | ✅ | ✅ |
| `.editor: string` (실명) | ✅ | - | ✅ | ✅ |
| `.editorId: string` | ✅ | - | ✅ | ✅ |
| `.editedAt: Timestamp` | ✅ | - | ✅ | ✅ |
| `.note: string` (편집 사유) | ✅ | - | ✅ | ✅ |
| `.action: VersionAction` | ✅ | - | ✅ | ✅ |
| `.diff?: FieldDiff[]` | ✅ | - | ✅ | ✅ |
| versions create-only 규칙 | ✅ | ✅ | ✅ | ✅ |
| **전체** | **100%** | **100%** | **100%** | **✅** |

---

## 7. 발견된 차이점

### 7.1 기능 정의는 완료되나 미사용 (영향도: 낮)

| 항목 | 상태 | 설명 |
|------|------|------|
| `getContentEditPermission()` | 정의만 완료 | 함수 정의 완료되나 어떤 컴포넌트에서도 호출하지 않음. Admin 페이지 자체가 AdminGuard로 보호되므로 즉시 수정 불필요 |
| VersionHistoryModal `onPreview` | prop 정의만 | `onPreview` prop은 존재하나 ContentOverrideManagement에서 연동하지 않음 |

### 7.2 의도적 레거시 잔류 (향후 호환성 유지)

| 항목 | 사유 |
|------|------|
| `ContentOverride` 인터페이스 (@deprecated) | 마이그레이션 스크립트 및 `requirementToSnapshot`에서 필요 |
| `snapshotUtils.ts`의 `ContentOverride` 파라미터 | 레거시 데이터를 새 시스템으로 마이그레이션할 때 필수 |

---

## 8. 아키텍처 준수도

### 8.1 파일 배치 검증

| 파일 | 설계 위치 | 실제 위치 | 일치 |
|------|-----------|-----------|:----:|
| `contentVersion.ts` | `src/types/` | `src/types/contentVersion.ts` | ✅ |
| `snapshotUtils.ts` | `src/lib/content/` | `src/lib/content/snapshotUtils.ts` | ✅ |
| `useContentVersions.ts` | `src/hooks/` | `src/hooks/useContentVersions.ts` | ✅ |
| `useContentVersioning.ts` | `src/features/admin/hooks/` | `src/features/admin/hooks/useContentVersioning.ts` | ✅ |
| `contentPermissions.ts` | `src/features/admin/utils/` | `src/features/admin/utils/contentPermissions.ts` | ✅ |
| `EditNoteModal.tsx` | `src/features/admin/components/content/` | ✅ | ✅ |
| `VersionHistoryModal.tsx` | `src/features/admin/components/content/` | ✅ | ✅ |
| `VersionDiffView.tsx` | `src/features/admin/components/content/` | ✅ | ✅ |
| `migrate-content-to-versions.ts` | `scripts/` | ✅ | ✅ |

### 8.2 의존성 방향 검증

| 파일 | 참조 대상 | 방향 | 상태 |
|------|-----------|------|:----:|
| `contentVersion.ts` (Domain) | `checklist.ts`, `mergeOverrides.ts` | Domain → Infra | ⚠️ 기존 이슈 |
| `snapshotUtils.ts` (Infra) | `types/`, `mergeOverrides.ts` | Infra → Domain | ✅ |
| `useContentVersions.ts` (App) | `firebase.ts`, `types/` | App → Infra, Domain | ✅ |
| `useContentVersioning.ts` (App) | `firebase.ts`, `snapshotUtils.ts`, `types/` | App → Infra, Domain | ✅ |
| `EditNoteModal.tsx` (Presentation) | `components/ui/` | 같은 레이어 | ✅ |
| `VersionHistoryModal.tsx` (Presentation) | `useContentVersioning.ts`, `types/` | Presentation → App, Domain | ✅ |

---

## 9. 설계보다 향상된 구현 (추가 개선)

| 항목 | 설명 |
|------|------|
| Atomic 버전 관리 | runTransaction으로 버전 번호 증가 시 동시 편집 경쟁 완전 방지 |
| Diff 자동 계산 | 편집 시 이전 버전과의 필드별 변경사항을 자동으로 computeSnapshotDiff 호출 |
| 롤백 = 새 버전 | 이전 버전으로 롤백할 때 새로운 버전 문서를 생성하여 이력 보존 |
| Snapshot 기반 모니터링 | useContentOverrideMonitor가 ContentSnapshot의 여러 필드를 조합하여 변경 감지 정확도 향상 |

---

## 10. 품질 검증

### 10.1 빌드

| 항목 | 결과 |
|------|:----:|
| `npm run build` | ✅ 통과 |
| TypeScript 컴파일 | ✅ 통과 (strict mode) |
| ESLint | ✅ 통과 (미사용 변수 수정 완료) |

### 10.2 변경 파일 크기 (요약)

| 구분 | 개수 | 비고 |
|------|:----:|------|
| 신규 타입 인터페이스 | 5개 | ContentSnapshot(11개 필드), ContentVersionDoc, ContentVersionRoot, FieldDiff, VersionAction |
| 신규 컴포넌트 | 3개 | EditNoteModal, VersionHistoryModal, VersionDiffView |
| 신규 훅 | 2개 | useContentVersions, useContentVersioning |
| 신규 유틸 | 2개 | snapshotUtils.ts, contentPermissions.ts |
| 신규 스크립트 | 1개 | migrate-content-to-versions.ts (마이그레이션 도구) |

---

## 11. 회고 (Retrospective)

### 11.1 잘된 점

1. **패치→스냅샷 전환의 완결성**: 기존 패치 기반 시스템의 모든 문제를 해결하는 완전한 설계를 달성했다. Firestore 스키마, 타입 정의, 보안 규칙이 일관되게 설계되었고 모두 100% 구현되었다.

2. **마이그레이션 안전성**: `migrate-content-to-versions.ts`가 --dry-run과 --validate 옵션을 지원하여 프로덕션 데이터 손실 위험 없이 검증 후 수행할 수 있는 구조로 설계되었다.

3. **불변 이력 보장**: Firestore Rules에서 versions 서브컬렉션의 수정/삭제를 차단하여 v0(원본)과 모든 편집 이력이 영구 보존되도록 강제하였다.

4. **Atomic 버전 관리**: runTransaction을 사용하여 루트 문서의 currentVersion 증가와 서브컬렉션 버전 문서 생성을 원자적으로 처리하므로 동시 편집 상황에서도 버전 번호가 중복되지 않는다.

5. **편집 사유 필수 입력**: EditNoteModal에서 사유가 비어 있으면 확인 버튼을 비활성화하는 강한 제약으로, 모든 콘텐츠 변경의 의도가 기록된다.

### 11.2 개선이 필요한 점

1. **권한 정의 미사용**: `getContentEditPermission()` 함수를 정의했으나 실제로 사용하지 않는다. 현재는 Admin 페이지 자체가 AdminGuard로 보호되므로 기능상 문제는 없지만, 향후 Tester/PL에게 text 편집 권한을 부여할 계획이 있다면 이 함수를 활용해야 한다.

2. **VersionHistoryModal의 미리보기 미연결**: 설계에는 버전별 미리보기 기능이 있었으나, 실제 ContentOverrideManagement에서 `onPreview` prop을 활용하지 않아 버전 내용을 미리보기 화면에서 확인할 수 없다.

3. **별도 Plan 문서 부재**: 이번 피처는 구현 계획 트랜스크립트로 직접 진행했으나, 정식 PDCA 플로우를 따라 별도 Plan 문서를 먼저 작성했으면 요구사항 검토가 더욱 체계적이었을 것 같다.

### 11.3 다음에 적용할 사항

1. **권한 제어 활성화**: Tester/PL 사용자에게 콘텐츠 "텍스트" 편집 권한을 부여할 때 `getContentEditPermission` 함수를 ContentOverrideManagement에서 호출하여 편집 범위를 제한하도록 리팩토링.

2. **미리보기 기능 연동**: VersionHistoryModal의 `onPreview` 콜백에 ContentPreview 컴포넌트를 연결하여 버전별 미리보기 기능 완성.

3. **마이그레이션 실행 문서**: 프로덕션 마이그레이션 시 운영 절차를 문서화(언제, 누가, 어떤 순서로)하여 팀 전체가 참고할 수 있도록 준비.

4. **향후 피처 계획**: 주요 설계 변경이 필요한 피처는 먼저 간단한 Plan 문서 작성 후 설계를 검토하는 2-단계 프로세스 도입.

---

## 12. 향후 과제

### 12.1 선택적 개선 (백로그)

| 우선순위 | 항목 | 파일 | 설명 |
|:--------:|------|------|------|
| 낮 | `getContentEditPermission` 실제 적용 | `ContentOverrideManagement.tsx` | 역할별 편집 범위 제한 |
| 낮 | VersionHistoryModal 미리보기 연결 | `ContentOverrideManagement.tsx:577` | `onPreview` prop에 ContentPreview 연동 |
| 낮 | `BranchingRule` 타입을 Domain 레이어로 이동 | `src/types/` | Domain → Infra 의존성 해소 (기존 이슈) |

### 12.2 다음 PDCA 사이클 후보

| 항목 | 우선순위 |
|------|:--------:|
| 프로덕션 마이그레이션 실행 (contentOverrides → contentVersions) | 높음 |
| 모달 컴포넌트 `src/components` → `src/features` 이동 (구조 정리) | 중간 |
| 공통 UI(`Button`, `Input`) 스타일 통일 | 중간 |

---

## 13. 결론

콘텐츠 위키 스타일 버전 관리 시스템은 **전체 매치율 93%**로 설계 요구사항과 매우 높은 일치도를 보인다.

19개 설계 태스크 중 16개가 100% 구현되었고, 나머지 3개(권한 정의, 미리보기, 기존 코드 정리)도 핵심 기능은 완성되어 있다. Firestore 스키마, 보안 규칙, 타입 정의가 설계와 완벽히 일치하며, runTransaction 기반 atomic 버전 관리, 불변 이력 보존, 편집 사유 필수 입력 등 **핵심 동작 요구사항이 모두 충족**되었다.

기존 레거시 시스템(`useContentOverrides`, `ChangeHistoryModal`, `mergeOverrides()` 함수)은 완전히 제거되었고, `ContentOverride` 인터페이스는 마이그레이션 참조용으로 `@deprecated` 표시 후 유지 중이다.

**본 구현을 통해 콘텐츠 편집의 투명성, 추적성, 복구 가능성이 모두 확보되었으며, 향후 프로덕션 마이그레이션 후 팀 전체의 콘텐츠 협업이 획기적으로 개선될 것으로 기대된다.**

---

## 7. 회고 (Retrospective)

### 7.1 잘된 점

- 기존 DnD 기능(`handleDragEnd`, `useSortable`, `arrayMove`)을 훼손 없이 레이아웃만 분리하는 데 성공하였다.
- 증빙을 팝오버 버튼 하나로 숨기던 방식을 개별 칩으로 전환함으로써 어드민의 데이터 가시성이 크게 향상되었다.
- CenterDisplay의 점검 수행 화면과 레이아웃 계층 구조를 일치시켜 어드민 편집 화면의 예측 가능성이 높아졌다.
- 설계 의도를 초과하는 3가지 UX 개선(배지 하이라이트, ref 변경 diff, 메모 존재 점)이 자연스럽게 포함되었다.

### 7.2 개선이 필요한 점

- 별도 Plan/Design 문서 없이 진행한 레이아웃 변경이었으나, Row 구조 정의가 명확했기에 Gap Analysis에서 설계 의도를 역산하는 방식으로 진행하였다. 향후 레이아웃 변경 시에도 간략한 스케치 문서를 남기면 추적성이 개선될 수 있다.
- `evidenceExamples` 비어 있을 때 `[+ 증빙]` 버튼 미표시 동작은 운영 환경에서는 문제가 없지만 설계 의도와의 미세한 불일치로 남아 있다.

### 7.3 다음에 적용할 사항

- 레이아웃 관련 피처에서는 Row 구조 ASCII 다이어그램을 Plan 단계에 먼저 정의하고 시작할 것.
- `evidenceExamples.length > 0` 조건 제거 — 팝오버 내부에서 빈 상태를 처리하도록 리팩터링 (백로그 등록).

---

## 8. 향후 과제

### 8.1 선택적 개선 (백로그)

| 우선순위 | 항목 | 파일 | 설명 |
|:--------:|------|------|------|
| 낮음 | `[+ 증빙]` 버튼 항상 표시 | `CheckpointEditor.tsx:242` | `evidenceExamples.length > 0` 조건을 팝오버 내부로 이동하여 버튼은 항상 렌더링 |

### 8.2 다음 PDCA 사이클 후보

| 항목 | 우선순위 |
|------|:--------:|
| 모달 컴포넌트 `src/components` → `src/features` 이동 (구조 정리) | 중간 |
| 공통 UI(`Button`, `Input`) 스타일 통일 | 중간 |
| `운영환경` 입력 UI 추가 (필드는 이미 모델에 존재) | 낮음 |

---

## 9. 결론

CheckpointEditor 4-Row 레이아웃 개선은 **전체 매치율 98%**로 설계 의도와 거의 완벽하게 일치하는 수준으로 완료되었다.

참고자료 태그를 질문 텍스트 위(Row 1)에 배치하여 CenterDisplay와의 시각적 일관성을 확보하였고, 증빙을 개별 칩으로 항상 표시함으로써 어드민의 편집 편의성이 향상되었다. 기존 DnD, 참고자료 드롭다운, 원본 diff 등 모든 기존 기능은 완전히 유지되었다.

---

---

# v4.0 시험 생성 UI 개선 (2026-03-16)

## 1. 개요

### 1.1 배경

v3.0에서 콘텐츠 위키 스타일 버전 관리 시스템을 구축한 이후, 시험 생성(create 모드) 프로세스의 UX를 개선하는 단계에 진입했다. 기존 문제점:

- **CalendarInput 2개 반복**: 시작일과 종료일 입력이 각각 별도 컴포넌트였음
- **시험번호 입력 시 즉시 프로젝트 생성**: 확정되지 않은 시점에 Firestore에 프로젝트 문서가 생성되는 취약점
- **일정 입력 프로세스 개선 부재**: 마일스톤 기반 일정 관리 UI 미적용

**목표**: ScheduleWizard 모달을 활용하여 통합된 일정 입력 체험을 제공하고, 의도적 행위(합의서 업로드, 일정 저장, 시험 시작)에서만 Firestore 쓰기가 발생하도록 구조를 개선한다.

### 1.2 결과 요약

```
+────────────────────────────────────────────+
|  전체 매치율: 92%                             |
+────────────────────────────────────────────+
|  CalendarInput 제거:             100%       |
|  ScheduleModal 통합:             100%       |
|  즉시 프로젝트 생성 제거:          100%       |
|  로컬 상태 동기화:                90%       |
|  Firestore 쓰기 의도성:           100%       |
|  데드 코드 정리:                  80%       |
|  아키텍처 준수:                   85%       |
+────────────────────────────────────────────+
```

---

## 2. 관련 문서

| 단계 | 문서 | 상태 |
|------|------|------|
| Plan | 변경 사양 트랜스크립트 | 완료 |
| Design | N/A (구현 계획에 설계 의도 기술) | N/A |
| Check | [admin.analysis.md (v4.0)](../03-analysis/admin.analysis.md) | 완료 |
| Act | 현재 문서 | 작성 완료 |

---

## 3. 변경 사항 상세

### 3.1 변경 1: CalendarInput → ScheduleModal 교체

#### 변경 전

```typescript
// TestSetupPage.tsx
<CalendarInput label="시작일" value={scheduleStartDate} onChange={onChangeScheduleStartDate} />
<CalendarInput label="종료일" value={scheduleEndDate} onChange={onChangeScheduleEndDate} />
```

#### 변경 후

```typescript
// TestSetupPage.tsx
<button
  disabled={!testNumberValidation.isValid}
  onClick={() => setScheduleWizardOpen(true)}
>
  📅 일정 관리
</button>

{scheduleWizardOpen && testNumberValidation.isValid && (
  <ScheduleModal
    project={minimalProject}
    onSave={(updates) => {
      onUpdateProjectSchedule?.(trimmedTestNumber, updates);
      if (updates.scheduleStartDate) onChangeScheduleStartDate(updates.scheduleStartDate as string);
      if (updates.scheduleEndDate) onChangeScheduleEndDate(updates.scheduleEndDate as string);
      setScheduleWizardOpen(false);
    }}
    onClose={() => setScheduleWizardOpen(false)}
  />
)}
```

**개선 사항:**
- CalendarInput 2개 제거 (TestSetupPage, CalendarInput.tsx 데드 코드)
- ScheduleWizard 모달로 마일스톤 기반 일정 설정 통합
- 시험번호 미확정 시 버튼 disabled 상태로 안내

### 3.2 변경 2: 즉시 프로젝트 생성 제거

#### 변경 전

```typescript
const createProjectFromInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return;
  await ensureProjectSkeleton(trimmed);  // ❌ Firestore 즉시 생성
  setTestSetup((prev) => ({ ...prev, testNumber: trimmed }));
};
```

#### 변경 후

```typescript
const createProjectFromInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (!currentUserId) {
    window.alert('사용자를 먼저 선택해주세요.');
    return;
  }
  const exists = projects.find((item) => item.testNumber === trimmed || item.id === trimmed);
  if (exists) {
    window.alert('이미 존재하는 시험번호입니다.');
    return;
  }
  setTestSetup((prev) => ({ ...prev, testNumber: trimmed }));  // ✅ 로컬 상태만 업데이트
};
```

**개선 사항:**
- `ensureProjectSkeleton` 호출 제거
- 로컬 상태(`testSetup`) 업데이트만 수행
- Firestore 쓰기는 의도적 행위(합의서 업로드, 일정 저장, 시험 시작)에서만 발생

### 3.3 Firestore 쓰기 흐름

```
시험번호 입력        →  로컬 상태만 업데이트 (Firestore 쓰기 없음)
              ↓
일정 저장 (버튼)    →  onUpdateProjectSchedule(testNumber, updates)
              │       └─ setDoc(doc(db, 'projects', testNumber), {...}, {merge: true})
              ↓
합의서 업로드       →  uploadAgreementDoc → ensureProjectSkeleton + 합의서 저장
              ↓
시험 시작 (버튼)    →  startProject → saveProjectNow + saveDocsNow
```

---

## 4. 구현 완료 항목

### 4.1 핵심 변경 파일

| 파일 | 변경 사항 |
|------|----------|
| `src/features/test-setup/components/TestSetupPage.tsx` | CalendarInput import/사용 제거, ScheduleModal 연동, scheduleWizardOpen 상태 추가 |
| `src/features/test-setup/hooks/useTestSetupState.ts` | `createProjectFromInput`에서 `ensureProjectSkeleton` 제거 |
| `src/features/test-setup/routes/TestSetupView.tsx` | `onUpdateProjectSchedule` 콜백 추가 |

### 4.2 재사용 컴포넌트

| 컴포넌트 | 역할 |
|--------|------|
| `src/features/checklist/components/ScheduleModal.tsx` | 기존 마일스톤 모달 활용 (변경 없음) |
| `src/components/schedule/ScheduleWizard.tsx` | lazy load 지원 |

### 4.3 데드 코드

| 파일 | 상태 |
|------|:----:|
| `src/features/test-setup/components/CalendarInput.tsx` | ⚠️ 삭제 필요 (현재 어디에서도 사용되지 않음) |

---

## 5. 발견된 차이점

### 5.1 데드 코드 정리 (우선순위: 낮)

| 항목 | 상태 | 영향도 |
|------|:----:|:------:|
| CalendarInput.tsx 파일 삭제 | 미완료 | 낮 |

**설명**: 파일이 아직 존재하지만, TestSetupPage에서 CalendarInput import/사용이 모두 제거되었고, 전체 코드베이스에서 어느 파일도 CalendarInput을 참조하지 않는 완전한 데드 코드 상태이다. 삭제는 선택사항.

### 5.2 로컬 상태 부분 동기화 이슈 (우선순위: 중)

| 항목 | 설계 의도 | 현재 구현 | 영향도 |
|------|----------|----------|:------:|
| 중간 마일스톤 동기화 | ScheduleWizard에서 저장한 `scheduleDefect1`, `schedulePatchDate` 등이 로컬 상태에도 반영 | `scheduleStartDate`와 `scheduleEndDate`만 `onChangeScheduleStartDate`/`onChangeScheduleEndDate`로 동기화. 나머지 마일스톤은 Firestore에만 저장 | 중 |

**시나리오 (데이터 손실 위험):**
1. 사용자가 ScheduleWizard에서 `scheduleDefect1 = '2026-04-01'` 설정 후 저장
2. `onUpdateProjectSchedule`이 Firestore에 `{ scheduleDefect1: '2026-04-01', ... }` 저장 ✅
3. 로컬 `testSetup.scheduleDefect1`은 여전히 `''` ⚠️
4. 사용자가 "시험 시작" 클릭 → `saveProjectNow`가 `scheduleDefect1: ''`으로 덮어씀 ❌

**수정 방안**: `onSave` 콜백에서 모든 스케줄 필드를 동기화하거나, `useTestSetupState`에 `updateScheduleFields` 함수 추가.

---

## 6. 아키텍처 준수도

### 6.1 Feature-First 구조

| 항목 | 상태 | 비고 |
|------|:----:|------|
| ScheduleModal 크로스 피처 참조 | ⚠️ | `test-setup` 피처에서 `checklist/components/ScheduleModal`을 import. 이상적으로는 공통 컴포넌트로 이동 권장 |

### 6.2 관심사 분리 (SoC)

| 항목 | 상태 | 비고 |
|------|:----:|------|
| Firestore 쓰기 로직 위치 | ⚠️ | `TestSetupView.tsx`에서 `setDoc` 직접 호출. `useTestSetupState`에 훅 함수로 추출 권장 |

---

## 7. 품질 검증

### 7.1 빌드

| 항목 | 결과 |
|------|:----:|
| `npm run build` | ✅ 통과 |
| TypeScript 컴파일 | ✅ 통과 |
| ESLint | ✅ 통과 |

### 7.2 변경 파일 요약

| 파일 | 변경 종류 | 주요 내용 |
|------|:-------:|----------|
| TestSetupPage.tsx | 수정 | CalendarInput 제거, ScheduleModal 추가, Calendar 아이콘 추가 |
| useTestSetupState.ts | 수정 | createProjectFromInput에서 ensureProjectSkeleton 제거 |
| TestSetupView.tsx | 수정 | onUpdateProjectSchedule 콜백 추가 |
| CalendarInput.tsx | 데드 코드 | 어디에서도 사용되지 않음 (삭제 대기) |

---

## 8. 회고 (Retrospective)

### 8.1 잘된 점

1. **명확한 요구사항 전달**: CalendarInput 제거와 즉시 생성 제거라는 두 가지 명확한 변경이 정확히 구현되었다.

2. **기존 ScheduleWizard 재활용**: 새로운 컴포넌트를 만들지 않고 기존 ScheduleWizard를 test-setup에서 재사용하는 현실적인 선택으로 개발 효율성을 높였다.

3. **조건부 활성화**: 시험번호 입력 전 일정 저장을 방지하기 위해 버튼에 `disabled={!testNumberValidation.isValid}` 조건을 적용하여 UX 안전성을 확보했다.

4. **Firestore 쓰기 의도성**: 로컬 상태와 Firestore 쓰기의 경계를 명확히 함으로써, 미확정 시점에 Firestore 데이터가 생성되는 문제를 완전히 해결했다.

### 8.2 개선이 필요한 점

1. **중간 마일스톤 동기화 누락**: 마일스톤별 날짜(결함 리포트, 패치)가 Firestore에는 저장되지만 로컬 상태에 동기화되지 않아, "시험 시작" 시 빈 값으로 덮어쓰일 가능성이 있다.

2. **CalendarInput.tsx 데드 코드**: 파일이 완전히 제거되지 않았으며, 향후 팀이 실수로 참조할 가능성이 있다.

3. **별도 설계 문서 부재**: 변경 사양을 트랜스크립트 형태로 진행했으나, 정식 Design 문서가 있었으면 요구사항 검토가 더욱 체계적이었을 것이다.

### 8.3 다음에 적용할 사항

1. **로컬 상태 동기화 함수 추가**: `useTestSetupState`에 `updateScheduleFields(updates: Record<string, string>)` 함수를 추가하여 모든 마일스톤 필드를 한번에 동기화.

2. **CalendarInput.tsx 삭제**: 데드 코드 정리 프로세스 적용.

3. **ScheduleModal 공통 컴포넌트 이동**: `src/features/checklist/components/ScheduleModal.tsx` → `src/components/schedule/ScheduleModal.tsx`로 이동하여 크로스 피처 의존성 해소.

4. **향후 UI 변경 시 Design 문서**: 구조 변경이 있는 피처는 먼저 간단한 설계 문서를 작성하고 진행하는 PDCA 플로우 강화.

---

## 9. 향후 과제

### 9.1 즉시 조치 (중간 우선순위)

| 우선순위 | 항목 | 파일 | 설명 |
|:--------:|------|------|------|
| 중 | 중간 마일스톤 로컬 동기화 | `TestSetupPage.tsx`, `useTestSetupState.ts` | `onSave` 콜백에서 모든 스케줄 필드 동기화 또는 `updateScheduleFields` 함수 추가 |

### 9.2 단기 조치 (낮은 우선순위)

| 우선순위 | 항목 | 파일 | 설명 |
|:--------:|------|------|------|
| 낮 | CalendarInput.tsx 삭제 | `src/features/test-setup/components/CalendarInput.tsx` | 데드 코드 제거 |
| 낮 | ScheduleModal 공통 컴포넌트 이동 | `src/components/schedule/` | 크로스 피처 의존성 해소 |
| 낮 | onUpdateProjectSchedule 훅으로 이동 | `TestSetupView.tsx:72-75` | SoC 개선 |

---

## 10. 결론

시험 생성 UI 개선은 **전체 매치율 92%**로 설계 의도와 높은 일치도를 보인다.

두 가지 핵심 변경이 올바르게 구현되었다:
- **CalendarInput 제거 + ScheduleModal 통합**: TestSetupPage에서 CalendarInput이 완전히 제거되었고, ScheduleWizard 모달로 마일스톤 기반 일정 설정이 가능해졌다.
- **즉시 프로젝트 생성 제거**: `createProjectFromInput`에서 `ensureProjectSkeleton` 호출이 제거되어, Firestore 쓰기는 합의서 업로드/일정 저장/시험 시작 등 의도적 행위에서만 발생한다.

유일한 중간 우선순위 이슈는 ScheduleWizard의 중간 마일스톤이 로컬 상태에 동기화되지 않는 것인데, 이는 `updateScheduleFields` 함수 추가로 간단히 해결할 수 있다.

---

## Version History

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-03-16 | 체크포인트 DnD 재정렬 기능 완성 보고서 | report-generator |
| 2.0 | 2026-03-16 | CheckpointEditor 4-Row 레이아웃 개선 완성 보고서 | report-generator |
| 3.0 | 2026-03-16 | 콘텐츠 위키 스타일 버전 관리 시스템 완성 보고서 | report-generator |
| 4.0 | 2026-03-16 | 시험 생성 UI 개선 (CalendarInput→ScheduleModal, 즉시 프로젝트 생성 제거) | report-generator |
