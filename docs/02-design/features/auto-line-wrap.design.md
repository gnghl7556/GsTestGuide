# Design: 자동 줄바꿈 기능

> Plan: `docs/01-plan/features/auto-line-wrap.plan.md`

## 1. 변경 명세

### 1.1. CenterDisplay.tsx — 체크포인트 제목 (라인 288)

```diff
- <h2 className={`text-2xl font-bold leading-snug ${isNA ? 'text-tx-muted' : 'text-tx-primary'}`}>
+ <h2 className={`text-2xl font-bold leading-snug break-words ${isNA ? 'text-tx-muted' : 'text-tx-primary'}`}>
```

- `break-words` 추가 → Tailwind의 `overflow-wrap: break-word` 적용
- 컨테이너 폭 초과 시 단어 내에서도 줄바꿈 발생
- `flex-wrap`이 이미 부모(라인 287)에 적용되어 있으므로 h2와 refItems 칩 간 래핑도 정상

### 1.2. CenterDisplay.tsx — 질문 텍스트 (라인 404)

```diff
- <span className="text-[14px] leading-snug font-semibold text-tx-primary">{question.text}</span>
+ <span className="text-[14px] leading-snug font-semibold text-tx-primary break-words">{question.text}</span>
```

- `break-words` 추가
- 부모(라인 373 부근)에 `min-w-0`이 있으므로 flex 자식으로서 정상 수축

### 1.3. NavSidebar.tsx — 항목 제목 (라인 301)

```diff
- <span className="block truncate flex-1">{toShortLabel(item.title)}</span>
+ <span className="block flex-1 line-clamp-2 break-words">{toShortLabel(item.title)}</span>
```

- `truncate` → `line-clamp-2` 교체: 2줄까지 표시 후 `...` 말줄임
- `break-words` 추가: 긴 단어도 줄바꿈
- `truncate`는 `whitespace-nowrap`을 포함하므로 반드시 제거 (충돌 방지)

### 1.4. NavSidebar.tsx — `toShortLabel` 함수 (라인 39-44)

```diff
  const toShortLabel = (text: string) => {
    const mapped = shortLabelMap[text];
    if (mapped) return mapped;
    const cleaned = text.replace(/[?.,]/g, '').trim();
-   return cleaned.length > 14 ? `${cleaned.slice(0, 14)}…` : cleaned;
+   return cleaned;
  };
```

- 14글자 절단 제거 — `line-clamp-2`가 시각적 절단을 담당하므로 JS 레벨 절단 불필요
- `shortLabelMap`은 유지 (특정 긴 문장에 대한 수동 매핑)
- `?.,` 제거 로직도 유지 (제목 정리)

### 1.5. NextItemsPanel.tsx — 미검토 항목 제목 (라인 64)

```diff
- <span className="block text-xs font-semibold text-tx-primary truncate">
+ <span className="block text-xs font-semibold text-tx-primary line-clamp-2 break-words">
```

### 1.6. NextItemsPanel.tsx — 보류 항목 제목 (라인 93)

```diff
- <span className="flex-1 min-w-0 text-xs font-semibold text-tx-primary truncate">
+ <span className="flex-1 min-w-0 text-xs font-semibold text-tx-primary line-clamp-2 break-words">
```

## 2. 구현 순서

1. CenterDisplay.tsx — `break-words` 2곳 추가
2. NavSidebar.tsx — `truncate` → `line-clamp-2` + `toShortLabel` 절단 제거
3. NextItemsPanel.tsx — `truncate` → `line-clamp-2` 2곳

## 3. Tailwind 클래스 참고

| 클래스 | CSS | 용도 |
|--------|-----|------|
| `break-words` | `overflow-wrap: break-word` | 컨테이너 폭 초과 시 단어 내 줄바꿈 |
| `line-clamp-2` | `-webkit-line-clamp: 2; display: -webkit-box; overflow: hidden` | 2줄 말줄임 |
| `truncate` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` | 1줄 말줄임 (제거 대상) |

## 4. 수정 파일 요약

| 파일 | 변경 수 | 내용 |
|------|:-------:|------|
| `CenterDisplay.tsx` | 2 | 라인 288, 404에 `break-words` 추가 |
| `NavSidebar.tsx` | 2 | 라인 301 `truncate` → `line-clamp-2`, `toShortLabel` 절단 제거 |
| `NextItemsPanel.tsx` | 2 | 라인 64, 93 `truncate` → `line-clamp-2` |

총 6곳 변경, 모두 CSS 클래스 수정 + 1곳 JS 로직 단순화.
