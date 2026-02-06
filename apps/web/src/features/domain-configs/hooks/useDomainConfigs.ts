/**
 * useDomainConfigs Hook
 * TanStack Query hook for fetching and caching domain configs list.
 */

import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  domainConfigsService,
  type DomainConfig,
  type DomainConfigListParams,
  type DomainType,
  type PaginatedDomainConfigsResponse,
} from '../api/domain-configs.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseDomainConfigsOptions {
  domainType?: DomainType;
  isActive?: boolean;
  isDefault?: boolean;
  limit?: number;
  enabled?: boolean;
}

interface UseDomainConfigsReturn {
  data: PaginatedDomainConfigsResponse | undefined;
  configs: DomainConfig[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useDomainConfigs(options: UseDomainConfigsOptions = {}): UseDomainConfigsReturn {
  const {
    domainType,
    isActive,
    isDefault,
    limit = 50,
    enabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: DomainConfigListParams = { limit };
  if (domainType) filters.domainType = domainType;
  if (isActive !== undefined) filters.isActive = isActive;
  if (isDefault !== undefined) filters.isDefault = isDefault;

  const query = useQuery({
    queryKey: queryKeys.domainConfigs.all({
      domainType: domainType as string | undefined,
      isActive,
    }),
    queryFn: () => domainConfigsService.list(filters),
    enabled,
    staleTime: 60 * 1000, // 1 minute - configs change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.domainConfigs.root });
  }, [queryClient]);

  return {
    data: query.data,
    configs: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}

/**
 * Infinite query hook for paginated domain configs with load more.
 */
interface UseInfiniteDomainConfigsReturn {
  configs: DomainConfig[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInfiniteDomainConfigs(
  options: Omit<UseDomainConfigsOptions, 'limit'> & { pageSize?: number } = {}
): UseInfiniteDomainConfigsReturn {
  const {
    domainType,
    isActive,
    isDefault,
    pageSize = 20,
    enabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: Omit<DomainConfigListParams, 'cursor'> = { limit: pageSize };
  if (domainType) filters.domainType = domainType;
  if (isActive !== undefined) filters.isActive = isActive;
  if (isDefault !== undefined) filters.isDefault = isDefault;

  const query = useInfiniteQuery({
    queryKey: [
      ...queryKeys.domainConfigs.all({
        domainType: domainType as string | undefined,
        isActive,
      }),
      'infinite',
    ],
    queryFn: ({ pageParam }) =>
      domainConfigsService.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const fetchNextPage = useCallback(async (): Promise<void> => {
    await query.fetchNextPage();
  }, [query]);

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.domainConfigs.root });
  }, [queryClient]);

  // Flatten all pages into a single array
  const configs = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    configs,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage,
    refetch,
  };
}
