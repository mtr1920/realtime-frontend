/**
 * Compliance Types
 *
 * Violation types and payloads for real-time compliance monitoring.
 * These mirror the backend protocol definitions.
 */

// =============================================================================
// Violation Types
// =============================================================================

/**
 * Types of compliance violations that can be detected
 */
export type ViolationType =
  | 'tab_switch'
  | 'window_blur'
  | 'copy_paste'
  | 'keyboard_shortcut'
  | 'screen_capture_attempt'
  | 'multiple_faces'
  | 'no_face'
  | 'suspicious_audio'
  | 'custom';

/**
 * Severity levels for violations
 */
export type ViolationSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Actions taken in response to a violation
 */
export type ViolationAction = 'logged' | 'warned' | 'paused' | 'terminated';

// =============================================================================
// Violation Data
// =============================================================================

/**
 * A compliance violation event
 */
export interface ComplianceViolation {
  /** Unique identifier for this violation */
  id: string;
  /** Type of violation detected */
  type: ViolationType;
  /** Severity level */
  severity: ViolationSeverity;
  /** Action taken by the system */
  action: ViolationAction;
  /** Human-readable description */
  message: string;
  /** Additional context about the violation */
  details?: Record<string, unknown>;
  /** ISO 8601 timestamp of when violation occurred */
  timestamp: string;
}

// =============================================================================
// UI State
// =============================================================================

/**
 * Active violation with UI state for display
 */
export interface ActiveViolation extends ComplianceViolation {
  /** Whether this violation is visible in the UI */
  isVisible: boolean;
  /** Auto-dismiss timer ID (if set) */
  dismissTimerId?: ReturnType<typeof setTimeout>;
}
