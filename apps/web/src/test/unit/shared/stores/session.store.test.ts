/**
 * Session Store Tests
 *
 * Tests for session state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useSessionStore,
  subscribeToParticipants,
  subscribeToSessionStatus,
} from '@/shared/stores/session.store';
import type { Session, Participant } from '@protocol/index';

// =============================================================================
// Test Setup
// =============================================================================

function resetStore() {
  useSessionStore.setState({
    sessionId: null,
    session: null,
    participants: new Map(),
    localParticipantId: null,
    status: null,
    config: null,
    realtimeToken: null,
    wsEndpoint: null,
  });
}

function createMockSession(id: string = 'session-001'): Session {
  return {
    id,
    tenantId: 'tenant-001',
    workspaceId: 'workspace-001',
    title: 'Test Session',
    status: 'active',
    config: {
      domainType: 'interview',
      enabledModules: ['ai', 'recording'],
      recording: { enabled: true, autoStart: true },
      ai: { enabled: true, provider: 'openai' },
      compliance: { enabled: true, browserLock: true, identityVerification: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMockParticipant(id: string, overrides: Partial<Participant> = {}): Participant {
  return {
    id,
    sessionId: 'session-001',
    userId: `user-${id}`,
    displayName: `Participant ${id}`,
    role: {
      name: 'candidate',
      displayName: 'Candidate',
      permissions: {
        canPublishAudio: true,
        canPublishVideo: true,
        canScreenShare: true,
        canChat: true,
        canEndSession: false,
        canRemoveParticipants: false,
        canStartRecording: false,
        canViewTranscript: true,
        canInteractWithAI: true,
        canViewComplianceData: false,
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
      audioEnabled: true,
      videoEnabled: true,
      screenShareEnabled: false,
      isSpeaking: false,
    },
    joinedAt: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Session Store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have null session', () => {
      resetStore();
      expect(useSessionStore.getState().session).toBeNull();
    });

    it('should have empty participants', () => {
      resetStore();
      expect(useSessionStore.getState().participants.size).toBe(0);
    });

  });

  // ===========================================================================
  // Session Actions
  // ===========================================================================

  describe('setSession', () => {
    it('should set session data', () => {
      const session = createMockSession();

      act(() => {
        useSessionStore.getState().setSession(session );
      });

      const state = useSessionStore.getState();
      expect(state.session).toEqual(session);
      expect(state.sessionId).toBe(session.id);
      expect(state.status).toBe(session.status);
    });
  });

  describe('setLocalParticipantId', () => {
    it('should set local participant ID', () => {
      act(() => {
        useSessionStore.getState().setLocalParticipantId('local-001');
      });

      expect(useSessionStore.getState().localParticipantId).toBe('local-001');
    });
  });

  // ===========================================================================
  // Participant Actions
  // ===========================================================================

  describe('addParticipant', () => {
    it('should add participant to map', () => {
      const participant = createMockParticipant('p1');

      act(() => {
        useSessionStore.getState().addParticipant(participant );
      });

      expect(useSessionStore.getState().participants.has('p1')).toBe(true);
    });
  });

  describe('updateParticipant', () => {
    it('should update participant properties', () => {
      const participant = createMockParticipant('p1');

      act(() => {
        useSessionStore.getState().addParticipant(participant );
        useSessionStore.getState().updateParticipant('p1', { displayName: 'Updated Name' });
      });

      const updated = useSessionStore.getState().participants.get('p1');
      expect(updated?.displayName).toBe('Updated Name');
    });

    it('should do nothing for non-existent participant', () => {
      act(() => {
        useSessionStore.getState().updateParticipant('non-existent', { displayName: 'Test' });
      });

      expect(useSessionStore.getState().participants.size).toBe(0);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from map', () => {
      const participant = createMockParticipant('p1');

      act(() => {
        useSessionStore.getState().addParticipant(participant );
        useSessionStore.getState().removeParticipant('p1');
      });

      expect(useSessionStore.getState().participants.has('p1')).toBe(false);
    });
  });

  describe('setParticipants', () => {
    it('should replace all participants', () => {
      const p1 = createMockParticipant('p1');
      const p2 = createMockParticipant('p2');

      act(() => {
        useSessionStore.getState().addParticipant(createMockParticipant('old') );
        useSessionStore.getState().setParticipants([p1, p2] );
      });

      const state = useSessionStore.getState();
      expect(state.participants.size).toBe(2);
      expect(state.participants.has('p1')).toBe(true);
      expect(state.participants.has('p2')).toBe(true);
      expect(state.participants.has('old')).toBe(false);
    });
  });

  // ===========================================================================
  // Derived State Helpers
  // ===========================================================================

  describe('getParticipant', () => {
    it('should return participant by ID', () => {
      const participant = createMockParticipant('p1');

      act(() => {
        useSessionStore.getState().addParticipant(participant );
      });

      expect(useSessionStore.getState().getParticipant('p1')).toBeDefined();
    });

    it('should return undefined for non-existent ID', () => {
      expect(useSessionStore.getState().getParticipant('non-existent')).toBeUndefined();
    });
  });

  describe('getLocalParticipant', () => {
    it('should return local participant', () => {
      const participant = createMockParticipant('local');

      act(() => {
        useSessionStore.getState().addParticipant(participant );
        useSessionStore.getState().setLocalParticipantId('local');
      });

      const local = useSessionStore.getState().getLocalParticipant();
      expect(local?.id).toBe('local');
    });

    it('should return undefined when no local participant', () => {
      expect(useSessionStore.getState().getLocalParticipant()).toBeUndefined();
    });
  });

  describe('getParticipantsList', () => {
    it('should return all participants as array', () => {
      const p1 = createMockParticipant('p1');
      const p2 = createMockParticipant('p2');

      act(() => {
        useSessionStore.getState().setParticipants([p1, p2] );
      });

      const list = useSessionStore.getState().getParticipantsList();
      expect(list.length).toBe(2);
    });
  });

  describe('isLocalParticipant', () => {
    it('should return true for local participant ID', () => {
      act(() => {
        useSessionStore.getState().setLocalParticipantId('local');
      });

      expect(useSessionStore.getState().isLocalParticipant('local')).toBe(true);
    });

    it('should return false for other participant IDs', () => {
      act(() => {
        useSessionStore.getState().setLocalParticipantId('local');
      });

      expect(useSessionStore.getState().isLocalParticipant('other')).toBe(false);
    });
  });

  // ===========================================================================
  // Credentials & Join Context
  // ===========================================================================

  describe('setRealtimeCredentials', () => {
    it('should set token and endpoint', () => {
      act(() => {
        useSessionStore.getState().setRealtimeCredentials('token-123', 'wss://example.com');
      });

      const state = useSessionStore.getState();
      expect(state.realtimeToken).toBe('token-123');
      expect(state.wsEndpoint).toBe('wss://example.com');
    });
  });

  // ===========================================================================
  // Outcome Actions
  // ===========================================================================

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe('reset', () => {
    it('should reset all state', () => {
      const session = createMockSession();
      const participant = createMockParticipant('p1');

      act(() => {
        useSessionStore.getState().setSession(session );
        useSessionStore.getState().addParticipant(participant );
        useSessionStore.getState().reset();
      });

      const state = useSessionStore.getState();
      expect(state.session).toBeNull();
      expect(state.sessionId).toBeNull();
      expect(state.participants.size).toBe(0);
    });
  });

  // ===========================================================================
  // Subscriptions
  // ===========================================================================

  describe('subscriptions', () => {
    describe('subscribeToParticipants', () => {
      it('should notify on participant changes', () => {
        let notified = false;
        const unsub = subscribeToParticipants(() => {
          notified = true;
        });

        act(() => {
          useSessionStore.getState().addParticipant(createMockParticipant('p1') );
        });

        expect(notified).toBe(true);
        unsub();
      });
    });

    describe('subscribeToSessionStatus', () => {
      it('should notify on status changes', () => {
        let receivedStatus: string | null = null;
        const unsub = subscribeToSessionStatus((status) => {
          receivedStatus = status;
        });

        act(() => {
          const session = createMockSession();
          session.status = 'ended';
          useSessionStore.getState().setSession(session);
        });

        expect(receivedStatus).toBe('ended');
        unsub();
      });
    });
  });

  // ===========================================================================
  // Immer MapSet Integration (regression: enableMapSet() must be called)
  // ===========================================================================

  describe('Immer MapSet integration', () => {
    // These tests verify that Map operations inside Immer producers work.
    // Regression: enableMapSet() was only called in test/setup.ts, not in
    // the production entry point (main.tsx), causing session.snapshot to fail.

    it('should not throw on Map.set inside Immer producer (addParticipant)', () => {
      expect(() => {
        act(() => {
          useSessionStore.getState().addParticipant(createMockParticipant('p1'));
        });
      }).not.toThrow();

      expect(useSessionStore.getState().participants.size).toBe(1);
      expect(useSessionStore.getState().participants.get('p1')?.id).toBe('p1');
    });

    it('should not throw on Map.clear + Map.set inside Immer producer (setParticipants)', () => {
      act(() => {
        useSessionStore.getState().addParticipant(createMockParticipant('old'));
      });

      expect(() => {
        act(() => {
          useSessionStore.getState().setParticipants([
            createMockParticipant('p1'),
            createMockParticipant('p2'),
          ]);
        });
      }).not.toThrow();

      const { participants } = useSessionStore.getState();
      expect(participants.size).toBe(2);
      expect(participants.has('old')).toBe(false);
      expect(participants.has('p1')).toBe(true);
      expect(participants.has('p2')).toBe(true);
    });

    it('should not throw on Map.delete inside Immer producer (removeParticipant)', () => {
      act(() => {
        useSessionStore.getState().addParticipant(createMockParticipant('p1'));
      });

      expect(() => {
        act(() => {
          useSessionStore.getState().removeParticipant('p1');
        });
      }).not.toThrow();

      expect(useSessionStore.getState().participants.size).toBe(0);
    });

    it('should not throw on reset with new Maps inside Immer producer', () => {
      act(() => {
        useSessionStore.getState().addParticipant(createMockParticipant('p1'));
      });

      expect(() => {
        act(() => {
          useSessionStore.getState().reset();
        });
      }).not.toThrow();

      expect(useSessionStore.getState().participants.size).toBe(0);
    });
  });
});
