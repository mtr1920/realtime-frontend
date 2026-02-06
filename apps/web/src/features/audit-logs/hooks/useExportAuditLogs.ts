/**
 * useExportAuditLogs Hook
 * Exports audit logs to JSON or CSV.
 */

import { useState, useCallback } from 'react';
import { auditLogsService } from '../api/audit-logs.service';
import type { ExportAuditLogsInput, ExportFormat, AuditLogListParams } from '../types/audit-logs.types';

interface UseExportAuditLogsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useExportAuditLogs(options?: UseExportAuditLogsOptions) {
  const [isLoading, setIsLoading] = useState(false);

  const exportLogs = useCallback(
    async (format: ExportFormat, filters?: AuditLogListParams) => {
      setIsLoading(true);
      try {
        const input: ExportAuditLogsInput = { format, filters };
        const blob = await auditLogsService.export(input);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        options?.onSuccess?.();
      } catch (error) {
        options?.onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  return {
    exportLogs,
    isLoading,
  };
}
