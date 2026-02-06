/**
 * useSessions Hook
 * TanStack Query hook for fetching and caching sessions list.
 */

import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  sessionsService,
  type Session,
  type SessionListParams,
  type PaginatedSessionsResponse,
} from '../api/sessions.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseSessionsOptions {
  workspaceId?: string;
  status?: SessionListParams['status'];
  limit?: number;
  enabled?: boolean;
}

interface UseSessionsReturn {
  data: PaginatedSessionsResponse | undefined;
  sessions: Session[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useSessions(options: UseSessionsOptions = {}): UseSessionsReturn {
  const { workspaceId, status, limit = 20, enabled = true } = options;
  const queryClient = useQueryClient();

  const filters: SessionListParams = {};
  if (workspaceId) filters.workspaceId = workspaceId;
  if (status) filters.status = status;
  if (limit) filters.limit = limit;

  const query = useQuery({
    queryKey: queryKeys.sessions.all(filters),
    queryFn: ({ signal }) => sessionsService.list(filters, { signal }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.sessions.root });
  }, [queryClient]);

  return {
    data: query.data,
    sessions: query.data?.sessions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}

/**
 * Infinite query hook for paginated sessions with load more.
 */
interface UseInfiniteSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInfiniteSessions(
  options: Omit<UseSessionsOptions, 'limit'> & { pageSize?: number } = {}
): UseInfiniteSessionsReturn {
  const { workspaceId, status, pageSize = 20, enabled = true } = options;
  const queryClient = useQueryClient();

  const filters: Omit<SessionListParams, 'cursor'> = { limit: pageSize };
  if (workspaceId) filters.workspaceId = workspaceId;
  if (status) filters.status = status;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.sessions.all(filters), 'infinite'],
    queryFn: ({ pageParam, signal }) =>
      sessionsService.list({ ...filters, cursor: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const fetchNextPage = useCallback(async (): Promise<void> => {
    await query.fetchNextPage();
  }, [query]);

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.sessions.root });
  }, [queryClient]);

  // Flatten all pages into a single array
  const sessions = query.data?.pages.flatMap((page) => page.sessions) ?? [];

  return {
    sessions,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage,
    refetch,
  };
}
