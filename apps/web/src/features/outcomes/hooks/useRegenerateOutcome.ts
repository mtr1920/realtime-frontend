/**
 * useRegenerateOutcome Hook
 * Regenerates an outcome.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { outcomesService } from '../api/outcomes.service';

interface UseRegenerateOutcomeOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useRegenerateOutcome(options?: UseRegenerateOutcomeOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (sessionId: string) => outcomesService.regenerate(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.root });
      queryClient.invalidateQueries({
        queryKey: queryKeys.outcomes.bySession(sessionId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    regenerateOutcome: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
