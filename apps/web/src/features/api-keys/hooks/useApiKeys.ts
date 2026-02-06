/**
 * useApiKeys Hook
 * TanStack Query hook for fetching and caching API keys list.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  apiKeysService,
  type ApiKey,
  type ApiKeyListParams,
  type PaginatedApiKeysResponse,
} from '../api/api-keys.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseApiKeysOptions {
  includeRevoked?: boolean;
  search?: string;
  orderBy?: ApiKeyListParams['orderBy'];
  orderDirection?: ApiKeyListParams['orderDirection'];
  limit?: number;
  enabled?: boolean;
}

interface UseApiKeysReturn {
  data: PaginatedApiKeysResponse | undefined;
  apiKeys: ApiKey[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useApiKeys(options: UseApiKeysOptions = {}): UseApiKeysReturn {
  const {
    includeRevoked = false,
    search,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    limit = 50,
    enabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: ApiKeyListParams = { includeRevoked, orderBy, orderDirection, limit };
  if (search) filters.search = search;

  const query = useQuery({
    queryKey: queryKeys.apiKeys.all(filters as Record<string, unknown>),
    queryFn: () => apiKeysService.list(filters),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.root });
  }, [queryClient]);

  return {
    data: query.data,
    apiKeys: query.data?.apiKeys ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
