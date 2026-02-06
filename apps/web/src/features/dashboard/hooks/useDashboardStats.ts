/**
 * useDashboardStats Hook
 * Fetches and manages dashboard statistics with TanStack Query.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/shared/services/query-keys';
import { dashboardService, calculateTrend } from '../api/dashboard.service';
import type {
  DateRangePeriod,
  DashboardStats,
  DashboardStatsResponse,
  StatTrend,
} from '../types/dashboard.types';

// =============================================================================
// Types
// =============================================================================

export interface UseDashboardStatsOptions {
  period?: DateRangePeriod;
  workspaceId?: string;
  enabled?: boolean;
}

export interface UseDashboardStatsReturn {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
  // Computed trends
  sessionsTrend: StatTrend | undefined;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useDashboardStats(
  options: UseDashboardStatsOptions = {}
): UseDashboardStatsReturn {
  const { period = 'last7days', workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery<DashboardStatsResponse, Error>({
    queryKey: queryKeys.admin.analytics(period),
    queryFn: () => dashboardService.getStats({ period, workspaceId }),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate sessions trend (flat structure - data IS the stats)
  const sessionsTrend = query.data
    ? calculateTrend(query.data.sessionsThisWeek, query.data.sessionsLastWeek)
    : undefined;

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.admin.analytics(),
    });
  }, [queryClient]);

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
    sessionsTrend,
  };
}
