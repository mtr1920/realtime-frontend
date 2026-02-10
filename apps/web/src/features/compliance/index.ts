/**
 * Compliance Feature
 *
 * Real-time compliance violation monitoring and display.
 */

// Components
export { ComplianceOverlay } from './components/ComplianceOverlay';
export { ViolationAlert } from './components/ViolationAlert';
export { IdentityChallenge } from './components/IdentityChallenge';
export type { IdentityChallengeProps } from './components/IdentityChallenge';
export { ChallengeQuestion } from './components/ChallengeQuestion';
export type { ChallengeQuestionProps } from './components/ChallengeQuestion';
export { CompliancePanel } from './components/CompliancePanel';
export type { CompliancePanelProps } from './components/CompliancePanel';
export { ViolationList } from './components/ViolationList';
export type { ViolationListProps } from './components/ViolationList';
export { ViolationFilters } from './components/ViolationFilters';
export type { ViolationFiltersProps } from './components/ViolationFilters';
export { ComplianceTimeline } from './components/ComplianceTimeline';
export type { ComplianceTimelineProps } from './components/ComplianceTimeline';
export { InactivityWarning } from './components/InactivityWarning';
export type { InactivityWarningProps } from './components/InactivityWarning';
export { ViolationsSummary } from './components/ViolationsSummary';
export type { ViolationsSummaryProps } from './components/ViolationsSummary';
export { VerificationOutcomes } from './components/VerificationOutcomes';
export type {
  VerificationOutcomesProps,
  VerificationOutcome,
  VerificationStatus,
} from './components/VerificationOutcomes';
export { IntegrityReportSummary } from './components/IntegrityReportSummary';
export type {
  IntegrityReportSummaryProps,
  IntegrityStatus,
} from './components/IntegrityReportSummary';

// Hooks
export { useBrowserLock } from './hooks/useBrowserLock';
export type {
  UseBrowserLockOptions,
  UseBrowserLockResult,
} from './hooks/useBrowserLock';
export { useIdentityChallenge } from './hooks/useIdentityChallenge';
export type {
  UseIdentityChallengeOptions,
  UseIdentityChallengeResult,
} from './hooks/useIdentityChallenge';
export { useInactivityTimer } from './hooks/useInactivityTimer';
export type {
  UseInactivityTimerOptions,
  UseInactivityTimerResult,
} from './hooks/useInactivityTimer';
export { useComplianceCapture } from './hooks/useComplianceCapture';
export type {
  UseComplianceCaptureOptions,
  UseComplianceCaptureResult,
} from './hooks/useComplianceCapture';
export { useComplianceReport } from './hooks/useComplianceReport';
export type {
  ComplianceReport,
  UseComplianceReportResult,
} from './hooks/useComplianceReport';

// Services
export {
  captureFromVideo,
  captureMultiple,
  findVideoElements,
  extractBase64,
} from './services/screenshot-capture.service';
export type {
  CaptureResult,
  CaptureOptions,
} from './services/screenshot-capture.service';

// Store
export {
  useComplianceStore,
  getDismissDelay,
  MAX_VISIBLE_VIOLATIONS,
  DEFAULT_DISMISS_DELAY_MS,
} from './stores/compliance.store';

export {
  useComplianceHistoryStore,
  selectViolationsCount,
  selectFilteredViolations,
  selectHasActiveFilter,
} from './stores/compliance-history.store';
export type { ViolationFilter } from './stores/compliance-history.store';

// Types
export type {
  ComplianceViolation,
  ViolationType,
  ViolationSeverity,
  ViolationAction,
  ActiveViolation,
} from './types/compliance.types';

export type {
  VerificationType,
  IdentityVerificationStatus,
  IdentityVerification,
  VerificationState,
  VerificationResult,
} from './types/challenge.types';
