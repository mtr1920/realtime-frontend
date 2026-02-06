/**
 * useRevokeApiKey Hook
 * TanStack Query mutation hook for revoking API keys.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysService } from '../api/api-keys.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseRevokeApiKeyOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseRevokeApiKeyReturn {
  revokeApiKey: (id: string) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useRevokeApiKey(
  options: UseRevokeApiKeyOptions = {}
): UseRevokeApiKeyReturn {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => apiKeysService.revoke(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.apiKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.root });
      onSuccess?.();
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    revokeApiKey: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
