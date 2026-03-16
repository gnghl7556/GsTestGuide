# Plan: 자동 줄바꿈 기능

> 점검 항목 및 체크리스트 항목의 긴 텍스트가 적절하게 줄바꿈되도록 개선

## 1. 배경

현재 체크리스트 UI에서 긴 텍스트가 잘리거나 컨테이너 밖으로 넘치는 문제가 있다.

| 구역 | 파일 | 라인 | 현재 상태 | 심각도 |
|------|------|:----:|----------|:------:|
| 중앙 — 체크포인트 제목 | CenterDisplay.tsx | 288 | 오버플로우 제어 없음 (`text-2xl font-bold`) | 높음 |
| 중앙 — 질문 텍스트 | CenterDisplay.tsx | 404 | 래핑 규칙 없음 (`text-[14px]`) | 높음 |
| 좌측 — 항목 제목 | NavSidebar.tsx | 301 | `truncate` + `toShortLabel` 14글자 이중 절단 | 중간 |
| 우측 — 다음할일 제목 | NextItemsPanel.tsx | 64, 93 | `truncate`로 한 줄 말줄임 | 낮음 |

## 2. 목표

- 중앙 디스플레이의 **제목**(h2)과 **질문 텍스트**가 컨테이너 폭에 맞춰 자연스럽게 줄바꿈
- 좌측 NavSidebar 제목이 2줄까지 표시 후 말줄임 (`line-clamp-2`)
- 우측 NextItemsPanel 제목도 2줄까지 허용
- 기존 레이아웃(3열 그리드) 파괴 없이 텍스트만 개선

## 3. 수정 대상

### 3.1. CenterDisplay.tsx — 체크포인트 제목 (라인 288)

**현재**: `<h2 className="text-2xl font-bold leading-snug ...">`
**변경**: `break-words` 추가로 단어 단위 줄바꿈 보장

### 3.2. CenterDisplay.tsx — 질문 텍스트 (라인 404)

**현재**: `<span className="text-[14px] leading-snug font-semibold ...">`
**변경**: `break-words` 추가

### 3.3. NavSidebar.tsx — 항목 제목 (라인 301)

**현재**: `truncate` (1줄 말줄임) + `toShortLabel` 14글자 절단
**변경**: `truncate` → `line-clamp-2` (2줄 허용 후 말줄임), `toShortLabel` 절단 길이 완화

### 3.4. NextItemsPanel.tsx — 다음할일 제목 (라인 64, 93)

**현재**: `truncate` (1줄 말줄임)
**변경**: `truncate` → `line-clamp-2` (2줄 허용)

## 4. 수정 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/features/checklist/components/CenterDisplay.tsx` | 제목/질문에 `break-words` 추가 |
| `src/features/checklist/components/NavSidebar.tsx` | `truncate` → `line-clamp-2`, `toShortLabel` 완화 |
| `src/features/checklist/components/NextItemsPanel.tsx` | `truncate` → `line-clamp-2` |

## 5. 범위 외

- 담당자 전화번호/이메일 영역 (`whitespace-nowrap`) — 의도적 고정, 변경 불필요
- 프로세스 마크다운 본문 영역 — 이미 정상 래핑
- 모바일 반응형 — 별도 이슈

## 6. 검증 기준

1. `npm run build` 성공
2. 중앙 디스플레이에서 30자 이상 제목이 자연스럽게 줄바꿈
3. 질문 텍스트 40자 이상도 컨테이너 내부에 래핑
4. NavSidebar에서 긴 제목이 2줄까지 표시 후 `...` 처리
5. NextItemsPanel에서도 2줄 표시
6. 기존 짧은 텍스트 항목의 레이아웃 변경 없음
