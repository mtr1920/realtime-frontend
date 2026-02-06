/**
 * useSession Hook
 * TanStack Query hook for fetching a single session by ID.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { sessionsService, type Session } from '../api/sessions.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseSessionOptions {
  enabled?: boolean;
}

interface UseSessionReturn {
  session: Session | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useSession(
  sessionId: string,
  options: UseSessionOptions = {}
): UseSessionReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: ({ signal }) => sessionsService.get(sessionId, { signal }),
    enabled: enabled && !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry 404 errors
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 404) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.sessions.detail(sessionId),
    });
  }, [queryClient, sessionId]);

  return {
    session: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
