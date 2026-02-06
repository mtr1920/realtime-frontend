/**
 * AuditLogsPage
 * Admin page for viewing audit logs.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';
import { Skeleton } from '@/shared/ui';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import {
  useAuditLogs,
  AuditLogTable,
  AuditLogFilters,
  AuditLogDetail,
  AuditLogPagination,
  ExportDialog,
  type AuditLog,
  type AuditLogListParams,
} from '@/features/audit-logs';

const DEFAULT_LIMIT = 25;

export function AuditLogsPage() {
  // Filter state
  const [filters, setFilters] = useState<AuditLogListParams>({
    page: 1,
    limit: DEFAULT_LIMIT,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });

  // Dialog states
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Fetch audit logs
  const { auditLogs, pagination, isLoading } = useAuditLogs(filters);

  const handleFilterChange = useCallback((newFilters: AuditLogListParams) => {
    setFilters({
      ...newFilters,
      page: 1, // Reset to first page when filters change
      limit: DEFAULT_LIMIT,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
  }, []);

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

  const handleViewDetails = useCallback((log: AuditLog) => {
    setSelectedLog(log);
  }, []);

  return (
    <PermissionGate permission="canViewAuditLogs" fallback={<UnauthorizedMessage />}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">
              View system activity and security events
            </p>
          </div>
          <Button onClick={() => setIsExportOpen(true)}>
            Export Logs
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter audit logs by various criteria</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              >
                {isFiltersExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </CardHeader>
          {isFiltersExpanded && (
            <CardContent>
              <AuditLogFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            </CardContent>
          )}
        </Card>

        {/* Audit Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              {pagination
                ? `${pagination.total} log${pagination.total !== 1 ? 's' : ''} found`
                : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <AuditLogsSkeleton />
            ) : (
              <>
                <AuditLogTable
                  auditLogs={auditLogs}
                  isLoading={isLoading}
                  onViewDetails={handleViewDetails}
                />
                {pagination && pagination.totalPages > 1 && (
                  <AuditLogPagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AuditLogDetail
          auditLog={selectedLog}
          open={!!selectedLog}
          onOpenChange={(open) => !open && setSelectedLog(null)}
        />

        <ExportDialog
          open={isExportOpen}
          onOpenChange={setIsExportOpen}
          filters={filters}
        />
      </div>
    </PermissionGate>
  );
}

function AuditLogsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={`skeleton-${i}`} className="h-14 w-full" />
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
            You don't have permission to view audit logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
