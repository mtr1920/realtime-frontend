/**
 * useWebhookDeliveries Hook
 * TanStack Query hook for fetching webhook deliveries.
 */

import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  webhooksService,
  type WebhookDelivery,
  type WebhookDeliveryListParams,
  type DeliveryStatus,
  type WebhookEvent,
  type PaginatedWebhookDeliveriesResponse,
} from '../api/webhooks.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseWebhookDeliveriesOptions {
  status?: DeliveryStatus;
  event?: WebhookEvent;
  orderBy?: WebhookDeliveryListParams['orderBy'];
  orderDirection?: WebhookDeliveryListParams['orderDirection'];
  limit?: number;
  enabled?: boolean;
}

interface UseWebhookDeliveriesReturn {
  data: PaginatedWebhookDeliveriesResponse | undefined;
  deliveries: WebhookDelivery[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useWebhookDeliveries(
  webhookId: string | undefined,
  options: UseWebhookDeliveriesOptions = {}
): UseWebhookDeliveriesReturn {
  const {
    status,
    event,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    limit = 20,
    enabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: WebhookDeliveryListParams = { orderBy, orderDirection, limit };
  if (status) filters.status = status;
  if (event) filters.event = event;

  const query = useQuery({
    queryKey: queryKeys.webhooks.deliveries(webhookId ?? '', filters as Record<string, unknown>),
    queryFn: () => webhooksService.listDeliveries(webhookId!, filters),
    enabled: enabled && !!webhookId,
    staleTime: 10 * 1000, // 10 seconds - deliveries update frequently
    gcTime: 5 * 60 * 1000,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    if (webhookId) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.deliveries(webhookId),
      });
    }
  }, [queryClient, webhookId]);

  return {
    data: query.data,
    deliveries: query.data?.deliveries ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}

/**
 * Infinite query hook for paginated deliveries with load more.
 */
interface UseInfiniteWebhookDeliveriesReturn {
  deliveries: WebhookDelivery[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInfiniteWebhookDeliveries(
  webhookId: string | undefined,
  options: Omit<UseWebhookDeliveriesOptions, 'limit'> & { pageSize?: number } = {}
): UseInfiniteWebhookDeliveriesReturn {
  const {
    status,
    event,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    pageSize = 20,
    enabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: Omit<WebhookDeliveryListParams, 'cursor'> = {
    limit: pageSize,
    orderBy,
    orderDirection,
  };
  if (status) filters.status = status;
  if (event) filters.event = event;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.webhooks.deliveries(webhookId ?? '', filters as Record<string, unknown>), 'infinite'],
    queryFn: ({ pageParam }) =>
      webhooksService.listDeliveries(webhookId!, { ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    enabled: enabled && !!webhookId,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const fetchNextPage = useCallback(async (): Promise<void> => {
    await query.fetchNextPage();
  }, [query]);

  const refetch = useCallback(async (): Promise<void> => {
    if (webhookId) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.deliveries(webhookId),
      });
    }
  }, [queryClient, webhookId]);

  // Flatten all pages into a single array
  const deliveries = query.data?.pages.flatMap((page) => page.deliveries) ?? [];

  return {
    deliveries,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage,
    refetch,
  };
}
