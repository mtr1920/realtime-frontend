---
name: tanstack-query-patterns
description: Use when fetching data, managing server state, or implementing mutations
---

# TanStack Query Patterns

Server state management with TanStack Query v5.

## Overview

This skill covers query key organization, hook patterns, mutations with cache invalidation, and integration with the service layer.

---

## Query Keys Architecture

```typescript
// ✅ CORRECT - Hierarchical query keys in shared/services/query-keys.ts
export const queryKeys = {
  sessions: {
    root: ['sessions'] as const,
    all: (filters?: SessionFilters) =>
      filters ? (['sessions', 'list', filters] as const) : (['sessions', 'list'] as const),
    detail: (id: string) => ['sessions', 'detail', id] as const,
    participants: (sessionId: string) => ['sessions', sessionId, 'participants'] as const,
  },
  users: {
    root: ['users'] as const,
    all: () => ['users', 'list'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    me: () => ['users', 'me'] as const,
  },
  auth: {
    root: ['auth'] as const,
    session: () => ['auth', 'session'] as const,
  },
} as const;

// Key structure:
// root → list/all → detail → nested resources
// ['sessions'] → ['sessions', 'list'] → ['sessions', 'detail', 'abc'] → ['sessions', 'abc', 'participants']
```

---

## Query Hook Pattern

```typescript
// ✅ CORRECT - Reusable query hook
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { sessionService } from '../api/sessions.service';
import { queryKeys } from '@/shared/services/query-keys';
import type { Session } from '@/types';

interface UseSessionOptions {
  enabled?: boolean;
  onSuccess?: (data: Session) => void;
  onError?: (error: Error) => void;
}

export function useSession(sessionId: string, options: UseSessionOptions = {}) {
  const { enabled = true, onSuccess, onError } = options;

  const query = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => sessionService.getOne(sessionId),
    enabled: enabled && !!sessionId,
    staleTime: 30_000, // 30 seconds
    meta: { skipGlobalErrorHandler: false },
  });

  // Handle callbacks in effect (TanStack Query v5 pattern)
  useEffect(() => {
    if (query.isSuccess && onSuccess) {
      onSuccess(query.data);
    }
  }, [query.isSuccess, query.data, onSuccess]);

  useEffect(() => {
    if (query.isError && onError) {
      onError(query.error);
    }
  }, [query.isError, query.error, onError]);

  return {
    session: query.data,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
```

### List Query with Filters

```typescript
// ✅ CORRECT - List query with filter parameters
export function useSessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: queryKeys.sessions.all(filters),
    queryFn: () => sessionService.list(filters),
    staleTime: 60_000, // 1 minute
  });
}

// Usage
const { data: sessions, isLoading } = useSessions({ status: 'ACTIVE' });
```

---

## Mutation Hook Pattern

```typescript
// ✅ CORRECT - Mutation with cache invalidation
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { handleError } from '@/shared/errors';
import { toast } from 'sonner';

interface UseCreateSessionOptions {
  onSuccess?: (data: Session) => void;
  onError?: (error: Error) => void;
}

export function useCreateSession(options: UseCreateSessionOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  const mutation = useMutation({
    mutationFn: sessionService.create,
    onSuccess: (data) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.root });
      toast.success('Session created');
      onSuccess?.(data);
    },
    onError: (error) => {
      handleError(error, { context: 'create-session' });
      onError?.(error);
    },
  });

  return {
    create: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
```

---

## useMutationWithToast Wrapper

```typescript
// ✅ CORRECT - Use the shared wrapper for consistent patterns
import { useMutationWithToast } from '@/shared/hooks';

export function useCreateSession(options = {}) {
  return useMutationWithToast({
    mutationFn: sessionService.create,
    toast: {
      successMessage: 'Session created successfully',
      errorMessage: 'Failed to create session',
    },
    invalidateKeys: [queryKeys.sessions.root],
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}

// The wrapper handles:
// - Cache invalidation
// - Toast notifications
// - Error handling via handleError()
// - Meta flag for global error handler
```

---

## Optimistic Updates

```typescript
// ✅ CORRECT - Optimistic update with rollback
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Session> }) =>
      sessionService.update(id, updates),

    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions.detail(id) });

      // Snapshot previous value
      const previousSession = queryClient.getQueryData<Session>(
        queryKeys.sessions.detail(id)
      );

      // Optimistically update
      if (previousSession) {
        queryClient.setQueryData(queryKeys.sessions.detail(id), {
          ...previousSession,
          ...updates,
        });
      }

      return { previousSession };
    },

    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          queryKeys.sessions.detail(id),
          context.previousSession
        );
      }
      handleError(err);
    },

    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
    },
  });
}
```

---

## Suspense Queries

```typescript
// ✅ CORRECT - useSuspenseQuery with error boundary
import { useSuspenseQuery } from '@tanstack/react-query';

export function useSessionSuspense(sessionId: string) {
  return useSuspenseQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => sessionService.getOne(sessionId),
  });
}

// Usage with Suspense boundary
<ErrorBoundary fallback={<ErrorState />}>
  <Suspense fallback={<SessionSkeleton />}>
    <SessionContent sessionId={id} />
  </Suspense>
</ErrorBoundary>
```

---

## Dependent Queries

```typescript
// ✅ CORRECT - Query depends on another query
export function useSessionParticipants(sessionId: string) {
  const { data: session } = useSession(sessionId);

  return useQuery({
    queryKey: queryKeys.sessions.participants(sessionId),
    queryFn: () => sessionService.getParticipants(sessionId),
    // Only fetch when session exists and is active
    enabled: !!session && session.status === 'ACTIVE',
  });
}
```

---

## Polling and Real-time Updates

```typescript
// ✅ CORRECT - Polling for status updates
export function useSessionStatus(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => sessionService.getOne(sessionId),
    refetchInterval: (query) => {
      // Poll every 5s if active, stop if completed
      const status = query.state.data?.status;
      return status === 'ACTIVE' ? 5000 : false;
    },
  });
}

// ✅ CORRECT - Manual invalidation from WebSocket
const queryClient = useQueryClient();

subscribe('session.updated', (payload) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.sessions.detail(payload.sessionId),
  });
});
```

---

## Select Transform

```typescript
// ✅ CORRECT - Transform data with select
export function useActiveSessionCount() {
  return useQuery({
    queryKey: queryKeys.sessions.all(),
    queryFn: sessionService.list,
    select: (sessions) => sessions.filter(s => s.status === 'ACTIVE').length,
  });
}

// Only re-renders when count changes, not when any session changes
```

---

## Query State Naming

```typescript
// ✅ CORRECT - Consistent return naming
return {
  // Data
  session: query.data,          // Singular for detail
  sessions: query.data,         // Plural for list

  // Loading states
  isLoading: query.isPending,   // Initial load
  isFetching: query.isFetching, // Any fetch (including background)

  // Error states
  isError: query.isError,
  error: query.error,

  // Actions
  refetch: query.refetch,
};

// ❌ WRONG - Inconsistent naming
return {
  data: query.data,           // Unclear what data type
  loading: query.isPending,   // Not camelCase "is" prefix
};
```

---

## Error Handling Integration

```typescript
// ✅ CORRECT - Global error handler with meta flag
const query = useQuery({
  queryKey: queryKeys.sessions.detail(id),
  queryFn: sessionService.getOne,
  meta: {
    // Set to true when handling errors locally
    skipGlobalErrorHandler: false,
  },
});

// In queryClient setup:
queryClient.setDefaultOptions({
  queries: {
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  },
  mutations: {
    onError: (error, _, __, mutation) => {
      if (!mutation.meta?.skipGlobalErrorHandler) {
        handleError(error);
      }
    },
  },
});
```

---

## Cache Invalidation Strategy

| Scenario | Strategy |
|----------|----------|
| Create | Invalidate list: `queryKeys.entity.root` |
| Update | Invalidate detail + list |
| Delete | Remove from cache + invalidate list |
| Bulk operation | Invalidate root |

```typescript
// Delete with cache removal
onSuccess: (_, id) => {
  // Remove from cache immediately
  queryClient.removeQueries({ queryKey: queryKeys.sessions.detail(id) });
  // Invalidate list
  queryClient.invalidateQueries({ queryKey: queryKeys.sessions.root });
},
```

---

## Critical Rules

1. **Never store server data in Zustand** - use TanStack Query
2. **Hierarchical query keys** - root → list → detail → nested
3. **Use `as const`** - for query key type safety
4. **Use useMutationWithToast** - for consistent mutation handling
5. **Invalidate on mutations** - always update cache after changes
6. **Handle loading and error states** - isPending, isError, error
7. **Use select** - for derived data transforms
8. **Suspense for critical paths** - useSuspenseQuery with boundaries

---

## Related Skills

- `zustand-state-management` - Client state
- `api-service-patterns` - Service layer
- `error-handling` - Error management
- `mutation-wrapper-patterns` - useMutationWithToast
