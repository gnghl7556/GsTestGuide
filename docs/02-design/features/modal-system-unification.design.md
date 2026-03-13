# Modal System Unification Design Document

> **Summary**: BaseModal 확장 + FormModal 신규 생성으로 18개 모달을 통합하는 상세 설계
>
> **Project**: GsTestGuide
> **Author**: Claude
> **Date**: 2026-03-14
> **Status**: Draft
> **Planning Doc**: [modal-system-unification.plan.md](../../01-plan/features/modal-system-unification.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **일관성**: 모든 모달이 동일한 백드롭, ESC, Click-Outside, 포커스 동작 제공
2. **재사용성**: BaseModal/FormModal 상속만으로 새 모달을 빠르게 생성
3. **최소 변경**: 각 모달의 내부 콘텐츠(JSX)는 최대한 보존, 래퍼만 교체
4. **무회귀**: 기존 폼 제출, 닫기, 키보드 동작이 동일하게 유지

### 1.2 Design Principles

- **기존 API 보존**: 각 모달의 Props 인터페이스 변경 없음
- **점진적 마이그레이션**: Step별로 커밋하여 회귀 즉시 감지
- **시맨틱 토큰 준수**: 하드코딩 색상 제거, CSS 변수 사용

---

## 2. Architecture

### 2.1 Component Hierarchy

```
BaseModal (확장)
├── ConfirmModal (기존 유지)
├── FormModal (신규)
│   ├── AdminPasswordModal
│   ├── CreateUserModal
│   ├── EditUserModal
│   └── DefectReportModal
├── 단순 모달 (BaseModal 직접 사용)
│   ├── AccessDeniedModal
│   ├── AgreementDeleteConfirmModal
│   ├── AgreementFailedModal
│   ├── DeleteUserConfirmModal
│   ├── ChangeHistoryModal
│   ├── ScheduleModal
│   ├── ManageUsersModal
│   ├── TestDetailModal
│   ├── ProjectListModal
│   └── ParsingOverlay (closeOnEsc: false)
└── 레이아웃 모달 (BaseModal + size="full" 또는 커스텀)
    ├── DefectRefBoardModal
    └── GuideModal
```

### 2.2 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| FormModal | BaseModal | 폼 모달 패턴 (헤더+폼+푸터) |
| ConfirmModal | BaseModal | 확인/삭제 대화 (기존) |
| 모든 Feature 모달 | BaseModal 또는 FormModal | 래퍼 |

---

## 3. Data Model

### 3.1 BaseModal Props (확장)

```typescript
type BaseModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: BaseModalSize;           // 기본값: 'sm'
  className?: string;             // 내부 패널 커스텀 클래스
  closeOnEsc?: boolean;           // 기본값: true
  closeOnBackdropClick?: boolean; // 기본값: true
  ariaLabelledBy?: string;        // aria-labelledby 연결
}
```

### 3.2 FormModal Props (신규)

```typescript
interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: BaseModalSize;           // 기본값: 'lg'
  busy?: boolean;                 // 제출 중 상태
  submitLabel?: string;           // 기본값: '확인'
  cancelLabel?: string;           // 기본값: '취소'
  onSubmit: () => void | Promise<void>;
  error?: string | null;          // 에러 메시지 표시
  children: ReactNode;            // 폼 필드 영역
}
```

### 3.3 Size Mapping

```typescript
const sizeClasses: Record<BaseModalSize, string> = {
  sm:   'max-w-sm',                      // 384px
  md:   'max-w-md',                      // 448px
  lg:   'max-w-lg',                      // 512px
  xl:   'max-w-xl',                      // 576px
  '2xl': 'max-w-2xl',                    // 672px
  full: 'w-full h-full',                 // 전체화면 (p-3 패딩)
};
```

---

## 4. UI/UX Design

### 4.1 BaseModal 레이아웃

```
┌──────────────── Backdrop (fixed inset-0 z-50) ─────────────────┐
│                  bg-[var(--overlay-backdrop)]                    │
│                  backdrop-blur-sm                                │
│                                                                  │
│     ┌──────── Panel (크기 프리셋) ────────┐                     │
│     │  rounded-2xl                         │                     │
│     │  border border-ln                    │                     │
│     │  bg-surface-overlay                  │                     │
│     │  shadow-2xl                          │                     │
│     │                                      │                     │
│     │  {children}                          │                     │
│     │                                      │                     │
│     └──────────────────────────────────────┘                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

size="full" 시:
┌──── Backdrop (fixed inset-0 z-50) ────┐
│  ┌──── Panel (p-3) ────────────────┐  │
│  │  w-full h-full                  │  │
│  │  rounded-xl                     │  │
│  │  {children}                     │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

### 4.2 FormModal 레이아웃

```
┌─────────────── FormModal Panel ───────────────┐
│ ┌───────────── Header (shrink-0) ───────────┐ │
│ │  title                        [닫기 버튼]  │ │
│ │  border-b border-ln                        │ │
│ └────────────────────────────────────────────┘ │
│ ┌───────────── Body (flex-1, scroll) ────────┐ │
│ │                                             │ │
│ │  {children} — 폼 필드                       │ │
│ │                                             │ │
│ │  {error && 에러 메시지}                     │ │
│ └────────────────────────────────────────────┘ │
│ ┌───────────── Footer (shrink-0) ────────────┐ │
│ │  border-t border-ln                        │ │
│ │              [취소]  [확인/제출 (busy 시 ⟳)]│ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### 4.3 포커스 트랩 동작

```
사용자가 Tab 누름:
  → 모달 내 마지막 focusable 요소에서 → 첫 번째 focusable 요소로 이동
  → Shift+Tab 시 역방향 순환

모달 열릴 때:
  → 첫 번째 focusable 요소에 자동 포커스 (autoFocus)
  → body에 overflow: hidden 적용 (배경 스크롤 방지)

모달 닫힐 때:
  → 이전에 포커스되었던 요소로 복원
  → body overflow 복원
```

---

## 5. Component Specification

### 5.1 BaseModal 확장 구현

```typescript
// src/components/ui/BaseModal.tsx (~90줄)

import { useEffect, useRef, useCallback, type ReactNode } from 'react';

type BaseModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: BaseModalSize;
  className?: string;
  closeOnEsc?: boolean;
  closeOnBackdropClick?: boolean;
  ariaLabelledBy?: string;
}

const sizeClasses: Record<BaseModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'w-full h-full',
};

export function BaseModal({
  open,
  onClose,
  children,
  size = 'sm',
  className = '',
  closeOnEsc = true,
  closeOnBackdropClick = true,
  ariaLabelledBy,
}: BaseModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ESC 처리
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, closeOnEsc]);

  // 포커스 트랩 + 배경 스크롤 방지
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    // 포커스 트랩: Tab/Shift+Tab 순환
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);

    // 첫 focusable 요소에 포커스
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // Backdrop 클릭 핸들러
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) onClose();
  }, [closeOnBackdropClick, onClose]);

  if (!open) return null;

  const isFullSize = size === 'full';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] backdrop-blur-sm ${isFullSize ? 'p-3' : 'p-4'}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby={ariaLabelledBy}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={`w-full ${sizeClasses[size]} ${isFullSize ? 'rounded-xl' : 'rounded-2xl'} border border-ln bg-surface-overlay shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export type { BaseModalSize, BaseModalProps };
```

### 5.2 FormModal 구현

```typescript
// src/components/ui/FormModal.tsx (~70줄)

import { type ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';
import { BaseModal, type BaseModalSize } from './BaseModal';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: BaseModalSize;
  busy?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: () => void | Promise<void>;
  error?: string | null;
  children: ReactNode;
}

export function FormModal({
  open,
  onClose,
  title,
  size = 'lg',
  busy = false,
  submitLabel = '확인',
  cancelLabel = '취소',
  onSubmit,
  error,
  children,
}: FormModalProps) {
  const handleClose = () => {
    if (!busy) onClose();
  };

  return (
    <BaseModal open={open} onClose={handleClose} size={size}>
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ln px-5 py-4 shrink-0">
          <div className="text-sm font-extrabold text-tx-primary">{title}</div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-md border border-ln p-1.5 text-tx-muted hover:text-tx-primary hover:bg-surface-raised transition-colors disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {children}
          {error && (
            <div className="text-xs text-danger-text">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ln px-5 py-3 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-lg border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:text-tx-primary disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60 flex items-center gap-1.5"
          >
            {busy && <Loader2 size={12} className="animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
```

---

## 6. Migration Specification

### 6.1 Step 1: 인프라 (BaseModal 확장 + FormModal 생성)

| 파일 | 작업 | 변경 크기 |
|------|------|----------|
| `src/components/ui/BaseModal.tsx` | 확장 (47줄 → ~90줄) | Medium |
| `src/components/ui/FormModal.tsx` | 신규 생성 (~70줄) | New |
| `src/components/ui/index.ts` | FormModal export 추가 | Trivial |

### 6.2 Step 2: 단순 모달 마이그레이션 (7개)

| 모달 | 현재 | 변경 후 | 변경 내용 |
|------|------|--------|----------|
| **AccessDeniedModal** | 자체 (`absolute z-40`) | `BaseModal size="md"` | 래퍼 교체, `closeOnEsc: false` |
| **AgreementDeleteConfirmModal** | 자체 (`absolute z-30`) | `BaseModal size="lg"` | 래퍼 교체 |
| **AgreementFailedModal** | 자체 (`absolute z-20`) | `BaseModal size="md"` | 래퍼 교체 |
| **DeleteUserConfirmModal** | 자체 (`absolute z-30`) | `BaseModal size="lg"` | 래퍼 교체 |
| **ScheduleModal** | 자체 (`fixed z-50`) | `BaseModal size="2xl"` | 래퍼 교체, ESC 유지 |
| **ChangeHistoryModal** | 자체 (`fixed z-50`) | `BaseModal size="lg"` | 래퍼 교체, max-h 유지 |
| **ParsingOverlay** | 자체 (`fixed z-50`) | `BaseModal size="md" closeOnEsc={false} closeOnBackdropClick={false}` | 래퍼 교체 |

**마이그레이션 패턴 (Before → After):**

```tsx
// Before (AccessDeniedModal)
if (!open) return null;
return (
  <div className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
    <div className="w-full max-w-md rounded-2xl border border-ln bg-surface-overlay shadow-xl">
      {/* 내용 */}
    </div>
  </div>
);

// After
return (
  <BaseModal open={open} onClose={onClose} size="md" closeOnEsc={false}>
    {/* 동일한 내용 (래퍼 div 2개 제거) */}
  </BaseModal>
);
```

### 6.3 Step 3: 폼/복합 모달 마이그레이션 (9개)

| 모달 | 현재 | 변경 후 | 핵심 변경 |
|------|------|--------|----------|
| **AdminPasswordModal** | 자체 (`fixed z-40`) | `FormModal size="sm"` | 래퍼 교체, 하드코딩 `bg-black/60` 제거 |
| **CreateUserModal** | 자체 (`absolute z-30`) | `FormModal size="lg"` | 래퍼 교체, 에러 표시를 `error` prop으로 |
| **EditUserModal** | 자체 (`absolute z-30`) | `FormModal size="lg"` | CreateUserModal과 동일 패턴 |
| **DefectReportModal** | 자체 (`fixed z-50`) | `FormModal size="2xl"` | 래퍼 교체, ESC 추가됨 |
| **ManageUsersModal** | 자체 (`absolute z-30`) | `BaseModal size="2xl"` | 래퍼 교체 (폼 아닌 리스트) |
| **TestDetailModal** | 자체 (`fixed z-50`) | `BaseModal size="2xl"` | 래퍼 교체 |
| **ProjectListModal** | 자체 (`absolute z-30`) | `BaseModal size="2xl"` | 래퍼 교체, 중첩 복제 대화는 ConfirmModal 활용 |
| **DefectRefBoardModal** | 자체 (`fixed z-50`) | `BaseModal size="full"` | 래퍼 교체 |
| **GuideModal** | 자체 (`fixed z-50`) | `BaseModal size="2xl" className="max-w-[112rem] max-h-[75vh]"` | 래퍼 교체, 커스텀 크기 유지 |

**FormModal 마이그레이션 패턴 (Before → After):**

```tsx
// Before (CreateUserModal) - 138줄
export function CreateUserModal({ open, onClose, ... }) {
  const [form, setForm] = useState({...});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-ln bg-surface-overlay shadow-xl">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4">
          <div className="text-sm font-extrabold">사용자 추가</div>
          <button onClick={handleClose}>닫기</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {/* 폼 필드들 */}
          {error && <div className="text-xs text-danger-text">{error}</div>}
        </div>
        <div className="border-t border-ln px-5 py-3 flex justify-end gap-2">
          <button onClick={handleClose}>취소</button>
          <button onClick={handleSubmit}>{loading ? '생성 중...' : '생성'}</button>
        </div>
      </div>
    </div>
  );
}

// After (~100줄, 래퍼 30줄 절감)
export function CreateUserModal({ open, onClose, ... }) {
  const [form, setForm] = useState({...});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="사용자 추가"
      size="lg"
      busy={loading}
      submitLabel="생성"
      onSubmit={handleSubmit}
      error={error}
    >
      {/* 폼 필드들만 (래퍼/헤더/푸터 제거됨) */}
      <div>
        <label className="text-xs text-tx-tertiary block mb-1">이름</label>
        <input ... />
      </div>
      {/* ... */}
    </FormModal>
  );
}
```

---

## 7. Error Handling

### 7.1 에러 시나리오

| 시나리오 | 현재 처리 | 변경 후 |
|----------|---------|--------|
| ESC 키 눌림 + busy 상태 | 일부만 차단 | FormModal: busy 시 ESC 무시 |
| 포커스 트랩 내 focusable 없음 | — | 트랩 비활성화 (안전 처리) |
| 중첩 모달 ESC | 둘 다 닫힘 가능 | `stopPropagation`으로 최상위만 닫기 |

---

## 8. Test Plan

### 8.1 수동 테스트 체크리스트

| # | 테스트 항목 | 검증 방법 |
|---|------------|----------|
| T-01 | 모든 모달 ESC 키로 닫기 | 각 모달 열고 ESC 누름 |
| T-02 | ParsingOverlay는 ESC로 안 닫힘 | 파싱 중 ESC 누름 → 유지 확인 |
| T-03 | 백드롭 클릭으로 닫기 | 모달 외부 영역 클릭 |
| T-04 | busy 상태에서 닫기 차단 | 폼 제출 중 ESC/백드롭 클릭 → 유지 |
| T-05 | Tab 키 포커스 순환 | 모달 내에서 Tab → 마지막 요소 → 첫 번째로 순환 |
| T-06 | 폼 제출 정상 동작 | CreateUser, EditUser, DefectReport 폼 제출 |
| T-07 | 결함 참조 보드 전체화면 | DefectRefBoardModal 열기 → 좌측 탭 동작 |
| T-08 | 참고 가이드 커스텀 크기 | GuideModal 열기 → 넓은 모달 확인 |
| T-09 | ProjectListModal 중첩 | 프로젝트 복제 → ConfirmModal 중첩 표시 |
| T-10 | Vercel 빌드 성공 | `npm run build` 통과 |

---

## 9. Implementation Guide

### 9.1 File Structure

```
src/components/ui/
├── BaseModal.tsx     # 확장 (기존 파일 수정)
├── FormModal.tsx     # 신규 생성
├── ConfirmModal.tsx  # 기존 유지 (변경 없음)
└── index.ts          # FormModal export 추가

src/features/admin/components/
├── AdminPasswordModal.tsx          # FormModal 기반으로 전환

src/features/admin/components/content/
├── ChangeHistoryModal.tsx          # BaseModal 기반으로 전환

src/features/checklist/components/
├── ScheduleModal.tsx               # BaseModal 기반으로 전환

src/features/defects/components/
├── DefectRefBoardModal.tsx         # BaseModal size="full"로 전환
├── DefectReportModal.tsx           # FormModal 기반으로 전환

src/features/guide/components/
├── GuideModal.tsx                  # BaseModal + className 오버라이드

src/features/test-setup/components/modals/
├── AccessDeniedModal.tsx           # BaseModal 기반으로 전환
├── AgreementDeleteConfirmModal.tsx # BaseModal 기반으로 전환
├── AgreementFailedModal.tsx        # BaseModal 기반으로 전환
├── CreateUserModal.tsx             # FormModal 기반으로 전환
├── DeleteUserConfirmModal.tsx      # BaseModal 기반으로 전환
├── EditUserModal.tsx               # FormModal 기반으로 전환
├── ManageUsersModal.tsx            # BaseModal 기반으로 전환
├── TestDetailModal.tsx             # BaseModal 기반으로 전환
├── ProjectListModal.tsx            # BaseModal 기반으로 전환
├── ParsingOverlay.tsx              # BaseModal closeOnEsc={false}
└── index.ts                        # 변경 없음
```

### 9.2 Implementation Order

**Step 1: 인프라** (1커밋)
1. [ ] BaseModal.tsx 확장 (크기 프리셋, closeOnEsc, closeOnBackdropClick, 포커스 트랩, aria, body overflow)
2. [ ] FormModal.tsx 신규 생성
3. [ ] index.ts에 FormModal export 추가
4. [ ] 빌드 확인 (`npm run build`)

**Step 2: 단순 모달 7개** (1커밋)
5. [ ] AccessDeniedModal → BaseModal
6. [ ] AgreementDeleteConfirmModal → BaseModal
7. [ ] AgreementFailedModal → BaseModal
8. [ ] DeleteUserConfirmModal → BaseModal
9. [ ] ScheduleModal → BaseModal
10. [ ] ChangeHistoryModal → BaseModal
11. [ ] ParsingOverlay → BaseModal (closeOnEsc: false, closeOnBackdropClick: false)
12. [ ] 빌드 확인

**Step 3: 폼/복합 모달 9개** (1커밋)
13. [ ] AdminPasswordModal → FormModal
14. [ ] CreateUserModal → FormModal
15. [ ] EditUserModal → FormModal
16. [ ] DefectReportModal → FormModal
17. [ ] ManageUsersModal → BaseModal
18. [ ] TestDetailModal → BaseModal
19. [ ] ProjectListModal → BaseModal
20. [ ] DefectRefBoardModal → BaseModal size="full"
21. [ ] GuideModal → BaseModal + className 오버라이드
22. [ ] 최종 빌드 확인 + 전체 모달 수동 테스트

---

## 10. Coding Convention Reference

### 10.1 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | `*Modal.tsx` (PascalCase) |
| File organization | 각 Feature 디렉터리 내 유지 (이동 없음) |
| State management | 각 모달 내부 useState (변경 없음) |
| Styling | 시맨틱 토큰 (`--overlay-backdrop`, `bg-surface-overlay`, `border-ln`) |
| Props | 기존 인터페이스 유지, 내부 래퍼만 교체 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-14 | Initial draft | Claude |
