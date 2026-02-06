/**
 * useOutcomeArtifacts Hook
 * Fetches artifacts for an outcome.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { outcomesService } from '../api/outcomes.service';

export function useOutcomeArtifacts(outcomeId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.outcomes.artifacts(outcomeId ?? ''),
    queryFn: () => outcomesService.listArtifacts(outcomeId!),
    enabled: !!outcomeId,
  });

  const invalidate = () => {
    if (outcomeId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.outcomes.artifacts(outcomeId),
      });
    }
  };

  return {
    artifacts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
