---
name: zustand-state-management
description: Use when creating Zustand stores, managing client state, or working with store patterns
---

# Zustand State Management

Client-side state management with Zustand, Immer, and subscribeWithSelector.

## Overview

This skill covers Zustand store creation, middleware composition, selector patterns, and the separation between client state (Zustand) and server state (TanStack Query).

---

## Core Store Pattern

```typescript
// ✅ CORRECT - Full store pattern with middleware
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

interface SessionState {
  // State
  currentSessionId: string | null;
  participants: Map<string, Participant>;
  isConnected: boolean;

  // Actions
  setCurrentSession: (id: string | null) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;

  // Selectors (computed state)
  getParticipant: (id: string) => Participant | undefined;
  getParticipantCount: () => number;
}

export const useSessionStore = create<SessionState>()(
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          // State
          currentSessionId: null,
          participants: new Map(),
          isConnected: false,

          // Actions (immer enables direct mutation)
          setCurrentSession: (id) =>
            set((state) => {
              state.currentSessionId = id;
            }),

          addParticipant: (participant) =>
            set((state) => {
              state.participants.set(participant.id, participant);
            }),

          removeParticipant: (id) =>
            set((state) => {
              state.participants.delete(id);
            }),

          updateParticipant: (id, updates) =>
            set((state) => {
              const existing = state.participants.get(id);
              if (existing) {
                state.participants.set(id, { ...existing, ...updates });
              }
            }),

          // Selectors
          getParticipant: (id) => get().participants.get(id),
          getParticipantCount: () => get().participants.size,
        }),
        {
          name: 'session-storage',
          partialize: (state) => ({
            currentSessionId: state.currentSessionId,
          }),
        }
      )
    )
  )
);
```

---

## Middleware Stack (Order Matters!)

```typescript
// ✅ CORRECT - Middleware order: subscribeWithSelector → immer → persist
create<State>()(
  subscribeWithSelector(  // Level 4: Enable subscriptions
    immer(                 // Level 3: Immer drafts
      persist(             // Level 2: Persistence
        (set, get) => ({}), // Level 1: Store definition
        { name: 'key' }
      )
    )
  )
)

// ❌ WRONG - Wrong middleware order breaks functionality
create<State>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({}))
    ),
    { name: 'key' }
  )
)
```

---

## Immer Mutation Pattern

```typescript
// ✅ CORRECT - Direct mutation in immer draft
set((state) => {
  state.user = newUser;
  state.isLoading = false;
});

// ✅ CORRECT - Nested mutations
set((state) => {
  state.participants.set(id, participant);
  state.metadata.lastUpdated = Date.now();
});

// ✅ CORRECT - Array mutations
set((state) => {
  state.messages.push(newMessage);
  if (state.messages.length > MAX_MESSAGES) {
    state.messages.shift();
  }
});

// ❌ WRONG - Returning new state (not using immer)
set((state) => ({
  ...state,
  user: newUser,
  isLoading: false,
}));
```

---

## Selective Persistence

```typescript
// ✅ CORRECT - Only persist specific keys
persist(
  (set, get) => ({ ... }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      // Only persist these
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      // Don't persist: isLoading, error, etc.
    }),
  }
)

// ✅ CORRECT - Handle hydration completion
persist(
  (set, get) => ({ ... }),
  {
    name: 'auth-storage',
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        console.error('Hydration failed:', error);
        return;
      }
      // Hydration complete - can now make authenticated requests
      state?.setHydrated(true);
    },
  }
)
```

---

## Selector Patterns

### Basic Selectors

```typescript
// ✅ CORRECT - Specific selector (minimal re-renders)
const sessionId = useSessionStore((s) => s.currentSessionId);
const isConnected = useSessionStore((s) => s.isConnected);

// ❌ WRONG - Selecting entire state (re-renders on any change)
const state = useSessionStore();
const { currentSessionId, isConnected } = state;
```

### Multiple Selections with useShallow

```typescript
import { useShallow } from 'zustand/react/shallow';

// ✅ CORRECT - Multiple values without excess re-renders
const { messages, pendingMessages } = useChatStore(
  useShallow((s) => ({
    messages: s.messages,
    pendingMessages: s.pendingMessages,
  }))
);

// ❌ WRONG - Object identity changes every render
const state = useChatStore((s) => ({
  messages: s.messages,
  pendingMessages: s.pendingMessages,
}));
```

### Standalone Selector Functions

```typescript
// ✅ CORRECT - Export reusable selectors
export const selectCurrentSession = (state: SessionState) =>
  state.currentSessionId;

export const selectActiveParticipants = (state: SessionState) =>
  Array.from(state.participants.values()).filter(p => p.isActive);

// Usage
const sessionId = useSessionStore(selectCurrentSession);
const activeParticipants = useSessionStore(selectActiveParticipants);
```

---

## Subscription Helpers

```typescript
// ✅ CORRECT - Export subscription functions for non-React contexts
export const subscribeToParticipants = (
  callback: (participants: Map<string, Participant>) => void
) => {
  return useSessionStore.subscribe(
    (state) => state.participants,
    callback,
    { fireImmediately: true }
  );
};

// Usage in service or effect
useEffect(() => {
  const unsubscribe = subscribeToParticipants((participants) => {
    webrtcService.updatePeers(participants);
  });
  return unsubscribe;
}, []);
```

---

## Store vs TanStack Query

| Use Case | Solution |
|----------|----------|
| Data from API | TanStack Query |
| Form state | Local useState or Zustand |
| UI state (sidebar, modals) | Zustand |
| WebSocket messages | Zustand |
| User preferences | Zustand with persist |
| Derived from API data | TanStack Query's select |

```typescript
// ✅ CORRECT - Server state with TanStack Query
const { data: sessions } = useQuery({
  queryKey: ['sessions'],
  queryFn: sessionService.list,
});

// ✅ CORRECT - Client state with Zustand
const { selectedSessionId, setSelectedSessionId } = useUIStore(
  useShallow((s) => ({
    selectedSessionId: s.selectedSessionId,
    setSelectedSessionId: s.setSelectedSessionId,
  }))
);

// ❌ WRONG - Server data in Zustand
const useSessionStore = create((set) => ({
  sessions: [],
  fetchSessions: async () => {
    const data = await sessionService.list();
    set({ sessions: data }); // Don't do this!
  },
}));
```

---

## Buffer/Limit Patterns

```typescript
// ✅ CORRECT - Buffer with max size
const MAX_MESSAGES = 500;

addMessage: (message) =>
  set((state) => {
    state.messages.push(message);
    // Keep buffer bounded
    if (state.messages.length > MAX_MESSAGES) {
      state.messages.shift();
    }
  }),

// ✅ CORRECT - Rate limiting state
interface RateLimitState {
  messageTimes: number[];

  canSendMessage: () => boolean;
  recordMessageSent: () => void;
}

canSendMessage: () => {
  const now = Date.now();
  const state = get();
  const recentTimes = state.messageTimes.filter(
    (time) => now - time < RATE_LIMIT_WINDOW
  );
  return recentTimes.length < MAX_MESSAGES_PER_MINUTE;
},
```

---

## Reset and Clear Patterns

```typescript
// ✅ CORRECT - Export initial state for reset
const initialState = {
  currentSessionId: null,
  participants: new Map(),
  isConnected: false,
};

export const useSessionStore = create<SessionState>()(
  // ...middleware
  (set, get) => ({
    ...initialState,

    reset: () => set(initialState),

    clearParticipants: () =>
      set((state) => {
        state.participants.clear();
      }),
  })
);

// Export for testing
export { initialState };
```

---

## External Access Pattern

```typescript
// ✅ CORRECT - Access store outside React components
// In services, callbacks, or event handlers
const currentUser = useAuthStore.getState().user;

// ✅ CORRECT - Update store from callback
webSocket.on('participant.joined', (participant) => {
  useSessionStore.getState().addParticipant(participant);
});
```

---

## Naming Conventions

| Element | Pattern | Example |
|---------|---------|---------|
| Store hook | `use[Entity]Store` | `useSessionStore`, `useChatStore` |
| Actions | `verb[Noun]` | `addParticipant`, `setCurrentSession` |
| Selectors | `select[Property]` or `get[Property]` | `selectMessages`, `getParticipant` |
| Subscriptions | `subscribeTo[Entity]` | `subscribeToParticipants` |
| Initial state | `initialState` | Export separately |

---

## Critical Rules

1. **Never store server data in Zustand** - use TanStack Query
2. **Middleware order matters** - subscribeWithSelector → immer → persist
3. **Use immer mutation style** - direct assignment, not spread
4. **Select specific values** - never destructure entire state
5. **Use useShallow** - when selecting multiple values
6. **Bound buffers** - always limit collection sizes
7. **Export initial state** - for testing and reset
8. **Partialize persistence** - don't persist derived or transient state

---

## Related Skills

- `tanstack-query-patterns` - Server state management
- `websocket-client` - Real-time state updates
- `react-patterns` - Hook consumption patterns
