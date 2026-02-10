# Codebase Analysis Agent Memory

## Project Structure

- Frontend monorepo at `realtime-frontend/` with main app at `apps/web/src/`
- Feature-Sliced Design: app -> pages -> features -> shared -> types
- 19 feature modules under `apps/web/src/features/`
- 12 Zustand stores total (6 shared, 6 feature-specific)
- TanStack Query used for all server state (auth, sessions, outcomes, etc.)

## Stores Inventory

- **Shared**: auth, session, media, network, ui, sidebar
- **Feature**: webrtc (media), chat, recording, transcript, compliance, compliance-history

## Key Architecture Patterns

- Auth: Zustand for tokens only, TanStack Query for user data (via useCurrentUser)
- Session: session.store holds participants Map + session data from WS snapshot
- WebRTC: webrtc.store mirrors PeerConnection state; context bridges service<->store
- Chat: Zustand store with optimistic pending messages + server confirmations
- Recording: Zustand store for recording lifecycle; services for MediaRecorder/mixer
- Compliance: Two stores (active violations + full history)

## Known Duplication Hotspots (confirmed 2026-02-10)

- **OutcomesService duplicate**: `features/sessions/api/outcomes.service.ts` AND `features/outcomes/api/outcomes.service.ts`
- **useSessionOutcome duplicate**: `sessions/hooks/` AND `outcomes/hooks/`
- **CRUD mutation hooks**: ~12+ hooks across webhooks, api-keys, users, workspaces with near-identical pattern
- **Query param building**: Two patterns (Record + if-chain vs URLSearchParams + if-chain) across ~8 service files
- **useRoleConfig role string matching**: Lines 166-257 (known: TASK-CF-002)
- **getDefaultXxxColor/Icon/AvatarColors**: Three parallel pattern-matching functions in useRoleConfig

## Cross-Feature Import Violations (updated 2026-02-10)

- 57 unique cross-feature imports across 30+ files
- 4 bidirectional circular dependencies: ai<->sessions, media<->sessions, outcomes<->sessions, transcript<->sessions
- `sessions` is the most coupled feature (imports from 8 other features)
- `realtime` is the most imported-from feature (13 features depend on it)
- See full report for details; key violations:
  - sessions -> outcomes (deep imports bypassing index.ts)
  - outcomes -> sessions (useSessionPermissions)
  - compliance -> recording (useRecordingStore)
  - media -> sessions (useSessionConfig), media -> compliance (ViolationSeverity type)
  - transcript -> sessions (useRoleConfig), ai -> sessions (useRoleConfig)

## Import Order Violations (confirmed 2026-02-10)

- 211 total violations across 163 files
- Most common: Shared after Relative (62), Shared after Features (41), React after External (33)
- 118 severe cross-category violations

## ESLint Summary (confirmed 2026-02-10)

- 1 error: unused eslint-disable in useAISession.ts:138
- 298 warnings: 239 max-lines-per-function, 112 complexity, 3 max-params
- TypeScript compiles cleanly (0 errors)

## File Length Violations (confirmed 2026-02-10)

- `realtime/types/messages.ts`: 1215 lines (limit: 800)
- `realtime/services/websocket.service.ts`: 730 lines (limit: 600)
- `sessions/components/wizard/SessionWizard.tsx`: 727 lines (limit: 600)
- `ai/components/AIActorForm.tsx`: 631 lines (limit: 600)
- `media/services/webrtc.service.ts`: 623 lines (limit: 600)
- `sessions/components/detail/SessionOutcomesTab.tsx`: 601 lines (limit: 600)

## State Mgmt Observations

- Session store holds server-originated data (participants, session, config, roleConfig)
- Chat/transcript/compliance-history stores accumulate WS server messages in Zustand
- `useMediaStore()` destructuring (no selector) in SessionLobbyPage, MediaPreview, useDevicePermissions
- `useSessionStore()` destructuring (no selector) in SessionLobbyPage

## Cross-Store Sync Observations

- Participant leave: session store removes, WebRTC cleanup via useWebRTC effect
- handleLeave in SessionRoomContent calls reset (session), stopAllTracks (media), clearComplianceHistory
- Does NOT reset chat/transcript/recording stores on leave

## Security Analysis (confirmed 2026-02-10)

- Auth tokens stored unencrypted in localStorage via Zustand persist (`auth-storage` key)
- ShareLinkJoinPage passes access token in URL query params (not cleaned after use)
- Upload services (recording-upload, upload.service) bypass apiClient, use raw fetch
- No XSS vectors found: zero dangerouslySetInnerHTML, innerHTML, eval, document.write
- Redirect URL sanitization properly handled by `shared/lib/redirect-utils.ts`
- Hardcoded role names in SessionDetailPage ShareLinksTab (violates role-agnostic rule)
- 12+ console.warn/error in production code bypassing logger utility

## Accessibility Analysis (confirmed 2026-02-10)

- ~15 animations missing `motion-safe:` prefix (detail views, action dialogs)
- 6 instances of doubled `motion-safe:motion-safe:` prefix (lazy.tsx, LoadingScreen, AI components)
- ~6 icon-only buttons missing aria-label/sr-only (copy buttons, more actions menus)
- 89 CSS transitions across 43 files not prefixed with motion-safe
- Loading spinners often lack role="status" for screen reader announcement
