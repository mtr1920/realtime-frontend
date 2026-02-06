/**
 * Dashboard Page
 * Main dashboard with stats cards, quick actions, and activity feed.
 * Features staggered card animations and refined visual hierarchy.
 */

import { useState } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import { Video, FolderKanban, Users, Activity, RefreshCw } from 'lucide-react';
import { usePermissions } from '@/features/auth';
import {
  StatsCard,
  RecentActivityList,
  DateRangeFilter,
  UpcomingSessionsList,
  QuickActions,
  useDashboardStats,
  useRecentActivity,
  useUpcomingSessions,
  type DateRangePeriod,
} from '@/features/dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@/shared/ui';

// =============================================================================
// Component
// =============================================================================

export function DashboardPage() {
  const { hasPermission } = usePermissions();
  const [period, setPeriod] = useState<DateRangePeriod>('last7days');

  // Fetch dashboard data
  const {
    stats,
    isLoading: statsLoading,
    sessionsTrend,
    refetch: refetchStats,
  } = useDashboardStats({ period });

  const {
    activities,
    isLoading: activityLoading,
    isError: activityError,
    error: activityErrorMsg,
    refetch: refetchActivity,
  } = useRecentActivity({ limit: 5 });

  const {
    sessions: upcomingSessions,
    isLoading: upcomingLoading,
    isError: upcomingError,
    error: upcomingErrorMsg,
    refetch: refetchUpcoming,
  } = useUpcomingSessions({ limit: 5, days: 2 });

  // Handle refresh all
  const handleRefreshAll = async () => {
    await Promise.all([refetchStats(), refetchActivity(), refetchUpcoming()]);
  };

  return (
    <div className="space-y-4">
      {/* Header with filters - compact inline layout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your workspace activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter
            value={period}
            onChange={setPeriod}
            disabled={statsLoading}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefreshAll}
            disabled={statsLoading || activityLoading || upcomingLoading}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid - compact with tighter gaps */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Sessions"
          value={stats?.activeSessions ?? 0}
          description="sessions in progress"
          icon={Video}
          isLoading={statsLoading}
          staggerIndex={0}
        />
        <StatsCard
          title="Workspaces"
          value={stats?.totalWorkspaces ?? 0}
          description="total workspaces"
          icon={FolderKanban}
          isLoading={statsLoading}
          staggerIndex={1}
        />
        <StatsCard
          title="Team Members"
          value={stats?.teamMembers ?? 0}
          description="active users"
          icon={Users}
          isLoading={statsLoading}
          staggerIndex={2}
        />
        <StatsCard
          title="Sessions This Week"
          value={stats?.sessionsThisWeek ?? 0}
          trend={sessionsTrend}
          description="vs last week"
          icon={Activity}
          isLoading={statsLoading}
          staggerIndex={3}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 flex-1 flex flex-col">
            <QuickActions className="flex-1" />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Latest updates from your workspace</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <RecentActivityList
              activities={activities}
              isLoading={activityLoading}
              isError={activityError}
              error={activityErrorMsg?.message}
              onRetry={refetchActivity}
              maxItems={5}
            />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
          <div>
            <CardTitle className="text-base font-semibold">Upcoming Sessions</CardTitle>
            <CardDescription className="text-xs">Sessions scheduled for today and tomorrow</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={'/sessions' as LinkProps['to']}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <UpcomingSessionsList
            sessions={upcomingSessions}
            isLoading={upcomingLoading}
            isError={upcomingError}
            error={upcomingErrorMsg?.message}
            onRetry={refetchUpcoming}
            canCreateSession={hasPermission('canCreateSession')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
