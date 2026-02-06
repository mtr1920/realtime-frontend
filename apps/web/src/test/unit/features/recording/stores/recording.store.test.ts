/**
 * Recording Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useRecordingStore,
  selectIsRecording,
  selectIsRecordingInProgress,
  selectFormattedDuration,
} from '@/features/recording/stores/recording.store';

describe('useRecordingStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useRecordingStore.getState().reset();
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useRecordingStore.getState();
      expect(state.status).toBe('idle');
      expect(state.recordingId).toBeNull();
      expect(state.durationMs).toBe(0);
      expect(state.hasConsent).toBe(false);
      expect(state.downloadUrl).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('setStarted', () => {
    it('should set recording as started', () => {
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
      });

      const state = useRecordingStore.getState();
      expect(state.status).toBe('recording');
      expect(state.recordingId).toBe('rec-123');
      expect(state.durationMs).toBe(0);
      expect(state.error).toBeNull();
    });
  });

  describe('setStopped', () => {
    it('should set recording as stopped with duration', () => {
      // First start recording
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
      });

      // Then stop it
      act(() => {
        useRecordingStore.getState().setStopped('rec-123', 60000);
      });

      const state = useRecordingStore.getState();
      expect(state.status).toBe('completed');
      expect(state.durationMs).toBe(60000);
    });

    it('should not update if recording ID does not match', () => {
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
      });

      act(() => {
        useRecordingStore.getState().setStopped('rec-456', 60000);
      });

      const state = useRecordingStore.getState();
      expect(state.status).toBe('recording');
      expect(state.durationMs).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update recording status', () => {
      act(() => {
        useRecordingStore.getState().updateStatus('rec-123', 30000, 'recording');
      });

      const state = useRecordingStore.getState();
      expect(state.status).toBe('recording');
      expect(state.recordingId).toBe('rec-123');
      expect(state.durationMs).toBe(30000);
    });
  });

  describe('setFinalized', () => {
    it('should set download URL when recording matches', () => {
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
      });

      act(() => {
        useRecordingStore.getState().setFinalized('rec-123', 'https://example.com/recording.webm');
      });

      const state = useRecordingStore.getState();
      expect(state.downloadUrl).toBe('https://example.com/recording.webm');
    });
  });

  describe('setError', () => {
    it('should set error and reset status to idle', () => {
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
      });

      act(() => {
        useRecordingStore.getState().setError('UPLOAD_FAILED', 'Failed to upload recording');
      });

      const state = useRecordingStore.getState();
      expect(state.error).toBe('UPLOAD_FAILED: Failed to upload recording');
      expect(state.status).toBe('idle');
    });
  });

  describe('setConsent', () => {
    it('should set consent flag', () => {
      act(() => {
        useRecordingStore.getState().setConsent(true);
      });

      expect(useRecordingStore.getState().hasConsent).toBe(true);

      act(() => {
        useRecordingStore.getState().setConsent(false);
      });

      expect(useRecordingStore.getState().hasConsent).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Set some state
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
        useRecordingStore.getState().setConsent(true);
      });

      // Reset
      act(() => {
        useRecordingStore.getState().reset();
      });

      const state = useRecordingStore.getState();
      expect(state.status).toBe('idle');
      expect(state.recordingId).toBeNull();
      expect(state.hasConsent).toBe(false);
    });
  });

  describe('selectors', () => {
    describe('selectIsRecording', () => {
      it('should return true when status is recording', () => {
        act(() => {
          useRecordingStore.getState().setStarted('rec-123');
        });

        expect(selectIsRecording(useRecordingStore.getState())).toBe(true);
      });

      it('should return false for other statuses', () => {
        expect(selectIsRecording(useRecordingStore.getState())).toBe(false);
      });
    });

    describe('selectIsRecordingInProgress', () => {
      it('should return true for pending status', () => {
        act(() => {
          useRecordingStore.getState().updateStatus('rec-123', 0, 'pending');
        });

        expect(selectIsRecordingInProgress(useRecordingStore.getState())).toBe(true);
      });

      it('should return true for recording status', () => {
        act(() => {
          useRecordingStore.getState().setStarted('rec-123');
        });

        expect(selectIsRecordingInProgress(useRecordingStore.getState())).toBe(true);
      });

      it('should return false for completed status', () => {
        act(() => {
          useRecordingStore.getState().updateStatus('rec-123', 0, 'completed');
        });

        expect(selectIsRecordingInProgress(useRecordingStore.getState())).toBe(false);
      });
    });

    describe('selectFormattedDuration', () => {
      it('should format seconds correctly', () => {
        act(() => {
          useRecordingStore.getState().updateStatus('rec-123', 45000, 'recording');
        });

        expect(selectFormattedDuration(useRecordingStore.getState())).toBe('00:45');
      });

      it('should format minutes and seconds correctly', () => {
        act(() => {
          useRecordingStore.getState().updateStatus('rec-123', 125000, 'recording');
        });

        expect(selectFormattedDuration(useRecordingStore.getState())).toBe('02:05');
      });

      it('should format hours, minutes and seconds correctly', () => {
        act(() => {
          useRecordingStore.getState().updateStatus('rec-123', 3725000, 'recording');
        });

        expect(selectFormattedDuration(useRecordingStore.getState())).toBe('01:02:05');
      });
    });
  });
});
