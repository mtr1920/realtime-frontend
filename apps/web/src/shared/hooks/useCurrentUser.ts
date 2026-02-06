/**
 * useCurrentUser Hook
 * TanStack Query hook for fetching and caching current user data.
 * Located in shared/ to avoid circular dependencies with auth store.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth.store';
import { apiClient } from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import type { User, UserRole } from '@/types';
import type { CurrentUserResponse } from '@/types/api';

interface UseCurrentUserReturn {
  user: User | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

/**
 * Maps API CurrentUserResponse to domain User type.
 */
function mapResponseToUser(response: CurrentUserResponse): User {
  return {
    id: response.id,
    email: response.email,
    displayName: response.displayName,
    avatarUrl: response.avatarUrl,
    tenantId: response.tenantId,
    role: response.role as UserRole,
  };
}

/**
 * Fetches current user from auth service.
 */
async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  return apiClient.get<CurrentUserResponse>('/v1/auth/me');
}

export function useCurrentUser(): UseCurrentUserReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  const query = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: fetchCurrentUser,
    // Only fetch when authenticated with a token
    enabled: isAuthenticated && !!token,
    // Keep user data fresh but don't refetch too often
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Keep in cache for 30 minutes
    gcTime: 30 * 60 * 1000,
    // Don't retry on auth errors
    retry: (failureCount, error) => {
      // Don't retry 401/403 errors
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 3;
    },
    // Map response to User type
    select: mapResponseToUser,
  });

  const refetch = async (): Promise<void> => {
    await query.refetch();
  };

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
  };

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
