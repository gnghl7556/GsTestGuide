# CLAUDE.md — GsTestGuide 유지보수 및 개선 가이드

> GS 인증 시험 전 과정(준비 → 설계 → 수행 → 패치/회귀 → 종료)을 관리하는 내부 도구.
> 이 문서는 Claude Code가 본 프로젝트를 이해하고 일관성 있게 작업하기 위한 컨텍스트를 제공한다.

---

## 1. 프로젝트 개요

| 항목 | 값 |
|---|---|
| 목적 | GS 인증 시험의 결함 차수 관리(1~4차), 회귀 테스트 추적, 산출물 자동 생성 |
| 대상 사용자 | 시험원(Tester), PL(Project Leader), Admin |
| 배포 URL | https://gs-test-guide.vercel.app |
| 저장소 | https://github.com/gnghl7556/GSTESTGUIDE |
| 상태 | 핵심 기능 90% 완료, 유지보수 및 고도화 단계 |

---

## 2. 기술 스택

| 레이어 | 기술 | 버전/비고 |
|---|---|---|
| Framework | React + TypeScript | React 19, TS ~5.9 |
| Bundler | Vite | v7, 커스텀 `vite-plugin-content.ts` 포함 |
| Styling | Tailwind CSS v3 | 커스텀 색상 팔레트 + CSS 변수 기반 시맨틱 토큰 (`surface`, `tx`, `ln`, `accent`, `status` 등) |
| Icons | lucide-react | |
| Routing | react-router-dom v7 | Lazy loading 적용 |
| DnD | @dnd-kit/core + @dnd-kit/sortable | |
| State | React Context API | `TestSetupProvider`, `ExecutionToolbarContext`, `ThemeProvider` |
| Backend | Firebase | Firestore, Storage, Authentication, Cloud Functions |
| Functions | Firebase Cloud Functions v2 | Node 20, region: `asia-northeast3` |
| Functions 라이브러리 | exceljs, mammoth, pdf-parse, xlsx | 합의서 파싱 및 결함 리포트 엑셀 생성 |
| Content | Markdown (gray-matter) | `content/` 디렉터리, Vite 빌드 시 가상 모듈로 변환 |
| Hosting (메인) | Vercel | SPA rewrite 설정 |
| Hosting (쇼케이스) | Firebase Hosting | `website/` 서브 프로젝트 |
| Font | Pretendard Variable | 한국어 최적화 |

---

## 3. 프로젝트 구조

```
GsTestGuide/
├── content/                    # 마크다운 기반 프로세스·결함 참조 데이터
│   ├── process/                # 시험 7단계 프로세스 정의 (01~03)
│   ├── defect-references/      # 품질특성별 결함 사례 (기능적합성, 보안성 등)
│   ├── references/             # 업체 응대 가이드, 물리적 마무리
│   ├── rules/                  # execution-gate 등 실행 규칙
│   └── theme/                  # 카테고리 정의 및 테마 색상
├── docs/                       # 프로젝트 산출물 (plan → design → analysis → report)
│   ├── 01-plan/
│   ├── 02-design/
│   ├── 03-analysis/
│   ├── 04-report/
│   ├── archive/                # 완료된 피처 문서 아카이브 (월별)
│   ├── COMMIT_CONVENTION.md
│   └── firestore-structure.md
├── functions/                  # Firebase Cloud Functions
│   ├── assets/templates/       # 엑셀 템플릿 (defect_report_template_fix.xlsx 등)
│   ├── src/
│   │   ├── index.ts            # 메인 함수 (onAgreementUpload, saveDefectReport 등)
│   │   ├── parsers/            # docxParser, pdfParser
│   │   └── utils/              # excelGenerator, textCleaner
│   └── package.json
├── public/
├── scripts/                    # 마이그레이션/정리 스크립트
├── src/
│   ├── App.tsx                 # 루트 컴포넌트 (Provider 트리)
│   ├── routes.tsx              # 라우트 정의 (lazy loading)
│   ├── main.tsx                # 엔트리
│   ├── index.css               # 글로벌 CSS + CSS 변수 (다크/라이트)
│   ├── components/
│   │   ├── Layout/             # AppShell, WorkspaceLayout, Sidebar 등
│   │   ├── schedule/           # 간트 차트/일정 관련
│   │   └── ui/                 # 공통 UI (Button, Input, Modal 등)
│   ├── constants/              # schedule.ts 등
│   ├── features/               # ★ Feature-First 구조
│   │   ├── admin/              # 어드민 (유저·프로젝트·연락처·자료·콘텐츠·가이드 관리)
│   │   ├── checklist/          # 체크리스트 수행 (QuickMode, 분기 로직)
│   │   ├── defects/            # 결함 보고 (차수별 관리, 파생 결함)
│   │   ├── design/             # 기능 명세, TC 설계
│   │   ├── pl-directory/       # PL 연락처 디렉터리
│   │   ├── project-management/ # 프로젝트 CRUD
│   │   ├── report/             # 최종 산출물, 통계
│   │   └── test-setup/         # 시험 식별, 합의서 파싱, 환경 구성, 대시보드
│   ├── hooks/                  # 공통 훅 (useAuthReady, useUsers 등)
│   ├── lib/
│   │   ├── firebase.ts         # Firebase 초기화 (환경변수 기반)
│   │   └── content/            # mergeOverrides (콘텐츠 오버라이드 병합)
│   ├── providers/              # Context Providers
│   ├── types/                  # 전역 타입 정의
│   └── utils/                  # branchingResolver, checklistGenerator, quickMode 등
├── website/                    # 쇼케이스 정적 사이트 (별도 Vite 프로젝트)
├── .env.example                # Firebase 환경변수 템플릿
├── firebase.json               # Firebase 호스팅·함수·규칙 설정
├── firestore.rules             # Firestore 보안 규칙 (프로젝트 잠금 포함)
├── storage.rules               # Storage 보안 규칙
├── CLAUDE.md                   # 프로젝트 컨텍스트 및 유지보수 가이드
├── TODO.md                     # 개발 로드맵
├── tailwind.config.js          # 커스텀 색상 팔레트 + 시맨틱 토큰
├── vite-plugin-content.ts      # content/ 마크다운을 가상 모듈로 변환하는 커스텀 플러그인
└── vite.config.ts
```

---

## 4. 핵심 도메인 개념

### 4.1. GS 인증 시험 워크플로우 (4 Phase)

**Phase 1 — SETUP (준비):** 시험 환경 구성, 합의서 파싱, 제품 설치 확인
**Phase 2 — DESIGN (설계):** 기능 리스트(DUR-PLAN) 작성, TC 설계(DUR-DESIGN)
**Phase 3 — EXECUTION (수행):** 초기 테스트 → 1차 패치/회귀 → 2차 패치/최종 (조건 분기 포함)
**Phase 4 — COMPLETION (종료):** 최종 산출물 정리, 데이터 삭제, 장비 반납

### 4.2. 결함 차수 관리

- **1~2차 리포트**: 초기 테스트에서 발견된 결함
- **3차 리포트**: 1차 패치 후 회귀 테스트에서 발견된 **파생 결함** (`isDerived: true` 자동 마킹)
- **4차 리포트**: 2차 패치 후 최종 결과 (이후 결함은 수정 불가, 심사 상정)

### 4.3. Execution Gate (조건부 실행)

`ExecutionGateState` 기반으로 기능 회귀 결과에 따라 보안/성능 테스트 활성화 여부를 제어한다.
- **기능 파생 결함 발견** → 보안/성능 생략, 즉시 리포트 발행
- **기능 파생 결함 없음** → 보안/성능 테스트 수행
- **Final Lock**: `finalizedAt` 존재 또는 `status == '완료'` → 프론트 UI + Firestore Rules + Cloud Functions 3중 잠금

### 4.4. 콘텐츠 시스템

`content/` 디렉터리의 마크다운 파일을 `vite-plugin-content.ts`가 빌드 시 가상 모듈(`virtual:content/*`)로 변환.
런타임에는 `mergeOverrides`를 통해 Admin이 Firestore에 저장한 오버라이드 데이터와 빌드 타임 콘텐츠를 병합.

---

## 5. 데이터 모델 (Firestore)

```
projects/{projectId}                    # 프로젝트 마스터 (식별, 상태, 일정, 담당자, executionState)
  ├── features/{featureId}              # 기능 리스트
  ├── testCases/{testCaseId}            # 테스트 케이스
  └── defects/{defectId}               # 결함 (차수별, 파생 여부, 상태 관리)

testDocuments/{testNumber}              # 시험 관련 문서 메타
agreementDocs/{testNumber}              # 합의서 업로드·파싱 결과
quickReviews/{testNumber}               # 체크리스트 QuickMode 응답
users/{userId}                          # 사용자 (시험원)
plContacts/{plId}                       # PL 연락처
```

### 주요 타입 (`src/types/`)

- `Project` — 프로젝트 전체 정보 + `executionState: ExecutionGateState`
- `Defect` — 결함 (`reportVersion: 1|2|3|4`, `isDerived`, `severity: H|M|L`, `frequency: A|I`)
- `User` — 사용자 (`role: PL|Tester|Admin`, `rank: 전임|선임|책임|수석`)
- `Requirement` / `ChecklistItem` — 체크리스트 항목 (분기 규칙, 포함/제외 조건)
- `QuickReviewAnswer` — QuickMode 응답 (`answers`, `autoRecommendation`, `finalDecision`)
- `TestSetupState` — 시험 설정 상태 (Context로 전역 공유)
- `AgreementParsed` — 합의서 파싱 결과

---

## 6. 아키텍처 패턴 및 코딩 규칙

### 6.1. Feature-First 구조 (엄수)

모든 도메인 로직은 `src/features/{feature-name}/` 하위에 배치한다.

```
src/features/{feature-name}/
├── components/    # UI 컴포넌트
├── hooks/         # 로직 (데이터 fetch, 상태 관리)
├── routes/        # 라우트 페이지 컴포넌트
├── data/          # 정적 데이터, 상수 (선택)
├── utils/         # 유틸리티 (선택)
└── shared/        # 피처 내 공유 컴포넌트 (선택)
```

### 6.2. 관심사 분리 (SoC)

- **UI** (`components/`)와 **로직** (`hooks/`)을 분리
- `hooks/`에서 Firestore 읽기/쓰기 처리, `components/`는 렌더링에만 집중
- 공통 UI는 `src/components/ui/` (Button, Input, Modal 등)

### 6.3. 상태 관리

- **전역 상태**: React Context (`TestSetupProvider`) — 현재 프로젝트 정보, 사용자, PL 목록
- **로컬 상태**: 개별 컴포넌트의 `useState`/`useReducer`
- **영속 상태**: localStorage (`gs-test-guide:review` 키) — 세션 복원용
- Context에 새 데이터 추가 시 `providers/testSetupContext.ts` 타입을 먼저 수정

### 6.4. 스타일링

- Tailwind CSS 유틸리티 클래스 사용, 인라인 style 지양
- **시맨틱 토큰 우선**: `bg-surface-base`, `text-tx-primary`, `border-ln` 등 사용 (다크/라이트 자동 대응)
- 하드코딩된 색상(`bg-gray-100` 등) 대신 시맨틱 토큰 사용
- 상태 색상: `status-pass-*`, `status-fail-*`, `status-hold-*`, `status-pending-*`
- 커스텀 CSS 변수는 `src/index.css`에 정의

### 6.5. 라우팅

- `src/routes.tsx`에서 중앙 관리
- 페이지 컴포넌트는 `React.lazy()`로 코드 스플리팅
- 어드민 라우트는 `AdminGuard`로 보호
- `WorkspaceLayout`으로 execution/report 공통 레이아웃 처리

### 6.6. TypeScript

- `strict: true` 기본
- 새 엔티티 타입은 반드시 `src/types/`에 정의 후 `index.ts`에서 re-export
- `as` 타입 단언 최소화, 타입 가드 함수 선호

### 6.7. 커밋 컨벤션

`docs/COMMIT_CONVENTION.md` 참조. 형식: `<이모티콘> <타입>: <제목>`
- ✨ `feat` / 🐛 `fix` / 📝 `docs` / ♻️ `refactor` / 💄 `style` / ⚡ `perf` / ✅ `test`
- 한국어 커밋 메시지 사용

---

## 7. Firebase 운영 규칙

### 7.1. 리전

- Cloud Functions 리전: **asia-northeast3** (서울)
- 클라이언트 `getFunctions()` 호출 시에도 동일 리전 지정 필수

### 7.2. Firestore 보안 규칙

- 인증된 사용자만 읽기/쓰기 가능 (`request.auth != null`)
- **결함(defects)**: `isProjectLocked()` 함수로 프로젝트 완료/최종화 시 쓰기 차단
- 보안 규칙 변경 시 `firestore.rules` 파일 수정 후 `firebase deploy --only firestore:rules`

### 7.3. Storage 보안 규칙

- `previews/`: 공개 읽기, 쓰기 불가 (정적 프리뷰 이미지)
- `agreements/`: 인증 사용자만 읽기/쓰기
- `checklist-previews/`, `sample-downloads/`: 공개 읽기, 인증 사용자 쓰기

### 7.4. Cloud Functions

- `onAgreementUpload`: Storage 트리거 — 합의서 업로드 시 자동 파싱 (PDF/DOCX)
- `saveDefectReport`: Callable — 결함 리포트 엑셀 생성 (프로젝트 잠금 확인 포함)
- `uploadPreviewAssets`: HTTP — 프리뷰 이미지 업로드
- 엑셀 생성: `functions/assets/templates/` 내 템플릿 기반, `{Placeholder}` 치환 방식

### 7.5. 환경변수

`.env.example` 참조. 필수 변수:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_ADMIN_PASSWORD
```

---

## 8. 개발 명령어

```bash
# 프론트엔드 개발 서버
npm run dev

# 빌드 (TypeScript 컴파일 → Vite 빌드)
npm run build

# 린트
npm run lint

# Cloud Functions 빌드
cd functions && npm run build

# Cloud Functions 배포
cd functions && npm run deploy

# Firebase 전체 배포
firebase deploy

# Functions 에뮬레이터
cd functions && npm run serve
```

---

## 9. 현재 알려진 미완료 항목 (TODO.md 기반)

### 완료된 핵심 기능
- ✅ 합의서 파싱 (PDF/DOCX)
- ✅ 결함 리포트 엑셀 생성 (헤더 치환, 동적 행, Data Validation)
- ✅ 기능 회귀 모드 UI
- ✅ 조건부 활성화(Locking) 및 파생 결함 자동 마킹
- ✅ 4차 리포트 이후 결함 수정 Lock
- ✅ Pass/Fail 처리 및 즉시 결함 보고 연동
- ✅ 어드민 관리 (사용자, 프로젝트, 연락처, 자료, 콘텐츠 오버라이드, 가이드)

### 미완료 항목
- 🔲 `test-setup` 페이지에 '운영환경' 입력란 추가 (필드는 모델에 존재)
- 🔲 `src/components`의 모달들을 `src/features`로 이동 (구조 정리)
- 🔲 공통 UI(`Button`, `Input`) 스타일 통일
- 🔲 기능 리스트 및 TC 작성 기능 고도화

---

## 10. 유지보수 시 주의사항

### 10.1. 콘텐츠 수정

- `content/` 마크다운 수정 시 Vite 재시작 필요 (빌드 타임 가상 모듈)
- Admin의 콘텐츠 오버라이드는 Firestore에 저장되어 런타임에 병합됨
- 프로세스 데이터는 옵시디언에서 Vault로 열어 시각적으로 편집 가능

### 10.2. Execution Gate 로직 변경

3중 잠금 구조이므로 변경 시 3곳 모두 동기화 필요:
1. **프론트**: `src/features/checklist/` 내 게이트 로직
2. **Cloud Functions**: `functions/src/index.ts` 내 `isProjectFinalized()`
3. **Firestore Rules**: `firestore.rules` 내 `isProjectLocked()`

### 10.3. 엑셀 템플릿 수정

- 템플릿 파일: `functions/assets/templates/`
- **Header Logic**: 코드 내 하드코딩 금지. 템플릿 셀의 문자열을 읽어 `replace('{Key}', value)` 방식으로 치환 (예: `{TestNumber}`, `{Date}`)
- **Row Logic**: 리스트 데이터는 템플릿의 '샘플 행' 스타일을 복제(Copy Style)하여 추가하고, 처리 후 샘플 행 삭제
- **Column Value Constraints (Enum)**:
  - 결함 정도 (Severity): `H` (High), `M` (Medium), `L` (Low)
  - 발생 빈도 (Frequency): `A` (Always), `I` (Intermittent)
  - 엑셀 생성 시 해당 컬럼에 `Data Validation` (List Type) 적용 필수

### 10.4. 새 Feature 추가 시

1. `src/features/{new-feature}/` 디렉터리 생성 (components, hooks, routes)
2. 타입 정의 → `src/types/`에 추가
3. 라우트 추가 → `src/routes.tsx`에 lazy import 등록
4. Firestore 컬렉션 추가 시 → `docs/firestore-structure.md` 업데이트
5. 보안 규칙 필요 시 → `firestore.rules` / `storage.rules` 업데이트

### 10.5. 성능 고려사항

- 라우트 단위 코드 스플리팅 (`React.lazy`) 유지
- Firestore 쿼리 시 필요한 필드만 조회
- `useMemo`/`useCallback` 적절히 사용 (과도한 최적화 지양)

---

## 11. 개선 방향 (권장)

### 단기 (Quick Wins)
- 모달 컴포넌트를 feature 디렉터리로 이동하여 구조 통일
- 공통 UI 컴포넌트 스타일 일관성 확보
- `운영환경` 입력 UI 추가 (모델은 이미 준비됨)

### 중기
- E2E 테스트 도입 (Playwright 권장 — 체크리스트 분기 로직, Execution Gate 검증)
- 에러 바운더리 체계화 (현재 Suspense fallback만 존재)
- Cloud Functions 로깅 강화 (파싱 실패 시 디버깅 용이성)

### 장기
- Firestore 보안 규칙 세분화 (현재 `/{document=**}` 와일드카드 규칙 존재 — 잠재적 보안 이슈)
- 오프라인 지원 (Firestore persistence 활성화)
- 실시간 협업 기능 (동시 결함 편집 충돌 방지)
- CI/CD 파이프라인 구축 (현재 GitHub Actions 미설정)

---

## 12. 참조 문서

| 문서 | 위치 | 용도 |
|---|---|---|
| 프로젝트 컨텍스트 | `CLAUDE.md` | 본 문서 (프로젝트 전체 가이드) |
| 개발 로드맵 | `TODO.md` | 미완료 항목 추적 |
| 커밋 컨벤션 | `docs/COMMIT_CONVENTION.md` | 커밋 메시지 작성 규칙 |
| Firestore 구조 | `docs/firestore-structure.md` | 컬렉션·필드 정의 |
| 콘텐츠 데이터 | `content/README.md` | 마크다운 콘텐츠 구조 |
| 텍스트 추출 | `functions/README-TEXT-EXTRACTION.md` | 합의서 파싱 로직 |
| 피처 산출물 | `docs/01~04-*` | plan → design → analysis → report |
| 아카이브 | `docs/archive/` | 완료된 피처 문서 |
