/**
 * Transcript Types
 *
 * Types for real-time transcript display and export.
 */

// =============================================================================
// Transcript Turn
// =============================================================================

/**
 * A single transcript turn (utterance)
 */
export interface TranscriptTurn {
  /** Unique turn ID */
  turnId: string;
  /** Speaker's role (e.g., 'interviewer', 'candidate', 'ai') */
  speakerRole: string;
  /** Speaker's participant ID (optional) */
  speakerId?: string;
  /** Speaker's display name */
  speakerName?: string;
  /** Transcript content */
  content: string;
  /** Whether this is the final version of the transcript */
  isFinal: boolean;
  /** Confidence score (0-1) */
  confidence?: number;
  /** ISO 8601 timestamp when turn started */
  startedAt: string;
  /** ISO 8601 timestamp when turn ended (optional) */
  endedAt?: string;
  /** Duration in milliseconds (optional) */
  durationMs?: number;
}

// =============================================================================
// Transcript State
// =============================================================================

/**
 * Transcript store state
 */
export interface TranscriptState {
  /** All transcript turns */
  turns: TranscriptTurn[];
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Whether there are more turns to load */
  hasMore: boolean;
  /** Error message if any */
  error: string | null;
}

// =============================================================================
// Export Types
// =============================================================================

/**
 * Export format options
 */
export type TranscriptExportFormat = 'json' | 'txt' | 'srt' | 'csv';

/**
 * Export options
 */
export interface TranscriptExportOptions {
  /** Export format */
  format: TranscriptExportFormat;
  /** Include timestamps */
  includeTimestamps?: boolean;
  /** Include speaker roles */
  includeSpeakerRoles?: boolean;
}
