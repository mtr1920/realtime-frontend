---
name: planning
description: Mandatory planning methodology for frontend-only implementation tasks. Contains the planning checklist, task template, failure patterns to avoid, and subsystem-specific planning guidance for React components, hooks, Zustand stores, WebRTC services, TanStack Query, media capture, and config-driven rendering.
allowed-tools: Read, Glob, Grep, WebFetch, WebSearch
model: opus
---

**Scope:** Use this skill when working from `realtime-frontend/` on changes that are frontend-only — React components, hooks, Zustand stores, WebRTC services, TanStack Query hooks, media capture, screen share, session room UI, or config-driven rendering.

---

## Pre-Planning: Mandatory Reads

Before planning ANY frontend task:

1. **Read** `Docs/PRODUCTION-PRD.md` — check §3.2 for FIXED items (especially ~~strikethrough~~ WebRTC fixes), §5 for dependencies
2. **Read** `realtime-frontend/CLAUDE.md` — frontend-specific rules and patterns
3. **Read** `development-process/tracker/tasks.md` — current task status
4. **Grep** the actual codebase — verify every hook, component, store method, and type

```bash
# Verify before planning — NEVER assume
grep -rn "hookName\|functionName" apps/web/src/
grep -rn "interface.*Props\|type.*Props" apps/web/src/features/
grep -rn "useSessionConfig\|usePermissions" apps/web/src/
```

---

## Part 1: Frontend Planning Checklist

### 1. Root Cause & Status
- [ ] PRD status checked (FIXED/PARTIAL/BROKEN/MISSING — especially ~~strikethrough~~ items in §3.2)
- [ ] Prerequisites from PRD §5 satisfied
- [ ] Root cause verified by reading actual code (not assumed from PRD description alone)
- [ ] Line numbers verified via `grep -n` against CURRENT codebase

### 2. Architecture Compliance (Feature-Sliced Design)
- [ ] Dependency direction: `app → pages → features → shared → types`
- [ ] `shared/` NEVER imports from `features/`
- [ ] Feature modules don't cross-import (e.g., `features/media` does NOT import from `features/sessions`)
- [ ] If cross-feature communication needed: use shared store or event-based pattern
- [ ] Components < 300 lines, hooks < 200 lines, all files < 600 lines

### 3. State Management Rules
- [ ] **Server state** (data from API) → TanStack Query hooks — NO caching in Zustand
- [ ] **Client-only state** (UI, media, connection) → Zustand stores
- [ ] If mixing: TanStack Query is source of truth for server data; Zustand only for ephemeral client state
- [ ] No duplicate state — one source of truth per data entity

### 4. Config-Driven Rendering
- [ ] UI behavior reads from `useSessionConfig()` — not hardcoded feature flags
- [ ] Role checks use `usePermissions()` — not string comparison on role names
- [ ] No domain-specific strings: `"interviewer"`, `"candidate"`, `"observer"` — use `classification.isFacilitator`, `classification.isPrimary`, `classification.isSpectator`
- [ ] Button enable/disable driven by config modules (`modules.X.enabled`)
- [ ] Plan specifies UI for BOTH config-enabled AND config-disabled states

### 5. Store Synchronization
- [ ] ALL stores that track the same entity are updated by the same event
- [ ] Session store participant list and WebRTC store peer list stay in sync
- [ ] On `session.participant.left`: session store updated AND WebRTC peer removed AND UI tile removed
- [ ] On `session.participant.joined`: session store updated AND (if publisher) WebRTC offer initiated
- [ ] No store update without considering all other stores that track related data

### 6. React Lifecycle Safety
- [ ] Every `useEffect` has correct dependencies (no stale closures)
- [ ] Every `useEffect` that creates resources has a cleanup function
- [ ] No `mountedRef` race conditions — if used, mount tracking is in a SEPARATE `useEffect([], ...)`
- [ ] Cleanup function doesn't cancel initialization that depends on reactive deps
- [ ] Context provider guaranteed to be mounted before hooks that consume it
- [ ] If provider might not be mounted: use safe variant (`useOptionalX()`) or early return

### 7. WebRTC & Media Safety (if applicable)
- [ ] Media tracks stopped in cleanup (`track.stop()`)
- [ ] RTCPeerConnection closed on peer departure (`connection.close()`)
- [ ] Event listeners removed from connections/tracks on cleanup
- [ ] No stale remote tracks after peer disconnect
- [ ] Connection state checked against actual media flow, not just ICE state

### 8. Tests (NON-NEGOTIABLE)
- [ ] Unit tests for each new hook/component — file paths specified
- [ ] Tests cover: normal state, error state, disabled-config state
- [ ] Existing test files that might break are identified
- [ ] Mock setup for stores/hooks/services specified
- [ ] Tests are PART OF THE PLAN, not deferred

### 9. Verification
```bash
cd realtime-frontend && pnpm typecheck:web && pnpm lint:web && pnpm test:web
```

---

## Part 2: Frontend Failure Patterns

### Pattern 1: Cross-Store Desynchronization
Session store tracks participants. WebRTC store tracks peers. An event updates one but not the other. Stale tiles, phantom connections, missing streams.
**Rule:** Every participant lifecycle event (join/leave/disconnect) must update ALL stores that reference participants.

### Pattern 2: mountedRef Race Condition
`useEffect` cleanup sets `mountedRef.current = false`, but the effect re-runs on dependency changes (not just unmount). Later code checks `mountedRef` and skips state updates on a still-mounted component.
**Rule:** Mount tracking goes in a dedicated `useEffect([], ...)` with no dependencies. NEVER in an effect that has reactive deps.

### Pattern 3: Stale Closure in Event Callbacks
WebSocket subscription callback captures a stale store value or prop. Event arrives, callback runs with old data.
**Rule:** Read current state from store inside the callback (`store.getState()`), not from a closure variable.

### Pattern 4: Context Provider Not Mounted
Hook calls `useContext(SomeContext)` but the provider is deeper in the tree or conditionally rendered. Throws or returns undefined.
**Rule:** Verify mount order. Use `useOptionalX()` pattern or guarantee provider wraps consumer in the component tree.

### Pattern 5: Config Read from Hardcoded Strings
`if (role === 'observer')` instead of `if (classification.isSpectator)`. Works for known roles, breaks for custom roles.
**Rule:** ALL role behavior from `usePermissions()` and `useSessionConfig()`. String matching only as display fallback.

### Pattern 6: TanStack Query and Zustand Divergence
API data in TanStack Query cache says one thing, Zustand store says another. UI reads from both and shows inconsistent state.
**Rule:** Server data → TanStack Query only. Client-only state → Zustand only. Never duplicate.

### Pattern 7: Missing Cleanup on Departure/Unmount
Timer created, event listener added, media track started — but no cleanup on component unmount or participant departure.
**Rule:** Every `addEventListener` has `removeEventListener`. Every `setInterval`/`setTimeout` has clear. Every `track` has `stop()`. Every `RTCPeerConnection` has `close()`.

### Pattern 8: useEffect Dependency Causing Infinite Re-runs
Callback identity changes every render (not memoized), listed as useEffect dep → effect re-runs → causes state change → re-render → loop.
**Rule:** Memoize callbacks with `useCallback` if used as deps. Or restructure to read value inside effect.

### Pattern 9: WebRTC Negotiation Race (Glare)
Two peers send offers simultaneously. Both discard the other's offer. Connection never establishes.
**Rule:** Implement polite/impolite peer pattern. Polite peer rolls back its own offer when it receives one.

### Pattern 10: Silent Subscription Failure
`signalingAdapter.subscribe('message.type', handler)` called but WebSocket not yet connected. Subscription silently fails or throws.
**Rule:** SignalingAdapter must handle gracefully (queue subscriptions or log warning). Verify WS connection state before subscribing.

### Pattern 11: UI Not Reflecting Config-Disabled State
Feature panel renders unconditionally. Config says `modules.X.enabled: false` but button is still clickable.
**Rule:** Every feature UI component reads config and renders appropriate disabled/hidden state.

### Pattern 12: Unverified Hook/Type References
Plan references a hook like `useMediaCapture()` or a type like `MediaStreamState` that doesn't exist or has a different signature.
**Rule:** `grep -rn` before including any reference in the plan.

---

## Part 3: Subsystem-Specific Guidance

### WebRTC (Peer Connections & Media)

When modifying WebRTC-related code:

1. **Media readiness gate** — WebRTC initialization MUST wait for `mediaReady === true` (camera/mic captured). Never start negotiation before media is available.
2. **Publisher → Subscriber flow** — Publisher creates offer → sends via signaling → subscriber receives → creates answer. Verify this flow for EVERY new peer, including late joiners.
3. **Late joiner handling** — When a new participant joins, existing publishers must send offers to them. Not just the first two participants.
4. **Glare resolution** — If two peers send offers simultaneously, implement polite/impolite peer pattern. Polite peer `setRemoteDescription(offer)` and rolls back its own.
5. **`negotiationneeded` suppression** — During active negotiation, suppress additional `negotiationneeded` events. Queue them and process after current negotiation completes.
6. **Per-peer state** — Track `iceRestartCount`, `connectionState`, `negotiationState` per peer, not globally.
7. **Connection state accuracy** — Report CONNECTED only when media tracks are actually flowing (check `track.readyState === 'live'`), not just when ICE connects.
8. **Peer cleanup on departure** — `removePeer(participantId)`: close `RTCPeerConnection`, stop all associated remote tracks, remove from WebRTC store, remove UI tile.
9. **Store sync** — WebRTC peer map and session store participant list must stay synchronized on every join/leave event.

```bash
# Key files to check
grep -rn "RTCPeerConnection\|peerConnection" apps/web/src/features/media/
grep -rn "createOffer\|createAnswer\|setRemoteDescription" apps/web/src/features/media/
grep -rn "removePeer\|cleanupPeer\|closePeer" apps/web/src/features/media/
```

### Screen Share (Capture, Enforcement, Recording)

When modifying screen share behavior:

1. **Config source** — Read from `useSessionConfig()` → `modules.screenShare.*`. Never hardcode.
2. **Lobby enforcement** — If `screenShare.required: true`, disable Join button until sharing. Read from config, not role name.
3. **Re-share detection** — Listen for `track.onended` event on screen share track. When fired, check `reshareOnEnd` config.
4. **Grace period** — `reshareGracePeriodMs` timer starts on share stop. Countdown shown to user. On expire → compliance event.
5. **Attempt tracking** — `maxReshareAttempts` tracked in hook state. Exceeded → session-level warning.
6. **Browser "stop sharing" detection** — `useScreenShare` hook must detect when user clicks browser's native "Stop sharing" button (fires `track.onended`).
7. **Auto-recording** — If `recording.types.screen: true` and `recording.enabled: true`, auto-start recording when share starts. Separate segment per share.

### Zustand Stores

When adding to or modifying stores:

1. **Client-only state** — Stores hold UI state, media state, connection state. NOT server data.
2. **Selectors** — Components select only the slices they need: `useStore(state => state.specificField)`.
3. **Derived state** — Compute in selectors or separate hooks, not stored redundantly.
4. **Cross-store updates** — If an event needs to update multiple stores, do it in the subscription handler, not scattered across components.
5. **Reset on session leave** — Store state must be reset when participant leaves session. Verify cleanup.

### TanStack Query Hooks

When adding API data hooks:

1. **Query key structure** — `['entity', entityId, ...filters]` — consistent and cache-friendly.
2. **Stale time** — Set appropriate `staleTime` based on data volatility.
3. **Error handling** — `onError` callback or error boundary. Show user-facing message.
4. **Loading state** — Components handle `isLoading`, `isError`, `data` states. No rendering with undefined data.
5. **Cache invalidation** — Mutations that change server data invalidate relevant query keys.
6. **No Zustand caching** — If it comes from the API, it lives in TanStack Query. Period.

### WebSocket Subscriptions

When adding signaling message subscriptions:

1. **Subscribe in the right hook** — Session-scoped subscriptions in `useSessionSubscriptions`. Feature-scoped in feature hooks.
2. **Cleanup** — Return unsubscribe function from `useEffect`. Subscription removed on unmount.
3. **WebSocket readiness** — Handle case where WS is not yet connected. Use graceful fallback (queue or warn), not throw.
4. **Store updates** — Subscription handler updates ALL relevant stores atomically. Not just one.
5. **Type safety** — Message payload typed from `packages/protocol`. No `any` or manual casting.

### Session Room Layout & Lifecycle

When modifying the session room UI flow:

1. **Lobby → Room transition** — Lobby validates prerequisites (media, screen share if required). Room assumes prerequisites met.
2. **MediaInitializer** — Captures media → sets `mediaReady` → triggers WebRTC init. Mount tracking in separate `useEffect([], ...)`.
3. **`session.ready`** — Sent after media initialized but DECOUPLED from WebRTC init. WebRTC init depends on `mediaReady` which is gated by `onReady`.
4. **Permission-gated UI** — Facilitator-only panels (suggestions, AI control) rendered conditionally via `usePermissions()`.
5. **Role-based layout** — Primary gets full interaction. Spectator gets read-only. Driven by `classification.*` flags.

### Video Grid & Tile Rendering

When modifying the video grid:

1. **Tile source** — Derive tiles from WebRTC store's peer map + local media. Not from session store participants directly.
2. **Tile removal** — On participant departure, tile removed immediately. No stale tiles.
3. **Track attachment** — `<video ref>` with `srcObject` set to remote stream. Clean up `srcObject` on tile removal.
4. **Layout responsiveness** — Grid adapts to participant count. Test with 1, 2, 3, 4+ participants.
5. **Local preview** — Local video always visible (unless audio-only mode). Mirrors local camera.

---

## Part 4: Frontend Task Template

```markdown
## Task: [TASK-ID] [Description]

### 1. PRD Status
- Task ID: TASK-XX-NNN
- Status: [from PRD §3.2]
- Prerequisites: [from PRD §5]
- Related FIXED items: [list ~~strikethrough~~ items that affect this task]

### 2. Root Cause (Verified)
- File: [path — `grep -n` output]
- Lines: [verified numbers]
- Cause: [with code evidence]

### 3. Architecture Check
- [ ] FSD direction: OK / violation at [location]
- [ ] State management: server state → TanStack Query / client state → Zustand
- [ ] Config-driven: useSessionConfig / usePermissions used (no hardcoded strings)

### 4. Changes
For each file:
- **File:** [path]
- **Current:** [verified via grep — actual export/signature]
- **Change:** [what and why]

### 5. Store Synchronization
| Event | Stores Updated | Cleanup Triggered |
|-------|---------------|-------------------|
| [event] | [store1, store2, ...] | [what cleanup] |

### 6. Config-Driven Behavior
| Config Path | UI When Enabled | UI When Disabled |
|------------|-----------------|------------------|
| `modules.X.enabled` | [behavior] | [behavior] |

### 7. React Lifecycle
| Effect | Dependencies | Cleanup | Mount Safety |
|--------|-------------|---------|-------------|
| [description] | [deps array] | [cleanup fn] | [mountedRef / dedicated effect] |

### 8. Edge Cases
| Scenario | UI Behavior |
|----------|------------|
| Network drop during this flow | [behavior] |
| Component unmounts mid-operation | [cleanup] |
| Late joiner | [state recovery] |
| Config disabled | [disabled UI] |

### 9. Tests
| Test File | What It Tests |
|-----------|---------------|
| [path] | [description] |

### 10. Verification
```bash
cd realtime-frontend && pnpm typecheck:web && pnpm lint:web && pnpm test:web
```
```

---

## Part 5: Quick Decisions

| Situation | Action |
|-----------|--------|
| Simple component style fix, < 20 lines | Just implement |
| New hook consuming existing store/config | Lightweight plan (§2, §4, §8) |
| Hook that subscribes to signaling messages | Full plan with emphasis on §5, §6, §7 |
| WebRTC negotiation or peer lifecycle change | Full plan with emphasis on WebRTC subsystem |
| New feature panel with config gating | Full plan with emphasis on §4, §6 |
| Store modification or new store | Full plan with emphasis on §3, §5 |

### Stop and Ask When:
- PRD says item is FIXED but code doesn't match
- Change requires cross-feature import (violates FSD)
- WebRTC change affects both publisher AND subscriber flows
- Store change affects > 5 consumer components
- Need to modify `shared/` in a way that's really feature-specific