/**
 * Dashboard Service
 * Handles all dashboard-related API calls.
 */

import { apiClient } from '@/shared/services/api-client';
import type {
  DashboardStatsParams,
  DashboardStatsResponse,
  RecentActivityParams,
  PaginatedActivityResponse,
  UpcomingSessionsParams,
  UpcomingSessionsResponse,
  DateRangePeriod,
} from '../types/dashboard.types';

// =============================================================================
// Dashboard Service Class
// =============================================================================

class DashboardService {
  private readonly basePath = '/v1/dashboard';

  /**
   * Get dashboard statistics.
   */
  async getStats(params: DashboardStatsParams = {}): Promise<DashboardStatsResponse> {
    const queryParams: Record<string, string | undefined> = {};

    if (params.period) queryParams.period = params.period;
    if (params.workspaceId) queryParams.workspaceId = params.workspaceId;

    return apiClient.get<DashboardStatsResponse>(`${this.basePath}/stats`, {
      params: queryParams,
    });
  }

  /**
   * Get recent activity feed.
   */
  async getRecentActivity(
    params: RecentActivityParams = {}
  ): Promise<PaginatedActivityResponse> {
    const queryParams: Record<string, string | number | undefined> = {};

    if (params.limit) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    if (params.types?.length) queryParams.types = params.types.join(',');

    return apiClient.get<PaginatedActivityResponse>(`${this.basePath}/activity`, {
      params: queryParams,
    });
  }

  /**
   * Get upcoming sessions.
   */
  async getUpcomingSessions(
    params: UpcomingSessionsParams = {}
  ): Promise<UpcomingSessionsResponse> {
    const queryParams: Record<string, number | undefined> = {};

    if (params.limit) queryParams.limit = params.limit;
    if (params.days) queryParams.days = params.days;

    return apiClient.get<UpcomingSessionsResponse>(`${this.basePath}/upcoming-sessions`, {
      params: queryParams,
    });
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get display label for a date range period.
 */
export function getPeriodLabel(period: DateRangePeriod): string {
  const labels: Record<DateRangePeriod, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7days: 'Last 7 days',
    last30days: 'Last 30 days',
    thisMonth: 'This month',
    lastMonth: 'Last month',
  };
  return labels[period];
}

/**
 * Calculate trend from current and previous values.
 */
export function calculateTrend(
  current: number,
  previous: number
): { value: number; isPositive: boolean } | undefined {
  if (previous === 0) {
    return current > 0 ? { value: 100, isPositive: true } : undefined;
  }

  const percentChange = Math.round(((current - previous) / previous) * 100);
  return {
    value: Math.abs(percentChange),
    isPositive: percentChange >= 0,
  };
}
