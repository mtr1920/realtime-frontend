/**
 * useComplianceReport Hook
 *
 * Downloads compliance integrity report from the API.
 * Returns the report data as JSON for rendering or export.
 */

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { apiClient } from '@/shared/services/api-client';

interface ComplianceEventResponse {
  id: string;
  sessionId: string;
  participantId: string;
  type: string;
  severity: string;
  category: string;
  details: Record<string, unknown>;
  screenshotUrl: string | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
}

interface ComplianceSummaryResponse {
  sessionId: string;
  status: string;
  totalEvents: number;
  unresolvedCount: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  lastEventAt: string | null;
}

export interface ComplianceReport {
  sessionId: string;
  generatedAt: string;
  summary: ComplianceSummaryResponse;
  events: ComplianceEventResponse[];
}

interface ReportApiResponse {
  report: ComplianceReport;
}

export interface UseComplianceReportResult {
  downloadReport: (format: 'json' | 'pdf') => void;
  isDownloading: boolean;
}

/**
 * Hook for downloading compliance integrity reports.
 */
export function useComplianceReport(
  sessionId: string
): UseComplianceReportResult {
  const mutation = useMutation({
    mutationFn: async (): Promise<ComplianceReport> => {
      const response = await apiClient.get<ReportApiResponse>(
        `/v1/sessions/${sessionId}/compliance/report`
      );
      return response.report;
    },
  });

  const downloadReport = useCallback(
    (format: 'json' | 'pdf') => {
      mutation.mutate(undefined, {
        onSuccess: (report) => {
          if (format === 'json') {
            const blob = new Blob([JSON.stringify(report, null, 2)], {
              type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compliance-report-${sessionId}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }
        },
      });
    },
    [mutation, sessionId]
  );

  return {
    downloadReport,
    isDownloading: mutation.isPending,
  };
}
