# State Management

## Overview

The application uses a hybrid state management approach:

- **Server State**: TanStack Query for data fetching, caching, and synchronization
- **Client State**: Zustand for local UI state
- **Real-time State**: WebSocket subscriptions for live updates

## TanStack Query (Server State)

### Query Keys

Use the `queryKeys` factory for consistent cache keys:

```tsx
import { queryKeys } from '@/shared/services/query-keys';

// Usage in queries
useQuery({
  queryKey: queryKeys.sessions.all(),
  queryFn: () => sessionService.list(),
});

useQuery({
  queryKey: queryKeys.sessions.detail(sessionId),
  queryFn: () => sessionService.get(sessionId),
});
```

### Service Pattern

Services encapsulate API calls:

```tsx
// features/sessions/api/sessions.service.ts
export const sessionService = {
  list: async (params?: ListParams) => {
    return apiClient.get<SessionListResponse>('/sessions', { params });
  },
  get: async (id: string) => {
    return apiClient.get<Session>(`/sessions/${id}`);
  },
  create: async (data: CreateSessionInput) => {
    return apiClient.post<Session>('/sessions', data);
  },
};
```

### Mutations

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const createSession = useMutation({
  mutationFn: sessionService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all() });
  },
});
```

### Optimistic Updates

```tsx
const updateSession = useMutation({
  mutationFn: sessionService.update,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.sessions.detail(id) });
    const previous = queryClient.getQueryData(queryKeys.sessions.detail(id));
    queryClient.setQueryData(queryKeys.sessions.detail(id), newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(queryKeys.sessions.detail(id), context?.previous);
  },
});
```

## Zustand (Client State)

### Store Pattern

```tsx
// shared/stores/session.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

interface SessionState {
  session: Session | null;
  participants: Participant[];
  // Actions
  setSession: (session: Session | null) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
}

export const useSessionStore = create<SessionState>()(
  subscribeWithSelector(
    immer((set) => ({
      session: null,
      participants: [],

      setSession: (session) => set((state) => {
        state.session = session;
      }),

      addParticipant: (participant) => set((state) => {
        state.participants.push(participant);
      }),

      removeParticipant: (id) => set((state) => {
        state.participants = state.participants.filter(p => p.id !== id);
      }),
    }))
  )
);
```

### Using Stores

```tsx
// Select specific state (re-renders only when selected state changes)
const session = useSessionStore(state => state.session);
const participants = useSessionStore(state => state.participants);

// Select actions (doesn't cause re-renders)
const setSession = useSessionStore(state => state.setSession);
```

### Store Subscriptions

```tsx
// Subscribe to state changes outside React
useSessionStore.subscribe(
  (state) => state.session?.status,
  (status, prevStatus) => {
    if (status === 'ended' && prevStatus !== 'ended') {
      // Session ended
    }
  }
);
```

## Key Stores

### Auth Store (`shared/stores/auth.store.ts`)

- User authentication state
- Token management
- Persisted to localStorage

### Session Store (`shared/stores/session.store.ts`)

- Current session state
- Participants list
- Real-time updates via WebSocket

### Media Store (`shared/stores/media.store.ts`)

- Media device state
- Audio/video enabled flags
- Selected devices

### UI Store (`shared/stores/ui.store.ts`)

- Theme preferences (persisted)
- Sidebar state
- Modal state

### Compliance Store (`features/compliance/stores/`)

- Violation history
- Browser lock state

### Recording Store (`features/recording/stores/`)

- Recording state
- Recording duration

## Best Practices

### DO

```tsx
// Server data: TanStack Query
const { data: sessions } = useQuery({
  queryKey: queryKeys.sessions.all(),
  queryFn: sessionService.list,
});

// UI state: Zustand
const isSidebarOpen = useUIStore(state => state.isSidebarOpen);
```

### DON'T

```tsx
// Don't store server data in Zustand
const useSessionStore = create(set => ({
  sessions: [],
  fetchSessions: async () => {
    const sessions = await api.getSessions();
    set({ sessions }); // BAD: Use TanStack Query instead
  },
}));
```

### Real-time Integration

Zustand stores integrate with WebSocket subscriptions:

```tsx
// In a component or effect
useSubscription('session.participant.joined', (payload) => {
  useSessionStore.getState().addParticipant(payload.participant);
});

useSubscription('session.participant.left', (payload) => {
  useSessionStore.getState().removeParticipant(payload.participantId);
});
```
