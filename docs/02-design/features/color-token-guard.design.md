# Design: color-token-guard — 하드코딩 Tailwind 색상 방지 및 잔여 토큰화

> **Feature**: color-token-guard
> **Plan Reference**: `docs/01-plan/features/color-token-guard.plan.md`
> **Author**: Claude Code
> **Date**: 2026-03-14
> **Status**: Draft

---

## 1. 설계 개요

본 설계는 2개 Stream으로 구성된다:

| Stream | 내용 | 수정 파일 |
|--------|------|-----------|
| **Stream 1** | 새 CSS 변수/토큰 정의 + 4개 파일 토큰 전환 | 6개 파일 |
| **Stream 2** | ESLint `no-restricted-syntax` 기반 하드코딩 색상 감지 규칙 | 1개 파일 |

**총 수정 파일**: 7개

---

## 2. Stream 1: 시맨틱 토큰 확장 및 전환

### 2.1 새 CSS 변수 정의

**파일**: `src/index.css`

#### `:root` (라이트 모드)

```css
/* Status - Modified (수정됨) */
--status-modified-bg: #fffbeb;
--status-modified-text: #d97706;
--status-modified-border: #fde68a;

/* Status - Retry (재시험) */
--status-retry-bg: #f3e8ff;
--status-retry-text: #7c3aed;
--status-retry-border: #d8b4fe;
```

#### `.dark` (다크 모드)

```css
--status-modified-bg: rgba(245, 158, 11, 0.15);
--status-modified-text: #fcd34d;
--status-modified-border: rgba(251, 191, 35, 0.3);

--status-retry-bg: rgba(139, 92, 246, 0.15);
--status-retry-text: #c4b5fd;
--status-retry-border: rgba(167, 139, 250, 0.3);
```

**설계 근거**:
- `status-modified` 색상은 기존 `status-hold` (amber 계열)과 유사하지만 별도 토큰으로 분리하여 의미적 독립성 확보
- `status-retry` 색상은 purple 계열 — "재시험"이라는 특수 상태를 나타내며 기존 토큰과 충돌하지 않음
- 다크 모드 값은 기존 status 토큰과 동일한 패턴(`rgba + 0.15 배경`, `밝은 텍스트`) 준수

### 2.2 Tailwind 토큰 매핑

**파일**: `tailwind.config.js`

`theme.extend.colors.status` 객체에 추가:

```js
'modified-bg': 'var(--status-modified-bg)',
'modified-text': 'var(--status-modified-text)',
'modified-border': 'var(--status-modified-border)',
'retry-bg': 'var(--status-retry-bg)',
'retry-text': 'var(--status-retry-text)',
'retry-border': 'var(--status-retry-border)',
```

### 2.3 파일별 전환 상세

#### 2.3.1 `src/features/checklist/components/HelperToolsPopup.tsx`

**변경 방식**: `TOOL_CATEGORIES` 배열의 `color` 프로퍼티 값 치환

| Line | 현재 값 | 전환 후 | 매핑 이유 |
|------|---------|---------|-----------|
| 21 | `text-rose-500 dark:text-rose-400` | `text-status-fail-text` | 캡처/녹화 → "주의" 의미, fail 토큰이 시맨틱으로 적합 |
| 30 | `text-sky-500 dark:text-sky-400` | `text-accent-text` | 원격 접속 → "액션" 의미, accent 토큰 활용 |
| 39 | `text-emerald-500 dark:text-emerald-400` | `text-status-pass-text` | 테스트 도구 → "성공/진행" 의미, pass 토큰 적합 |
| 48 | `text-amber-500 dark:text-amber-400` | `text-status-hold-text` | 성능 측정 → "대기/측정" 의미, hold 토큰 적합 |

**변경 후 dark 모드 대응**: 시맨틱 토큰이 CSS 변수 기반이므로 `dark:` 접두사 불필요 — 자동 전환됨. 기존 `dark:text-rose-400` 같은 이중 선언 제거.

#### 2.3.2 `src/features/checklist/components/NextItemsPanel.tsx`

| Line | 현재 값 | 전환 후 |
|------|---------|---------|
| 41 | `text-emerald-500` | `text-status-pass-text` |
| 92 | `text-yellow-600` | `text-status-hold-text` |

**참고**: Line 92의 `text-yellow-600`은 보류(Hold) 상태 아이콘이며, 이미 같은 파일 Line 90에서 `border-status-hold-border`, `bg-status-hold-bg`를 사용 중 — 일관성 확보.

#### 2.3.3 `src/features/admin/components/ReferenceGuideManagement.tsx`

| Line | 현재 값 | 전환 후 |
|------|---------|---------|
| 266 | `text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10` | `text-status-modified-text bg-status-modified-bg` |
| 277 | `hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10` | `hover:text-status-modified-text hover:bg-status-modified-bg` |

**변경 후 dark 모드 대응**: `dark:` 접두사 제거 — CSS 변수로 자동 전환.

#### 2.3.4 `src/features/test-setup/components/modals/ProjectListModal.tsx`

| Line | 현재 값 | 전환 후 |
|------|---------|---------|
| 16 | `bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400` | `bg-status-retry-bg text-status-retry-text` |
| 170 | `border-purple-400/60` | `border-accent/60` |

**Line 170 설계 근거**: 활성 프로젝트 카드의 테두리로, `bg-accent`와 함께 사용되므로 `border-accent/60`이 시맨틱으로 일관됨.

---

## 3. Stream 2: ESLint 하드코딩 색상 감지 규칙

### 3.1 구현 방식 선택

**선택**: `no-restricted-syntax` 규칙 활용 (별도 플러그인 불필요)

**이유**:
- ESLint flat config에서 바로 사용 가능
- 프로젝트에 새 의존성 추가 불필요
- JSX 속성(className)에서 문자열 리터럴 내 패턴 매칭이 목적

### 3.2 규칙 설계

**파일**: `eslint.config.js`

className 속성의 문자열 리터럴에서 하드코딩 Tailwind 색상 패턴을 감지하는 `no-restricted-syntax` 셀렉터를 추가한다.

다만 `no-restricted-syntax`는 AST 셀렉터 기반이므로 **문자열 내용**을 검사하기 어렵다. 따라서 다음 접근을 사용한다:

**최종 방식**: 프로젝트 로컬 ESLint 플러그인 파일

**파일**: `eslint-rules/no-hardcoded-tailwind-colors.js`

```js
// ESM 모듈
export default {
  meta: {
    type: 'suggestion',
    docs: { description: '시맨틱 토큰 대신 하드코딩된 Tailwind 색상 사용 금지' },
    messages: {
      noHardcodedColor: '하드코딩된 Tailwind 색상 "{{match}}"를 발견했습니다. 시맨틱 토큰을 사용하세요.'
    },
    schema: []
  },
  create(context) {
    // 정규식: (prefix)-(color)-(shade) 패턴
    const PATTERN = /\b(?:bg|text|border|ring|from|via|to|divide|outline|shadow|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/g;

    function checkString(node, value) {
      let m;
      PATTERN.lastIndex = 0;
      while ((m = PATTERN.exec(value)) !== null) {
        context.report({ node, messageId: 'noHardcodedColor', data: { match: m[0] } });
      }
    }

    return {
      // JSX 속성의 문자열 리터럴
      Literal(node) {
        if (typeof node.value === 'string') checkString(node, node.value);
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkString(node, quasi.value.raw);
        }
      }
    };
  }
};
```

### 3.3 ESLint 설정 통합

**파일**: `eslint.config.js`

```js
import noHardcodedTailwindColors from './eslint-rules/no-hardcoded-tailwind-colors.js';

export default defineConfig([
  // ... 기존 설정 ...
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/constants/schedule.ts',
      'src/components/schedule/**',
    ],
    plugins: {
      'local': { rules: { 'no-hardcoded-tailwind-colors': noHardcodedTailwindColors } }
    },
    rules: {
      'local/no-hardcoded-tailwind-colors': 'warn'
    }
  }
])
```

### 3.4 범위 제외 전략

| 방식 | 적용 대상 |
|------|-----------|
| `ignores` (설정 레벨) | `schedule.ts`, `schedule/**` — 갠트 차트 도메인 색상 전체 |
| `// eslint-disable-next-line` (라인 레벨) | `TestSetupPage.tsx`의 브랜드 그래디언트 및 단계 배지 |
| `// eslint-disable-next-line` (라인 레벨) | `TestInfoCard.tsx`의 `<option>` 태그 (`text-gray-900`) |

### 3.5 규칙 심각도

- 초기: `warn` (경고) — 기존 범위 제외 파일에 대한 점진적 적용
- 안정화 후: `error`로 격상 가능 (후속 결정)

---

## 4. 구현 순서

```
Step 1: src/index.css — 새 CSS 변수 6개 추가 (:root + .dark)
Step 2: tailwind.config.js — 새 토큰 매핑 6개 추가
Step 3: HelperToolsPopup.tsx — color 프로퍼티 4곳 전환
Step 4: NextItemsPanel.tsx — 아이콘 className 2곳 전환
Step 5: ReferenceGuideManagement.tsx — 배지+버튼 className 2곳 전환
Step 6: ProjectListModal.tsx — STATUS_COLORS + 카드 테두리 2곳 전환
Step 7: eslint-rules/no-hardcoded-tailwind-colors.js — 규칙 파일 생성
Step 8: eslint.config.js — 로컬 플러그인 등록 + ignores 설정
Step 9: npm run lint — 전체 통과 확인
```

---

## 5. 파일 변경 목록

| # | 파일 | 변경 유형 | 설명 |
|---|------|-----------|------|
| 1 | `src/index.css` | 수정 | CSS 변수 6개 추가 (`:root` 3개, `.dark` 3개씩 × 2세트) |
| 2 | `tailwind.config.js` | 수정 | `status` 토큰에 modified/retry 6개 추가 |
| 3 | `src/features/checklist/components/HelperToolsPopup.tsx` | 수정 | `color` 프로퍼티 4곳 시맨틱 토큰 전환 |
| 4 | `src/features/checklist/components/NextItemsPanel.tsx` | 수정 | 아이콘 className 2곳 시맨틱 토큰 전환 |
| 5 | `src/features/admin/components/ReferenceGuideManagement.tsx` | 수정 | 배지/버튼 className 2곳 시맨틱 토큰 전환 |
| 6 | `src/features/test-setup/components/modals/ProjectListModal.tsx` | 수정 | STATUS_COLORS + 카드 테두리 2곳 시맨틱 토큰 전환 |
| 7 | `eslint-rules/no-hardcoded-tailwind-colors.js` | 신규 | ESLint 로컬 규칙 파일 |
| 8 | `eslint.config.js` | 수정 | 로컬 플러그인 등록 + ignores |

---

## 6. 검증 체크리스트

- [ ] 라이트 모드에서 4개 파일의 색상이 기존과 시각적으로 동일
- [ ] 다크 모드에서 4개 파일의 색상이 기존과 시각적으로 동일
- [ ] `npm run lint` 전체 통과 (0 errors)
- [ ] 테스트: 새 `.tsx` 파일에 `bg-red-500` 작성 시 lint warning 발생
- [ ] 범위 제외: `schedule.ts`에서 lint warning 미발생
- [ ] `npm run build` 성공
