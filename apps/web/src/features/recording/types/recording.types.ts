/**
 * Recording Types
 *
 * Types for recording state management and UI.
 */

// =============================================================================
// Recording Status
// =============================================================================

/**
 * Recording status from the server
 */
export type RecordingStatus =
  | 'idle'
  | 'pending'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'completed'
  | 'failed';

// =============================================================================
// Recording State
// =============================================================================

/**
 * Recording state for the store
 */
export interface RecordingState {
  /** Current recording status */
  status: RecordingStatus;
  /** Recording ID when active */
  recordingId: string | null;
  /** Duration in milliseconds */
  durationMs: number;
  /** Whether user has given consent */
  hasConsent: boolean;
  /** Download URL when finalized */
  downloadUrl: string | null;
  /** Error message if any */
  error: string | null;
}

// =============================================================================
// Recording Actions
// =============================================================================

/**
 * Recording store actions
 */
export interface RecordingActions {
  /** Set recording as started */
  setStarted: (recordingId: string) => void;
  /** Set recording as stopped */
  setStopped: (recordingId: string, durationMs: number) => void;
  /** Update recording status */
  updateStatus: (recordingId: string, durationMs: number, status: RecordingStatus) => void;
  /** Set recording as finalized with download URL */
  setFinalized: (recordingId: string, downloadUrl: string) => void;
  /** Set error */
  setError: (code: string, message: string) => void;
  /** Set consent */
  setConsent: (hasConsent: boolean) => void;
  /** Reset recording state */
  reset: () => void;
}
