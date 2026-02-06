/**
 * useUpdateApiKey Hook
 * TanStack Query mutation hook for updating API keys.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysService, type ApiKey, type UpdateApiKeyInput } from '../api/api-keys.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UpdateApiKeyVariables {
  id: string;
  data: UpdateApiKeyInput;
}

interface UseUpdateApiKeyOptions {
  onSuccess?: (apiKey: ApiKey) => void;
  onError?: (error: Error) => void;
}

interface UseUpdateApiKeyReturn {
  updateApiKey: (variables: UpdateApiKeyVariables) => Promise<ApiKey>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useUpdateApiKey(
  options: UseUpdateApiKeyOptions = {}
): UseUpdateApiKeyReturn {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: UpdateApiKeyVariables) =>
      apiKeysService.update(id, data),
    onSuccess: (apiKey) => {
      queryClient.setQueryData(queryKeys.apiKeys.detail(apiKey.id), apiKey);
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.root });
      onSuccess?.(apiKey);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    updateApiKey: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
