/**
 * Identity Verification Types
 *
 * Types for identity verification challenges.
 * Field names match backend protocol (verificationId, VerificationType).
 */

// =============================================================================
// Verification Types (imported from messages for consistency)
// =============================================================================

/**
 * Type of identity verification.
 * Matches backend VerificationType.
 */
export type VerificationType = 'challenge_question' | 'biometric' | 'custom';

/**
 * Verification status
 */
export type IdentityVerificationStatus = 'pending' | 'active' | 'completed' | 'expired' | 'failed';

// =============================================================================
// Verification Data
// =============================================================================

/**
 * An identity verification request
 */
export interface IdentityVerification {
  /** Unique verification ID (matches backend verificationId) */
  verificationId: string;
  /** Type of verification */
  type: VerificationType;
  /** Verification prompt/question */
  prompt: string;
  /** Timeout in seconds */
  timeoutSeconds: number;
  /** Options for challenge_question type verifications */
  options?: string[];
  /** Verification start timestamp */
  startedAt: string;
}

/**
 * Verification state for the store
 */
export interface VerificationState {
  /** Active verification if any */
  activeVerification: IdentityVerification | null;
  /** Verification status */
  status: IdentityVerificationStatus;
  /** Remaining time in seconds */
  remainingSeconds: number;
  /** History of completed verifications */
  history: VerificationResult[];
}

/**
 * Result of a verification attempt
 */
export interface VerificationResult {
  /** Verification ID */
  verificationId: string;
  /** Whether the verification passed */
  passed: boolean;
  /** Response provided */
  response?: string;
  /** Timestamp of completion */
  completedAt: string;
}
