# Code Quality Analysis Results

## Analysis Target
- Path: `src/` (full project)
- File count: ~90 TypeScript/TSX files
- Analysis date: 2026-03-12
- Stack: React + TypeScript + Vite + Tailwind CSS + Firebase (Firestore, Storage, Functions)

## Quality Score: 62/100

---

## Issues Found

### CRITICAL (Immediate Fix Required)

| # | File | Line | Issue | Recommended Action |
|---|------|------|-------|-------------------|
| C1 | `src/features/admin/hooks/useAdminAuth.ts` | 11-12 | **Admin password exposed to client bundle.** `VITE_ADMIN_PASSWORD` is a `VITE_`-prefixed env var, meaning it is embedded in the production JS bundle. Anyone can extract it from browser DevTools (`import.meta.env.VITE_ADMIN_PASSWORD`). The client-side comparison `password === adminPassword` provides zero security. | Move admin authentication to a Firebase Cloud Function or Firebase Auth custom claims. The password must never reach the browser. |
| C2 | `firestore.rules` | 19-21 | **Wildcard rule allows any authenticated user to read/write every collection.** `match /{document=**} { allow read, write: if isSignedIn(); }` grants full database access to any logged-in user. The defect-specific lock rule (lines 14-17) is shadowed by this wildcard for non-defect collections. | Implement per-collection rules. At minimum: `contentOverrides`, `roleContacts`, `docMaterials` should be read-only for non-admins; `projects` write should be restricted to owner/tester; `agreementDocs` write should be restricted by testNumber ownership. |
| C3 | `.env` | 1-7 | **Real Firebase credentials and admin password committed in the working tree.** Although `.env` is in `.gitignore`, the file currently exists and `VITE_ADMIN_PASSWORD=12Sqecd34!` is present. If this file was ever committed to git history, credentials are permanently exposed. `.env.example` exists but only as a template. | 1) Rotate the admin password immediately. 2) Audit git history for `.env` commits (`git log --all --full-history -- .env`). 3) If found, use `git filter-repo` or BFG to purge. 4) Store secrets in Vercel/GitHub Secrets only. |
| C4 | `src/features/admin/hooks/useAdminAuth.ts` | 7 | **Admin session persisted in `sessionStorage` with no server verification.** After one successful client-side password check, the flag `gs-admin-authenticated=true` is stored. Any user can manually set this value in DevTools to bypass admin auth entirely. | Enforce admin status server-side: use Firebase Auth custom claims (`admin: true`) checked in Firestore rules and Cloud Functions. |
| C5 | `storage.rules` | 9-10 | **Any authenticated user can write to any agreement path.** `match /agreements/{testNumber}/{fileName} { allow read, write: if request.auth != null; }` means User A can overwrite User B's agreement files. | Add ownership validation: store uploader UID in Firestore and check `request.auth.uid` matches the project's tester/creator. |

### WARNING (Improvement Recommended)

| # | File | Line | Issue | Recommended Action |
|---|------|------|-------|-------------------|
| W1 | `src/features/checklist/routes/ExecutionPage.tsx` | entire file | **File is 773 lines.** This single component manages localStorage persistence, Firestore sync, branching logic, keyboard shortcuts, review state, defect modals, and auto-advance. It handles 15+ pieces of state. | Extract into custom hooks: `useReviewPersistence`, `useBranchingNavigation`, `useQuickReviewSync`. Target <300 lines per file. |
| W2 | `src/features/test-setup/components/TestSetupPage.tsx` | entire file | **File is 977 lines.** Contains extensive form logic, multiple modals, file upload handling, and layout rendering in one component. | Split into `TestSetupForm`, `AgreementUpload`, `ProjectSelector` sub-components and a `useTestSetupForm` hook. |
| W3 | `src/features/checklist/components/CenterDisplay.tsx` | entire file | **File is 664 lines.** Contains duplicated branching logic (`computeSkipped` at line 168) that already exists in `src/utils/branchingResolver.ts` (`computeSkippedIndices`). | Import `computeSkippedIndices` from `branchingResolver.ts` instead of reimplementing. Extract the document preview modal into a separate component. |
| W4 | `src/features/test-setup/hooks/useTestSetupState.ts` | entire file | **File is 616 lines.** Single hook manages test setup CRUD, agreement upload/delete, project creation, schedule management, and Firestore sync. | Split into `useAgreementUpload`, `useProjectSync`, `useScheduleState` hooks composed together. |
| W5 | `src/features/test-setup/hooks/useTestSetupState.ts` | 161-184 | **Excessive `as` type assertions on Firestore data.** Six consecutive casts like `(nextAgreementParsed as { managerName?: string }).managerName` bypass type safety. | Define a proper `AgreementFirestoreDoc` interface and use a single typed cast at the top, or use a validation/parsing function. |
| W6 | `src/features/checklist/routes/ExecutionPage.tsx` | 130-164 | **Firestore data cast to `Record<string, unknown>` then field-by-field `as` assertions.** 8 sequential `as` casts on unvalidated external data. | Use a schema validation library (e.g., zod) to parse Firestore snapshots, or create a typed `parseQuickReviewDoc` helper. |
| W7 | `src/features/checklist/routes/ExecutionPage.tsx` | 92-110 | **Content override fingerprint uses `JSON.stringify` for change detection.** Serializing the entire overrides map every render for comparison is wasteful. | Use a hash or version counter from Firestore (`updatedAt` timestamp) instead of full serialization. |
| W8 | `src/features/checklist/components/CenterDisplay.tsx` | 58-69 | **`onSnapshot` listener on entire `docMaterials` collection inside a frequently-rendered component.** This creates a new Firestore listener per mount of CenterDisplay, even though the same data is already fetched by `useDocMaterials()` in the parent. | Remove the duplicate subscription. Pass `docDescriptions` from the parent or use the existing `useDocMaterials` hook. |
| W9 | `src/features/checklist/routes/ExecutionPage.tsx` | 100, 173, 230, 276 | **4 instances of `eslint-disable` for `react-hooks/exhaustive-deps`.** Suppressed dependency warnings often indicate stale closure bugs. | Restructure effects to include all dependencies, or use refs explicitly for values that should not trigger re-runs. Document the reason for each suppression. |
| W10 | `src/features/checklist/routes/ExecutionPage.tsx` | 194-202 | **localStorage write on every state change.** The `useEffect` at line 195 runs whenever `profile`, `reviewData`, `selectedReqId`, `quickReviewById`, `testSetup`, `currentUserId`, or `currentTestNumber` changes, calling `JSON.stringify` and `localStorage.setItem` each time. | Debounce the localStorage write (e.g., 500ms) to reduce I/O during rapid interactions. |
| W11 | `src/features/checklist/routes/ExecutionPage.tsx` | 222-230 | **Unconditional Firestore write of `executionState` on every change.** This effect fires on each `executionState` mutation, causing a Firestore write per user interaction. | Debounce or batch these writes. Consider writing only on significant state transitions (e.g., item completion). |
| W12 | `src/hooks/useContentOverrides.ts` | 9-19 | **No error handling on Firestore `onSnapshot`.** If the snapshot listener fails (network error, permission denied), the error is silently swallowed. | Add an `onError` callback to `onSnapshot` and surface it to the user or a logging service. This pattern recurs in 12+ hooks across the codebase. |
| W13 | `src/features/checklist/components/CenterDisplay.tsx` | 122-161 | **N+1 Storage API calls.** For each `refItem`, the component calls `listAll()` then `getDownloadURL()` individually. With 5+ required docs, this creates 10+ sequential API calls per item selection. | Cache preview URLs at the provider level. Batch-resolve on app load or use signed URLs stored in Firestore. |
| W14 | `src/features/admin/components/ContentOverrideManagement.tsx` | 322-333 | **`handleResetAll` deletes documents sequentially via `Promise.all` without batching.** For large override sets, this creates N individual delete operations. | Use Firestore batched writes (`writeBatch`) for atomic multi-document operations. |
| W15 | `src/components/schedule/ScheduleWizard.tsx` | entire file | **File is 550 lines** with mixed concerns (calendar rendering, milestone management, modal handling). | Extract calendar grid into a reusable `CalendarGrid` component. |

### INFO (Reference)

| # | Observation | Details |
|---|-------------|---------|
| I1 | **Good type system usage overall** | Core types in `src/types/checklist.ts` are well-structured with proper discriminated unions (`ReviewStatus`, `QuickAnswer`, `QuickDecision`). No `any` types found in application code. |
| I2 | **Consistent memoization** | 118 instances of `useMemo`/`useCallback`/`React.memo` across 28 files. Performance-critical paths like `ExecutionPage` properly memoize derived computations. |
| I3 | **No XSS via `dangerouslySetInnerHTML`** | Zero instances found. All user content is rendered via React's built-in escaping. |
| I4 | **Clean feature-based architecture** | `src/features/` directory cleanly separates `checklist`, `admin`, `defects`, `design`, `report`, `test-setup`, `pl-directory` with co-located hooks/components/routes. |
| I5 | **Proper Firebase initialization guard** | `src/lib/firebase.ts` checks all env vars before initializing (`firebaseReady`), preventing crashes in environments without Firebase config. |
| I6 | **No `@ts-ignore` or `@ts-expect-error`** | Zero instances found, indicating disciplined TypeScript usage. |
| I7 | **38 console.warn/error calls** | These are used for Firestore operation failures. Acceptable for development but should be replaced with a structured logging/error reporting service for production. |
| I8 | **`.env.example` template exists** | Proper template provided for environment variables. |
| I9 | **Good use of Firestore `merge: true`** | Firestore writes consistently use `{ merge: true }` to prevent accidental data overwrites. |

---

## Duplicate Code Analysis

### Duplicates Found

| Type | Location 1 | Location 2 | Similarity | Recommended Action |
|------|------------|------------|------------|-------------------|
| Functional | `src/utils/branchingResolver.ts:8` (`computeSkippedIndices`) | `src/features/checklist/components/CenterDisplay.tsx:168` (`computeSkipped`) | ~95% | Delete `computeSkipped` in CenterDisplay, import from `branchingResolver.ts` |
| Structural | `src/features/checklist/routes/ExecutionPage.tsx:40-60` (`readStoredReview`) | `src/App.tsx:15-29` (`readStoredSetup`) | ~70% | Extract shared localStorage read logic into `src/utils/storageUtils.ts` |
| Structural | `src/hooks/useContentOverrides.ts` | `src/features/admin/components/ContentOverrideManagement.tsx:50-59` | ~90% | ContentOverrideManagement should use `useContentOverrides` hook instead of duplicating the `onSnapshot` subscription |
| Structural | `src/hooks/useDocMaterials.ts` | `src/features/checklist/components/CenterDisplay.tsx:58-69` | ~85% | CenterDisplay subscribes to `docMaterials` independently when `useDocMaterials` already does this at the parent level |
| Pattern | Multiple `onSnapshot` hooks | `useUsers`, `usePlDirectory`, `useProjects`, `useContentOverrides`, `useDocMaterials`, `useReferenceGuides` | Identical pattern | Create a generic `useFirestoreCollection<T>(collectionName, parser)` hook |

### Extensibility Issues

| File | Pattern | Problem | Suggestion |
|------|---------|---------|------------|
| `src/utils/quickMode.ts:22-43` | Hardcoded `CATEGORY_TAGS` and `TAG_PATTERNS` | Adding new categories or tags requires code changes | Move to a configuration file or Firestore-managed config |
| `src/utils/quickMode.ts:10-20` | Hardcoded `MUST_HINTS` / `SHOULD_HINTS` | Importance inference keywords are fixed in code | Allow admin override (already partially done via `checkpointImportances`) |
| `src/features/checklist/routes/ChecklistView.tsx:25-29` | Hardcoded `CATEGORY_QUALITY_MAP` | Mapping categories to quality characteristics is static | Move to a shared constant or derive from requirement metadata |

---

## Architecture Compliance

### Layer Separation

| Check | Status | Notes |
|-------|--------|-------|
| Feature-based module isolation | PASS | Each feature has its own `components/`, `hooks/`, `routes/` |
| Shared UI components | PASS | `src/components/ui/` provides reusable Button, Input, ConfirmModal |
| Firebase access centralized | PARTIAL | `src/lib/firebase.ts` exports instances, but many components import `db` directly instead of receiving it via props/context |
| Type definitions centralized | PASS | `src/types/` with proper barrel exports |
| Business logic in hooks | PARTIAL | ExecutionPage (773 lines) mixes business logic with component rendering |

### Dependency Direction Issues

| From | To | Violation |
|------|-----|-----------|
| `src/features/checklist/components/CenterDisplay.tsx` | `src/features/admin/hooks/useStepContacts.ts` | Checklist feature directly imports from admin feature. Should go through a shared hook or provider. |
| `src/features/checklist/components/CenterDisplay.tsx` | `src/lib/firebase.ts` (direct `db`, `storage` import) | Component directly accesses infrastructure. Should receive data through props or context. |

---

## Improvement Recommendations

### Priority 1 -- Security (Immediate)

1. **Replace client-side admin auth with Firebase Auth custom claims.** Create a Cloud Function `setAdminClaim` that sets `{ admin: true }` on a user's token. Check this claim in Firestore rules and client-side routing.

2. **Tighten Firestore rules.** Remove the `/{document=**}` wildcard. Define explicit rules per collection:
   ```
   match /projects/{projectId} {
     allow read: if isSignedIn();
     allow write: if isSignedIn() && (isAdmin() || isProjectOwner(projectId));
   }
   match /contentOverrides/{docId} {
     allow read: if isSignedIn();
     allow write: if isSignedIn() && isAdmin();
   }
   ```

3. **Audit git history for `.env` exposure.** Run `git log --all -- .env` and purge if found. Rotate the admin password and Firebase API key if exposed.

### Priority 2 -- Performance

4. **Debounce localStorage and Firestore writes in ExecutionPage.** Both the localStorage cache (line 195) and executionState sync (line 222) should be debounced by 500-1000ms.

5. **Eliminate duplicate Firestore subscriptions.** CenterDisplay should not subscribe to `docMaterials` independently. Pass data from the parent or use the existing `useDocMaterials` hook.

6. **Cache Storage preview URLs.** Move preview URL resolution to a provider-level cache to avoid repeated `listAll()` + `getDownloadURL()` calls on every item selection.

### Priority 3 -- Code Quality / Maintainability

7. **Split ExecutionPage into focused hooks.** Extract:
   - `useReviewPersistence(testNumber)` -- localStorage + Firestore sync
   - `useBranchingNavigation(quickModeItem, answers)` -- skip/trigger computation
   - `useReviewActions(checklist, itemGates)` -- answer/verdict handlers

8. **Remove duplicated `computeSkipped` from CenterDisplay.** Import `computeSkippedIndices` from `src/utils/branchingResolver.ts`.

9. **Create a generic `useFirestoreCollection` hook** to replace the 6+ near-identical `onSnapshot` patterns:
   ```ts
   function useFirestoreCollection<T>(path: string, parser: (data: unknown) => T): T[] {
     // Shared onSnapshot logic with error handling
   }
   ```

10. **Add Firestore snapshot error handling** to all `onSnapshot` calls (currently 12+ locations silently swallow errors).

### Priority 4 -- Type Safety

11. **Replace sequential `as` casts on Firestore data** (especially in `useTestSetupState.ts:161-184` and `ExecutionPage.tsx:130-164`) with proper parsing/validation functions.

12. **Define typed Firestore document interfaces** for each collection (`QuickReviewDoc`, `AgreementDoc`, `ProjectDoc`) and parse at the boundary.
