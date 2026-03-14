# GsTestGuide 최종 개선안 브레인스토밍

> 작성일: 2026-03-14
> 프로젝트 상태: 핵심 기능 95% 완료, 유지보수 및 고도화 단계
> 총 커밋: 165개 | Feature 모듈: 9개 | 콘텐츠: 35개 마크다운

---

## 목차

1. [현재 프로젝트 진단 요약](#1-현재-프로젝트-진단-요약)
2. [팀 역할별 개선 제안](#2-팀-역할별-개선-제안)
   - [CTO / 아키텍트](#21-cto--아키텍트-시스템-설계--기술-방향)
   - [프론트엔드 리드](#22-프론트엔드-리드-ui--ux--성능)
   - [백엔드 / 인프라 엔지니어](#23-백엔드--인프라-엔지니어-firebase--functions--보안)
   - [QA / 테스트 엔지니어](#24-qa--테스트-엔지니어-품질-보증)
   - [프로덕트 매니저](#25-프로덕트-매니저-사용자-가치--로드맵)
   - [UX 디자이너](#26-ux-디자이너-사용자-경험--접근성)
3. [통합 로드맵](#3-통합-로드맵)
4. [의사결정 매트릭스](#4-의사결정-매트릭스)

---

## 1. 현재 프로젝트 진단 요약

### 강점
- Feature-First 아키텍처 철저히 준수
- 시맨틱 CSS 토큰 시스템 (60+ 토큰, 다크/라이트 완전 지원)
- Execution Gate 3중 잠금 (프론트 + Firestore Rules + Cloud Functions)
- 콘텐츠 오버라이드 시스템 (마크다운 기반 + Firestore 런타임 병합)
- 일관된 한국어 커밋 컨벤션

### 약점
- 자동화 테스트 전무 (Unit/Integration/E2E 없음)
- 일부 거대 컴포넌트 (ExecutionPage 687줄, TestSetupPage 1025줄)
- Firestore 보안 규칙 와일드카드 (`/{document=**}`) 잔존
- 에러 처리 체계 미흡 (Suspense fallback만 존재)
- 설계(Design) 페이지 기능 미완성

### 핵심 수치

| 항목 | 현황 |
|------|------|
| 완성된 Feature | 8/9 (Design 페이지 고도화 필요) |
| 거대 파일 (>500줄) | 7개 (ExecutionPage, TestSetupPage, quickMode 등) |
| CSS 토큰 커버리지 | ~98% (하드코딩 색상 거의 제거) |
| Firestore 컬렉션 | 9개 |
| Cloud Functions | 3개 |
| 테스트 커버리지 | 0% |

---

## 2. 팀 역할별 개선 제안

---

### 2.1 CTO / 아키텍트 (시스템 설계 & 기술 방향)

> **관점**: 시스템의 확장성, 유지보수성, 기술 부채 최소화

#### A. 아키텍처 리팩토링

**A-1. 거대 컴포넌트 분할** `[높음]` `[1~2주]`

현재 500줄을 초과하는 파일 7개가 존재한다. 특히 핵심 페이지들의 복잡도가 높다.

| 파일 | 현재 줄수 | 분할 목표 |
|------|---------|----------|
| `ExecutionPage.tsx` | 687줄 | 200줄 이하 × 4개 |
| `TestSetupPage.tsx` | 1025줄 | 200줄 이하 × 5개 |
| `quickMode.ts` | 7113줄 | 모듈별 분리 (태그, 추론, 판정) |
| `GlobalProcessHeader.tsx` | 408줄 | 일정 표시부 추출 |
| `CenterDisplay.tsx` | 678줄 | 폼/판정/네비게이션 분리 |

```
제안 구조 (ExecutionPage 예시):
features/checklist/routes/
├── ExecutionPage.tsx          # 오케스트레이션만 (~150줄)
├── components/
│   ├── ExecutionLayout.tsx    # 3패널 레이아웃
│   ├── QuickModeForm.tsx      # QuickMode 질문/답변 UI
│   ├── ReviewJudgment.tsx     # 판정 입력 (적합/부적합/보류)
│   └── EvidenceMapper.tsx     # 증빙 매핑 UI
└── hooks/
    ├── useExecutionState.ts   # 체크리스트 + 리뷰 상태
    └── useGateComputation.ts  # Execution Gate 계산
```

**A-2. 상태 관리 계층 재설계** `[중간]` `[2~3주]`

현재 Context API가 모든 전역 상태를 담당한다. 프로젝트 규모가 커지면 리렌더링 이슈가 발생할 수 있다.

```
현재:
  TestSetupProvider (모든 것이 한 곳에)
    └─ testSetup, projects, users, plDirectory, currentUserId...

제안:
  AuthProvider          → 인증 상태만
  ProjectProvider       → 프로젝트 목록 + 현재 프로젝트
  UserProvider          → 사용자 목록 + 현재 사용자
  ExecutionProvider     → 체크리스트 + 리뷰 + 게이트

  각 Provider는 독립적으로 구독 → 불필요한 리렌더링 방지
```

대안: Context 분리 없이 **Zustand**를 도입하면 selector 패턴으로 리렌더링을 자연스럽게 최적화할 수 있다.

**A-3. 콘텐츠 시스템 확장성** `[낮음]` `[탐색]`

현재 `vite-plugin-content.ts`가 빌드 타임에 마크다운을 파싱한다. 콘텐츠가 100개 이상으로 늘어나면 빌드 시간에 영향을 줄 수 있다.

```
고려사항:
- 현재 35개 파일 → 빌드 영향 미미 (유지)
- 50개+ 시 → 증분 빌드 캐시 도입 검토
- 100개+ 시 → CMS 또는 별도 API 고려
```

#### B. 기술 부채 해소

**B-1. TypeScript 엄격화** `[중간]`

```
현재 이슈:
- `as` 타입 단언 ~20개 잔존 → 타입 가드 함수로 대체
- Record<string, unknown> 사용 → 구체적 타입으로 교체
- any 타입 ~130개 (대부분 Firebase SDK 반환값) → 제네릭 래퍼로 감싸기
```

**B-2. 불필요 파일 정리** `[낮음]`

```
삭제 후보:
- functions/src/index-enhanced.ts (미사용, index.ts와 중복)
- functions/src/test-parser.ts (테스트용, 프로덕션 불필요)
- src/components/schedule/ → test-setup 내부에서만 사용 → 이동 검토
```

#### C. 미래 확장 고려

**C-1. 멀티테넌시 가능성** `[탐색]`

현재 단일 조직(GS 시험원)을 대상으로 하지만, 다른 시험 기관으로 확장 시:

```
고려 포인트:
- Firestore 최상위에 `organizations/{orgId}` 추가
- 보안 규칙에 org 기반 접근 제어
- 커스텀 도메인 + 테마 시스템 (이미 시맨틱 토큰 기반이라 용이)
```

**C-2. 오프라인 퍼스트** `[중간]`

시험 현장에서 네트워크 불안정 상황 대비:

```
단계별 적용:
Phase 1: Firestore enablePersistence() 활성화 (읽기 캐시)
Phase 2: 오프라인 큐 (쓰기 대기열)
Phase 3: 동기화 충돌 해결 UI
```

---

### 2.2 프론트엔드 리드 (UI & UX & 성능)

> **관점**: 사용자 인터페이스 품질, 렌더링 성능, 개발자 경험

#### A. UI 컴포넌트 고도화

**A-1. 공통 UI 컴포넌트 체계 완성** `[높음]` `[1주]`

현재 `src/components/ui/`에 Button, Input, Select, BaseModal 등이 있으나, 일부 페이지에서 직접 `<button>`, `<input>`을 사용하는 경우가 있다.

```
통일 대상 점검:
- NavSidebar의 필터 버튼 → Button 컴포넌트로 교체
- 검색 입력 → Input 컴포넌트로 교체
- 각종 인라인 <button> → Button variant 활용
- 모달 패턴 → BaseModal 상속으로 통일

추가 검토할 공통 컴포넌트:
- Badge (상태 표시: 적합/부적합/보류/잠금)
- Chip (카테고리 태그, 필터 칩)
- Tooltip (현재 title 속성만 사용)
- Toast/Notification (성공/실패 알림)
- EmptyState (데이터 없음 표시)
```

**A-2. 모달 시스템 통합** `[중간]` `[1주]`

현재 모달이 여러 패턴으로 구현되어 있다:

```
현재 모달 패턴 (혼재):
1. BaseModal (공통 UI) → 일부 사용
2. ConfirmModal (공통 UI) → 삭제/확인에 사용
3. GuideModal → 자체 구현 (fixed inset-0 패턴)
4. DefectRefBoardModal → 자체 구현
5. test-setup/modals/ → 각각 자체 구현

통합 제안:
- 모든 모달을 BaseModal 기반으로 래핑
- 크기 프리셋: sm, md, lg, xl, full
- 포커스 트랩 (접근성)
- 중첩 모달 z-index 관리
```

**A-3. 애니메이션 & 트랜지션** `[낮음]`

```
현재:
- transition-colors만 일부 사용
- animate-in slide-in-from-top (NavSidebar 아코디언)

추가 고려:
- 페이지 전환 애니메이션 (React Router + Framer Motion)
- 모달 열림/닫힘 (scale + opacity)
- 리스트 아이템 등장 (stagger)
- 진행률 바 애니메이션 (CSS transition)
```

#### B. 렌더링 성능

**B-1. 체크리스트 가상화** `[중간]` `[3일]`

체크리스트 항목이 많아지면 DOM 노드 수가 급증한다.

```
현재: 모든 항목을 한 번에 렌더링
문제: 카테고리 13개 × 항목 5~15개 = 최대 ~200개 DOM 노드

해결:
- react-window 또는 @tanstack/virtual 도입
- 카테고리별 lazy rendering (펼칠 때만 렌더)
- 현재 아코디언이 이미 부분적으로 해결 → 추가 최적화 여부 측정 후 결정
```

**B-2. 메모이제이션 전략** `[중간]`

```
최적화 후보:
1. ExecutionPage의 computeExecutionGate() → useMemo 적용 (의존성: checklist, reviewData, defects)
2. NavSidebar의 카테고리별 필터링 → useMemo
3. 자주 변경되지 않는 프로젝트 정보 → React.memo 래핑
4. 콘텐츠 오버라이드 병합 결과 → useMemo

주의: 과도한 메모이제이션 금지. React DevTools Profiler로 측정 후 적용
```

**B-3. 번들 사이즈 최적화** `[낮음]`

```
현재 추정 번들 크기:
- Firebase SDK: ~300KB (gzip ~80KB) ← 가장 큼
- React + ReactDOM: ~130KB
- Lucide Icons: Tree-shaking 적용 (필요한 것만)
- Tailwind: Purge 적용

최적화 방안:
1. Firebase modular imports 확인 (getFirestore만 import 등)
2. Bundle Analyzer 도입: vite-plugin-visualizer
3. Dynamic import for admin 모듈 (일반 사용자는 불필요)
4. 코드 스플리팅 세분화: admin, report를 별도 chunk로
```

#### C. 반응형 & 접근성

**C-1. 모바일 대응** `[중간]`

```
현재 상태:
- Tailwind의 반응형 클래스 부분적 사용
- 핵심 페이지(ExecutionPage)는 3패널 → 모바일에서 사용 불가

대응 전략:
Phase 1: 대시보드(OverviewPage)만 모바일 최적화
Phase 2: 체크리스트 뷰를 모바일용 단일 패널로
Phase 3: 모달들의 모바일 대응 (bottom sheet 패턴)

※ 시험원이 현장에서 태블릿 사용 시나리오 고려
```

**C-2. 키보드 접근성 강화** `[중간]`

```
현재 구현:
✅ ESC로 모달 닫기
✅ 화살표 키 네비게이션 (체크리스트)
✅ Enter/Space로 판정

추가 필요:
- 포커스 트랩 (모달 내에서만 Tab 순환)
- aria-label 보완 (아이콘 전용 버튼)
- 스크린리더 호환성 (aria-live 영역)
- skip-to-content 링크
```

#### D. 신규 UI 기능 아이디어

**D-1. 대시보드 고도화** `[높음]`

```
현재 OverviewPage:
- 시험 정보 카드
- 일정 캘린더

추가 제안:
┌──────────────────────────────────────────────┐
│ 대시보드 레이아웃 (제안)                         │
├────────────┬─────────────────────────────────┤
│ 시험 정보    │  진행률 도넛 차트                   │
│ (카드)      │  (카테고리별 완료율)                 │
├────────────┼─────────────────────────────────┤
│ D-Day      │  최근 활동 타임라인                  │
│ 카운트다운   │  (판정 기록, 결함 등록 등)           │
├────────────┼─────────────────────────────────┤
│ 결함 현황    │  일정 간트 차트 (미니)              │
│ (차수별)    │  (마일스톤 표시)                    │
└────────────┴─────────────────────────────────┘
```

**D-2. 실시간 알림 시스템** `[낮음]`

```
시나리오:
- 결함이 등록되면 PL에게 알림
- 시험 일정 D-3, D-1 알림
- 패치 업로드 완료 알림
- 프로젝트 최종화 알림

구현 방안:
- Firestore onSnapshot 기반 인앱 알림
- 추후 Firebase Cloud Messaging(FCM)으로 푸시 확장
```

---

### 2.3 백엔드 / 인프라 엔지니어 (Firebase & Functions & 보안)

> **관점**: 데이터 무결성, 보안, 서버리스 최적화, 운영 안정성

#### A. 보안 강화 (Critical)

**A-1. Firestore 보안 규칙 세분화** `[긴급]` `[1주]`

현재 가장 큰 보안 리스크. 와일드카드 규칙이 모든 컬렉션에 대한 읽기/쓰기를 허용한다.

```javascript
// 현재 (위험)
match /{document=**} {
  allow read, write: if request.auth != null;
}

// 제안 (컬렉션별 세분화)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 사용자: 본인 문서만 수정, 목록은 읽기 가능
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == userId;
    }

    // 프로젝트: 모든 인증 사용자 읽기, 생성자/PL만 수정
    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && !isProjectLocked(projectId);
      allow delete: if isAdmin();

      // 하위 컬렉션
      match /features/{featureId} {
        allow read, write: if isSignedIn() && !isProjectLocked(projectId);
      }
      match /testCases/{testCaseId} {
        allow read, write: if isSignedIn() && !isProjectLocked(projectId);
      }
      match /defects/{defectId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn() && !isProjectLocked(projectId);
      }
    }

    // 콘텐츠 오버라이드: Admin만 수정
    match /contentOverrides/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // 참고 가이드 오버라이드: Admin만 수정
    match /guideOverrides/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // QuickReview: 인증 사용자 읽기/쓰기
    match /quickReviews/{testNumber} {
      allow read, write: if isSignedIn();
    }
  }
}
```

**A-2. Admin 인증 강화** `[높음]`

```
현재:
- VITE_ADMIN_PASSWORD 환경변수로 비밀번호 확인
- 클라이언트 사이드에서만 검증 (우회 가능)

제안:
Phase 1: Firestore에 Admin 역할 저장 (users/{uid}.role == 'Admin')
Phase 2: Custom Claims로 Firebase Auth에 역할 부여
Phase 3: Firestore Rules에서 Custom Claims 기반 접근 제어

function isAdmin() {
  return request.auth.token.admin == true;
}
```

**A-3. Storage 보안 규칙 정교화** `[중간]`

```
현재:
- previews/: 공개 읽기 (OK)
- agreements/: 인증 사용자만 (OK)
- 다른 경로: 규칙 미정의 (위험)

추가:
- defect-reports/: 인증 사용자만 읽기/쓰기
- 파일 크기 제한 (합의서: 50MB, 이미지: 10MB)
- 파일 타입 제한 (content-type 검증)
```

#### B. Cloud Functions 개선

**B-1. 에러 처리 & 로깅 강화** `[높음]` `[1주]`

```javascript
// 현재 (기본적인 에러 처리)
try {
  const parsed = await parseAgreement(file);
} catch (error) {
  console.error('파싱 실패:', error);
}

// 제안 (구조화된 로깅)
import { logger } from 'firebase-functions';

try {
  const parsed = await parseAgreement(file);
  logger.info('합의서 파싱 성공', {
    testNumber,
    fileType: contentType,
    fieldsExtracted: Object.keys(parsed).length,
    duration: Date.now() - startTime
  });
} catch (error) {
  logger.error('합의서 파싱 실패', {
    testNumber,
    fileType: contentType,
    error: error.message,
    stack: error.stack,
    fileSize: file.size
  });
  // Firestore에 실패 상태 기록
  await updateParseStatus(testNumber, 'failed', error.message);
}
```

**B-2. 엑셀 생성 로직 리팩토링** `[중간]`

```
현재 이슈:
- excelGenerator.ts에 모든 로직이 한 파일에 집중
- 헤더 치환, 동적 행 추가, 스타일 복사가 혼재

제안 구조:
functions/src/excel/
├── templateLoader.ts      # 템플릿 로드 + 캐싱
├── headerReplacer.ts      # {Placeholder} 치환
├── rowGenerator.ts        # 동적 행 추가 + 스타일 복사
├── validationApplier.ts   # Data Validation (H/M/L, A/I)
└── excelBuilder.ts        # 오케스트레이션
```

**B-3. 함수 성능 최적화** `[낮음]`

```
현재:
- 콜드 스타트 시 모든 모듈 로드 (~3초 추정)
- 단일 index.ts에서 3개 함수 export

최적화:
- 함수별 별도 엔트리 포인트 (tree-shaking 가능)
- 최소 인스턴스 설정 (합의서 파싱은 빈도 낮으므로 0)
- 메모리 할당 최적화 (엑셀 생성: 512MB, 파싱: 256MB)
```

#### C. 데이터 무결성

**C-1. 결함 차수 전환 검증** `[높음]`

```
현재 우려:
- 3차 결함의 isDerived가 reportVersion >= 3만으로 판단
- 실제로 회귀 테스트에서 발견된 건인지 확인 안 됨

제안:
- isDerived 판단에 추가 조건: 해당 결함의 parentDefectId 존재 여부
- Cloud Functions에서 결함 생성 시 phase 확인
- 차수 간 이행 시 Firestore 트랜잭션으로 원자성 보장
```

**C-2. 데이터 백업 전략** `[중간]`

```
현재: 없음 (Firestore 자체 복구만 의존)

제안:
Phase 1: Firestore 자동 백업 (daily, 7일 보존)
Phase 2: 주요 이벤트 시점 스냅샷 (최종화 직전)
Phase 3: 프로젝트별 데이터 내보내기 기능 (JSON/CSV)
```

**C-3. 감사 로그 (Audit Trail)** `[중간]`

```
추적 대상:
- 결함 상태 변경 (누가, 언제, 무엇을)
- 판정 변경 (적합→부적합 등)
- 프로젝트 최종화/잠금 해제
- Admin 작업 (사용자 생성/삭제, 콘텐츠 변경)

구현:
- Firestore subcollection: projects/{id}/auditLog/{logId}
- Cloud Functions onWrite 트리거로 자동 기록
- 변경 전/후 값 diff 저장
```

---

### 2.4 QA / 테스트 엔지니어 (품질 보증)

> **관점**: 테스트 커버리지, 회귀 방지, 자동화 파이프라인

#### A. 테스트 전략 수립

**A-1. E2E 테스트 도입 (최우선)** `[긴급]` `[2주]`

```
프레임워크: Playwright (권장)
이유:
- TypeScript 네이티브 지원
- Cross-browser 테스트
- Firebase 에뮬레이터와 통합 용이

우선 테스트 시나리오 (Critical Path):
1. 로그인 → 프로젝트 선택 → 시험 설정
2. 체크리스트 수행 (QuickMode 질문 답변 → 자동 판정)
3. 분기 규칙 동작 (조건 분기 시 질문 스킵)
4. Execution Gate (기능 회귀 → 보안/성능 활성화)
5. 결함 등록 → 엑셀 생성 → 다운로드
6. 프로젝트 최종화 → 수정 잠금 확인
```

```typescript
// 예시: Execution Gate E2E 테스트
test('기능 회귀에서 파생 결함 발견 시 보안/성능 비활성화', async ({ page }) => {
  // Given: 기능 회귀 단계 진입
  await page.goto('/execution');
  await enterRegressionMode(page);

  // When: 파생 결함 등록
  await registerDerivedDefect(page, {
    title: '파생 결함 예시',
    severity: 'M',
    frequency: 'A'
  });

  // Then: 보안/성능 항목 비활성화 확인
  const securityItem = page.locator('[data-testid="security-checkpoint"]');
  await expect(securityItem).toHaveAttribute('disabled');
  await expect(securityItem).toContainText('잠금');
});
```

**A-2. 유닛 테스트 (핵심 로직)** `[높음]` `[1주]`

```
프레임워크: Vitest (Vite 네이티브)

최우선 테스트 대상:
1. computeExecutionGate() - 12+ 분기 조합 테스트
2. branchingResolver - skipIndices 계산 정확성
3. quickMode - 자동 판정(YES/NO/NA → PASS/HOLD/FAIL)
4. mergeOverrides - 오버라이드 병합 결과
5. validation.ts - 입력 검증 로직
6. excelGenerator - 헤더 치환, Data Validation

테스트 매트릭스 (computeExecutionGate):
┌───────────────────┬──────────────┬───────────────────┬────────────┐
│ phase             │ regression   │ derived           │ expected   │
├───────────────────┼──────────────┼───────────────────┼────────────┤
│ INITIAL           │ PENDING      │ false             │ 보안 비활성 │
│ PATCH1_REGRESSION │ PASS         │ false             │ 보안 활성   │
│ PATCH1_REGRESSION │ DERIVED_FOUND│ true              │ 보안 비활성 │
│ PATCH2_FINAL      │ PASS         │ false             │ 전체 활성   │
│ (any)             │ (any)        │ finalizedAt 존재  │ 전체 잠금   │
└───────────────────┴──────────────┴───────────────────┴────────────┘
```

**A-3. 통합 테스트 (Firebase 에뮬레이터)** `[중간]` `[1~2주]`

```
테스트 범위:
1. Firestore Rules 테스트
   - 인증되지 않은 사용자 → 읽기/쓰기 차단
   - 잠긴 프로젝트 → 결함 수정 차단
   - Admin이 아닌 사용자 → 콘텐츠 수정 차단

2. Cloud Functions 테스트
   - 합의서 업로드 → 파싱 결과 확인
   - 결함 리포트 생성 → 엑셀 구조 검증
   - 잠긴 프로젝트 → 엑셀 생성 차단

3. Storage Rules 테스트
   - 파일 크기/타입 제한 검증
```

#### B. 자동화 파이프라인

**B-1. CI/CD (GitHub Actions)** `[높음]` `[3일]`

```yaml
# .github/workflows/ci.yml (제안)
name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit  # 타입 체크

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test  # Vitest

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build  # TypeScript + Vite
```

**B-2. Pre-commit 검증** `[중간]`

```
도구: husky + lint-staged

검증 항목:
1. ESLint (코드 품질)
2. TypeScript 타입 체크 (tsc --noEmit)
3. 커밋 메시지 형식 검증 (이모지 + 한국어)
4. 번들 크기 체크 (임계값 초과 시 경고)
```

#### C. 모니터링

**C-1. 에러 추적** `[중간]`

```
도구: Sentry (무료 티어 충분)

추적 대상:
- 런타임 에러 (React ErrorBoundary → Sentry 전송)
- Firebase 연결 실패
- Cloud Functions 에러
- 합의서 파싱 실패율

대시보드:
- 에러 발생 빈도
- 영향 받은 사용자 수
- 에러 발생 페이지/컴포넌트
```

---

### 2.5 프로덕트 매니저 (사용자 가치 & 로드맵)

> **관점**: 사용자 니즈, 업무 효율화, 기능 우선순위

#### A. 미완성 기능 완성

**A-1. 설계(Design) 페이지 고도화** `[높음]` `[2~3주]`

현재 DesignPage는 참고 가이드만 표시한다. 핵심 목적인 TC 설계 기능이 없다.

```
제안 기능:
┌─────────────────────────────────────────────────┐
│ 설계 페이지 (DesignPage)                          │
├─────────────┬───────────────────────────────────┤
│ 좌측 패널    │ 우측 패널                           │
│             │                                    │
│ 기능 리스트   │ TC 작성 영역                        │
│ (DUR-PLAN)  │ ┌────────────────────────────────┐ │
│             │ │ TC ID: TC-001                  │ │
│ ┌─────────┐ │ │ 시험 항목: 로그인 기능             │ │
│ │ F-001   │ │ │ 시험 조건: 정상 계정               │ │
│ │ F-002 ← │ │ │ 시험 절차:                       │ │
│ │ F-003   │ │ │   1. URL 접속                   │ │
│ │ ...     │ │ │   2. ID/PW 입력                 │ │
│ └─────────┘ │ │   3. 로그인 클릭                  │ │
│             │ │ 기대 결과: 대시보드 이동             │ │
│ [+ 기능 추가] │ │                                │ │
│             │ │ [저장] [Firestore 동기화]         │ │
│             │ └────────────────────────────────┘ │
│             │                                    │
│             │ 참고 가이드 (하단 또는 슬라이드)        │
└─────────────┴───────────────────────────────────┘
```

**A-2. 리포트 페이지 활성화** `[높음]` `[2주]`

현재 헤더에서 숨겨놓은 리포트 탭을 활성화해야 한다.

```
리포트 페이지 기능 제안:
1. 시험 결과 요약
   - 카테고리별 적합/부적합/보류 통계
   - 전체 적합률 (%)

2. 결함 통계
   - 차수별 결함 수 (1차~4차)
   - 심각도별 분포 (H/M/L)
   - 빈도별 분포 (A/I)
   - 파생 결함 비율

3. 일정 준수율
   - 계획 vs 실제 마일스톤
   - 지연된 단계 하이라이트

4. 산출물 다운로드
   - 결함 리포트 엑셀 (차수별)
   - 시험 결과서 (PDF 생성 고려)
   - 체크리스트 결과표
```

**A-3. 프로젝트 복제 기능 개선** `[낮음]`

```
현재: 프로젝트 기본 정보 복제
추가:
- 체크리스트 결과 초기화 옵션
- 콘텐츠 오버라이드 포함 옵션
- 결함 데이터 포함/제외 선택
- "재시험" 시나리오 지원 (이전 결과 참조 가능)
```

#### B. 업무 효율화 기능

**B-1. 일괄 판정 기능** `[높음]`

```
시나리오:
- 시험원이 한 카테고리 내 모든 항목을 "적합"으로 처리하고 싶을 때
- 회귀 테스트에서 변경 없는 항목들을 빠르게 "이전 결과 유지"

UI:
- 카테고리 헤더에 "일괄 판정" 버튼
- 선택 모드: 체크박스로 다중 선택 → 일괄 적용
- 확인 모달: "N개 항목을 '적합'으로 판정하시겠습니까?"
```

**B-2. 시험 템플릿** `[중간]`

```
시나리오:
- 비슷한 유형의 제품을 반복 시험
- 매번 같은 설정을 반복하는 것이 비효율적

기능:
- "템플릿으로 저장" → 시험 설정 + 커스텀 체크리스트를 템플릿화
- "템플릿에서 시작" → 저장된 설정으로 빠르게 새 프로젝트 생성
- 공유 템플릿 (팀 내 공유)
```

**B-3. 시험 진행 상황 공유** `[낮음]`

```
시나리오:
- PL이 시험 진행 상황을 확인하고 싶을 때
- 매번 시험원에게 물어보는 것이 비효율적

기능:
- 읽기 전용 공유 링크 생성
- 대시보드 형태의 진행률 뷰
- 이메일 알림 (주요 마일스톤 달성 시)
```

#### C. 데이터 활용

**C-1. 시험 통계/분석 대시보드** `[중간]`

```
분석 지표:
- 프로젝트별 평균 시험 기간
- 카테고리별 부적합률 트렌드
- 가장 빈번한 결함 유형 (품질특성별)
- 시험원별 처리 속도
- 월별/분기별 시험 건수

활용:
- 시험 일정 추정 정확도 향상
- 취약 영역 사전 식별
- 리소스 배분 최적화
```

**C-2. 결함 패턴 분석** `[낮음]`

```
축적된 결함 데이터에서:
- 반복적으로 발생하는 결함 유형
- 특정 품질특성에서 자주 발생하는 패턴
- 결함 해결 평균 소요 시간
- 파생 결함 발생 확률 예측

→ 체크리스트 수행 시 "주의 필요" 경고로 활용
```

---

### 2.6 UX 디자이너 (사용자 경험 & 접근성)

> **관점**: 인터랙션 패턴, 시각적 일관성, 학습 용이성

#### A. 온보딩 경험

**A-1. 첫 사용자 가이드** `[중간]`

```
현재: 사용자가 직접 탐색해야 함
제안:
- 첫 로그인 시 투어 가이드 (3~5 단계)
  Step 1: "시험 설정에서 프로젝트를 선택하세요"
  Step 2: "체크리스트에서 각 항목을 점검하세요"
  Step 3: "결함 발견 시 바로 등록할 수 있습니다"
  Step 4: "모든 점검이 끝나면 리포트를 생성하세요"

- 빈 상태(Empty State) 개선
  프로젝트 없음 → "새 프로젝트를 생성하거나 배정을 확인하세요"
  체크리스트 없음 → "시험 설정을 먼저 완료해주세요"
```

**A-2. 도움말 시스템 체계화** `[낮음]`

```
현재:
- ShortcutHelpOverlay (키보드 단축키)
- HelperToolsPopup (도움말 팝업)
- 참고 가이드 모달

통합 제안:
- "?" 키로 컨텍스트 도움말 호출
- 현재 페이지에 맞는 도움말 자동 표시
- 인라인 툴팁 (아이콘 위 hover 시 설명)
```

#### B. 인터랙션 개선

**B-1. 체크리스트 수행 흐름 최적화** `[높음]`

```
현재 흐름:
항목 선택 → QuickMode 질문 답변 → 판정 → 증빙 입력 → 다음 항목

개선 아이디어:
1. "빠른 판정 모드"
   - 스와이프 제스처 (←: 부적합, →: 적합)
   - 키보드 1/2/3 (적합/부적합/보류) 즉시 판정

2. "포커스 모드"
   - 현재 항목만 확대 표시
   - 사이드바 축소
   - 진행률만 상단에 표시

3. "검토 모드"
   - 판정 완료된 항목만 필터
   - 변경 이력 표시
   - 일괄 수정 가능
```

**B-2. 결함 등록 흐름 간소화** `[중간]`

```
현재: 모달 → 폼 작성 (10+ 필드) → 저장
시험원 피드백: "필드가 너무 많아서 등록이 번거롭다"

개선:
Phase 1: "빠른 등록"
  - 필수 필드만 (제목, 설명, 심각도, 재현경로)
  - 나머지는 "상세 정보 추가" 펼침

Phase 2: "스크린샷 첨부"
  - 클립보드에서 바로 붙여넣기 (Ctrl+V)
  - 영역 캡처 도구 연동

Phase 3: "음성 메모"
  - 결함 설명을 음성으로 녹음 → 텍스트 변환 (Web Speech API)
  - 현장에서 타이핑이 어려울 때 활용
```

**B-3. 진행률 시각화 강화** `[중간]`

```
현재: 숫자 (15/20) + 프로그레스 바

추가 제안:
1. 카테고리별 도넛 차트 (한눈에 전체 파악)
2. 히트맵 (시간대별 판정 빈도 → 업무 패턴 파악)
3. 타임라인 (오늘 한 작업 순서대로 나열)
4. "남은 예상 시간" (평균 소요시간 × 남은 항목)
```

#### C. 시각 디자인 개선

**C-1. 마이크로 인터랙션** `[낮음]`

```
추가하면 좋을 마이크로 인터랙션:
- 판정 완료 시: 체크 아이콘 바운스 애니메이션
- 카테고리 100% 완료 시: 축하 효과 (confetti?)
- 결함 등록 시: 카운터 증가 애니메이션
- 저장 성공 시: 토스트 알림 (fade in → out)
- 에러 시: 셰이크 애니메이션 + 빨간 강조
```

**C-2. 데이터 시각화** `[중간]`

```
차트 라이브러리 추천: recharts (React 네이티브, 경량)

활용처:
1. 대시보드: 카테고리별 완료율 (Bar Chart)
2. 리포트: 결함 분포 (Pie Chart)
3. 일정: 마일스톤 간트 차트 (Timeline)
4. 통계: 월별 추이 (Line Chart)
```

**C-3. 테마 시스템 확장** `[낮음]`

```
현재: 다크/라이트 2종

추가 고려:
- 고대비 모드 (시각 보조)
- 컴팩트 모드 (정보 밀도 높음, 노트북 화면용)
- 시험 기관별 브랜딩 (멀티테넌시 시)
```

---

## 3. 통합 로드맵

### Phase 0: 즉시 (이번 주) — 안정화
| # | 항목 | 담당 | 난이도 |
|---|------|------|--------|
| 0-1 | Firestore 보안 규칙 세분화 | 백엔드 | ★★★ |
| 0-2 | 불필요 파일 정리 (index-enhanced.ts 등) | 아키텍트 | ★ |

### Phase 1: 단기 (1~2주) — 품질 기반
| # | 항목 | 담당 | 난이도 |
|---|------|------|--------|
| 1-1 | Vitest 설정 + 핵심 로직 유닛 테스트 | QA | ★★ |
| 1-2 | ExecutionPage 컴포넌트 분할 | 프론트 | ★★★ |
| 1-3 | Cloud Functions 로깅 강화 | 백엔드 | ★★ |
| 1-4 | 공통 UI 컴포넌트 통일 | 프론트 | ★★ |

### Phase 2: 중기 (2~4주) — 기능 완성
| # | 항목 | 담당 | 난이도 |
|---|------|------|--------|
| 2-1 | 설계(Design) 페이지 고도화 | PM+프론트 | ★★★★ |
| 2-2 | 리포트 페이지 활성화 | PM+프론트 | ★★★ |
| 2-3 | E2E 테스트 (Playwright) | QA | ★★★ |
| 2-4 | GitHub Actions CI 파이프라인 | QA | ★★ |
| 2-5 | 대시보드 고도화 | UX+프론트 | ★★★ |

### Phase 3: 장기 (1~2개월) — 고도화
| # | 항목 | 담당 | 난이도 |
|---|------|------|--------|
| 3-1 | 일괄 판정 기능 | PM+프론트 | ★★★ |
| 3-2 | 오프라인 지원 (Firestore persistence) | 백엔드 | ★★ |
| 3-3 | 결함 등록 간소화 (빠른 등록 + 스크린샷) | UX+프론트 | ★★★ |
| 3-4 | 감사 로그 (Audit Trail) | 백엔드 | ★★★ |
| 3-5 | 시험 통계 대시보드 | PM+프론트 | ★★★ |

### Phase 4: 미래 (분기 단위) — 확장
| # | 항목 | 담당 | 난이도 |
|---|------|------|--------|
| 4-1 | 실시간 협업 (충돌 방지) | 아키텍트+백엔드 | ★★★★★ |
| 4-2 | 시험 템플릿 시스템 | PM+프론트 | ★★★ |
| 4-3 | 시험 결과서 PDF 생성 | 백엔드 | ★★★ |
| 4-4 | 모바일 대응 (태블릿 최적화) | UX+프론트 | ★★★★ |
| 4-5 | 멀티테넌시 (다기관 지원) | 아키텍트+백엔드 | ★★★★★ |

---

## 4. 의사결정 매트릭스

> 임팩트(사용자 가치) vs 노력(개발 비용) 기준 우선순위 판단

### 높은 임팩트 + 낮은 노력 (즉시 실행)
- Firestore 보안 규칙 세분화
- 불필요 파일 정리
- Vitest 설정 + 핵심 유닛 테스트
- GitHub Actions CI

### 높은 임팩트 + 높은 노력 (계획적 실행)
- 설계 페이지 고도화 (TC 작성)
- 리포트 페이지 활성화
- E2E 테스트 도입
- 대시보드 고도화

### 낮은 임팩트 + 낮은 노력 (시간 나면)
- 마이크로 인터랙션
- 테마 확장
- 애니메이션 개선

### 낮은 임팩트 + 높은 노력 (보류)
- 멀티테넌시
- 실시간 협업
- 국제화(i18n)

---

> **다음 단계**: 이 문서를 기반으로 구체적인 작업 항목을 선정하고 PDCA Plan을 수립한다.
> 각 Phase의 항목은 독립적으로 실행 가능하며, 우선순위는 프로젝트 상황에 따라 유연하게 조정한다.
