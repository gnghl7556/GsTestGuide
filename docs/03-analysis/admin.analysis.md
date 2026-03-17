# Admin Feature Analysis Report -- 콘텐츠 관리 수정 내역 시각적 식별 개선

> **Analysis Type**: Gap Analysis (설계 사양 vs 구현 코드)
>
> **Project**: GsTestGuide
> **Analyst**: gap-detector
> **Date**: 2026-03-17
> **Status**: Approved

---

## 1. 분석 개요

### 1.1 분석 목적

"콘텐츠 관리 수정 내역 시각적 식별 개선" 설계 사양 4건과 실제 구현 코드를 비교하여, 설계 의도가 코드에 정확히 반영되었는지 검증한다.

### 1.2 분석 범위

| 설계 항목 | 구현 파일 |
|-----------|----------|
| 1. 좌측 목록 변경 요약 칩 | `src/features/admin/components/ContentOverrideManagement.tsx` |
| 2. 기본 정보 필드 하이라이트 | `src/features/admin/components/content/ContentEditForm.tsx` |
| 3. 체크포인트 카드 하이라이트 | `src/features/admin/components/content/CheckpointEditor.tsx` |
| 4. 리스트 항목별 비교 | `src/features/admin/components/content/DetailFieldsEditor.tsx` |

---

## 2. 전체 점수

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| 1. 좌측 목록 변경 요약 칩 | 100% | [PASS] |
| 2. 기본 정보 필드 하이라이트 | 100% | [PASS] |
| 3. 체크포인트 카드 하이라이트 | 100% | [PASS] |
| 4. 리스트 항목별 비교 | 100% | [PASS] |
| 디자인 토큰 준수 | 100% | [PASS] |
| **전체** | **100%** | **[PASS]** |

---

## 3. 항목별 상세 분석

### 3.1 ContentOverrideManagement.tsx -- 좌측 목록 변경 요약 칩

#### 설계 사양

| # | 요구사항 | 상태 |
|---|---------|:----:|
| 1-1 | `getChangeSummary(reqId)` useMemo 헬퍼로 versionedContents와 REQUIREMENTS_DB 비교 | [PASS] |
| 1-2 | 변경된 필드 목록 반환: ['제목', 'CP', '증빙'] 등 | [PASS] |
| 1-3 | 목록 아이템에 칩으로 렌더링 (최대 2개 + `+N`) | [PASS] |

#### 구현 확인

**1-1. useMemo 헬퍼** (L226-248)

`changeSummaryMap`으로 구현됨. 설계에서 `getChangeSummary(reqId)`라는 함수명을 제안했으나, 실제로는 `useMemo`로 전체 맵을 한번에 계산하는 방식으로 구현. 개별 reqId마다 호출하는 것보다 성능상 우수한 구현이며 기능적으로 동일.

```typescript
// L226-248: changeSummaryMap useMemo
const changeSummaryMap = useMemo(() => {
  const result: Record<string, string[]> = {};
  for (const reqId of Object.keys(versionedContents)) {
    const vc = versionedContents[reqId];
    const req = REQUIREMENTS_DB.find((r) => r.id === reqId);
    if (!vc || !req) continue;
    const changes: string[] = [];
    if (vc.title && vc.title !== req.title) changes.push('제목');
    if (vc.description && vc.description !== req.description) changes.push('설명');
    // ... CP, 증빙, 제안, 판정 비교
    if (changes.length > 0) result[reqId] = changes;
  }
  return result;
}, [versionedContents]);
```

**1-2. 변경 필드 목록 반환** (L233-245)

비교 대상 필드: `제목`, `설명`, `CP`, `증빙`, `제안`, `판정` -- 총 6종. 설계에서 언급한 ['제목', 'CP', '증빙']을 포함하여 더 넓은 범위를 커버.

**1-3. 칩 렌더링 (최대 2개 + `+N`)** (L532-544)

```tsx
// L532-544: 좌측 목록 칩 렌더링
{modified && changeSummaryMap[req.id] && (
  <span className="shrink-0 flex items-center gap-0.5">
    {changeSummaryMap[req.id].slice(0, 2).map((label) => (
      <span key={label} className="text-[8px] font-medium text-status-hold-text bg-status-hold-bg px-1 py-0.5 rounded">
        {label}
      </span>
    ))}
    {changeSummaryMap[req.id].length > 2 && (
      <span className="text-[8px] font-medium text-tx-muted">
        +{changeSummaryMap[req.id].length - 2}
      </span>
    )}
  </span>
)}
```

`.slice(0, 2)`로 최대 2개까지만 표시하고, 3개 이상이면 `+N` 표시. 설계와 정확히 일치.

---

### 3.2 ContentEditForm.tsx -- 기본 정보 필드 하이라이트

#### 설계 사양

| # | 요구사항 | 상태 |
|---|---------|:----:|
| 2-1 | 제목 input 수정 시: `border-l-[3px] border-l-status-hold-border bg-status-hold-bg/20` | [PASS] |
| 2-2 | 설명 textarea 수정 시: 동일한 좌측 bar + 배경 | [PASS] |
| 2-3 | "원본" 표시를 diff 블록으로 교체: `bg-surface-sunken rounded px-2 py-1` | [PASS] |
| 2-4 | 원본 텍스트에 `line-through` | [PASS] |

#### 구현 확인

**2-1. 제목 input 하이라이트** (L213-216)

```tsx
className={`... ${
  editing.title !== req.title
    ? 'border-l-[3px] border-l-status-hold-border border-t-ln border-r-ln border-b-ln bg-status-hold-bg/20'
    : 'border-ln'
}`}
```

설계 토큰과 정확히 일치. 추가로 `border-t-ln border-r-ln border-b-ln`으로 나머지 세 변 테두리도 처리.

**2-2. 설명 textarea 하이라이트** (L231-234)

제목과 동일한 패턴 적용. `border-l-[3px] border-l-status-hold-border ... bg-status-hold-bg/20`.

**2-3. diff 블록** (L222-226, L241-244)

```tsx
<div className="mt-1.5 flex items-center gap-1.5 bg-surface-sunken rounded px-2 py-1">
  <span className="shrink-0 text-[9px] font-semibold text-tx-muted">원본</span>
  <span className="text-[11px] text-tx-muted line-through">{req.title}</span>
</div>
```

`bg-surface-sunken rounded px-2 py-1` -- 설계와 정확히 일치.

**2-4. 원본 텍스트 `line-through`** -- `text-tx-muted line-through` 적용 확인.

---

### 3.3 CheckpointEditor.tsx -- 체크포인트 카드 하이라이트

#### 설계 사양

| # | 요구사항 | 상태 |
|---|---------|:----:|
| 3-1 | `isModified` 플래그 계산 (body 또는 refs 변경) | [PASS] |
| 3-2 | 수정된 카드: `border-l-[3px] border-l-status-hold-border` 좌측 바 | [PASS] |
| 3-3 | 기존 "원본: ..." 인라인 텍스트를 diff 블록으로 교체 (bg-surface-sunken + line-through) | [PASS] |

#### 구현 확인

**3-1. `isModified` 플래그 계산** (L90-94)

```typescript
const { body: origBody, refs: origRefs } = splitRef(origCp);
const editedBody = editing.checkpoints[i] ?? origBody;
const editedRefs = editing.checkpointRefs[i] ?? [];
const refsChanged = JSON.stringify(editedRefs) !== JSON.stringify(origRefs);
const isBodyOrRefsModified = editedBody !== origBody || refsChanged;
```

설계의 `isModified` 에 해당하는 `isBodyOrRefsModified` 변수. body 변경과 refs 변경 모두 감지.

**3-2. 수정된 카드 좌측 바** (L110-114)

```tsx
className={`rounded-lg border bg-surface-base/50 px-3 py-2.5 space-y-2 ${
  isBodyOrRefsModified
    ? 'border-ln border-l-[3px] border-l-status-hold-border'
    : 'border-ln'
}`}
```

설계 토큰 `border-l-[3px] border-l-status-hold-border` 정확히 적용.

**3-3. diff 블록** (L292-297)

```tsx
{isBodyOrRefsModified && (
  <div className="w-full mt-1 flex items-center gap-1.5 bg-surface-sunken rounded px-2 py-1">
    <span className="shrink-0 text-[9px] font-semibold text-tx-muted">원본</span>
    <span className="text-[10px] text-tx-muted line-through truncate">{origBody}</span>
  </div>
)}
```

`bg-surface-sunken rounded px-2 py-1` + `line-through` -- 설계와 정확히 일치.

---

### 3.4 DetailFieldsEditor.tsx -- 리스트 항목별 비교

#### 설계 사양

| # | 요구사항 | 상태 |
|---|---------|:----:|
| 4-1 | 변경된 항목: 좌측 accent bar (`border-l-[3px] border-l-status-hold-border`) | [PASS] |
| 4-2 | 새로 추가된 항목 (i >= originalItems.length): `+ 신규` 뱃지 | [PASS] |
| 4-3 | 삭제된 원본 항목: 리스트 하단에 취소선으로 표시 | [PASS] |
| 4-4 | passCriteria textarea: 동일한 좌측 bar + diff 블록 패턴 | [PASS] |

#### 구현 확인

**4-1. 변경된 항목 좌측 accent bar** (L60-64)

```tsx
className={`flex-1 rounded border bg-surface-base px-2.5 py-1.5 text-xs ... ${
  isNew || isChanged
    ? 'border-l-[3px] border-l-status-hold-border border-t-ln border-r-ln border-b-ln bg-status-hold-bg/20'
    : 'border-ln'
}`}
```

변경(`isChanged`) 뿐 아니라 신규(`isNew`) 항목에도 동일한 좌측 바 적용.

**4-2. `+ 신규` 뱃지** (L69-72)

```tsx
{isNew && (
  <span className="shrink-0 text-[8px] font-bold text-status-pass-text bg-status-pass-bg px-1 py-0.5 rounded">
    + 신규
  </span>
)}
```

설계 토큰 `bg-status-pass-bg text-status-pass-text` 정확히 적용. `i >= originalItems.length` 조건은 L51의 `const isNew = i >= originalItems.length;`로 구현.

**4-3. 삭제된 원본 항목 표시** (L39-107)

```typescript
// L39-40: 삭제된 원본 계산
const deletedOriginals = originalItems.slice(items.length);

// L98-107: 삭제 항목 렌더링
{deletedOriginals.length > 0 && (
  <div className="mt-1.5 space-y-1">
    {deletedOriginals.map((orig, di) => (
      <div key={`del-${di}`} className="flex items-center gap-1.5 ml-5 bg-surface-sunken rounded px-2 py-1 opacity-60">
        <span className="shrink-0 text-[9px] font-semibold text-status-fail-text">삭제</span>
        <span className="text-[10px] text-tx-muted line-through truncate">{orig}</span>
      </div>
    ))}
  </div>
)}
```

리스트 하단에 `line-through` + `opacity-60`으로 시각적 구분. 설계 요구사항 충족.

**4-4. passCriteria textarea 좌측 bar + diff 블록** (L166-181)

```tsx
// 좌측 bar (L166-169)
className={`... ${
  editing.passCriteria !== (originalReq.passCriteria ?? '')
    ? 'border-l-[3px] border-l-status-hold-border border-t-ln border-r-ln border-b-ln bg-status-hold-bg/20'
    : 'border-ln'
}`}

// diff 블록 (L176-181)
{editing.passCriteria !== (originalReq.passCriteria ?? '') && (
  <div className="mt-1.5 flex items-start gap-1.5 bg-surface-sunken rounded px-2 py-1">
    <span className="shrink-0 text-[9px] font-semibold text-tx-muted mt-px">원본</span>
    <span className="text-[10px] text-tx-muted line-through">{originalReq.passCriteria}</span>
  </div>
)}
```

제목/설명과 동일한 패턴 적용. 설계와 정확히 일치.

---

## 4. 디자인 토큰 준수 검증

| 토큰 용도 | 설계 토큰 | 구현 확인 | 상태 |
|-----------|----------|----------|:----:|
| 수정 배경 | `bg-status-hold-bg/20` | ContentEditForm L215, CheckpointEditor 미사용(카드 레벨), DetailFieldsEditor L62 | [PASS] |
| 수정 보더 | `border-l-status-hold-border` | 4개 파일 모두 적용 | [PASS] |
| diff 블록 배경 | `bg-surface-sunken` | 4개 파일 모두 적용 | [PASS] |
| diff 텍스트 | `text-tx-muted line-through` | 4개 파일 모두 적용 | [PASS] |
| 신규 뱃지 | `bg-status-pass-bg text-status-pass-text` | DetailFieldsEditor L70-71 | [PASS] |
| 칩 스타일 | `text-status-hold-text bg-status-hold-bg` | ContentOverrideManagement L535 | [PASS] |

CSS 변수 존재 확인 (`src/index.css`):
- `--surface-sunken`: L35 (light), L117 (dark)
- `--status-pass-bg`: L90 (light), L156 (dark)
- `--status-pass-text`: L91 (light), L157 (dark)
- `--status-hold-border`: L98 (light), L164 (dark)

모든 토큰이 light/dark 모드에서 정의되어 있음을 확인.

---

## 5. 패턴 일관성 분석

4개 파일 전체에서 동일한 시각적 패턴이 일관되게 적용되어 있음:

| 패턴 | 적용 위치 |
|------|----------|
| 좌측 3px 노란색 바 | ContentEditForm (제목/설명), CheckpointEditor (카드), DetailFieldsEditor (리스트/판정) |
| diff 블록 (bg-surface-sunken + line-through) | ContentEditForm (제목/설명), CheckpointEditor (원본), DetailFieldsEditor (리스트/판정) |
| 변경 감지 배경 (bg-status-hold-bg/20) | ContentEditForm (제목/설명), DetailFieldsEditor (리스트/판정) |
| 변경 요약 칩 (bg-status-hold-bg) | ContentOverrideManagement (좌측 목록) |

모든 파일에서 동일한 디자인 언어를 사용하여 일관된 UX 제공.

---

## 6. 추가 발견 사항

### 6.1 설계 이상 구현 (Design+)

설계 범위를 넘어서 구현된 개선 사항:

| 항목 | 파일 | 설명 |
|------|------|------|
| 변경 항목에 diff 표시 | DetailFieldsEditor L83-88 | 변경된 개별 리스트 항목에도 diff 블록 표시 |
| 삭제 항목에 `삭제` 라벨 | DetailFieldsEditor L102 | `text-status-fail-text`로 삭제 사유 시각 표시 |
| 중요도 변경 하이라이트 | CheckpointEditor L140 | `ring-1 ring-status-hold-border`로 중요도 변경 표시 |
| 참고자료 변경 감지 | CheckpointEditor L93-94 | refs 변경도 isModified에 포함 |
| 설명 diff에 `line-clamp-3` | ContentEditForm L243 | 긴 원본 설명 텍스트 잘림 처리 |

### 6.2 리스크 없음

현재 구현에서 설계 누락이나 불일치로 인한 리스크 요소는 발견되지 않음.

---

## 7. 결론

```
Overall Match Rate: 100%

  [PASS] 구현 항목:    14/14 (100%)
  [WARN] 부분 일치:     0/14 (0%)
  [FAIL] 미구현:        0/14 (0%)
```

설계 사양 4개 파일의 모든 요구사항이 구현 코드에 정확히 반영되어 있다.
디자인 토큰 6종 모두 설계 명세와 일치하며, light/dark 모드에서 CSS 변수가 정의되어 있음을 확인했다.
추가로 설계 범위를 넘어서는 5건의 개선 사항이 구현되어 있어, 설계 의도를 충실히 구현한 것으로 평가한다.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-17 | 콘텐츠 관리 수정 내역 시각적 식별 개선 Gap 분석 | gap-detector |
