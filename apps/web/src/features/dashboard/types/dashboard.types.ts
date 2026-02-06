/**
 * Dashboard Types
 * Type definitions for dashboard data and API responses.
 */

// =============================================================================
// Date Range Types
// =============================================================================

export type DateRangePeriod =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth';

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

// =============================================================================
// Stats Types
// =============================================================================

/**
 * Dashboard statistics from API.
 * Flat structure matching backend contract.
 */
export interface DashboardStats {
  /** Sessions currently in progress (ACTIVE status) */
  activeSessions: number;
  /** Total workspaces in the tenant */
  totalWorkspaces: number;
  /** Total active users (team members) */
  teamMembers: number;
  /** Sessions created in the last 7 days */
  sessionsThisWeek: number;
  /** Sessions created 8-14 days ago (for comparison) */
  sessionsLastWeek: number;
  /** Total completed sessions */
  completedSessions: number;
  /** Average session duration in minutes */
  averageSessionDuration: number;
  /** Period for statistics (e.g., 'last7days') */
  period: string;
  /** Timestamp when stats were generated */
  generatedAt: string;
}

export interface StatTrend {
  value: number;
  isPositive: boolean;
  label?: string;
}

// =============================================================================
// Activity Types
// =============================================================================

export type ActivityType = 'session' | 'workspace' | 'user' | 'outcome' | 'integration';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string; // ISO date string
  actorId?: string;
  actorName?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
}

export interface PaginatedActivityResponse {
  activities: ActivityItem[];
  pagination: {
    total: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

// =============================================================================
// Upcoming Sessions Types
// =============================================================================

export interface UpcomingSession {
  id: string;
  title: string;
  scheduledAt: string;
  workspaceName: string;
  participantCount: number;
  status: 'scheduled' | 'waiting' | 'starting_soon';
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface DashboardStatsParams {
  period?: DateRangePeriod;
  workspaceId?: string;
}

/**
 * Dashboard stats API response.
 * Same as DashboardStats (flat structure, no wrapper).
 */
export type DashboardStatsResponse = DashboardStats;

export interface RecentActivityParams {
  limit?: number;
  cursor?: string;
  types?: ActivityType[];
}

export interface UpcomingSessionsParams {
  limit?: number;
  days?: number; // Number of days ahead to look
}

export interface UpcomingSessionsResponse {
  sessions: UpcomingSession[];
  total: number;
}
