# Development Backlog

This file tracks future work items, deferred tasks, and technical debt. Items move to `tasks.md` when their target phase begins.

---

## Priority Levels

| Level | Description |
|-------|-------------|
| **P1** | Critical - blocks other work or has known issues |
| **P2** | Important - significant value, target for next phase |
| **P3** | Nice-to-have - improvements without urgency |

---

## Phase 11+: Future Work

### Auth Hardening (P2) - COMPLETED 2026-01-30

- [x] Move user data from auth.store to TanStack Query (store only tokens)
- [x] Implement token-only auth store pattern
- [ ] Add useSuspenseQuery adoption across all data-fetching hooks

### Server State Migration - DEFERRED from Phase 12 (P2)

High-risk architecture changes requiring dedicated sprint:

- [ ] Migrate `useComplianceHistoryStore` to TanStack Query
  - Create `useComplianceHistory` query hook
  - Move filtering to server-side
  - Keep store for UI-only state (filter preferences)
- [ ] Migrate `useTranscriptStore` to TanStack Query
  - TanStack Query for historical transcript fetch
  - Zustand for current-turn-only (live WebSocket updates)
  - Custom hook to merge cached + live data
- [ ] Decompose `SessionOverviewTab.tsx` (524 lines)
  - Lower priority, already under 2x limit

### Backend Integration E2E Tests (P2)

These tests require backend API mocking or real backend:

- [ ] Test login flow
- [ ] Test session creation
- [ ] Test session join flow
- [ ] Test observer join flow
- [ ] Test media controls
- [ ] Test screen share required gating
- [ ] Test recording mix includes AI audio
- [ ] Test AI interaction
- [ ] Test outcome review visibility
- [ ] Test integration sync status
- [ ] Test non-interview domain profile
- [ ] Test admin CRUD flows

### Performance Optimization (P2)

- [ ] Split large vendor bundle (559KB/170KB gzip)
- [ ] Review and remove unnecessary manual memoization (62 files)
- [ ] Add useTransition to remaining filter/search operations
- [ ] Add useDeferredValue to remaining list renders

### WebRTC Enhancements (P2)

- [ ] Implement simulcast (3 layers) - requires backend SFU support
- [ ] Add bandwidth estimation
- [ ] Add adaptive quality switching
- [ ] Expose peer.getStats() for quality metrics

### Tooling & DX (P3)

- [ ] Add Storybook stories for @realtime/ui components
- [ ] Add error reporting (Sentry integration)
- [ ] Add visual regression CI workflow

---

## Technical Debt

### Architecture

| Item | Location | Notes |
|------|----------|-------|
| ~~shared/ imports from features/auth~~ | ~~Sidebar, SearchCommand, etc.~~ | **FIXED** 2026-01-30 - Token-only auth store pattern, user via TanStack Query |
| Cross-feature imports | signaling-adapter.ts, useScreenShareEnforcement.ts | Architecture debt - acceptable for now |

### File Size Violations

| File | Lines | Limit | Notes |
|------|-------|-------|-------|
| SessionRoomPage.tsx | 880 | 300 | Target for Phase 12.5 decomposition |
| SessionWizard.tsx | 726 | 300 | Target for Phase 12.5 decomposition |
| AIActorForm.tsx | 631 | 300 | Target for Phase 12.5 decomposition |
| SessionOverviewTab.tsx | 524 | 300 | Deferred - lower priority |
| messages.ts | 845 | 600 | Type definitions, well-organized |
| websocket.service.ts | 729 | 600 | Cohesive service with lifecycle |

### Test Gaps (from Phase 9)

| Category | Items | Priority | Status |
|----------|-------|----------|--------|
| ~~Session hooks~~ | ~~useSession, useCreateSession, useJoinSession~~ | ~~P1~~ | ✅ COMPLETED 2026-01-31 |
| WebRTC hooks | useWebRTC, useRemoteStreams | P1 | |
| Integration tests | WebSocket → Session join flow | P1 | |
| Integration tests | WebRTC signaling → Connection | P1 | |
| AI hooks | useAudioCapture, useAudioPlayback, useAISubscriptions | P2 | |
| Components | SessionCard, DeviceSelector, AIPanel, ViolationAlert | P2 | |
| Workspace hooks | All 5 workspace hooks | P2 | |

---

## Deferred Items

### From Phase 8

- Error reporting (Sentry) - deferred to production deployment
- Storybook stories - deferred to future iteration

### From Phase 9

- useSuspenseQuery adoption (~4 hours) - deferred to Phase 11
- Move session data from session.store to TanStack Query - FALSE POSITIVE (WebSocket state correct in Zustand)

### From Phase 10

- ~~Move auth.store to shared/stores/~~ - **COMPLETED** 2026-01-30 (Token-only pattern implemented instead)
- Simulcast implementation - requires backend SFU support

---

## Notes

When moving items to tasks.md:
1. Update priority based on current phase goals
2. Break down large items into specific tasks
3. Add acceptance criteria
4. Link to relevant documentation

---

*Last Updated: 2026-01-30*
