/**
 * useSessionParticipants Hook
 * TanStack Query hook for fetching session participants.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { sessionsService, type SessionParticipant } from '../api/sessions.service';
import { queryKeys } from '@/shared/services/query-keys';
import type { ParticipantStatus } from '@/types';

interface UseSessionParticipantsOptions {
  /** Filter by participant status */
  status?: ParticipantStatus;
  /** Maximum number of participants to fetch */
  limit?: number;
  /** Whether the query is enabled */
  enabled?: boolean;
}

interface UseSessionParticipantsReturn {
  participants: SessionParticipant[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

/**
 * Hook to fetch participants for a session.
 *
 * @example
 * ```ts
 * const { participants, isLoading } = useSessionParticipants(sessionId);
 * const activeParticipants = useSessionParticipants(sessionId, { status: 'ACTIVE' });
 * ```
 */
export function useSessionParticipants(
  sessionId: string,
  options: UseSessionParticipantsOptions = {}
): UseSessionParticipantsReturn {
  const { status, limit, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.sessions.participants(sessionId),
    queryFn: ({ signal }) =>
      sessionsService.listParticipants(sessionId, { status, limit }, { signal }),
    enabled: enabled && !!sessionId,
    staleTime: 10 * 1000, // 10 seconds - participants change frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.sessions.participants(sessionId),
    });
  }, [queryClient, sessionId]);

  return {
    participants: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
