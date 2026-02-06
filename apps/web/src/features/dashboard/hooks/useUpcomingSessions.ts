/**
 * useUpcomingSessions Hook
 * Fetches and manages upcoming sessions with TanStack Query.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { dashboardService } from '../api/dashboard.service';
import type {
  UpcomingSession,
  UpcomingSessionsResponse,
} from '../types/dashboard.types';

// =============================================================================
// Query Keys
// =============================================================================

const upcomingKeys = {
  all: ['dashboard', 'upcoming-sessions'] as const,
  list: (params?: { limit?: number; days?: number }) =>
    params
      ? (['dashboard', 'upcoming-sessions', 'list', params] as const)
      : (['dashboard', 'upcoming-sessions', 'list'] as const),
};

// =============================================================================
// Types
// =============================================================================

export interface UseUpcomingSessionsOptions {
  limit?: number;
  days?: number;
  enabled?: boolean;
}

export interface UseUpcomingSessionsReturn {
  sessions: UpcomingSession[];
  total: number;
  isEmpty: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useUpcomingSessions(
  options: UseUpcomingSessionsOptions = {}
): UseUpcomingSessionsReturn {
  const { limit = 5, days = 2, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery<UpcomingSessionsResponse, Error>({
    queryKey: upcomingKeys.list({ limit, days }),
    queryFn: () => dashboardService.getUpcomingSessions({ limit, days }),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: upcomingKeys.all,
    });
  }, [queryClient]);

  return {
    sessions: query.data?.sessions ?? [],
    total: query.data?.total ?? 0,
    isEmpty: (query.data?.sessions.length ?? 0) === 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
