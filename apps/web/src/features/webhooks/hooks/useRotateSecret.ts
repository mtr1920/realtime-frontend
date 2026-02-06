/**
 * useRotateSecret Hook
 * TanStack Query mutation hook for rotating webhook secrets.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksService, type RotateSecretResponse } from '../api/webhooks.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseRotateSecretOptions {
  onSuccess?: (response: RotateSecretResponse) => void;
  onError?: (error: Error) => void;
}

interface UseRotateSecretReturn {
  rotateSecret: (webhookId: string) => Promise<RotateSecretResponse>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: RotateSecretResponse | undefined;
  reset: () => void;
}

export function useRotateSecret(
  options: UseRotateSecretOptions = {}
): UseRotateSecretReturn {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (webhookId: string) => webhooksService.rotateSecret(webhookId),
    onSuccess: (response, webhookId) => {
      // Invalidate the webhook to refetch updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.detail(webhookId),
      });
      onSuccess?.(response);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    rotateSecret: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
