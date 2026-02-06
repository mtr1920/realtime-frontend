/**
 * useWorkspace Hook
 * TanStack Query hook for fetching a single workspace by ID.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { workspacesService, type Workspace } from '../api/workspaces.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseWorkspaceOptions {
  enabled?: boolean;
}

interface UseWorkspaceReturn {
  workspace: Workspace | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useWorkspace(
  workspaceId: string,
  options: UseWorkspaceOptions = {}
): UseWorkspaceReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.workspaces.detail(workspaceId),
    queryFn: ({ signal }) => workspacesService.get(workspaceId, { signal }),
    enabled: enabled && !!workspaceId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry 404 errors
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 404) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.workspaces.detail(workspaceId),
    });
  }, [queryClient, workspaceId]);

  return {
    workspace: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
