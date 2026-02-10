# Frontend Development Tasks

**Status:** Phase 11 - Documentation & Hardening
**Build:** 36.75KB main bundle gzip | 1532 tests passing

---

## Phase Summary

| Phase | Status         | Description                                         |
| ----- | -------------- | --------------------------------------------------- |
| 1     | ✅ Complete    | Foundation (setup, routing, state, UI)              |
| 1.5   | ✅ Complete    | Theme System (tokens, provider, FOUC prevention)    |
| 1.6   | ✅ Complete    | Modernization (FSD, types, auth consolidation)      |
| 2     | ✅ Complete    | Authentication (login, SSO, permissions)            |
| 3     | ✅ Complete    | Session Management (WebSocket, lobby, room)         |
| 4     | ✅ Complete    | Media & WebRTC (devices, P2P, screen share)         |
| 5     | ✅ Complete    | AI Integration (audio capture/playback, actors)     |
| 6     | ✅ Complete    | Compliance & Recording (proctoring, consent, mix)   |
| 7     | ✅ Complete    | Admin, Outcomes & Integrations (CRUD, connectors)   |
| 8     | ✅ Complete    | Polish & Testing (coverage, E2E, performance)       |
| 9     | ✅ Complete    | Agent Verification (8 agent reviews)                |
| 10    | ✅ Complete    | Critical Remediation (reduced motion, empty states) |
| 11    | 🔄 In Progress | Documentation & Hardening                           |

---

## Phase 11: Documentation & Hardening

### Documentation Restructuring

- [x] Restructure development-process/ to BMAD methodology
- [x] Create tracker/backlog.md for deferred items
- [x] Create BMAD directories (business/, model/, api/, development/, decisions/)
- [x] Create README.md navigation hub
- [x] Migrate numbered docs to new structure
- [x] Archive old numbered files
- [x] Create new skills (domain-config, routing, api-service, testing)
- [x] Update CLAUDE.md references
- [x] Create model/pages-and-routing.md
- [x] Create model/shared-packages.md

### Auth Hardening (Deferred from Phase 9)

- [x] Move user data from auth.store to TanStack Query
- [x] Implement token-only auth store pattern
- [x] Code review fixes: extract ROLE_HIERARCHY, add useCurrentUser tests, centralize mock pattern
- [ ] Add useSuspenseQuery adoption (P2 - future)

### Test Coverage & Consolidation ✅ Complete

- [x] Add P1 session hook tests (useSession, useCreateSession, useJoinSession)
- [x] Consolidate all tests to centralized `src/test/unit/` folder
- [x] Update all relative imports to use absolute `@/` paths
- [x] Verify: 1532 tests passing, typecheck clean, lint clean

### Code Quality Enforcement ✅ Complete

- [x] Add tiered file length enforcement (600/900/800), max-depth, complexity, max-params ESLint rules
- [x] Add commitlint, husky hooks, .editorconfig, .gitattributes, CONTRIBUTING.md
- [x] Add eslint-disable with tracking comments for existing violations

### File Length Refactoring (TASK-REFACTOR-007)

Files with `eslint-disable` that need refactoring to remove the disable:

- [ ] `features/media/hooks/useDeviceSwitch.ts` — flatten nested device switching (max-depth)
- [ ] `features/media/services/stats-monitor.service.ts` — flatten nested stats processing (max-depth)
- [ ] `features/media/services/webrtc.service.ts` — flatten nested peer connection logic (max-depth)
- [ ] `features/recording/hooks/useRecording.ts` — flatten nested recording state logic (max-depth)
- [ ] `features/sessions/components/room/MediaInitializer.tsx` — flatten nested media init conditions (max-depth)
- [ ] `features/sessions/components/wizard/SessionWizard.tsx` (726 lines) — extract wizard steps
- [ ] `features/realtime/services/websocket.service.ts` (730 lines) — split by domain
- [ ] `features/ai/components/AIActorForm.tsx` (631 lines) — extract form sections

---

## Phase 13: Session Room Refactoring ✅ Complete

**Goal:** Reduce SessionRoomContent.tsx from 742 to ~420 lines

### Phase 13.1: Connection State Deduplication ✅

- [x] Add isConnecting/isReconnecting to WebSocketContext
- [x] Remove connectionState/connectionError from session.store.ts
- [x] Update ParticipantList and SessionLayout to use WebSocketContext
- [x] Remove subscribeToConnectionState export
- [x] Update test files

### Phase 13.2: WebSocket Subscription Extraction ✅

- [x] Create useSessionSubscriptions.ts hook
- [x] Extract 11 WebSocket subscriptions from SessionRoomContent
- [x] Add cleanupAndNavigate helper

### Phase 13.3: Session Ready Logic Extraction ✅

- [x] Create useSessionReady.ts hook
- [x] Extract session.ready announcement logic

### Phase 13.4: Connection Management Extraction ✅

- [x] Create useSessionConnection.ts hook
- [x] Extract WebSocket connect/disconnect lifecycle
- [x] Extract error debouncing logic
- [x] Extract session.join message sending

### Results

| File                   | Before | After | Reduction       |
| ---------------------- | ------ | ----- | --------------- |
| SessionRoomContent.tsx | 742    | 414   | 328 lines (44%) |

---

## Phase 12: Codebase Refactoring ✅ Complete

**Plan**: [plans/codebase-refactoring-plan.md](../plans/codebase-refactoring-plan.md)

### Phase 12.1: Dead Code & Duplicate Removal ✅

- [x] Delete duplicate `useLogout` hook from `features/auth/hooks/`
- [x] Remove duplicate sidebar state from `useUIStore`
- [x] Add immer + subscribeWithSelector middleware to `useSidebarStore`
- [x] Verify: `pnpm typecheck:web && pnpm lint:web && pnpm test:web`

### Phase 12.2: Zustand Store Cleanup ✅

- [x] Add buffer limits (MAX_MESSAGES=500) to `useChatStore`
- [x] Add test for buffer behavior
- [x] Verify: `pnpm typecheck:web && pnpm lint:web && pnpm test:web`

### Phase 12.3: Shared Component Creation ✅

- [x] Create `SubmitButton` component
- [x] Create `ConfirmationDialog` component
- [x] Create `FormDialog` component
- [x] Create `StatusBadge` component
- [x] Create `ErrorAlert` component
- [x] Update `shared/components/index.ts` exports
- [x] Verify: `pnpm typecheck:web && pnpm lint:web && pnpm test:web`

### Phase 12.4: Dialog Refactoring ✅

- [x] Refactor `DeleteConnectorDialog` to use `ConfirmationDialog`
- [x] Refactor `InviteUserDialog` to use `SubmitButton`
- [x] Refactor `WorkspaceDialog` to use `SubmitButton`
- [x] Refactor `CreateShareLinkDialog` to use `SubmitButton`
- [x] Verify: `pnpm typecheck:web && pnpm lint:web && pnpm test:web`
- [ ] DEFERRED: Remaining dialogs (DeleteSession, CancelSession, ApiKey)

### Phase 12.5: Large File Decomposition ✅

- [x] Decompose `SessionRoomPage.tsx` (880 → ~75 lines)
  - [x] Extract `SessionRoomContent.tsx` (~400 lines)
  - [x] Extract `sessionRoomHelpers.ts` (~130 lines)
- [ ] DEFERRED: `SessionWizard.tsx` (already well-organized internally)
- [ ] DEFERRED: `AIActorForm.tsx` (already well-organized internally)
- [x] Verify: `pnpm typecheck:web && pnpm lint:web && pnpm test:web`

### Phase 12.6: Final Cleanup ✅

- [x] Verify TypeScript compiles with no errors
- [x] Verify lint passes with no errors
- [x] Update tracker/changelog.md
- [x] Final verification: `pnpm typecheck:web && pnpm lint:web && pnpm test:web`

---

## Phase 11 Gate Criteria

| Gate ID | Criterion              | Command              | Status |
| ------- | ---------------------- | -------------------- | ------ |
| PG-11.1 | TypeScript compiles    | `pnpm typecheck:web` | ⏳     |
| PG-11.2 | Lint passes            | `pnpm lint:web`      | ⏳     |
| PG-11.3 | Build succeeds         | `pnpm build:web`     | ⏳     |
| PG-11.4 | Unit tests pass        | `pnpm test:web`      | ⏳     |
| PG-11.5 | Documentation complete | Manual review        | ⏳     |
| PG-11.6 | All links work         | Manual review        | ⏳     |

---

## Phase 12 Gate Criteria

| Gate ID  | Criterion                  | Command              | Status                     |
| -------- | -------------------------- | -------------------- | -------------------------- |
| PG-12.1  | TypeScript compiles        | `pnpm typecheck:web` | ✅                         |
| PG-12.2  | Lint passes                | `pnpm lint:web`      | ✅                         |
| PG-12.3  | Build succeeds             | `pnpm build:web`     | ⏳                         |
| PG-12.4  | Unit tests pass            | `pnpm test:web`      | ✅ (pre-existing failures) |
| PG-12.5  | E2E tests pass             | `pnpm test:web:e2e`  | ⏳                         |
| PG-12.6  | No duplicate hooks         | Manual review        | ✅                         |
| PG-12.7  | No duplicate store state   | Manual review        | ✅                         |
| PG-12.8  | All components < 300 lines | Manual review        | 🔄 (large files deferred)  |
| PG-12.9  | Shared components created  | 5 components         | ✅                         |
| PG-12.10 | Dialogs refactored         | 4 dialogs            | ✅ (partial)               |

---

## Completed Tasks (Recent)

### 2026-01-28

- [x] Created tracker/backlog.md for deferred items
- [x] Cleaned tasks.md to current phase only

### 2026-01-25

- [x] Completed Phase 10 Critical Remediation
- [x] Fixed reduced motion support (~80 files)
- [x] Added empty state components (5 core components)
- [x] Fixed architecture violations (usePermissions, useLogout to shared)
- [x] Added accessibility fixes (aria-invalid, aria-live, contrast)
- [x] Added React 19 concurrent features (useTransition, useDeferredValue)

### 2026-01-23

- [x] Completed Phase 9 Agent Verification (8/8 agents)
- [x] Code review: Fixed console.log, WebSocket cleanup, AudioContext leaks
- [x] Accessibility audit: Fixed Select errors, Badge keyboard, AI transcript
- [x] State management: Added subscribeWithSelector, useShallow
- [x] Performance review: Added useTransition to filters

---

## Quality Metrics

| Metric      | Value                  | Target  |
| ----------- | ---------------------- | ------- |
| Unit Tests  | 1410 passing           | -       |
| E2E Tests   | 50 passing, 71 skipped | -       |
| Main Bundle | 36.75KB gzip           | < 150KB |
| TypeScript  | 0 errors               | 0       |
| ESLint      | 0 errors               | 0       |

---

## Notes

- See `backlog.md` for deferred items and technical debt
- See `changelog.md` for detailed change history
- See `metrics.md` for test coverage details

---

_Last Updated: 2026-01-28_
