/**
 * useWorkspaces Hook
 * TanStack Query hook for fetching and caching workspaces list.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  workspacesService,
  type Workspace,
  type WorkspaceListParams,
  type PaginatedWorkspacesResponse,
} from '../api/workspaces.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseWorkspacesOptions {
  search?: string;
  domainType?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseWorkspacesReturn {
  data: PaginatedWorkspacesResponse | undefined;
  workspaces: Workspace[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useWorkspaces(options: UseWorkspacesOptions = {}): UseWorkspacesReturn {
  const { search, domainType, limit = 20, enabled = true } = options;
  const queryClient = useQueryClient();

  const apiParams: WorkspaceListParams = { limit };
  if (search) apiParams.search = search;
  if (domainType) apiParams.domainType = domainType;

  // Build query key filters (exclude limit for caching purposes)
  const queryKeyFilters = search || domainType ? { search, domainType } : undefined;

  const query = useQuery({
    queryKey: queryKeys.workspaces.all(queryKeyFilters),
    queryFn: ({ signal }) => workspacesService.list(apiParams, { signal }),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.root });
  }, [queryClient]);

  return {
    data: query.data,
    workspaces: query.data?.workspaces ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
