/**
 * OutcomesPage
 * Admin page for reviewing outcomes.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';
import { Skeleton } from '@/shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import {
  useOutcomes,
  OutcomeList,
  OutcomeDetailDialog,
  outcomeStatusLabels,
  type Outcome,
  type OutcomeListParams,
  type OutcomeStatus,
} from '@/features/outcomes';

const DEFAULT_LIMIT = 10;

const statusOptions: { value: OutcomeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: outcomeStatusLabels.pending },
  { value: 'generating', label: outcomeStatusLabels.generating },
  { value: 'ready', label: outcomeStatusLabels.ready },
  { value: 'approved', label: outcomeStatusLabels.approved },
  { value: 'rejected', label: outcomeStatusLabels.rejected },
  { value: 'failed', label: outcomeStatusLabels.failed },
];

export function OutcomesPage() {
  // Filter state
  const [filters, setFilters] = useState<OutcomeListParams>({
    page: 1,
    limit: DEFAULT_LIMIT,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });

  // Dialog state
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);

  // Fetch outcomes
  const { outcomes, pagination, isLoading, invalidate } = useOutcomes(filters);

  const handleFilterChange = useCallback(
    (key: keyof OutcomeListParams, value: string | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        page: 1,
      }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: DEFAULT_LIMIT,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleViewOutcome = useCallback((outcome: Outcome) => {
    setSelectedOutcome(outcome);
  }, []);

  const handleActionComplete = useCallback(() => {
    invalidate();
  }, [invalidate]);

  const hasFilters = filters.status || filters.workspaceId || filters.startDate || filters.endDate;

  return (
    <PermissionGate permission="canViewOutcomes" fallback={<UnauthorizedMessage />}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Outcomes</h1>
          <p className="text-muted-foreground">
            Review and approve session outcomes
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter outcomes by status and date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('status', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger id="status" aria-label="Filter by status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                  aria-label="Filter by start date"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                  aria-label="Filter by end date"
                />
              </div>

              {/* Clear */}
              <div className="flex items-end">
                {hasFilters && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outcomes List */}
        <Card>
          <CardHeader>
            <CardTitle>Outcomes</CardTitle>
            <CardDescription>
              {pagination
                ? `${pagination.total} outcome${pagination.total !== 1 ? 's' : ''} found`
                : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <OutcomesSkeleton />
            ) : (
              <>
                <OutcomeList
                  outcomes={outcomes}
                  isLoading={isLoading}
                  onView={handleViewOutcome}
                />

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <OutcomeDetailDialog
          outcome={selectedOutcome}
          open={!!selectedOutcome}
          onOpenChange={(open) => !open && setSelectedOutcome(null)}
          onActionComplete={handleActionComplete}
        />
      </div>
    </PermissionGate>
  );
}

function OutcomesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={`skeleton-${i}`} className="h-24 w-full" />
      ))}
    </div>
  );
}

function UnauthorizedMessage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-muted-foreground">
            You don't have permission to view outcomes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
