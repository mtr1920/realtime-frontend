/**
 * useCancelSync Hook
 * Cancels a pending sync.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { integrationsService } from '../api/integrations.service';

interface UseCancelSyncOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCancelSync(options?: UseCancelSyncOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ connectorId, syncId }: { connectorId: string; syncId: string }) =>
      integrationsService.cancelSync(connectorId, syncId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.syncs(variables.connectorId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    cancelSync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
