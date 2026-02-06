/**
 * useUpdateConnector Hook
 * Updates a connector.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { integrationsService } from '../api/integrations.service';
import type { UpdateConnectorInput } from '../types/integrations.types';

interface UseUpdateConnectorOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useUpdateConnector(options?: UseUpdateConnectorOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConnectorInput }) =>
      integrationsService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.root });
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.detail(variables.id),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    updateConnector: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
