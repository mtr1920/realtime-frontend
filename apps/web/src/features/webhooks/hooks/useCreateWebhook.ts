/**
 * useCreateWebhook Hook
 * TanStack Query mutation hook for creating webhooks.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksService, type Webhook, type CreateWebhookInput } from '../api/webhooks.service';
import { queryKeys } from '@/shared/services/query-keys';

interface CreateWebhookResult {
  webhook: Webhook;
  secret: string;
}

interface UseCreateWebhookOptions {
  onSuccess?: (result: CreateWebhookResult) => void;
  onError?: (error: Error) => void;
}

interface UseCreateWebhookReturn {
  createWebhook: (data: CreateWebhookInput) => Promise<CreateWebhookResult>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useCreateWebhook(
  options: UseCreateWebhookOptions = {}
): UseCreateWebhookReturn {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateWebhookInput) => webhooksService.create(data),
    onSuccess: (result) => {
      // Invalidate webhooks list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.root });
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    createWebhook: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
