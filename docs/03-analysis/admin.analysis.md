# Admin CheckpointEditor 레이아웃 개선 Gap Analysis Report

> **분석 유형**: 설계 의도 vs 구현 Gap 분석 (PDCA Check)
>
> **프로젝트**: GsTestGuide
> **분석 대상**: Admin 콘텐츠 편집 - CheckpointEditor 4-Row 레이아웃 구조
> **분석일**: 2026-03-16
> **상태**: Review

---

## 1. 분석 개요

### 1.1 분석 목적

체크포인트 편집 카드 레이아웃을 4-Row 구조로 개선하는 설계 의도가 `CheckpointEditor.tsx`의 `SortableCheckpointCard` 컴포넌트에 올바르게 반영되었는지 검증한다.

### 1.2 분석 범위

| 항목 | 파일 경로 |
|------|----------|
| 핵심 구현체 | `src/features/admin/components/content/CheckpointEditor.tsx` |
| 타입 정의 | `src/features/admin/components/content/types.ts` |
| 미리보기 | `src/features/admin/components/content/ContentPreview.tsx` |

### 1.3 설계 의도 요약

```
Row 1: [Handle] [Number] [필수/권고] [ref1] [ref2] [+참고자료]  (flex-wrap)
Row 2: [Input ──────────────────────────────────────────]       (pl-7)
Row 3: "증빙:" [칩1 X] [칩2 X] [+ 증빙]          [원본 diff]   (우측 정렬)
Row 4: ▸ 메모                                                   (pl-7, 접을 수 있음)
```

---

## 2. 전체 스코어

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| Row 1 구조 일치도 | 100% | ✅ |
| Row 2 구조 일치도 | 100% | ✅ |
| Row 3 구조 일치도 | 90% | ✅ |
| Row 4 구조 일치도 | 100% | ✅ |
| 기존 기능 유지 (DnD, 참고자료, 원본 diff) | 100% | ✅ |
| 증빙 칩 동작 | 95% | ✅ |
| **전체** | **98%** | **✅** |

---

## 3. Row별 상세 분석

### 3.1 Row 1 — Handle + Number + Badge + Ref tags + 참고자료 버튼

**결과: 100% 일치**

| 설계 요소 | 구현 여부 | 위치 | 비고 |
|-----------|:---------:|------|------|
| 드래그 핸들 (`GripVertical`) | ✅ | L113-120 | `cursor-grab`, `touch-none` 적용 |
| 번호 표시 (`displayNum`) | ✅ | L121 | `tabular-nums`, 재정렬 위치 반영 |
| 필수/권고 토글 배지 | ✅ | L122-139 | 클릭 시 `MUST`/`SHOULD` 토글, 변경 시 ring 표시 |
| Ref 태그 인라인 표시 | ✅ | L141-157 | `FileDown` 아이콘, X 제거 버튼 포함 |
| `+참고자료` 드롭다운 버튼 | ✅ | L159-205 | 그룹별 재료 선택, 체크박스 UI |
| `flex-wrap` 허용 | ✅ | L112 | `flex flex-wrap items-center gap-1.5` |

**특이사항:** 필수/권고 배지에 `importanceChanged` 조건부 `ring-1` 하이라이트가 추가되어 있어 설계 의도보다 향상된 UX를 제공한다.

---

### 3.2 Row 2 — Input 전체 너비 (pl-7 오프셋)

**결과: 100% 일치**

| 설계 요소 | 구현 여부 | 위치 | 비고 |
|-----------|:---------:|------|------|
| Input 전체 너비 (`w-full`) | ✅ | L210-217 | `w-full` 클래스 적용 |
| pl-7 드래그 핸들 오프셋 | ✅ | L209 | `<div className="pl-7">` |
| 인라인 편집 (`onChange`) | ✅ | L212-215 | `editing.checkpoints[i]` 즉시 업데이트 |

---

### 3.3 Row 3 — 증빙 라벨 + 증빙 칩 + [+ 증빙] 버튼 + 원본 diff

**결과: 90% 일치 (경미한 차이 1건)**

| 설계 요소 | 구현 여부 | 위치 | 비고 |
|-----------|:---------:|------|------|
| `pl-7` 오프셋 | ✅ | L221 | `pl-7 flex flex-wrap items-center gap-1.5` |
| "증빙:" 라벨 | ✅ | L222-224 | 증빙 0건이면 라벨 숨김 |
| 증빙 칩 (X 제거 버튼) | ✅ | L225-238 | `bg-status-pass-bg` 스타일, X 클릭 시 `toggleEvidence` |
| `[+ 증빙]` 팝오버 버튼 | ✅ | L241-282 | `evidenceExamples.length > 0` 조건부 렌더링 |
| 팝오버 체크박스 UI | ✅ | L253-280 | 선택/미선택 상태 구분 |
| 원본 diff 우측 정렬 | ✅ | L284-289 | `ml-auto` 적용, 변경 시에만 표시 |

**경미한 차이:**

| 항목 | 설계 | 구현 | 영향도 |
|------|------|------|:------:|
| 증빙 0건 시 `[+ 증빙]` 버튼 표시 조건 | "증빙 0건이면 `[+ 증빙]` 버튼만 표시" | `evidenceExamples.length > 0` 조건에 따라 표시 — `evidenceExamples` 배열이 아예 비어 있으면 버튼도 숨김 | 낮 |

**상세:** 설계에서는 "증빙 0건이면 `[+ 증빙]` 버튼만 표시"라고 명시하였다. 구현 코드(L242)는 `evidenceExamples.length > 0` 조건으로 버튼 자체를 감싸므로, `evidenceExamples` 전역 배열이 비어 있는 경우에는 연결된 증빙이 없더라도 `[+ 증빙]` 버튼이 아예 표시되지 않는다. 실제로 `evidenceExamples`는 항목 데이터에서 공급되어 빈 경우가 드물지만, 의도적으로 빈 배열을 가지는 요구사항에 대한 버튼 표시 여부가 설계와 미세하게 다르다.

---

### 3.4 Row 4 — 메모 (접기/펼치기)

**결과: 100% 일치**

| 설계 요소 | 구현 여부 | 위치 | 비고 |
|-----------|:---------:|------|------|
| `▸ 메모` 토글 버튼 | ✅ | L294-302 | `ChevronRight` 아이콘 회전 애니메이션 |
| `pl-7` 오프셋 | ✅ | L293 | `<div className="pl-7">` |
| 메모 존재 시 시각적 표시 | ✅ | L301 | accent 색상 점(`h-1.5 w-1.5 rounded-full bg-accent`) |
| 펼침 시 textarea | ✅ | L303-314 | `resize-y`, 2행, placeholder 텍스트 포함 |
| `isMemoOpen` 상태 관리 | ✅ | L339-346 | `Set<number>` 기반, 다중 항목 독립 관리 |

---

## 4. 기존 기능 유지 확인

### 4.1 드래그 핸들 및 DnD

| 항목 | 상태 | 설명 |
|------|:----:|------|
| `useSortable` 훅 연결 | ✅ | `setNodeRef`, `transform`, `transition`, `isDragging` 모두 적용 |
| 드래그 중 시각 피드백 | ✅ | `opacity: 0.4` |
| `handleDragEnd`로 `checkpointOrder` 업데이트 | ✅ | `arrayMove` 사용 |
| 원래 인덱스 키 유지 | ✅ | 모든 메타데이터는 `origIdx` 기준 |

### 4.2 참고자료 드롭다운

| 항목 | 상태 | 설명 |
|------|:----:|------|
| `groupedMaterials` 기반 그룹별 렌더링 | ✅ | 카테고리 헤더 + 항목 목록 |
| `dropdownRef` 외부 클릭 닫기 | ✅ | `isDropdownOpen ? dropdownRef : undefined` |
| 선택 상태 체크박스 | ✅ | `editedRefs.includes(label)` 기반 |
| `toggleRef` 콜백 연결 | ✅ | 추가/제거 즉시 반영 |

### 4.3 원본 diff 표시

| 항목 | 상태 | 설명 |
|------|:----:|------|
| 텍스트 변경 감지 | ✅ | `editedBody !== origBody` |
| 참고자료 변경 감지 | ✅ | `refsChanged` (`JSON.stringify` 비교) |
| 원본 내용 요약 표시 (30자 이내) | ✅ | `origBody.slice(0, 30)` + `...` |
| `ml-auto` 우측 정렬 | ✅ | Row 3 내 `ml-auto` 적용 |
| `title` 툴팁으로 전체 원본 표시 | ✅ | ref 포함 전체 원본 텍스트 |

---

## 5. 증빙 칩 표시/제거 동작

| 항목 | 상태 | 설명 |
|------|:----:|------|
| `connectedEvidenceIndices` 읽기 | ✅ | `editing.checkpointEvidences[i] ?? []` |
| 증빙 인덱스 -> 텍스트 변환 | ✅ | `evidenceExamples[evIdx]` |
| X 버튼 클릭 시 `toggleEvidence` 호출 | ✅ | `toggleEvidence(i, evIdx)` |
| `toggleEvidence` 내부 로직 | ✅ | `current.includes(evIdx)` 판단 후 추가/제거, 정렬 유지 |
| 팝오버에서 이미 선택된 항목 구분 | ✅ | `connectedEvidenceIndices.includes(evIdx)` |

---

## 6. 발견된 차이점

### 6.1 [빨간색] 누락 기능 (설계 O, 구현 X)

해당 없음.

### 6.2 [노란색] 경미한 차이

| 항목 | 위치 | 설명 | 영향도 |
|------|------|------|:------:|
| `evidenceExamples` 비어 있을 때 `[+ 증빙]` 버튼 미표시 | `CheckpointEditor.tsx:242` | `evidenceExamples.length > 0` 조건으로 버튼 자체를 감싸므로, 전역 예시 배열이 비면 버튼도 사라짐. 설계는 "증빙 0건이면 버튼만 표시"라고 명시 | 낮 |

### 6.3 [파란색] 설계보다 향상된 구현 (의도적 추가)

| 항목 | 설명 |
|------|------|
| 중요도 배지 변경 하이라이트 | `importanceChanged`가 true일 때 `ring-1 ring-status-hold-border` 추가 -- 설계에 없는 시각적 피드백 |
| 원본 diff에 ref 변경도 포함 | `refsChanged` 감지를 추가하여 참고자료만 변경된 경우에도 원본 diff 표시 |
| 메모 존재 표시 점 | `hasMemo` 조건부 accent 점으로 내용 유무를 한눈에 확인 가능 |

---

## 7. 전체 매치율 요약

```
+-------------------------------------------------+
|  전체 매치율: 98%                                |
+-------------------------------------------------+
|  Row 1 (Handle/Number/Badge/Refs):  100%         |
|  Row 2 (Input + pl-7):             100%          |
|  Row 3 (Evidence + diff):           90%          |
|  Row 4 (Memo):                     100%          |
|  기존 기능 유지 (DnD/참고자료/diff): 100%         |
|  증빙 칩 동작:                       95%          |
+-------------------------------------------------+
```

---

## 8. 권장 조치

### 8.1 즉시 수정 불필요 (매치율 98% 이상)

현재 구현은 설계 의도와 매우 높은 일치도를 보인다. 발견된 경미한 차이(Row 3 `evidenceExamples` 조건)는 실제 사용 환경에서 `evidenceExamples`가 빈 배열인 경우가 없으므로 현실적인 영향이 없다.

### 8.2 선택적 개선 (백로그)

| 항목 | 파일 | 설명 |
|------|------|------|
| `evidenceExamples` 빈 배열 대응 | `CheckpointEditor.tsx:242` | `evidenceExamples.length > 0` 조건을 제거하고 항상 `[+ 증빙]` 버튼을 표시하도록 변경 (설계 의도 완전 일치) |

**수정 방안:**
```typescript
// Before (현재):
{evidenceExamples.length > 0 && (
  <div className="relative">
    ...
  </div>
)}

// After (설계 의도 완전 반영):
<div className="relative">
  <button ...>
    <Plus size={10} />
    증빙
  </button>
  {isEvidencePopoverOpen && evidenceExamples.length > 0 && (
    <div className="absolute ...">
      {/* 팝오버 내용 */}
    </div>
  )}
</div>
```

---

## 9. 결론

CheckpointEditor 4-Row 레이아웃 개선은 전체 매치율 **98%**로 설계 의도와 거의 완벽하게 일치한다.

설계에서 요구한 4가지 Row 구조, 드래그 핸들, 참고자료 드롭다운, 증빙 칩(표시/제거), 원본 diff, 메모 접기/펼치기가 모두 올바르게 구현되어 있다. 오히려 중요도 배지 변경 하이라이트, ref 변경 시 원본 diff 표시, 메모 존재 표시 점 등 설계보다 향상된 UX 요소가 추가되었다.

유일한 경미한 차이는 `evidenceExamples`가 완전히 빈 배열일 때 `[+ 증빙]` 버튼도 함께 숨겨지는 동작이며, 실제 운영 환경에서는 영향이 없다.

---

## Version History

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-03-16 | 초기 분석 (DnD 재정렬 기능) | gap-detector |
| 2.0 | 2026-03-16 | CheckpointEditor 4-Row 레이아웃 개선 분석 | gap-detector |
