/**
 * useSessionOutcome Hook
 * TanStack Query hook for fetching session outcome.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/shared/services/query-keys';
import { outcomesService, type SessionOutcomeResponse } from '../api/outcomes.service';
import type { SessionStatus } from '@/types';

interface UseSessionOutcomeOptions {
  /** Whether the query is enabled */
  enabled?: boolean;
}

interface UseSessionOutcomeReturn {
  outcome: SessionOutcomeResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

/**
 * Hook to fetch outcome for a session.
 * Only fetches when session is in a completed state.
 *
 * @example
 * ```ts
 * const { outcome, isLoading } = useSessionOutcome(sessionId, session.status);
 * ```
 */
export function useSessionOutcome(
  sessionId: string,
  sessionStatus?: SessionStatus,
  options: UseSessionOutcomeOptions = {}
): UseSessionOutcomeReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  // Only fetch outcome for completed sessions
  const shouldFetch =
    enabled &&
    !!sessionId &&
    sessionStatus === 'COMPLETED';

  const query = useQuery({
    queryKey: queryKeys.outcomes.bySession(sessionId),
    queryFn: () => outcomesService.getBySessionId(sessionId),
    enabled: shouldFetch,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry 404 errors - session may not have outcome yet
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
      queryKey: queryKeys.outcomes.bySession(sessionId),
    });
  }, [queryClient, sessionId]);

  return {
    outcome: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
