/**
 * useOutcome Hook
 * Fetches a single outcome by ID.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { outcomesService } from '../api/outcomes.service';

export function useOutcome(outcomeId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.outcomes.detail(outcomeId ?? ''),
    queryFn: () => outcomesService.getById(outcomeId!),
    enabled: !!outcomeId,
  });

  const invalidate = () => {
    if (outcomeId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.outcomes.detail(outcomeId),
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
