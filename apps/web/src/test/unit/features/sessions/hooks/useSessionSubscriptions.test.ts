/**
 * useSessionSubscriptions Hook Tests
 *
 * Tests for participant join/leave event handling and notifications.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionStore } from '@/shared/stores/session.store';
import type { Participant } from '@protocol/index';

// =============================================================================
// Mocks
// =============================================================================

const {
  mockSubscriptions,
  mockDisconnect,
  mockMarkSessionJoined,
  mockResetSessionState,
  mockToast,
  mockNavigate,
  mockInvalidateQueries,
} = vi.hoisted(() => ({
  mockSubscriptions: new Map<string, (payload: unknown) => void>(),
  mockDisconnect: vi.fn(),
  mockMarkSessionJoined: vi.fn(),
  mockResetSessionState: vi.fn(),
  mockToast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  mockNavigate: vi.fn(),
  mockInvalidateQueries: vi.fn(),
}));

vi.mock('@/features/realtime', () => ({
  useSubscription: (type: string, handler: (payload: unknown) => void) => {
    mockSubscriptions.set(type, handler);
  },
  useWebSocket: () => ({
    disconnect: mockDisconnect,
    markSessionJoined: mockMarkSessionJoined,
    resetSessionState: mockResetSessionState,
  }),
  getWebSocketService: () => null,
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock('@/features/compliance', () => ({
  useComplianceHistoryStore: (selector: (state: { clearHistory: () => void }) => unknown) =>
    selector({ clearHistory: vi.fn() }),
}));

vi.mock('@/shared/services/query-keys', () => ({
  queryKeys: {
    outcomes: {
      bySession: (id: string) => ['outcomes', 'session', id],
    },
  },
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/sessions/utils/sessionRoomHelpers', () => ({
  mapSnapshotToSession: vi.fn(),
  mapSnapshotParticipants: vi.fn(() => []),
  mapRolePermissionsToParticipantPermissions: vi.fn(() => ({
    canPublishAudio: true,
    canPublishVideo: true,
    canScreenShare: false,
    canChat: true,
    canEndSession: false,
    canRemoveParticipants: false,
    canStartRecording: false,
    canViewTranscript: false,
    canInteractWithAI: false,
    canViewComplianceData: false,
    canSendPrivateMessages: false,
    canViewOutcome: false,
    canEditOutcome: false,
    canApproveOutcome: false,
    canAdvancePhase: false,
    canRevertPhase: false,
  })),
}));

// Import after mocks
import { useSessionSubscriptions } from '@/features/sessions/hooks/useSessionSubscriptions';

// =============================================================================
// Helpers
// =============================================================================

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
        canScreenShare: false,
        canChat: true,
        canEndSession: false,
        canRemoveParticipants: false,
        canStartRecording: false,
        canViewTranscript: false,
        canInteractWithAI: false,
        canViewComplianceData: false,
        canSendPrivateMessages: false,
        canViewOutcome: false,
        canEditOutcome: false,
        canApproveOutcome: false,
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

// =============================================================================
// Tests
// =============================================================================

describe('useSessionSubscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscriptions.clear();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('subscription registration', () => {
    it('should subscribe to participant events', () => {
      renderHook(() =>
        useSessionSubscriptions({ sessionId: 'session-001' })
      );

      expect(mockSubscriptions.has('session.participant.joined')).toBe(true);
      expect(mockSubscriptions.has('session.participant.left')).toBe(true);
      expect(mockSubscriptions.has('session.participant.updated')).toBe(true);
    });
  });

  describe('session.participant.joined', () => {
    it('should add participant to store and show toast', () => {
      renderHook(() =>
        useSessionSubscriptions({ sessionId: 'session-001' })
      );

      const handler = mockSubscriptions.get('session.participant.joined')!;

      act(() => {
        handler({
          participantId: 'p-123',
          userId: 'u-123',
          displayName: 'Alice',
          roleId: 'interviewer',
          roleName: 'Interviewer',
          joinedAt: new Date().toISOString(),
        });
      });

      const participants = useSessionStore.getState().participants;
      expect(participants.has('p-123')).toBe(true);

      const added = participants.get('p-123')!;
      expect(added.displayName).toBe('Alice');
      expect(added.connectionState).toBe('connected');

      expect(mockToast.info).toHaveBeenCalledWith('Alice joined');
    });
  });

  describe('session.participant.left', () => {
    it('should remove participant from store and show toast with display name', () => {
      // Pre-populate store with a participant
      const participant = createMockParticipant('p-456', { displayName: 'Bob' });
      act(() => {
        useSessionStore.getState().addParticipant(participant);
      });
      expect(useSessionStore.getState().participants.has('p-456')).toBe(true);

      renderHook(() =>
        useSessionSubscriptions({ sessionId: 'session-001' })
      );

      const handler = mockSubscriptions.get('session.participant.left')!;

      act(() => {
        handler({ participantId: 'p-456', reason: 'user_action', leftAt: new Date().toISOString() });
      });

      expect(useSessionStore.getState().participants.has('p-456')).toBe(false);
      expect(mockToast.info).toHaveBeenCalledWith('Bob left');
    });

    it('should not show toast if participant was not in store', () => {
      renderHook(() =>
        useSessionSubscriptions({ sessionId: 'session-001' })
      );

      const handler = mockSubscriptions.get('session.participant.left')!;

      act(() => {
        handler({ participantId: 'unknown-id', reason: 'timeout', leftAt: new Date().toISOString() });
      });

      expect(mockToast.info).not.toHaveBeenCalled();
    });

    it('should handle multiple participants leaving sequentially', () => {
      const alice = createMockParticipant('p-1', { displayName: 'Alice' });
      const bob = createMockParticipant('p-2', { displayName: 'Bob' });
      act(() => {
        useSessionStore.getState().addParticipant(alice);
        useSessionStore.getState().addParticipant(bob);
      });

      renderHook(() =>
        useSessionSubscriptions({ sessionId: 'session-001' })
      );

      const handler = mockSubscriptions.get('session.participant.left')!;

      act(() => {
        handler({ participantId: 'p-1', reason: 'user_action', leftAt: new Date().toISOString() });
      });

      act(() => {
        handler({ participantId: 'p-2', reason: 'user_action', leftAt: new Date().toISOString() });
      });

      expect(useSessionStore.getState().participants.size).toBe(0);
      expect(mockToast.info).toHaveBeenCalledTimes(2);
      expect(mockToast.info).toHaveBeenCalledWith('Alice left');
      expect(mockToast.info).toHaveBeenCalledWith('Bob left');
    });

    it('should handle duplicate leave events for same participant', () => {
      const alice = createMockParticipant('p-1', { displayName: 'Alice' });
      act(() => {
        useSessionStore.getState().addParticipant(alice);
      });

      renderHook(() =>
        useSessionSubscriptions({ sessionId: 'session-001' })
      );

      const handler = mockSubscriptions.get('session.participant.left')!;

      act(() => {
        handler({ participantId: 'p-1', reason: 'user_action', leftAt: new Date().toISOString() });
      });

      // Second leave event for same participant (idempotency)
      act(() => {
        handler({ participantId: 'p-1', reason: 'user_action', leftAt: new Date().toISOString() });
      });

      expect(mockToast.info).toHaveBeenCalledTimes(1);
      expect(mockToast.info).toHaveBeenCalledWith('Alice left');
    });
  });
});
