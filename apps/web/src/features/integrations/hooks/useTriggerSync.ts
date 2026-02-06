/**
 * useTriggerSync Hook
 * Triggers a manual sync for a connector.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { integrationsService } from '../api/integrations.service';

interface UseTriggerSyncOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useTriggerSync(options?: UseTriggerSyncOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (connectorId: string) => integrationsService.triggerSync(connectorId),
    onSuccess: (_data, connectorId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.syncs(connectorId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.detail(connectorId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    triggerSync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
