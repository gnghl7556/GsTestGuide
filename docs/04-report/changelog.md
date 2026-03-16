# Changelog

## [2026-03-16] - 시험 생성 UI 개선

### Changed
- `src/features/test-setup/components/TestSetupPage.tsx` — CalendarInput 컴포넌트 제거, ScheduleModal 모달로 일정 관리 버튼 추가
- `src/features/test-setup/hooks/useTestSetupState.ts` — `createProjectFromInput`에서 `ensureProjectSkeleton` 호출 제거 (Firestore 즉시 생성 방지)
- `src/features/test-setup/routes/TestSetupView.tsx` — `onUpdateProjectSchedule` 콜백 추가 (Firestore 일정 저장)

### Removed
- `src/features/test-setup/components/CalendarInput.tsx` — 데드 코드 (파일 아직 존재하나 사용 중단, 삭제 대기)

### Rationale
- 시험번호 입력 시 즉시 Firestore 프로젝트 생성 취약점 해결: 로컬 상태 업데이트만 수행
- CalendarInput 2개 반복 제거: ScheduleWizard 모달로 마일스톤 기반 통합 일정 관리로 전환
- Firestore 쓰기 의도성 강화: 합의서 업로드, 일정 저장, 시험 시작 등 명시적 행위에서만 발생

---

## [2026-03-16] - 콘텐츠 위키 스타일 버전 관리 시스템

### Added
- `src/types/contentVersion.ts` — ContentSnapshot, ContentVersionDoc, ContentVersionRoot, FieldDiff, VersionAction 타입 정의
- `src/lib/content/snapshotUtils.ts` — requirementToSnapshot, applySnapshotToRequirement, computeSnapshotDiff 유틸리티
- `src/hooks/useContentVersions.ts` — contentVersions 컬렉션 실시간 구독 훅
- `src/features/admin/hooks/useContentVersioning.ts` — saveContentVersion, getVersionHistory, getVersionSnapshot 훅
- `src/features/admin/utils/contentPermissions.ts` — getContentEditPermission (역할별 편집 권한 매핑)
- `src/features/admin/components/content/EditNoteModal.tsx` — 편집 사유 필수 입력 모달
- `src/features/admin/components/content/VersionHistoryModal.tsx` — 버전 이력 조회 및 롤백 UI
- `src/features/admin/components/content/VersionDiffView.tsx` — before/after 필드 diff 시각화
- `scripts/migrate-content-to-versions.ts` — contentOverrides → contentVersions 마이그레이션 스크립트 (--dry-run, --validate)
- Firestore 보안 규칙: contentVersions create-only 불변 이력 규칙

### Changed
- `src/lib/content/mergeOverrides.ts` — mergeOverrides() 함수 제거, applyVersionedContent() 함수 추가, ContentOverride @deprecated 표시
- `src/features/checklist/routes/ExecutionPage.tsx` — useContentOverrides → useContentVersions, mergeOverrides → applyVersionedContent 전환
- `src/features/checklist/hooks/useContentOverrideMonitor.ts` — ContentSnapshot 기반 fingerprint 계산
- `src/features/admin/components/ContentOverrideManagement.tsx` — contentVersions 기반으로 전면 리팩토링 (스냅샷 편집, 실명 편집자 기록, EditNoteModal 연동, 롤백 기능)
- `firestore.rules` — contentVersions 컬렉션 읽기/쓰기, versions 서브컬렉션 create-only 규칙 추가
- `docs/firestore-structure.md` — contentVersions 스키마 상세 문서화

### Removed
- `src/hooks/useContentOverrides.ts` — contentVersions로 대체
- `src/features/admin/components/content/ChangeHistoryModal.tsx` — VersionHistoryModal로 대체
- `mergeOverrides()` 함수 제거

### Rationale
패치 기반 콘텐츠 오버라이드(`contentOverrides`)를 위키 스타일 버전 관리로 전환.
- 편집자 실명 기록, 편집 사유 필수 입력, 버전별 완전한 스냅샷 저장, 원자적 버전 증가, 롤백 가능성 제공
- Firestore Rules에서 versions 서브컬렉션 불변 이력 보장 (v0 원본 및 모든 편집 이력 영구 보존)
- runTransaction 기반 동시 편집 경쟁 완전 차단

---

## [2026-03-16] - CheckpointEditor 4-Row 레이아웃 개선

### Changed
- CheckpointEditor 편집 카드 레이아웃을 3-Row에서 4-Row 구조로 개편
- Row 1: Handle + Number + Badge + 참고자료 태그 인라인 배치 (`flex-wrap`)
- Row 2: Input 전체 너비 분리 (`w-full`, `pl-7` 오프셋)
- Row 3: 증빙을 "N건" 팝오버 버튼 방식에서 개별 칩(X 제거 버튼) 방식으로 전환
- Row 3: 원본 diff `ml-auto` 우측 정렬 유지

### Added
- 중요도 배지 변경 시 `ring-1` 하이라이트 (설계 초과 개선)
- 참고자료 변경 감지 시 원본 diff 표시 (`refsChanged`)
- 메모 존재 여부 accent 점 표시 (`hasMemo`)

### Removed
- 미사용 변수 `connectedEvidenceCount` 제거

---

## [2026-03-16] - 체크포인트 DnD 재정렬 기능

### Added
- `checkpointOrder: number[]` 배열 기반 체크포인트 순서 관리
- `@dnd-kit` 기반 DnD 드래그 앤 드롭 UI (`PointerSensor`, `KeyboardSensor`)
- `mergeOverrides.ts`에 재정렬 로직 추가 (소비자 측 자동 반영)
- `ContentPreview.tsx`에 재정렬 반영 로직 추가
- `BranchingRuleEditor.tsx`에 `displayNumMap` 기반 표시 번호 매핑 추가

### Changed
- `EditingState` 타입에 `checkpointOrder: number[]` 필드 추가
- `handleEditStart` / `handleSave` 로드/저장 로직 업데이트 (기본 순서 시 미저장 최적화)
