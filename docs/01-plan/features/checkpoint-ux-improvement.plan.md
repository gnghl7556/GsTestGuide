# Plan: checkpoint-ux-improvement

## 개요
관리자 콘텐츠 관리 페이지의 체크포인트 편집 영역 UX 개선.
사용자 피드백 및 분석 기반으로 시각적 위계, 정보 밀도, 데이터 연동 문제를 해결한다.

## 배경
- 체크포인트 카드의 '상세 메모' textarea가 메인 체크포인트 input보다 시각적으로 큼 → 주객전도
- 각 카드에 7종 요소가 동시 노출되어 정보 과밀
- 증빙 예시를 "상세 정보" 섹션에서 정의하고 "체크포인트" 섹션에서 연결하는 이중 관리 구조
- 참고 자료 드롭다운이 다른 카드를 가리고, 선택값 가독성 낮음
- MUST/SHOULD 토글의 발견성 부족

## 변경 범위

### Task 1: 시각적 위계 정상화 (CheckpointEditor 카드 구조 개편)
**파일**: `src/features/admin/components/content/CheckpointEditor.tsx`
**심각도**: 높음 (사용자 피드백)

현재:
```
┌─ 카드 상단 (bg-surface-base/50) ──────────┐
│ [번호] [input text-xs] [MUST/SHOULD]       │ ← 메인인데 시각적으로 약함
│ [참고 자료 ▾] 자료1, 자료2                  │
│ 원본: ...                                  │
├─ 카드 하단 (bg-surface-sunken/40) ─────────┤
│ [textarea rows=1 resize-y]                 │ ← 보조인데 시각적으로 강함
│ 증빙 예시 연결: [칩1] [칩2] [칩3]           │
└────────────────────────────────────────────┘
```

변경 후:
```
┌─ 카드 ─────────────────────────────────────┐
│ [번호] [MUST 뱃지]                          │
│ [input text-sm font-medium] ← 크기 UP      │
│ [참고 자료 태그] [증빙 N건 태그]             │ ← 인라인 태그로 통합
│                                            │
│ ▸ 상세 메모 (접힌 상태, 내용 있을 때만 표시) │ ← 접이식으로 전환
└────────────────────────────────────────────┘
```

변경 사항:
1. 체크포인트 input을 `text-sm font-medium`으로 키워 시각적 주인공화
2. MUST/SHOULD를 번호 옆 뱃지로 이동 (라벨 추가: "필수"/"권고")
3. 상세 메모를 접이식(disclosure)으로 전환, 내용 존재 시에만 표시
4. 증빙 연결 칩을 카드 하단 별도 블록에서 참고 자료 옆 인라인 태그로 변경
5. sunken 배경 블록 제거 → 단일 배경으로 통일

### Task 2: 증빙 예시 연결 UX 개선 (이중 관리 해소)
**파일**: `src/features/admin/components/content/CheckpointEditor.tsx`, `ContentEditForm.tsx`
**심각도**: 중간

현재 문제:
- 증빙 목록은 "상세 정보" 아코디언(접힌 상태)에 정의
- 연결 UI는 "체크포인트" 아코디언(펼친 상태)에 존재
- 왔다 갔다 해야 함

변경:
1. 증빙 연결을 클릭하면 팝오버로 증빙 목록 표시 (현재 증빙 목록을 props로 전달받아 표시)
2. 팝오버 내에서 체크/언체크 + 현재 연결 수 뱃지 표시
3. "상세 정보" 섹션의 증빙 편집과 독립적으로 동작 (기존 데이터 흐름 유지)

### Task 3: 참고 자료 드롭다운 → 인라인 태그 전환
**파일**: `src/features/admin/components/content/CheckpointEditor.tsx`
**심각도**: 중간

현재 문제:
- 드롭다운이 열리면 아래 카드를 가림
- 선택된 자료가 9px 텍스트로만 표시

변경:
1. 선택된 참고 자료를 인라인 태그 칩으로 표시
2. 태그 클릭으로 제거, + 버튼으로 드롭다운 열기
3. 드롭다운을 portal로 변경하거나, 위치를 카드 위에 고정

### Task 4: 데이터 정합성 점검 및 저장 로직 검증
**파일**: `ContentOverrideManagement.tsx`, `mergeOverrides.ts`, `CenterDisplay.tsx`
**심각도**: 중간

점검 항목:
1. 증빙 삭제 시 checkpointEvidences 인덱스 리매핑 정확성 검증
2. mergeOverrides에서 checkpointEvidences 병합 시 범위 초과 인덱스 방어
3. CenterDisplay의 증빙 필터링 로직 (cpEvidenceMapping fallback) 정합성
4. 저장(handleSave) 시 빈 증빙 필터링 후 인덱스 시프트 → checkpointEvidences 매핑 정확성
5. 빌드타임(마크다운) ↔ 런타임(Firestore 오버라이드) 증빙 데이터 동기화

## 기존 재사용 (변경 없음)
- `BranchingRuleEditor` — 분기 규칙 편집
- `DetailFieldsEditor` — 증빙/테스트 제안/판정 기준 편집 (목록 관리)
- `ContentPreview` — 미리보기
- `ChangeHistoryModal` — 변경 이력
- 저장/초기화 로직 핵심 흐름 유지

## 검증
- `npm run build` 성공
- 체크포인트 input이 시각적으로 카드의 주인공
- 상세 메모가 보조 요소로 인지됨 (접이식)
- 증빙 연결이 직관적으로 동작
- 참고 자료 태그가 가독성 좋음
- 기존 저장 데이터와 호환 (마이그레이션 불필요)
- 다크 모드 정상
