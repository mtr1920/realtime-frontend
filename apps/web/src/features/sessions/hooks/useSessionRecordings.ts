/**
 * useSessionRecordings Hook
 * TanStack Query hook for fetching session recordings.
 *
 * Backend recordings endpoint is not yet implemented.
 * This adapter returns an empty array until the endpoint exists.
 * Replace the queryFn implementation when backend is ready.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/shared/services/query-keys';
import type { Recording } from '../components/detail';

interface UseSessionRecordingsOptions {
  /** Whether the query is enabled */
  enabled?: boolean;
}

interface UseSessionRecordingsReturn {
  recordings: Recording[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

/**
 * Hook to fetch recordings for a session.
 *
 * Backend recordings endpoint is not yet implemented.
 * This hook returns an empty array until the backend is ready.
 *
 * @example
 * ```ts
 * const { recordings, isLoading } = useSessionRecordings(sessionId);
 * ```
 */
export function useSessionRecordings(
  sessionId: string,
  options: UseSessionRecordingsOptions = {}
): UseSessionRecordingsReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.sessions.recording(sessionId),
    queryFn: async (): Promise<Recording[]> => {
      // Backend recordings endpoint not implemented - returns empty array
      return [];
    },
    enabled: enabled && !!sessionId,
    staleTime: 60 * 1000, // 1 minute - recordings don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.sessions.recording(sessionId),
    });
  }, [queryClient, sessionId]);

  return {
    recordings: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
