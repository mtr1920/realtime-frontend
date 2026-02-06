/**
 * useSessionEvents Hook
 * TanStack Query hook with infinite scroll support for fetching session events.
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { sessionsService, type SessionEvent } from '../api/sessions.service';

interface UseSessionEventsOptions {
  /** Filter by event category */
  category?: string;
  /** Number of events per page */
  limit?: number;
  /** Whether the query is enabled */
  enabled?: boolean;
}

interface UseSessionEventsReturn {
  events: SessionEvent[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

/**
 * Hook to fetch events for a session with infinite scroll support.
 *
 * @example
 * ```ts
 * const { events, hasNextPage, fetchNextPage, isLoading } = useSessionEvents(sessionId);
 *
 * // Filter by category
 * const systemEvents = useSessionEvents(sessionId, { category: 'system' });
 * ```
 */
export function useSessionEvents(
  sessionId: string,
  options: UseSessionEventsOptions = {}
): UseSessionEventsReturn {
  const { category, limit = 50, enabled = true } = options;
  const queryClient = useQueryClient();

  // Create a stable query key that includes filters
  const queryKey = useMemo(
    () => ['sessions', sessionId, 'events', { category }] as const,
    [sessionId, category]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      return sessionsService.listEvents(
        sessionId,
        { category, cursor: pageParam as string | undefined, limit },
        { signal }
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    enabled: enabled && !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all pages into a single array of events
  const events = useMemo(
    () => query.data?.pages.flatMap((page) => page.events) ?? [],
    [query.data]
  );

  const fetchNextPage = useCallback(async (): Promise<void> => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      await query.fetchNextPage();
    }
  }, [query]);

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    events,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage,
    refetch,
    invalidate,
  };
}
