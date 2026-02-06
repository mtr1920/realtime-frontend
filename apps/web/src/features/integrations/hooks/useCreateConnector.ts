/**
 * useCreateConnector Hook
 * Creates a new connector.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { integrationsService } from '../api/integrations.service';
import type { CreateConnectorInput } from '../types/integrations.types';

interface UseCreateConnectorOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCreateConnector(options?: UseCreateConnectorOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateConnectorInput) => integrationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.root });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    createConnector: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
