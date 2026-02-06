/**
 * useWebhook Hook
 * TanStack Query hook for fetching a single webhook.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { webhooksService, type Webhook } from '../api/webhooks.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseWebhookOptions {
  enabled?: boolean;
}

interface UseWebhookReturn {
  webhook: Webhook | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useWebhook(
  webhookId: string | undefined,
  options: UseWebhookOptions = {}
): UseWebhookReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.webhooks.detail(webhookId ?? ''),
    queryFn: () => webhooksService.get(webhookId!),
    enabled: enabled && !!webhookId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    if (webhookId) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.detail(webhookId),
      });
    }
  }, [queryClient, webhookId]);

  return {
    webhook: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
