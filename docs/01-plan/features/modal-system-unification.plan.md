# Modal System Unification Planning Document

> **Summary**: 18개 모달 컴포넌트를 BaseModal 기반으로 통합하여 일관된 UX와 유지보수성 확보
>
> **Project**: GsTestGuide
> **Author**: Claude
> **Date**: 2026-03-14
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 18개 모달이 3가지 다른 패턴으로 구현되어 있고, 7개는 `absolute` 포지셔닝 버그가 있으며, ESC/Click-Outside 처리가 불일치함 |
| **Solution** | BaseModal을 확장하여 크기 프리셋·ESC·Click-Outside·포커스 트랩을 표준화하고, 모든 자체 구현 모달을 BaseModal 기반으로 전환 |
| **Function/UX Effect** | 모든 모달이 동일한 백드롭·닫기 동작·키보드 인터랙션을 제공하여 사용자 혼란 제거 및 접근성 향상 |
| **Core Value** | UI 인프라 일관성 확보로 향후 기능 추가(대시보드, 반응형) 시 모달 관련 작업 비용 50% 이상 절감 |

---

## 1. Overview

### 1.1 Purpose

현재 코드베이스에 18개의 모달 컴포넌트가 존재하며, 이 중 1개만 BaseModal을 상속한다(ConfirmModal). 나머지 16개는 각각 독자적으로 구현되어 있어 다음 문제가 발생한다:

- **포지셔닝 버그**: 7개 모달이 `absolute inset-0`을 사용하여 부모 엘리먼트 컨텍스트에 의존 (스크롤 시 위치 이탈 가능)
- **동작 불일치**: ESC 키 처리 7개만 구현, Click-Outside 3개만 구현
- **z-index 혼재**: `z-20`~`z-50`까지 4단계가 체계 없이 사용
- **색상 하드코딩**: `bg-black/60`, `bg-black/80` 등 시맨틱 토큰 미사용
- **접근성 부재**: 포커스 트랩 전무, aria 속성 미흡

### 1.2 Background

프론트엔드 리드 브레인스토밍(2026-03-14)에서 4가지 핵심 개선 중 첫 번째로 선정. 모달 시스템은 대시보드 고도화, 반응형 대응 등 후속 작업의 UI 인프라 기반이 된다.

### 1.3 Related Documents

- 브레인스토밍: `docs/BRAINSTORM_2026-03-14.md` §2.2
- CLAUDE.md: §6.4 스타일링 규칙 (시맨틱 토큰 우선)

---

## 2. Scope

### 2.1 In Scope

- [ ] BaseModal 확장 (크기 프리셋 추가, ESC/Click-Outside 옵션, 포커스 트랩)
- [ ] FormModal 신규 컴포넌트 생성 (폼 모달 공통 패턴)
- [ ] 16개 자체 구현 모달을 BaseModal/FormModal 기반으로 전환
- [ ] `absolute` → `fixed` 포지셔닝 통일
- [ ] z-index 전략 표준화
- [ ] 하드코딩 색상 → 시맨틱 토큰 전환
- [ ] 기본 aria 속성 추가 (role="dialog", aria-modal, aria-labelledby)

### 2.2 Out of Scope

- 모달 애니메이션 (open/close transition) — 별도 Phase에서 처리
- 모바일 bottom-sheet 패턴 — 반응형 대응 Phase에서 처리
- 모달 내부 콘텐츠 리디자인 — 기존 UI 유지, 래퍼만 교체
- 중첩 모달 스택 관리 (Portal 기반) — 현재 중첩은 ProjectListModal 1건만

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | BaseModal에 `size` 프리셋 확장: `sm`, `md`, `lg`, `xl`, `2xl`, `full` | High | Pending |
| FR-02 | BaseModal에 `closeOnEsc` 옵션 (기본값: true) | High | Pending |
| FR-03 | BaseModal에 `closeOnBackdropClick` 옵션 (기본값: true) | High | Pending |
| FR-04 | BaseModal에 포커스 트랩 구현 (Tab/Shift+Tab 순환) | Medium | Pending |
| FR-05 | BaseModal에 aria 속성 자동 적용 (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) | Medium | Pending |
| FR-06 | FormModal 컴포넌트 생성 (헤더+폼+푸터 레이아웃, 제출/취소 버튼, busy 상태) | High | Pending |
| FR-07 | 모든 모달 `absolute` → `fixed` 포지셔닝 통일 | High | Pending |
| FR-08 | z-index 표준화: 기본 `z-50`, 중첩 시 `z-[60]` | High | Pending |
| FR-09 | 백드롭 색상을 시맨틱 토큰(`--overlay-backdrop`)으로 통일 | Medium | Pending |
| FR-10 | 16개 자체 구현 모달을 BaseModal/FormModal 기반으로 마이그레이션 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 모달 open/close 시 불필요한 리렌더링 없음 | React DevTools Profiler |
| 접근성 | 모든 모달에서 Tab 키로 포커스 순환 | 수동 키보드 테스트 |
| 일관성 | 모든 모달이 동일한 백드롭·닫기 동작 제공 | 시각적 검수 |
| 유지보수 | 새 모달 생성 시 BaseModal 상속만으로 완성 | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] BaseModal이 6가지 크기 프리셋을 지원
- [ ] FormModal이 헤더/폼/푸터 패턴을 제공
- [ ] 18개 모달 중 17개가 BaseModal 기반 (ParsingOverlay는 별도 — 닫기 불가 오버레이)
- [ ] 모든 모달이 `fixed inset-0 z-50` 사용
- [ ] ESC 키로 모든 모달 닫기 가능 (ParsingOverlay 제외)
- [ ] 하드코딩 색상 0개
- [ ] TypeScript 빌드 에러 0개

### 4.2 Quality Criteria

- [ ] Vercel 빌드 성공
- [ ] 기존 모달 기능 회귀 없음 (모든 폼 제출, 닫기 동작 정상)
- [ ] ESLint 에러 0개

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 모달 내부 레이아웃 깨짐 (래퍼 교체 시) | High | Medium | 모달별 개별 테스트, 기존 className 보존 |
| 포커스 트랩이 기존 키보드 단축키와 충돌 | Medium | Low | 모달 open 시만 트랩 활성화, 체크리스트 단축키는 모달 외부에서만 작동 |
| z-index 변경으로 모달 계층 깨짐 | High | Low | z-50으로 통일, ProjectListModal 중첩만 z-[60] |
| `absolute` → `fixed` 변경으로 test-setup 모달 동작 변경 | Medium | Medium | test-setup 모달들이 TestSetupPage 내부에서만 사용되는지 확인 후 전환 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| **Dynamic** | Feature-based modules, BaaS integration | ✅ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 포커스 트랩 | focus-trap-react / 자체 구현 | 자체 구현 | 외부 의존성 최소화, 단순한 Tab 순환만 필요 |
| 모달 래퍼 구조 | BaseModal 확장 / 새 ModalProvider | BaseModal 확장 | 기존 구조 활용, 변경 범위 최소화 |
| 크기 프리셋 | Tailwind 클래스 직접 / props | props (`size`) | 일관성 보장, 커스텀도 `className`으로 가능 |
| 백드롭 스타일 | CSS 변수 / Tailwind | CSS 변수 (`--overlay-backdrop`) | 다크/라이트 모드 자동 대응 |

### 6.3 컴포넌트 구조

```
src/components/ui/
├── BaseModal.tsx          # 확장 (47줄 → ~90줄 예상)
│   ├── 크기 프리셋: sm, md, lg, xl, 2xl, full
│   ├── closeOnEsc: boolean (기본 true)
│   ├── closeOnBackdropClick: boolean (기본 true)
│   ├── 포커스 트랩 (Tab/Shift+Tab)
│   └── aria 속성 자동 적용
├── FormModal.tsx          # 신규 (~60줄 예상)
│   ├── extends BaseModal
│   ├── title: string
│   ├── onSubmit / onCancel
│   ├── submitLabel / cancelLabel
│   └── busy: boolean
├── ConfirmModal.tsx       # 기존 유지 (BaseModal 기반)
└── index.ts               # re-export
```

### 6.4 마이그레이션 전략

3단계로 순차 진행하여 회귀 리스크 최소화:

**Step 1: BaseModal 확장 + FormModal 생성** (인프라)
- BaseModal props 확장
- 포커스 트랩 구현
- FormModal 신규 작성
- ConfirmModal은 그대로 유지 (이미 BaseModal 기반)

**Step 2: 단순 모달 마이그레이션** (7개 — 폼 없는 정보/확인 모달)
- AccessDeniedModal → BaseModal
- AgreementDeleteConfirmModal → ConfirmModal 활용 또는 BaseModal
- AgreementFailedModal → BaseModal
- DeleteUserConfirmModal → ConfirmModal 활용 또는 BaseModal
- ParsingOverlay → BaseModal (`closeOnEsc: false, closeOnBackdropClick: false`)
- ScheduleModal → BaseModal
- ChangeHistoryModal → BaseModal

**Step 3: 폼/복합 모달 마이그레이션** (9개)
- AdminPasswordModal → FormModal
- CreateUserModal → FormModal
- EditUserModal → FormModal
- DefectReportModal → FormModal
- ManageUsersModal → BaseModal (리스트 표시)
- TestDetailModal → BaseModal
- ProjectListModal → BaseModal (중첩 모달은 z-[60])
- DefectRefBoardModal → BaseModal (`size="full"`)
- GuideModal → BaseModal (`size="2xl"`)

### 6.5 크기 프리셋 매핑

| 프리셋 | Tailwind | 사용 대상 |
|--------|----------|----------|
| `sm` | `max-w-sm` (384px) | ConfirmModal, AdminPasswordModal |
| `md` | `max-w-md` (448px) | AccessDeniedModal, AgreementFailedModal, ParsingOverlay |
| `lg` | `max-w-lg` (512px) | AgreementDeleteConfirmModal, CreateUserModal, EditUserModal, DeleteUserConfirmModal, ChangeHistoryModal |
| `xl` | `max-w-xl` (576px) | — |
| `2xl` | `max-w-2xl` (672px) | DefectReportModal, ScheduleModal, ManageUsersModal, TestDetailModal, ProjectListModal |
| `full` | `w-full h-full` (전체화면, p-3 패딩) | DefectRefBoardModal |
| (커스텀) | `max-w-[112rem] max-h-[75vh]` | GuideModal (className으로 오버라이드) |

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section (§6)
- [x] ESLint configuration
- [x] TypeScript configuration (`strict: true`)
- [x] 시맨틱 CSS 토큰 시스템 정의 (`tailwind.config.js` + `index.css`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **모달 네이밍** | `*Modal.tsx` 일관 | 유지 | — |
| **모달 크기** | 각자 하드코딩 | `size` prop 프리셋 사용 필수 | High |
| **모달 z-index** | 혼재 (z-20~z-50) | 기본 z-50, 중첩 z-[60] | High |
| **모달 백드롭** | 혼재 | `--overlay-backdrop` CSS 변수 사용 | High |
| **포지셔닝** | fixed/absolute 혼재 | `fixed` 필수 | High |

### 7.3 Environment Variables Needed

해당 없음 (프론트엔드 UI 리팩토링)

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design modal-system-unification`)
2. [ ] Step 1 구현: BaseModal 확장 + FormModal 생성
3. [ ] Step 2 구현: 단순 모달 7개 마이그레이션
4. [ ] Step 3 구현: 폼/복합 모달 9개 마이그레이션
5. [ ] Gap Analysis (`/pdca analyze modal-system-unification`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-14 | Initial draft | Claude |
