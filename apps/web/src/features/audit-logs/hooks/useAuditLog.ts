/**
 * useAuditLog Hook
 * Fetches a single audit log by ID.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { auditLogsService } from '../api/audit-logs.service';

export function useAuditLog(id: string | null) {
  const query = useQuery({
    queryKey: queryKeys.auditLogs.detail(id ?? ''),
    queryFn: () => auditLogsService.getById(id!),
    enabled: !!id,
  });

  return {
    auditLog: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
