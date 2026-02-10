/**
 * useSessionRecordings Hook
 * TanStack Query hook for fetching session recordings from the API.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { apiClient } from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import type { Recording } from '../components/detail';

interface RecordingApiResponse {
  id: string;
  sessionId: string;
  kind: string;
  status: string;
  storageProvider: string;
  storageUri: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  sizeBytes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface RecordingsListResponse {
  recordings: RecordingApiResponse[];
  pagination: {
    total: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

function mapRecording(r: RecordingApiResponse): Recording {
  return {
    id: r.id,
    kind: r.kind as Recording['kind'],
    status: r.status as Recording['status'],
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    durationMs: r.durationMs,
    sizeBytes: r.sizeBytes ? Number(r.sizeBytes) : null,
  };
}

interface UseSessionRecordingsOptions {
  /** Whether the query is enabled */
  enabled?: boolean;
}

interface UseSessionRecordingsReturn {
  recordings: Recording[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

/**
 * Hook to fetch recordings for a session.
 *
 * @example
 * ```ts
 * const { recordings, isLoading } = useSessionRecordings(sessionId);
 * ```
 */
export function useSessionRecordings(
  sessionId: string,
  options: UseSessionRecordingsOptions = {}
): UseSessionRecordingsReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.sessions.recording(sessionId),
    queryFn: async (): Promise<Recording[]> => {
      const response = await apiClient.get<RecordingsListResponse>(
        `/v1/sessions/${sessionId}/recordings`
      );
      return response.recordings.map(mapRecording);
    },
    enabled: enabled && !!sessionId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.sessions.recording(sessionId),
    });
  }, [queryClient, sessionId]);

  return {
    recordings: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}
