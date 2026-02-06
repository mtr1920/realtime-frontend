/**
 * Test Factories
 *
 * Re-export all factory functions for easy imports.
 */

// Imports for reset function
import { resetSessionIdCounter as _resetSession } from './session.factory';
import { resetParticipantIdCounter as _resetParticipant } from './participant.factory';
import { resetViolationIdCounter as _resetViolation } from './violation.factory';
import { resetEntryIdCounter as _resetEntry } from './transcript.factory';
import { resetRecordingCounters as _resetRecording } from './recording.factory';

// Session factories
export {
  createMockSession,
  createMockSessionConfig,
  createSessionWithStatus,
  createSessionWithModules,
  createSessionWithScreenShareRequired,
  resetSessionIdCounter,
  type Session,
  type SessionConfig,
} from './session.factory';

// Participant factories
export {
  createMockParticipant,
  createParticipantWithRole,
  createObserver,
  createFacilitator,
  createCandidate,
  createParticipantWithMedia,
  createParticipantWithStatus,
  createSessionParticipants,
  resetParticipantIdCounter,
  PARTICIPANT_ROLES,
  type Participant,
  type MediaState,
  type ConnectionState,
  type ParticipantRoleId,
} from './participant.factory';

// Violation factories
export {
  createMockViolation,
  createViolationOfType,
  createViolationWithSeverity,
  createCriticalViolation,
  createInfoViolation,
  createViolationBatch,
  createViolationWithDetails,
  resetViolationIdCounter,
  VIOLATION_TYPES,
  SEVERITY_LEVELS,
  VIOLATION_ACTIONS,
} from './violation.factory';

// Transcript factories
export {
  createMockTranscriptEntry,
  createUserEntry,
  createAIEntry,
  createSystemEntry,
  createStreamingEntry,
  createConversation,
  createTranscriptEntries,
  resetEntryIdCounter,
  type TranscriptEntry,
  type SpeakerType,
} from './transcript.factory';

// Recording factories
export {
  createMockRecording,
  createRecordingWithStatus,
  createActiveRecording,
  createCompletedRecording,
  createFailedRecording,
  createMockChunk,
  createChunkBatch,
  resetRecordingIdCounter,
  resetChunkIdCounter,
  resetRecordingCounters,
  type Recording,
  type RecordingStatus,
  type RecordingChunk,
} from './recording.factory';

// =============================================================================
// Reset All Counters
// =============================================================================

/**
 * Reset all factory counters.
 * Call in beforeEach for deterministic test IDs.
 */
export function resetAllFactoryCounters(): void {
  _resetSession();
  _resetParticipant();
  _resetViolation();
  _resetEntry();
  _resetRecording();
}
