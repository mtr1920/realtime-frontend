/**
 * Recording Store
 *
 * Zustand store for recording state management.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { RecordingState, RecordingActions, RecordingStatus } from '../types/recording.types';

// =============================================================================
// Initial State
// =============================================================================

const initialState: RecordingState = {
  status: 'idle',
  recordingId: null,
  durationMs: 0,
  hasConsent: false,
  downloadUrl: null,
  error: null,
};

// =============================================================================
// Store
// =============================================================================

export const useRecordingStore = create<RecordingState & RecordingActions>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      setStarted: (recordingId: string) => {
        set((state) => {
          state.status = 'recording';
          state.recordingId = recordingId;
          state.durationMs = 0;
          state.error = null;
        });
      },

      setStopped: (recordingId: string, durationMs: number) => {
        set((state) => {
          if (state.recordingId === recordingId) {
            state.status = 'completed';
            state.durationMs = durationMs;
          }
        });
      },

      updateStatus: (recordingId: string, durationMs: number, status: RecordingStatus) => {
        set((state) => {
          if (state.recordingId === recordingId || state.recordingId === null) {
            state.recordingId = recordingId;
            state.status = status;
            state.durationMs = durationMs;
          }
        });
      },

      setFinalized: (recordingId: string, downloadUrl: string) => {
        set((state) => {
          if (state.recordingId === recordingId) {
            state.downloadUrl = downloadUrl;
          }
        });
      },

      setError: (code: string, message: string) => {
        set((state) => {
          state.error = `${code}: ${message}`;
          state.status = 'idle';
        });
      },

      setConsent: (hasConsent: boolean) => {
        set((state) => {
          state.hasConsent = hasConsent;
        });
      },

      reset: () => {
        set(() => initialState);
      },
    }))
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if recording is active
 */
export const selectIsRecording = (state: RecordingState): boolean =>
  state.status === 'recording';

/**
 * Check if recording is in progress (starting or recording)
 */
export const selectIsRecordingInProgress = (state: RecordingState): boolean =>
  state.status === 'pending' || state.status === 'recording';

/**
 * Get formatted duration string (HH:MM:SS)
 */
export const selectFormattedDuration = (state: RecordingState): string => {
  const totalSeconds = Math.floor(state.durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
