/**
 * useDeleteConnector Hook
 * Deletes a connector.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { integrationsService } from '../api/integrations.service';

interface UseDeleteConnectorOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteConnector(options?: UseDeleteConnectorOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => integrationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.root });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    deleteConnector: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
