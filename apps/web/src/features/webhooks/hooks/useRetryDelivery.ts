/**
 * useRetryDelivery Hook
 * TanStack Query mutation hook for retrying failed webhook deliveries.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksService, type WebhookDelivery } from '../api/webhooks.service';
import { queryKeys } from '@/shared/services/query-keys';

interface RetryDeliveryVariables {
  webhookId: string;
  deliveryId: string;
}

interface UseRetryDeliveryOptions {
  onSuccess?: (delivery: WebhookDelivery) => void;
  onError?: (error: Error) => void;
}

interface UseRetryDeliveryReturn {
  retryDelivery: (variables: RetryDeliveryVariables) => Promise<WebhookDelivery>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useRetryDelivery(
  options: UseRetryDeliveryOptions = {}
): UseRetryDeliveryReturn {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ webhookId, deliveryId }: RetryDeliveryVariables) =>
      webhooksService.retryDelivery(webhookId, deliveryId),
    onSuccess: (delivery, { webhookId }) => {
      // Invalidate deliveries list to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.deliveries(webhookId),
      });
      // Also invalidate the webhook to update lastDeliveredAt/lastFailedAt
      queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.detail(webhookId),
      });
      onSuccess?.(delivery);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    retryDelivery: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
