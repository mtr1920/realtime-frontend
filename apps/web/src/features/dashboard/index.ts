/**
 * Dashboard Feature Module
 * Public API for dashboard functionality.
 */

// =============================================================================
// Types
// =============================================================================

export type {
  DateRangePeriod,
  DateRange,
  DashboardStats,
  StatTrend,
  ActivityType,
  ActivityItem,
  PaginatedActivityResponse,
  UpcomingSession,
  DashboardStatsParams,
  DashboardStatsResponse,
  RecentActivityParams,
  UpcomingSessionsParams,
  UpcomingSessionsResponse,
} from './types/dashboard.types';

// =============================================================================
// API Service
// =============================================================================

export {
  dashboardService,
  getPeriodLabel,
  calculateTrend,
} from './api/dashboard.service';

// =============================================================================
// Hooks
// =============================================================================

export {
  useDashboardStats,
  type UseDashboardStatsOptions,
  type UseDashboardStatsReturn,
} from './hooks/useDashboardStats';

export {
  useRecentActivity,
  type UseRecentActivityOptions,
  type UseRecentActivityReturn,
} from './hooks/useRecentActivity';

export {
  useUpcomingSessions,
  type UseUpcomingSessionsOptions,
  type UseUpcomingSessionsReturn,
} from './hooks/useUpcomingSessions';

// =============================================================================
// Components
// =============================================================================

export { StatsCard, type StatsCardProps } from './components/StatsCard';
export { RecentActivityList, type RecentActivityListProps } from './components/RecentActivityList';
export { DateRangeFilter, type DateRangeFilterProps } from './components/DateRangeFilter';
export { UpcomingSessionsList, type UpcomingSessionsListProps } from './components/UpcomingSessionsList';
export { QuickActions, type QuickActionsProps } from './components/QuickActions';
