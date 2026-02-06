/**
 * useUser Hook
 * TanStack Query hook for fetching a single user by ID.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usersService, type User } from '../api/users.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseUserOptions {
  enabled?: boolean;
}

interface UseUserReturn {
  user: User | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useUser(
  userId: string,
  options: UseUserOptions = {}
): UseUserReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: ({ signal }) => usersService.get(userId, { signal }),
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds
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
      queryKey: queryKeys.users.detail(userId),
    });
  }, [queryClient, userId]);

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
