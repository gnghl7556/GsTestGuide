# Changelog

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
