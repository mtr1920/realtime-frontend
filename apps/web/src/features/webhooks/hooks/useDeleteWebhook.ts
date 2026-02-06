/**
 * useDeleteWebhook Hook
 * TanStack Query mutation hook for deleting webhooks.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksService } from '../api/webhooks.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseDeleteWebhookOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseDeleteWebhookReturn {
  deleteWebhook: (id: string) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useDeleteWebhook(
  options: UseDeleteWebhookOptions = {}
): UseDeleteWebhookReturn {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => webhooksService.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.webhooks.detail(id) });
      // Invalidate webhooks list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.root });
      onSuccess?.();
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    deleteWebhook: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
