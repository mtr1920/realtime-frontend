/**
 * useApproveOutcome Hook
 * Approves an outcome.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { outcomesService } from '../api/outcomes.service';

interface UseApproveOutcomeOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useApproveOutcome(options?: UseApproveOutcomeOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (sessionId: string) => outcomesService.approve(sessionId),
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
    approveOutcome: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
