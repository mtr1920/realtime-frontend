/**
 * useWebhooks Hook
 * TanStack Query hook for fetching and caching webhooks list.
 */

import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  webhooksService,
  type Webhook,
  type WebhookListParams,
  type PaginatedWebhooksResponse,
} from '../api/webhooks.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseWebhooksOptions {
  enabled?: boolean;
  search?: string;
  orderBy?: WebhookListParams['orderBy'];
  orderDirection?: WebhookListParams['orderDirection'];
  limit?: number;
  queryEnabled?: boolean;
}

interface UseWebhooksReturn {
  data: PaginatedWebhooksResponse | undefined;
  webhooks: Webhook[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useWebhooks(options: UseWebhooksOptions = {}): UseWebhooksReturn {
  const {
    enabled,
    search,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    limit = 20,
    queryEnabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: WebhookListParams = { orderBy, orderDirection, limit };
  if (enabled !== undefined) filters.enabled = enabled;
  if (search) filters.search = search;

  const query = useQuery({
    queryKey: queryKeys.webhooks.all(filters as Record<string, unknown>),
    queryFn: () => webhooksService.list(filters),
    enabled: queryEnabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.root });
  }, [queryClient]);

  return {
    data: query.data,
    webhooks: query.data?.webhooks ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}

/**
 * Infinite query hook for paginated webhooks with load more.
 */
interface UseInfiniteWebhooksReturn {
  webhooks: Webhook[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInfiniteWebhooks(
  options: Omit<UseWebhooksOptions, 'limit'> & { pageSize?: number } = {}
): UseInfiniteWebhooksReturn {
  const {
    enabled,
    search,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    pageSize = 20,
    queryEnabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: Omit<WebhookListParams, 'cursor'> = {
    limit: pageSize,
    orderBy,
    orderDirection,
  };
  if (enabled !== undefined) filters.enabled = enabled;
  if (search) filters.search = search;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.webhooks.all(filters as Record<string, unknown>), 'infinite'],
    queryFn: ({ pageParam }) =>
      webhooksService.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    enabled: queryEnabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const fetchNextPage = useCallback(async (): Promise<void> => {
    await query.fetchNextPage();
  }, [query]);

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.root });
  }, [queryClient]);

  // Flatten all pages into a single array
  const webhooks = query.data?.pages.flatMap((page) => page.webhooks) ?? [];

  return {
    webhooks,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage,
    refetch,
  };
}
