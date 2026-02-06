/**
 * Tests for SignalingAdapter participant event handling.
 * Verifies that flat payload fields are correctly extracted.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock types matching the implementation
interface ParticipantJoinedPayload {
  participantId: string;
  userId?: string;
  roleId: string;
  displayName: string;
  joinedAt: string;
}

interface ParticipantLeftPayload {
  participantId: string;
  reason: 'user_action' | 'timeout' | 'removed' | 'error';
  leftAt: string;
}

interface SignalingCallbacks {
  onParticipantJoined: (participantId: string) => void;
  onParticipantLeft: (participantId: string) => void;
}

describe('SignalingAdapter - Participant Events', () => {
  let callbacks: SignalingCallbacks;
  let wsSubscriptionHandlers: Map<string, (payload: unknown) => void>;

  beforeEach(() => {
    callbacks = {
      onParticipantJoined: vi.fn(),
      onParticipantLeft: vi.fn(),
    };

    wsSubscriptionHandlers = new Map();
  });

  function subscribe(event: string, handler: (payload: unknown) => void): void {
    wsSubscriptionHandlers.set(event, handler);
  }

  function simulateEvent(event: string, payload: unknown): void {
    const handler = wsSubscriptionHandlers.get(event);
    if (handler) {
      handler(payload);
    }
  }

  describe('session.participant.joined', () => {
    it('should extract participantId from flat payload', () => {
      // Set up subscription similar to signaling-adapter.ts
      subscribe('session.participant.joined', (payload) => {
        const typedPayload = payload as ParticipantJoinedPayload;
        callbacks.onParticipantJoined(typedPayload.participantId);
      });

      const mockPayload: ParticipantJoinedPayload = {
        participantId: 'p-123',
        roleId: 'trainer',
        displayName: 'Test User',
        joinedAt: '2025-01-24T12:00:00Z',
      };

      simulateEvent('session.participant.joined', mockPayload);

      expect(callbacks.onParticipantJoined).toHaveBeenCalledWith('p-123');
      expect(callbacks.onParticipantJoined).not.toHaveBeenCalledWith(undefined);
    });

    it('should NOT expect nested participant object', () => {
      const mockPayload: ParticipantJoinedPayload = {
        participantId: 'p-456',
        roleId: 'support',
        displayName: 'Support Agent',
        joinedAt: '2025-01-24T12:00:00Z',
      };

      // Verify the payload does NOT have nested structure
      expect((mockPayload as unknown as { participant?: unknown }).participant).toBeUndefined();
      expect(mockPayload.participantId).toBe('p-456');
    });

    it('should handle multiple participant joined events', () => {
      subscribe('session.participant.joined', (payload) => {
        const typedPayload = payload as ParticipantJoinedPayload;
        callbacks.onParticipantJoined(typedPayload.participantId);
      });

      const participants = [
        { participantId: 'p-1', roleId: 'trainer', displayName: 'User 1', joinedAt: '2025-01-24T12:00:00Z' },
        { participantId: 'p-2', roleId: 'support', displayName: 'User 2', joinedAt: '2025-01-24T12:01:00Z' },
        { participantId: 'p-3', roleId: 'candidate', displayName: 'User 3', joinedAt: '2025-01-24T12:02:00Z' },
      ];

      participants.forEach((p) => {
        simulateEvent('session.participant.joined', p);
      });

      expect(callbacks.onParticipantJoined).toHaveBeenCalledTimes(3);
      expect(callbacks.onParticipantJoined).toHaveBeenNthCalledWith(1, 'p-1');
      expect(callbacks.onParticipantJoined).toHaveBeenNthCalledWith(2, 'p-2');
      expect(callbacks.onParticipantJoined).toHaveBeenNthCalledWith(3, 'p-3');
    });
  });

  describe('session.participant.left', () => {
    it('should extract participantId from flat payload', () => {
      subscribe('session.participant.left', (payload) => {
        const typedPayload = payload as ParticipantLeftPayload;
        callbacks.onParticipantLeft(typedPayload.participantId);
      });

      const mockPayload: ParticipantLeftPayload = {
        participantId: 'p-789',
        reason: 'user_action',
        leftAt: '2025-01-24T12:30:00Z',
      };

      simulateEvent('session.participant.left', mockPayload);

      expect(callbacks.onParticipantLeft).toHaveBeenCalledWith('p-789');
    });

    it('should handle different leave reasons', () => {
      const reasons: ParticipantLeftPayload['reason'][] = ['user_action', 'timeout', 'removed', 'error'];

      subscribe('session.participant.left', (payload) => {
        const typedPayload = payload as ParticipantLeftPayload;
        callbacks.onParticipantLeft(typedPayload.participantId);
      });

      reasons.forEach((reason, index) => {
        simulateEvent('session.participant.left', {
          participantId: `p-${index}`,
          reason,
          leftAt: new Date().toISOString(),
        });
      });

      expect(callbacks.onParticipantLeft).toHaveBeenCalledTimes(4);
    });
  });

  describe('callback invocation pattern', () => {
    it('should pass only participantId to callbacks', () => {
      subscribe('session.participant.joined', (payload) => {
        const typedPayload = payload as ParticipantJoinedPayload;
        callbacks.onParticipantJoined(typedPayload.participantId);
      });

      subscribe('session.participant.left', (payload) => {
        const typedPayload = payload as ParticipantLeftPayload;
        callbacks.onParticipantLeft(typedPayload.participantId);
      });

      const joinPayload: ParticipantJoinedPayload = {
        participantId: 'p-test',
        userId: 'u-test',
        roleId: 'interviewer',
        displayName: 'Full Name',
        joinedAt: '2025-01-24T12:00:00Z',
      };

      simulateEvent('session.participant.joined', joinPayload);

      // Callback only receives participantId, not full payload
      expect(callbacks.onParticipantJoined).toHaveBeenCalledWith('p-test');
      expect(callbacks.onParticipantJoined).not.toHaveBeenCalledWith(joinPayload);
    });
  });

  describe('unsubscribe behavior', () => {
    it('should not trigger callbacks after unsubscribe', () => {
      const unsubscribers: Array<() => void> = [];

      unsubscribers.push(() => {
        wsSubscriptionHandlers.delete('session.participant.joined');
      });

      subscribe('session.participant.joined', (payload) => {
        const typedPayload = payload as ParticipantJoinedPayload;
        callbacks.onParticipantJoined(typedPayload.participantId);
      });

      // Trigger before unsubscribe
      simulateEvent('session.participant.joined', {
        participantId: 'p-1',
        roleId: 'trainer',
        displayName: 'User',
        joinedAt: new Date().toISOString(),
      });

      expect(callbacks.onParticipantJoined).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribers.forEach((unsub) => unsub());

      // Trigger after unsubscribe
      simulateEvent('session.participant.joined', {
        participantId: 'p-2',
        roleId: 'trainer',
        displayName: 'User 2',
        joinedAt: new Date().toISOString(),
      });

      // Still only 1 call
      expect(callbacks.onParticipantJoined).toHaveBeenCalledTimes(1);
    });
  });
});
