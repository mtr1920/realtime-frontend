/**
 * useCreateApiKey Hook
 * TanStack Query mutation hook for creating API keys.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiKeysService,
  type CreateApiKeyInput,
  type CreateApiKeyResponse,
} from '../api/api-keys.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseCreateApiKeyOptions {
  onSuccess?: (result: CreateApiKeyResponse) => void;
  onError?: (error: Error) => void;
}

interface UseCreateApiKeyReturn {
  createApiKey: (data: CreateApiKeyInput) => Promise<CreateApiKeyResponse>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useCreateApiKey(
  options: UseCreateApiKeyOptions = {}
): UseCreateApiKeyReturn {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateApiKeyInput) => apiKeysService.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.root });
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    createApiKey: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
