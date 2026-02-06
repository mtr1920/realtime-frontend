/**
 * Participant Test Factory
 *
 * Create mock participant data for testing.
 */

import type { ParticipantStatus } from '@/types';

// =============================================================================
// Types (matching @protocol/index)
// =============================================================================

export interface Participant {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  roleId: string;
  status: ParticipantStatus;
  joinedAt?: string;
  leftAt?: string;
  mediaState?: MediaState;
  connectionState?: ConnectionState;
}

export interface MediaState {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  speaking?: boolean;
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

// =============================================================================
// Role IDs
// =============================================================================

export const PARTICIPANT_ROLES = {
  CANDIDATE: 'candidate',
  INTERVIEWER: 'interviewer',
  FACILITATOR: 'facilitator',
  OBSERVER: 'observer',
} as const;

export type ParticipantRoleId = (typeof PARTICIPANT_ROLES)[keyof typeof PARTICIPANT_ROLES];

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_PARTICIPANT: Participant = {
  id: 'participant-001',
  sessionId: 'session-001',
  userId: 'user-001',
  displayName: 'Test Participant',
  roleId: PARTICIPANT_ROLES.CANDIDATE,
  status: 'ACTIVE',
  mediaState: {
    audioEnabled: true,
    videoEnabled: true,
    screenShareEnabled: false,
    speaking: false,
  },
  connectionState: 'connected',
};

// =============================================================================
// Factory Functions
// =============================================================================

let participantIdCounter = 0;

/**
 * Create a mock participant with optional overrides.
 */
export function createMockParticipant(
  overrides: Partial<Participant> = {}
): Participant {
  participantIdCounter++;
  const defaultMedia = DEFAULT_PARTICIPANT.mediaState!;
  const overrideMedia = overrides.mediaState;
  return {
    ...DEFAULT_PARTICIPANT,
    id: `participant-${String(participantIdCounter).padStart(3, '0')}`,
    joinedAt: new Date().toISOString(),
    ...overrides,
    mediaState: {
      audioEnabled: overrideMedia?.audioEnabled ?? defaultMedia.audioEnabled,
      videoEnabled: overrideMedia?.videoEnabled ?? defaultMedia.videoEnabled,
      screenShareEnabled: overrideMedia?.screenShareEnabled ?? defaultMedia.screenShareEnabled,
      speaking: overrideMedia?.speaking ?? defaultMedia.speaking,
    },
  };
}

/**
 * Create a participant with specific role.
 */
export function createParticipantWithRole(
  roleId: ParticipantRoleId,
  overrides: Partial<Participant> = {}
): Participant {
  return createMockParticipant({
    roleId,
    displayName: `${roleId.charAt(0).toUpperCase() + roleId.slice(1)} User`,
    ...overrides,
  });
}

/**
 * Create an observer participant (cannot publish media).
 */
export function createObserver(overrides: Partial<Participant> = {}): Participant {
  return createParticipantWithRole(PARTICIPANT_ROLES.OBSERVER, {
    mediaState: {
      audioEnabled: false,
      videoEnabled: false,
      screenShareEnabled: false,
      speaking: false,
    },
    ...overrides,
  });
}

/**
 * Create a facilitator participant.
 */
export function createFacilitator(overrides: Partial<Participant> = {}): Participant {
  return createParticipantWithRole(PARTICIPANT_ROLES.FACILITATOR, overrides);
}

/**
 * Create a candidate participant.
 */
export function createCandidate(overrides: Partial<Participant> = {}): Participant {
  return createParticipantWithRole(PARTICIPANT_ROLES.CANDIDATE, overrides);
}

/**
 * Create a participant with specific media state.
 */
export function createParticipantWithMedia(
  mediaState: Partial<MediaState>,
  overrides: Partial<Participant> = {}
): Participant {
  return createMockParticipant({
    ...overrides,
    mediaState: {
      audioEnabled: mediaState.audioEnabled ?? DEFAULT_PARTICIPANT.mediaState!.audioEnabled,
      videoEnabled: mediaState.videoEnabled ?? DEFAULT_PARTICIPANT.mediaState!.videoEnabled,
      screenShareEnabled: mediaState.screenShareEnabled ?? DEFAULT_PARTICIPANT.mediaState!.screenShareEnabled,
      speaking: mediaState.speaking ?? DEFAULT_PARTICIPANT.mediaState!.speaking,
    },
  });
}

/**
 * Create a participant with specific status.
 */
export function createParticipantWithStatus(
  status: ParticipantStatus,
  overrides: Partial<Participant> = {}
): Participant {
  const participant = createMockParticipant({ status, ...overrides });

  if (status === 'LEFT' || status === 'REMOVED') {
    participant.leftAt = new Date().toISOString();
  }

  return participant;
}

/**
 * Create multiple participants for a session.
 */
export function createSessionParticipants(
  sessionId: string,
  count: number = 3
): Participant[] {
  const roles: ParticipantRoleId[] = [
    PARTICIPANT_ROLES.CANDIDATE,
    PARTICIPANT_ROLES.INTERVIEWER,
    PARTICIPANT_ROLES.FACILITATOR,
    PARTICIPANT_ROLES.OBSERVER,
  ];

  return Array.from({ length: count }, (_, i) => {
    return createMockParticipant({
      sessionId,
      roleId: roles[i % roles.length] || PARTICIPANT_ROLES.CANDIDATE,
      displayName: `Participant ${i + 1}`,
    });
  });
}

/**
 * Reset the participant ID counter (call in beforeEach for deterministic IDs).
 */
export function resetParticipantIdCounter(): void {
  participantIdCounter = 0;
}
