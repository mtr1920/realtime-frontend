/**
 * useSessionOutcome Hook
 * Fetches an outcome by session ID.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { outcomesService } from '../api/outcomes.service';

export function useSessionOutcome(sessionId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.outcomes.bySession(sessionId ?? ''),
    queryFn: () => outcomesService.getBySessionId(sessionId!),
    enabled: !!sessionId,
  });

  const invalidate = () => {
    if (sessionId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.outcomes.bySession(sessionId),
      });
    }
  };

  return {
    outcome: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
