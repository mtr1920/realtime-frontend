/**
 * useUpdateWebhook Hook
 * TanStack Query mutation hook for updating webhooks.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksService, type Webhook, type UpdateWebhookInput } from '../api/webhooks.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UpdateWebhookVariables {
  id: string;
  data: UpdateWebhookInput;
}

interface UseUpdateWebhookOptions {
  onSuccess?: (webhook: Webhook) => void;
  onError?: (error: Error) => void;
}

interface UseUpdateWebhookReturn {
  updateWebhook: (variables: UpdateWebhookVariables) => Promise<Webhook>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useUpdateWebhook(
  options: UseUpdateWebhookOptions = {}
): UseUpdateWebhookReturn {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: UpdateWebhookVariables) =>
      webhooksService.update(id, data),
    onSuccess: (webhook) => {
      // Update the specific webhook in cache
      queryClient.setQueryData(queryKeys.webhooks.detail(webhook.id), webhook);
      // Invalidate webhooks list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.root });
      onSuccess?.(webhook);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    updateWebhook: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
