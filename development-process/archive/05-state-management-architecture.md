---
title: "5. State Management Architecture"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 5. State Management Architecture

### 3.1 State Categories

| Category | Solution | Examples |
|----------|----------|----------|
| Server State | TanStack Query | API data, sessions, users |
| Global UI State | Zustand | Theme, sidebar, modals |
| Session State | Zustand | Current session, participants |
| Media State | Zustand | Tracks, devices, permissions |
| Real-Time State | Zustand | WebSocket messages, presence |
| Form State | React Hook Form | Input values, validation |
| URL State | TanStack Router | Filters, pagination, tabs |

### 3.2 Zustand Store Structure

```typescript
// stores/session.store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface SessionState {
  // Data
  sessionId: string | null;
  status: SessionStatus;
  config: DomainTypeConfig | null;
  participants: Map<string, Participant>;
  myParticipantId: string | null;
  myRole: RoleDefinition | null;
  joinMode: 'participant' | 'observer';
  activeActorId: string | null;

  // Connection
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  lastServerSeq: number;

  // Actions
  setSession: (session: SessionSnapshot) => void;
  updateParticipant: (id: string, update: Partial<Participant>) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  setConnectionState: (state: ConnectionState) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      sessionId: null,
      status: 'CREATED',
      config: null,
      participants: new Map(),
      myParticipantId: null,
      myRole: null,
      joinMode: 'participant',
      activeActorId: null,
      connectionState: 'disconnected',
      lastServerSeq: 0,

      setSession: (snapshot) =>
        set((state) => {
          state.sessionId = snapshot.sessionId;
          state.status = snapshot.status;
          state.config = snapshot.config;
          state.participants = new Map(
            snapshot.participants.map((p) => [p.id, p])
          );
          state.myParticipantId = snapshot.myParticipantId;
          state.myRole = snapshot.myRole;
          state.joinMode = snapshot.myRole?.id === 'observer' ? 'observer' : 'participant';
          state.activeActorId = snapshot.config?.modules.ai?.activeActorId ?? null;
          state.lastServerSeq = snapshot.serverSeq;
        }),

      updateParticipant: (id, update) =>
        set((state) => {
          const participant = state.participants.get(id);
          if (participant) {
            Object.assign(participant, update);
          }
        }),

      addParticipant: (participant) =>
        set((state) => {
          state.participants.set(participant.id, participant);
        }),

      removeParticipant: (id) =>
        set((state) => {
          state.participants.delete(id);
        }),

      setConnectionState: (connectionState) =>
        set((state) => {
          state.connectionState = connectionState;
        }),

      reset: () =>
        set((state) => {
          state.sessionId = null;
          state.status = 'CREATED';
          state.config = null;
          state.participants = new Map();
          state.myParticipantId = null;
          state.myRole = null;
          state.joinMode = 'participant';
          state.activeActorId = null;
          state.connectionState = 'disconnected';
          state.lastServerSeq = 0;
        }),
    }))
  )
);
```

### 3.3 TanStack Query Configuration

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Query key factory
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  tenants: {
    all: () => ['tenants'] as const,
    detail: (id: string) => ['tenants', id] as const,
  },
  workspaces: {
    all: (tenantId: string) => ['workspaces', tenantId] as const,
    detail: (id: string) => ['workspaces', 'detail', id] as const,
  },
  sessions: {
    all: (filters?: SessionFilters) => ['sessions', filters] as const,
    detail: (id: string) => ['sessions', id] as const,
    participants: (id: string) => ['sessions', id, 'participants'] as const,
  },
  domainConfigs: {
    all: (tenantId: string) => ['domainConfigs', tenantId] as const,
    detail: (id: string) => ['domainConfigs', 'detail', id] as const,
  },
  users: {
    all: (tenantId: string) => ['users', tenantId] as const,
    detail: (id: string) => ['users', id] as const,
  },
  auditLogs: {
    all: (filters?: AuditFilters) => ['auditLogs', filters] as const,
  },
};
```

### 3.4 TanStack Query v5 with Suspense (Recommended)

> **React 19 Best Practice:** Prefer `useSuspenseQuery` over `useQuery` for data fetching.
> This integrates with React Suspense for cleaner loading states and better error boundaries.

```typescript
// ✅ RECOMMENDED: useSuspenseQuery with Suspense boundary
import { useSuspenseQuery } from '@tanstack/react-query';

function SessionDetails({ sessionId }: { sessionId: string }) {
  // No isLoading check needed - Suspense handles loading state
  // No undefined data - TypeScript knows data exists after Suspense resolves
  const { data: session } = useSuspenseQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => sessionService.get(sessionId),
  });

  return <SessionCard session={session} />;
}

// Wrap with Suspense boundary in parent
function SessionPage({ sessionId }: { sessionId: string }) {
  return (
    <ErrorBoundary fallback={<SessionError />}>
      <Suspense fallback={<SessionSkeleton />}>
        <SessionDetails sessionId={sessionId} />
      </Suspense>
    </ErrorBoundary>
  );
}

// ✅ Multiple parallel queries with useSuspenseQueries
import { useSuspenseQueries } from '@tanstack/react-query';

function DashboardStats() {
  const [sessionsQuery, usersQuery] = useSuspenseQueries({
    queries: [
      { queryKey: queryKeys.sessions.all(), queryFn: sessionService.list },
      { queryKey: queryKeys.users.all(tenantId), queryFn: () => userService.list(tenantId) },
    ],
  });

  return (
    <Stats sessions={sessionsQuery.data} users={usersQuery.data} />
  );
}

// ✅ Infinite lists with useSuspenseInfiniteQuery
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

function AuditLogList() {
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
    queryKey: queryKeys.auditLogs.all(),
    queryFn: ({ pageParam }) => auditService.list({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allLogs = data.pages.flatMap((page) => page.items);
  return <VirtualizedList items={allLogs} onLoadMore={fetchNextPage} />;
}
```

---
