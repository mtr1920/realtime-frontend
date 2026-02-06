# REST API Client

## Overview

The frontend uses Axios for HTTP requests with TanStack Query for caching, background updates, and mutation handling.

## API Client Setup

```typescript
// shared/services/api-client.ts
import axios from 'axios';
import { useAuthStore } from '@/features/auth/model/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return api(error.config);
      }
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

## Service Layer Pattern

Each feature has a service file for API calls:

```typescript
// features/session/api/session.service.ts
import { api } from '@/shared/services/api-client';
import type {
  Session,
  CreateSessionDto,
  UpdateSessionDto,
  SessionListResponse,
} from '@/types';

export const sessionService = {
  list: async (params?: SessionFilter): Promise<SessionListResponse> => {
    const { data } = await api.get('/sessions', { params });
    return data;
  },

  get: async (id: string): Promise<Session> => {
    const { data } = await api.get(`/sessions/${id}`);
    return data;
  },

  create: async (dto: CreateSessionDto): Promise<Session> => {
    const { data } = await api.post('/sessions', dto);
    return data;
  },

  update: async (id: string, dto: UpdateSessionDto): Promise<Session> => {
    const { data } = await api.patch(`/sessions/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },

  // Public endpoint - no auth required
  join: async (params: JoinSessionParams): Promise<JoinResponse> => {
    const { data } = await api.post('/sessions/join', params);
    return data.join;
  },

  // Get invite info (requires auth)
  getInviteInfo: async (id: string): Promise<InviteInfoResponse> => {
    const { data } = await api.get(`/sessions/${id}/invite-info`);
    return data;
  },

  // Exchange invite code for access token (public)
  exchangeCode: async (code: string): Promise<ExchangeCodeResponse> => {
    const { data } = await api.post('/sessions/exchange-code', { code });
    return data;
  },
};

// Types
interface JoinSessionParams {
  accessToken: string;
  roleId: string;
  displayName: string;
  userId?: string;
}

interface JoinResponse {
  sessionId: string;
  participantId: string;
  realtimeToken: string;
  expiresAt: string;
  wsEndpoint: string;
}

interface InviteInfoResponse {
  accessToken: string;
  roles: Array<{ id: string; name: string; isObserver: boolean }>;
}

interface ExchangeCodeResponse {
  accessToken: string;
  roleId: string;
  sessionId: string;
  requiresAuth: boolean;
}
```

## Query Key Factory

Centralized query keys for cache management:

```typescript
// shared/services/query-keys.ts
export const queryKeys = {
  sessions: {
    all: () => ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all(), 'list'] as const,
    list: (filters?: SessionFilter) => [...queryKeys.sessions.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.sessions.all(), 'detail', id] as const,
  },

  workspaces: {
    all: () => ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.workspaces.all(), 'detail', id] as const,
  },

  users: {
    all: () => ['users'] as const,
    me: () => [...queryKeys.users.all(), 'me'] as const,
    detail: (id: string) => [...queryKeys.users.all(), 'detail', id] as const,
  },

  domainConfigs: {
    all: () => ['domain-configs'] as const,
    detail: (id: string) => [...queryKeys.domainConfigs.all(), id] as const,
  },
} as const;
```

## Query Hooks

### useSuspenseQuery (Preferred)

```typescript
// features/session/hooks/useSession.ts
import { useSuspenseQuery } from '@tanstack/react-query';
import { sessionService } from '../api/session.service';
import { queryKeys } from '@/shared/services/query-keys';

export function useSession(id: string) {
  return useSuspenseQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => sessionService.get(id),
  });
}
```

### useQuery (For Loading States)

```typescript
export function useSessions(filters?: SessionFilter) {
  return useQuery({
    queryKey: queryKeys.sessions.list(filters),
    queryFn: () => sessionService.list(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
```

### useInfiniteQuery (For Pagination)

```typescript
export function useInfiniteSessions(filters?: SessionFilter) {
  return useInfiniteQuery({
    queryKey: queryKeys.sessions.list(filters),
    queryFn: ({ pageParam }) =>
      sessionService.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

## Mutation Hooks

```typescript
// features/session/hooks/useCreateSession.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.lists(),
      });
    },
  });
}

// With optimistic update
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionDto }) =>
      sessionService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.sessions.detail(id),
      });
      const previous = queryClient.getQueryData(queryKeys.sessions.detail(id));
      queryClient.setQueryData(queryKeys.sessions.detail(id), (old: Session) =>
        old ? { ...old, ...data } : old
      );
      return { previous };
    },

    onError: (_, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.sessions.detail(id), context.previous);
      }
    },

    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(id),
      });
    },
  });
}
```

## Error Handling

```typescript
// Typed API errors
class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// Response interceptor for error transformation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      throw new ApiError(status, data.code, data.message);
    }
    throw error;
  }
);

// Usage in components
const { error } = useSession(id);
if (error instanceof ApiError) {
  if (error.status === 404) {
    return <NotFound />;
  }
}
```

## Service Files

| Service | Location | Purpose |
|---------|----------|---------|
| auth.service | `features/auth/api/` | Login, logout, refresh |
| session.service | `features/session/api/` | Session CRUD, join |
| workspace.service | `features/workspaces/api/` | Workspace CRUD |
| user.service | `features/users/api/` | User management |
| domain-config.service | `features/domain-configs/api/` | Config CRUD |

## Related Documentation

- [TanStack Query Patterns Skill](../../.claude/skills/tanstack-query-patterns/)
- [State Management](../model/state-management.md)
