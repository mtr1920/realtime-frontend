/**
 * useUsers Hook
 * TanStack Query hook for fetching and caching users list.
 */

import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  usersService,
  type User,
  type UserListParams,
  type PaginatedUsersResponse,
} from '../api/users.service';
import { queryKeys } from '@/shared/services/query-keys';
import type { UserRole } from '@/types';
import type { UserStatus } from '../types/users.types';

interface UseUsersOptions {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
  orderBy?: UserListParams['orderBy'];
  orderDirection?: UserListParams['orderDirection'];
  limit?: number;
  enabled?: boolean;
}

interface UseUsersReturn {
  data: PaginatedUsersResponse | undefined;
  users: User[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const {
    status,
    role,
    search,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    limit = 20,
    enabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: UserListParams = { orderBy, orderDirection, limit };
  if (status) filters.status = status;
  if (role) filters.role = role;
  if (search) filters.search = search;

  const query = useQuery({
    queryKey: queryKeys.users.all({ role: role as string | undefined }),
    queryFn: ({ signal }) => usersService.list(filters, { signal }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['users'] });
  }, [queryClient]);

  return {
    data: query.data,
    users: query.data?.users ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}

/**
 * Infinite query hook for paginated users with load more.
 */
interface UseInfiniteUsersReturn {
  users: User[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInfiniteUsers(
  options: Omit<UseUsersOptions, 'limit'> & { pageSize?: number } = {}
): UseInfiniteUsersReturn {
  const {
    status,
    role,
    search,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    pageSize = 20,
    enabled = true,
  } = options;
  const queryClient = useQueryClient();

  const filters: Omit<UserListParams, 'cursor'> = {
    limit: pageSize,
    orderBy,
    orderDirection,
  };
  if (status) filters.status = status;
  if (role) filters.role = role;
  if (search) filters.search = search;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.users.all({ role: role as string | undefined }), 'infinite'],
    queryFn: ({ pageParam, signal }) =>
      usersService.list({ ...filters, cursor: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const fetchNextPage = useCallback(async (): Promise<void> => {
    await query.fetchNextPage();
  }, [query]);

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['users'] });
  }, [queryClient]);

  // Flatten all pages into a single array
  const users = query.data?.pages.flatMap((page) => page.users) ?? [];

  return {
    users,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage,
    refetch,
  };
}
