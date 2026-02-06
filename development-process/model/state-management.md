# State Management

## Overview

This application uses three complementary tools for state:

| Library | Purpose | Examples |
|---------|---------|----------|
| **TanStack Query** | Server state (fetching, caching, mutations) | Sessions list, user profile, API data |
| **Zustand** | Client state (local app state, real-time) | UI state, media state, WebSocket events |
| **@realtime/ui** | UI components (not state) | Buttons, modals, forms |

**These are complementary, not competing.** Use both TanStack Query AND Zustand together.

## When to Use What

| Use TanStack Query When | Use Zustand When |
|-------------------------|------------------|
| Fetching from REST API | Managing UI state (modals, sidebar) |
| Caching server responses | Handling WebSocket real-time updates |
| CRUD operations | Storing media tracks/streams |
| Optimistic updates on server data | User preferences (theme, layout) |
| Background refetching | Cross-component local state |
| Pagination/infinite scroll | Derived/computed client state |

**Rule:** NEVER store server data in Zustand. NEVER fetch data directly in Zustand actions.

## State Categories

| Category | Location | Examples |
|----------|----------|----------|
| **Server** | TanStack Query | Sessions list, user profile, workspace settings |
| **Real-time** | Zustand (session.store) | Participants, WebSocket events, phase |
| **Media** | Zustand (media.store) | Tracks, streams, device selection |
| **UI** | Zustand (ui.store) | Modals, sidebar, layout preferences |
| **Auth** | Zustand (auth.store) | Tokens, authentication status |
| **Theme** | Context | Theme mode, system preference |

## TanStack Query (Server State)

### Query Key Factory

```typescript
// shared/services/query-keys.ts
export const queryKeys = {
  sessions: {
    all: () => ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all(), 'list'] as const,
    list: (filters: SessionFilter) => [...queryKeys.sessions.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.sessions.all(), 'detail', id] as const,
    participants: (id: string) => [...queryKeys.sessions.detail(id), 'participants'] as const,
  },
  workspaces: {
    all: () => ['workspaces'] as const,
    detail: (id: string) => [...queryKeys.workspaces.all(), 'detail', id] as const,
  },
  users: {
    me: () => ['users', 'me'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
} as const;
```

### useSuspenseQuery Pattern (Preferred)

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';

function SessionDetails({ sessionId }: { sessionId: string }) {
  // No loading state needed - component suspends
  const { data: session } = useSuspenseQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => sessionService.get(sessionId),
  });

  return <h1>{session.name}</h1>;
}

// Wrap with Suspense boundary
function SessionPage({ sessionId }: { sessionId: string }) {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <SessionDetails sessionId={sessionId} />
    </Suspense>
  );
}
```

### Mutations with Optimistic Updates

```typescript
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionDto }) =>
      sessionService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions.detail(id) });
      const previous = queryClient.getQueryData(queryKeys.sessions.detail(id));
      queryClient.setQueryData(queryKeys.sessions.detail(id), (old) =>
        old ? { ...old, ...data } : old
      );
      return { previous };
    },

    onError: (err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.sessions.detail(id), context.previous);
      }
    },

    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
    },
  });
}
```

## Zustand (Client State)

### Store Pattern

```typescript
// shared/stores/session.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

interface SessionState {
  sessionId: string | null;
  participants: Map<string, Participant>;
  phase: string;
  serverSeq: number;

  setSession: (snapshot: SessionSnapshot) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  setPhase: (phase: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()(
  subscribeWithSelector(
    immer((set) => ({
      sessionId: null,
      participants: new Map(),
      phase: 'waiting',
      serverSeq: 0,

      setSession: (snapshot) =>
        set((state) => {
          state.sessionId = snapshot.sessionId;
          state.participants = new Map(snapshot.participants.map((p) => [p.id, p]));
          state.phase = snapshot.phase;
          state.serverSeq = snapshot.serverSeq;
        }),

      addParticipant: (participant) =>
        set((state) => {
          state.participants.set(participant.id, participant);
        }),

      removeParticipant: (id) =>
        set((state) => {
          state.participants.delete(id);
        }),

      setPhase: (phase) =>
        set((state) => {
          state.phase = phase;
        }),

      reset: () =>
        set((state) => {
          state.sessionId = null;
          state.participants = new Map();
          state.phase = 'waiting';
          state.serverSeq = 0;
        }),
    }))
  )
);
```

### Selectors (Critical for Performance)

```typescript
// ❌ WRONG: Full state subscription
const store = useSessionStore();
const { sessionId, participants } = store; // Re-renders on ANY change

// ✅ CORRECT: Individual selectors
const sessionId = useSessionStore((s) => s.sessionId);
const participantCount = useSessionStore((s) => s.participants.size);

// ✅ CORRECT: Shallow comparison for objects
import { useShallow } from 'zustand/react/shallow';

const { audioEnabled, videoEnabled } = useSessionStore(
  useShallow((s) => ({
    audioEnabled: s.mediaState.audioEnabled,
    videoEnabled: s.mediaState.videoEnabled,
  }))
);
```

### Pre-defined Selector Hooks

```typescript
// shared/stores/session.selectors.ts
export const useSessionId = () => useSessionStore((s) => s.sessionId);
export const usePhase = () => useSessionStore((s) => s.phase);
export const useParticipantCount = () => useSessionStore((s) => s.participants.size);
export const useParticipant = (id: string) => useSessionStore((s) => s.participants.get(id));
```

## WebSocket → Store Integration

WebSocket events update Zustand stores, not TanStack Query:

```typescript
// Participant joined event
subscribe('session.participant.joined', (msg) => {
  useSessionStore.getState().addParticipant(msg.payload.participant);
});

// Phase changed event
subscribe('session.phase.changed', (msg) => {
  useSessionStore.getState().setPhase(msg.payload.phase);
});
```

## Store Files

| Store | Location | Purpose |
|-------|----------|---------|
| session.store | `shared/stores/session.store.ts` | Real-time session state |
| media.store | `shared/stores/media.store.ts` | Tracks, streams, devices |
| ui.store | `shared/stores/ui.store.ts` | Modals, sidebar, layout |
| auth.store | `shared/stores/auth.store.ts` | Tokens, auth status |

## Critical Rules

1. **TanStack Query for server data** - API responses, cached entities
2. **Zustand for client data** - Real-time state, UI state
3. **Use selectors** - Prevent unnecessary re-renders
4. **Use subscribeWithSelector** - Enable fine-grained subscriptions
5. **Reset on cleanup** - Prevent stale state between sessions
6. **Don't derive state in store** - Compute in selectors

## Related Documentation

- [TanStack Query Patterns Skill](../../.claude/skills/tanstack-query-patterns/)
- [Zustand State Management Skill](../../.claude/skills/zustand-state-management/)
- [WebSocket Client](../api/websocket-client.md)
