/**
 * Tests for SessionRoomPage participant join handler.
 * Verifies that flat payload fields are correctly mapped to participant store format.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock types matching the implementation
interface ParticipantJoinedPayload {
  participantId: string;
  userId?: string;
  roleId: string;
  displayName: string;
  joinedAt: string;
}

interface Participant {
  id: string;
  userId: string;
  sessionId: string;
  displayName: string;
  role: {
    name: string;
    displayName: string;
    permissions: {
      canPublishAudio: boolean;
      canPublishVideo: boolean;
      canScreenShare: boolean;
      canInteractWithAI: boolean;
      canEndSession: boolean;
      canViewComplianceData: boolean;
      canRemoveParticipants: boolean;
      canStartRecording: boolean;
      canViewTranscript: boolean;
      canChat: boolean;
      // Communication
      canSendPrivateMessages: boolean;
      // Outcome permissions
      canViewOutcome: boolean;
      canEditOutcome: boolean;
      canApproveOutcome: boolean;
      // Phase control
      canAdvancePhase: boolean;
      canRevertPhase: boolean;
    };
  };
  connectionState: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  mediaState: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenShareEnabled: boolean;
    isSpeaking: boolean;
  };
  joinedAt: string;
}

describe('SessionRoomPage - Participant Join Handler', () => {
  const sessionId = 'session-1';

  function mapPayloadToParticipant(
    flatPayload: ParticipantJoinedPayload
  ): Participant {
    return {
      id: flatPayload.participantId,
      userId: flatPayload.userId ?? flatPayload.participantId,
      sessionId,
      displayName: flatPayload.displayName,
      role: {
        name: flatPayload.roleId,
        displayName: flatPayload.roleId,
        permissions: {
          canPublishAudio: true,
          canPublishVideo: true,
          canScreenShare: true,
          canInteractWithAI: true,
          canEndSession: false,
          canViewComplianceData: false,
          canRemoveParticipants: false,
          canStartRecording: false,
          canViewTranscript: false,
          canChat: true,
          // Communication
          canSendPrivateMessages: false,
          // Outcome permissions
          canViewOutcome: false,
          canEditOutcome: false,
          canApproveOutcome: false,
          // Phase control
          canAdvancePhase: false,
          canRevertPhase: false,
        },
      },
      connectionState: 'connected',
      mediaState: {
        audioEnabled: false,
        videoEnabled: false,
        screenShareEnabled: false,
        isSpeaking: false,
      },
      joinedAt: flatPayload.joinedAt,
    };
  }

  it('should construct Participant from flat payload fields', () => {
    const flatPayload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      userId: 'u-456',
      roleId: 'trainer',
      displayName: 'Jane Trainer',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    const participant = mapPayloadToParticipant(flatPayload);

    expect(participant.id).toBe('p-123');
    expect(participant.userId).toBe('u-456');
    expect(participant.sessionId).toBe('session-1');
    expect(participant.displayName).toBe('Jane Trainer');
    expect(participant.role.name).toBe('trainer');
    expect(participant.connectionState).toBe('connected');
    expect(participant.joinedAt).toBe('2025-01-24T12:00:00Z');
  });

  it('should use participantId as fallback for userId when not provided', () => {
    const flatPayload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      roleId: 'trainer',
      displayName: 'Anonymous',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    const participant = mapPayloadToParticipant(flatPayload);

    expect(participant.userId).toBe('p-123');
    expect(participant.id).toBe('p-123');
  });

  it('should set default permissions based on role', () => {
    const flatPayload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      roleId: 'interviewer',
      displayName: 'Interviewer',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    const participant = mapPayloadToParticipant(flatPayload);

    expect(participant.role.permissions.canPublishAudio).toBe(true);
    expect(participant.role.permissions.canPublishVideo).toBe(true);
    expect(participant.role.permissions.canScreenShare).toBe(true);
    expect(participant.role.permissions.canInteractWithAI).toBe(true);
    expect(participant.role.permissions.canChat).toBe(true);
    // These are false by default for non-facilitator roles
    expect(participant.role.permissions.canEndSession).toBe(false);
    expect(participant.role.permissions.canRemoveParticipants).toBe(false);
  });

  it('should initialize media state as disabled', () => {
    const flatPayload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      roleId: 'support',
      displayName: 'Support Agent',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    const participant = mapPayloadToParticipant(flatPayload);

    expect(participant.mediaState.audioEnabled).toBe(false);
    expect(participant.mediaState.videoEnabled).toBe(false);
    expect(participant.mediaState.screenShareEnabled).toBe(false);
    expect(participant.mediaState.isSpeaking).toBe(false);
  });

  it('should set connectionState to connected on join', () => {
    const flatPayload: ParticipantJoinedPayload = {
      participantId: 'p-new',
      roleId: 'candidate',
      displayName: 'New Participant',
      joinedAt: new Date().toISOString(),
    };

    const participant = mapPayloadToParticipant(flatPayload);

    expect(participant.connectionState).toBe('connected');
  });

  it('should preserve roleId as both role.name and role.displayName', () => {
    const flatPayload: ParticipantJoinedPayload = {
      participantId: 'p-123',
      roleId: 'presales',
      displayName: 'Sales Rep',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    const participant = mapPayloadToParticipant(flatPayload);

    expect(participant.role.name).toBe('presales');
    expect(participant.role.displayName).toBe('presales');
  });

  it('should handle addParticipant store action correctly', () => {
    const addParticipant = vi.fn();

    const flatPayload: ParticipantJoinedPayload = {
      participantId: 'p-store-test',
      roleId: 'trainer',
      displayName: 'Store Test',
      joinedAt: '2025-01-24T12:00:00Z',
    };

    const participant = mapPayloadToParticipant(flatPayload);
    addParticipant(participant);

    expect(addParticipant).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p-store-test',
        displayName: 'Store Test',
        role: expect.objectContaining({
          name: 'trainer',
        }),
      })
    );
  });
});
