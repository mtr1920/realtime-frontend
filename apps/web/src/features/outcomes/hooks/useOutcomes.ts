/**
 * useOutcomes Hook
 * Fetches paginated outcomes with filters.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { outcomesService } from '../api/outcomes.service';
import type { OutcomeListParams } from '../types/outcomes.types';

export function useOutcomes(params?: OutcomeListParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.outcomes.all(params as Record<string, unknown>),
    queryFn: () => outcomesService.list(params),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.root });
  };

  return {
    outcomes: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
