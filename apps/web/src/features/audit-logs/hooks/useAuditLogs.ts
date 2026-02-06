/**
 * useAuditLogs Hook
 * Fetches paginated audit logs with filters.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { auditLogsService } from '../api/audit-logs.service';
import type { AuditLogListParams } from '../types/audit-logs.types';

export function useAuditLogs(params?: AuditLogListParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.auditLogs.all(params as Record<string, unknown>),
    queryFn: () => auditLogsService.list(params),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.root });
  };

  return {
    auditLogs: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
