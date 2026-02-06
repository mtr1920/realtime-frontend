/**
 * useRejectOutcome Hook
 * Rejects an outcome.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { outcomesService } from '../api/outcomes.service';
import type { RejectOutcomeInput } from '../types/outcomes.types';

interface UseRejectOutcomeOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useRejectOutcome(options?: UseRejectOutcomeOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: RejectOutcomeInput }) =>
      outcomesService.reject(sessionId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.root });
      queryClient.invalidateQueries({
        queryKey: queryKeys.outcomes.bySession(variables.sessionId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    rejectOutcome: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
