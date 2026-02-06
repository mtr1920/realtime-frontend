/**
 * useSessionInviteInfo Hook
 * TanStack Query hook for fetching session invite information.
 * Fetches a fresh access token and available roles on demand.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { sessionsService, type SessionInviteInfo } from '../api/sessions.service';

interface UseSessionInviteInfoOptions {
  /** Whether to fetch the invite info */
  enabled?: boolean;
}

export function useSessionInviteInfo(
  sessionId: string,
  options: UseSessionInviteInfoOptions = {}
) {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.sessions.inviteInfo(sessionId),
    queryFn: ({ signal }) => sessionsService.getInviteInfo(sessionId, { signal }),
    enabled: enabled && !!sessionId,
    // Don't cache the result since we want fresh tokens each time
    staleTime: 0,
    gcTime: 0,
  });

  return {
    inviteInfo: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export type { SessionInviteInfo };
