# Plan: 점검항목 콘텐츠 오버라이드

> **Feature**: content-override
> **Created**: 2026-02-20
> **Status**: Draft

---

## 1. 문제 정의

### 현재 상태
- 점검항목 제목, 설명, 체크포인트 문구가 **마크다운 파일에 하드코딩**되어 있음
- 문구 수정 시 마크다운 편집 → 빌드 → 배포가 필요
- 담당자, 참조 문서는 이미 Firestore로 DB화되어 관리자 페이지에서 CRUD 가능
- **점검항목 텍스트 콘텐츠만 동적 수정 불가** 상태

### 해결 방향
- 마크다운은 **기본값(폴백)**으로 유지
- Firestore에 **텍스트 오버라이드** 저장
- 관리자 페이지에서 점검항목 제목/설명/체크포인트 문구 편집
- 카테고리 구조(시험준비/수행/종료)는 **변경하지 않음**

---

## 2. 기능 범위

### 2.1 이번 구현 대상

#### A. Firestore 오버라이드 저장소
- 컬렉션: `contentOverrides`
- 문서 ID: requirement ID (예: `SETUP-01`, `EXEC-01`)
- 값이 있는 필드만 오버라이드, 없으면 마크다운 원본 사용

```typescript
// Firestore 문서 구조
interface ContentOverride {
  title?: string;                     // 점검항목 제목
  description?: string;               // 점검항목 설명
  checkpoints?: Record<number, string>; // 체크포인트 문구 (인덱스 → 텍스트)
  updatedAt: Timestamp;
  updatedBy: string;
}
```

#### B. 런타임 병합 로직
- `REQUIREMENTS_DB` (빌드타임 마크다운) + `contentOverrides` (런타임 DB) 병합
- 병합 우선순위: DB 값 > 마크다운 값
- DB 연결 실패 시 마크다운 원본으로 정상 동작 (폴백)

#### C. 관리자 페이지 — 콘텐츠 편집 UI
- 기존 `ContactManagement`, `MaterialManagement`와 동일한 패턴
- 점검항목 목록 → 선택 → 인라인 편집
- 편집 가능 필드: 제목, 설명, 체크포인트 각 항목
- 원본(마크다운) 대비 변경 여부 표시
- "원본으로 되돌리기" 기능 (오버라이드 삭제)

### 2.2 변경하지 않는 것
- 카테고리 구조 (SETUP / EXECUTION / COMPLETION) — 고정
- 점검항목 ID, 순서 — 마크다운 기준 유지
- 마크다운 파일 — 삭제하지 않음 (폴백으로 유지)
- `vite-plugin-content.ts` — 빌드타임 로직 변경 없음
- `quickMode.ts` — 입력 형식 변경 없음 (Requirement 타입 그대로)
- 담당자/참조문서 관리 — 기존 기능 그대로

### 2.3 향후 확장 가능 (이번 범위 아님)
- 체크포인트 추가/삭제 (현재는 문구 수정만)
- 점검항목 순서 변경
- 카테고리 동적 추가
- 변경 이력(히스토리) 관리

---

## 3. 기술 전략

### 3.1 데이터 흐름

```
마크다운 13개 파일
    ↓ (빌드타임)
vite-plugin-content.ts → REQUIREMENTS_DB (정적 배열)
    ↓ (런타임)
mergeOverrides(REQUIREMENTS_DB, firestoreOverrides)
    ↓
최종 Requirement[] → quickMode 변환 → UI 렌더링
```

### 3.2 병합 함수

```typescript
// src/lib/content/mergeOverrides.ts
export function mergeOverrides(
  base: Requirement[],
  overrides: Record<string, ContentOverride>
): Requirement[] {
  return base.map(req => {
    const ov = overrides[req.id];
    if (!ov) return req;
    return {
      ...req,
      title: ov.title ?? req.title,
      description: ov.description ?? req.description,
      checkPoints: req.checkPoints?.map((cp, i) =>
        ov.checkpoints?.[i] ?? cp
      ),
    };
  });
}
```

### 3.3 프론트엔드 구조

```
src/features/admin/components/
  ├─ ContactManagement.tsx       (기존)
  ├─ MaterialManagement.tsx      (기존)
  └─ ContentOverrideManagement.tsx  ← 신규
```

### 3.4 오버라이드 소비 위치

현재 `REQUIREMENTS_DB`를 직접 import하는 파일들에서 병합된 데이터를 사용하도록 전환:

| 소비 파일 | 현재 방식 | 변경 후 |
|-----------|-----------|---------|
| 체크리스트 관련 | `REQUIREMENTS_DB` 직접 import | Context에서 병합된 데이터 소비 |
| `ContactManagement.tsx` | `REQUIREMENTS_DB`에서 step 목록 | 병합 데이터에서 step 목록 |
| `MaterialManagement.tsx` | `REQUIREMENTS_DB`에서 step 목록 | 병합 데이터에서 step 목록 |

---

## 4. 기존 코드 영향도

### 변경 필요한 파일

| 파일 | 변경 내용 | 영향도 |
|------|-----------|--------|
| `REQUIREMENTS_DB` 소비 지점들 | 병합된 데이터 사용으로 전환 | Medium |
| 관리자 라우트/레이아웃 | ContentOverrideManagement 메뉴 추가 | Low |

### 신규 생성 파일

| 파일 | 설명 |
|------|------|
| `src/lib/content/mergeOverrides.ts` | 마크다운 + DB 오버라이드 병합 |
| `src/features/admin/components/ContentOverrideManagement.tsx` | 관리자 콘텐츠 편집 UI |

### 변경하지 않는 파일
- `content/process/*.md` — 마크다운 원본 유지
- `vite-plugin-content.ts` — 빌드 파이프라인 변경 없음
- `src/utils/quickMode.ts` — Requirement 타입 입력 그대로
- `src/types/checklist.ts` — 기존 타입 변경 없음

---

## 5. 구현 순서

### Phase 1: 병합 레이어
1. `ContentOverride` 타입 정의
2. `mergeOverrides()` 함수 구현
3. Firestore `contentOverrides` 컬렉션 실시간 구독
4. 기존 `REQUIREMENTS_DB` 소비 지점에 병합 데이터 연결

### Phase 2: 관리자 UI
1. `ContentOverrideManagement` 컴포넌트 (기존 Admin 패턴 재사용)
2. 점검항목 목록 표시 (카테고리별 그룹)
3. 선택 시 제목/설명/체크포인트 인라인 편집
4. 원본 대비 변경 표시 + "되돌리기" 버튼
5. 관리자 레이아웃에 메뉴 추가

### Phase 3: 검증
1. 오버라이드 적용 시 체크리스트 UI 정상 반영 확인
2. 오버라이드 없을 때 마크다운 원본 정상 표시 확인
3. DB 연결 실패 시 폴백 동작 확인
4. `tsc --noEmit` + `vite build` 통과

---

## 6. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| DB 연결 실패 시 콘텐츠 미표시 | Medium | 마크다운이 폴백이므로 DB 없이도 동작 |
| 마크다운 구조 변경 시 인덱스 불일치 | Low | 인덱스 기반 오버라이드이므로 마크다운 체크포인트 순서 변경 시 재매핑 필요 |
| 오버라이드 데이터 유실 | Low | Firestore 자동 백업 + 원본 마크다운 항상 존재 |

---

## 7. 성공 기준

- [ ] 관리자 페이지에서 점검항목 제목 수정 → 체크리스트 UI에 즉시 반영
- [ ] 관리자 페이지에서 설명 수정 → 체크리스트 UI에 즉시 반영
- [ ] 관리자 페이지에서 체크포인트 문구 수정 → 체크리스트 UI에 즉시 반영
- [ ] "원본으로 되돌리기" 클릭 시 마크다운 원본으로 복원
- [ ] 오버라이드 없는 항목은 마크다운 원본 그대로 표시
- [ ] 기존 기능(담당자, 참조문서, 체크리스트 동작) 정상 유지
- [ ] `tsc --noEmit` + `vite build` 통과
