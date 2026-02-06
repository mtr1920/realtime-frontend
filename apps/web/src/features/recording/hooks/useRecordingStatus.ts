/**
 * useRecordingStatus Hook
 *
 * Subscribes to recording WebSocket messages and updates the store.
 */

import { useCallback } from 'react';
import { useSubscription } from '@/features/realtime';
import {
  useRecordingStore,
  selectIsRecording,
  selectIsRecordingInProgress,
  selectFormattedDuration,
} from '../stores/recording.store';

export interface UseRecordingStatusResult {
  /** Current recording status */
  status: ReturnType<typeof useRecordingStore.getState>['status'];
  /** Recording ID if active */
  recordingId: string | null;
  /** Duration in milliseconds */
  durationMs: number;
  /** Formatted duration (HH:MM:SS or MM:SS) */
  formattedDuration: string;
  /** Whether recording is active */
  isRecording: boolean;
  /** Whether recording is in progress (starting or recording) */
  isRecordingInProgress: boolean;
  /** Download URL when finalized */
  downloadUrl: string | null;
  /** Error message if any */
  error: string | null;
}

/**
 * Hook for tracking recording status
 *
 * @example
 * ```tsx
 * const { isRecording, formattedDuration } = useRecordingStatus();
 *
 * return (
 *   <div>
 *     {isRecording && <span>{formattedDuration}</span>}
 *   </div>
 * );
 * ```
 */
export function useRecordingStatus(): UseRecordingStatusResult {
  // Store selectors
  const status = useRecordingStore((state) => state.status);
  const recordingId = useRecordingStore((state) => state.recordingId);
  const durationMs = useRecordingStore((state) => state.durationMs);
  const downloadUrl = useRecordingStore((state) => state.downloadUrl);
  const error = useRecordingStore((state) => state.error);

  // Derived state
  const isRecording = useRecordingStore(selectIsRecording);
  const isRecordingInProgress = useRecordingStore(selectIsRecordingInProgress);
  const formattedDuration = useRecordingStore(selectFormattedDuration);

  // Store actions
  const setStarted = useRecordingStore((state) => state.setStarted);
  const setStopped = useRecordingStore((state) => state.setStopped);
  const updateStatus = useRecordingStore((state) => state.updateStatus);
  const setFinalized = useRecordingStore((state) => state.setFinalized);
  const setError = useRecordingStore((state) => state.setError);

  // Subscribe to recording messages
  useSubscription(
    'recording.started',
    useCallback(
      (payload) => {
        setStarted(payload.recordingId);
      },
      [setStarted]
    )
  );

  // Backend sends stoppedAt and reason, not durationMs
  // We use the current store duration since stop just signals end of recording
  useSubscription(
    'recording.stopped',
    useCallback(
      (payload) => {
        // Get current duration from store since backend doesn't send durationMs
        const currentDuration = useRecordingStore.getState().durationMs;
        setStopped(payload.recordingId, currentDuration);
      },
      [setStopped]
    )
  );

  // Backend sends durationSeconds, convert to ms for store
  useSubscription(
    'recording.status',
    useCallback(
      (payload) => {
        updateStatus(payload.recordingId, payload.durationSeconds * 1000, payload.status);
      },
      [updateStatus]
    )
  );

  // downloadUrl is optional in backend response
  useSubscription(
    'recording.finalized',
    useCallback(
      (payload) => {
        setFinalized(payload.recordingId, payload.downloadUrl ?? '');
      },
      [setFinalized]
    )
  );

  useSubscription(
    'recording.error',
    useCallback(
      (payload) => {
        setError(payload.code, payload.message);
      },
      [setError]
    )
  );

  return {
    status,
    recordingId,
    durationMs,
    formattedDuration,
    isRecording,
    isRecordingInProgress,
    downloadUrl,
    error,
  };
}
