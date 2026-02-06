/**
 * useRecentActivity Hook
 * Fetches and manages recent activity feed with TanStack Query.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { dashboardService } from '../api/dashboard.service';
import type {
  ActivityItem,
  ActivityType,
  PaginatedActivityResponse,
} from '../types/dashboard.types';

// =============================================================================
// Query Keys
// =============================================================================

const activityKeys = {
  all: ['dashboard', 'activity'] as const,
  list: (filters?: { limit?: number; types?: ActivityType[] }) =>
    filters
      ? (['dashboard', 'activity', 'list', filters] as const)
      : (['dashboard', 'activity', 'list'] as const),
};

// =============================================================================
// Types
// =============================================================================

export interface UseRecentActivityOptions {
  limit?: number;
  types?: ActivityType[];
  enabled?: boolean;
}

export interface UseRecentActivityReturn {
  activities: ActivityItem[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useRecentActivity(
  options: UseRecentActivityOptions = {}
): UseRecentActivityReturn {
  const { limit = 10, types, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery<PaginatedActivityResponse, Error>({
    queryKey: activityKeys.list({ limit, types }),
    queryFn: () => dashboardService.getRecentActivity({ limit, types }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: activityKeys.all,
    });
  }, [queryClient]);

  return {
    activities: query.data?.activities ?? [],
    total: query.data?.pagination.total ?? 0,
    hasMore: query.data?.pagination.hasMore ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
