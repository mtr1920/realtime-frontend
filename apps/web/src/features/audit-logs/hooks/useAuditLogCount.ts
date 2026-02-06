/**
 * useAuditLogCount Hook
 * Fetches count of audit logs matching filters.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { auditLogsService } from '../api/audit-logs.service';
import type { AuditLogListParams } from '../types/audit-logs.types';

export function useAuditLogCount(params?: AuditLogListParams) {
  const query = useQuery({
    queryKey: queryKeys.auditLogs.count(params as Record<string, unknown>),
    queryFn: () => auditLogsService.getCount(params),
  });

  return {
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
