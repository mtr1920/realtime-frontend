/**
 * useSessionPermissions Hook Tests
 *
 * Tests for role-based permission pattern.
 * This is a MANDATORY architecture pattern per CLAUDE.md.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { useSessionPermissions, SessionPermissionGate } from '@/features/sessions/hooks/useSessionPermissions';
import { useSessionStore } from '@/shared/stores/session.store';
import { render, screen } from '@testing-library/react';

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

interface TestPermissions {
  canPublishAudio?: boolean;
  canPublishVideo?: boolean;
  canScreenShare?: boolean;
  canChat?: boolean;
  canEndSession?: boolean;
  canRemoveParticipants?: boolean;
  canStartRecording?: boolean;
  canViewTranscript?: boolean;
  canInteractWithAI?: boolean;
  canViewComplianceData?: boolean;
  canSendPrivateMessages?: boolean;
  canViewOutcome?: boolean;
  canEditOutcome?: boolean;
  canApproveOutcome?: boolean;
  canAdvancePhase?: boolean;
  canRevertPhase?: boolean;
}

function setLocalParticipantWithRole(
  roleName: string,
  permissions: TestPermissions
) {
  const participant = {
    id: 'local-participant',
    role: {
      name: roleName,
      permissions: permissions,
    },
  };

  const participantMap = new Map();
  participantMap.set(participant.id, participant);

  useSessionStore.setState({
    participants: participantMap,
    localParticipantId: participant.id,
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('useSessionPermissions', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===========================================================================
  // Default/Empty State
  // ===========================================================================

  describe('with no participant', () => {
    it('should return false for all permissions', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canPublishAudio).toBe(false);
      expect(result.current.canPublishVideo).toBe(false);
      expect(result.current.canScreenShare).toBe(false);
      expect(result.current.canChat).toBe(false);
      expect(result.current.canEndSession).toBe(false);
      expect(result.current.canRemoveParticipants).toBe(false);
      expect(result.current.canStartRecording).toBe(false);
      expect(result.current.canViewTranscript).toBe(false);
      expect(result.current.canInteractWithAI).toBe(false);
      expect(result.current.canViewComplianceData).toBe(false);
      // New permissions
      expect(result.current.canSendPrivateMessages).toBe(false);
      expect(result.current.canViewOutcome).toBe(false);
      expect(result.current.canEditOutcome).toBe(false);
      expect(result.current.canApproveOutcome).toBe(false);
      expect(result.current.canAdvancePhase).toBe(false);
      expect(result.current.canRevertPhase).toBe(false);
    });

    it('should return false for isFacilitator', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.isFacilitator).toBe(false);
    });

    it('should return undefined for role', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.role).toBeUndefined();
      expect(result.current.roleName).toBeUndefined();
    });
  });

  // ===========================================================================
  // hasPermission
  // ===========================================================================

  describe('hasPermission', () => {
    it('should return true for granted permissions', () => {
      act(() => {
        setLocalParticipantWithRole('candidate', {
          canPublishAudio: true,
          canPublishVideo: true,
          canChat: true,
        });
      });

      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.hasPermission('canPublishAudio')).toBe(true);
      expect(result.current.hasPermission('canPublishVideo')).toBe(true);
      expect(result.current.hasPermission('canChat')).toBe(true);
    });

    it('should return false for denied permissions', () => {
      act(() => {
        setLocalParticipantWithRole('candidate', {
          canPublishAudio: true,
          canEndSession: false,
        });
      });

      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.hasPermission('canEndSession')).toBe(false);
      expect(result.current.hasPermission('canRemoveParticipants')).toBe(false);
    });

    it('should return false when permissions object is missing', () => {
      const participant = {
        id: 'local-participant',
        role: { name: 'test' },
      };

      const participantMap = new Map();
      participantMap.set(participant.id, participant);

      act(() => {
        useSessionStore.setState({
          participants: participantMap,
          localParticipantId: participant.id,
        });
      });

      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.hasPermission('canPublishAudio')).toBe(false);
    });
  });

  // ===========================================================================
  // Candidate Role
  // ===========================================================================

  describe('candidate role', () => {
    beforeEach(() => {
      act(() => {
        setLocalParticipantWithRole('candidate', {
          canPublishAudio: true,
          canPublishVideo: true,
          canScreenShare: true,
          canChat: false,
          canEndSession: false,
          canRemoveParticipants: false,
          canStartRecording: false,
          canViewTranscript: false,
          canInteractWithAI: true,
        });
      });
    });

    it('should have media permissions', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canPublishAudio).toBe(true);
      expect(result.current.canPublishVideo).toBe(true);
      expect(result.current.canScreenShare).toBe(true);
    });

    it('should not have facilitator permissions', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canEndSession).toBe(false);
      expect(result.current.canRemoveParticipants).toBe(false);
      expect(result.current.canStartRecording).toBe(false);
    });

    it('should not be facilitator', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.isFacilitator).toBe(false);
    });

    it('should be able to control media', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canControlMedia).toBe(true);
    });
  });

  // ===========================================================================
  // Facilitator Role
  // ===========================================================================

  describe('facilitator role', () => {
    beforeEach(() => {
      act(() => {
        setLocalParticipantWithRole('facilitator', {
          canPublishAudio: true,
          canPublishVideo: true,
          canScreenShare: true,
          canChat: true,
          canEndSession: true,
          canRemoveParticipants: true,
          canStartRecording: true,
          canViewTranscript: true,
          canInteractWithAI: true,
        });
      });
    });

    it('should have all media permissions', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canPublishAudio).toBe(true);
      expect(result.current.canPublishVideo).toBe(true);
      expect(result.current.canScreenShare).toBe(true);
    });

    it('should have facilitator permissions', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canEndSession).toBe(true);
      expect(result.current.canRemoveParticipants).toBe(true);
      expect(result.current.canStartRecording).toBe(true);
    });

    it('should be facilitator', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.isFacilitator).toBe(true);
    });

    it('should be able to moderate', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canModerate).toBe(true);
    });
  });

  // ===========================================================================
  // Observer Role
  // ===========================================================================

  describe('observer role', () => {
    beforeEach(() => {
      act(() => {
        setLocalParticipantWithRole('observer', {
          canPublishAudio: false,
          canPublishVideo: false,
          canScreenShare: false,
          canChat: false,
          canEndSession: false,
          canRemoveParticipants: false,
          canStartRecording: false,
          canViewTranscript: true,
          canInteractWithAI: false,
        });
      });
    });

    it('should not have media permissions', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canPublishAudio).toBe(false);
      expect(result.current.canPublishVideo).toBe(false);
      expect(result.current.canScreenShare).toBe(false);
    });

    it('should be able to view transcript', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canViewTranscript).toBe(true);
    });

    it('should not be facilitator', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.isFacilitator).toBe(false);
    });

    it('should not be able to control media', () => {
      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.canControlMedia).toBe(false);
    });
  });

  // ===========================================================================
  // Role Name
  // ===========================================================================

  describe('role name', () => {
    it('should return role name', () => {
      act(() => {
        setLocalParticipantWithRole('interviewer', {
          canPublishAudio: true,
        });
      });

      const { result } = renderHook(() => useSessionPermissions());

      expect(result.current.roleName).toBe('interviewer');
    });
  });

  // ===========================================================================
  // Computed Properties
  // ===========================================================================

  describe('computed properties', () => {
    describe('isFacilitator', () => {
      it('should be true with canEndSession', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canEndSession: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.isFacilitator).toBe(true);
      });

      it('should be true with canRemoveParticipants', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canRemoveParticipants: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.isFacilitator).toBe(true);
      });

      it('should be true with canStartRecording', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canStartRecording: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.isFacilitator).toBe(true);
      });
    });

    describe('canModerate', () => {
      it('should be true with canEndSession', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canEndSession: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canModerate).toBe(true);
      });

      it('should be true with canRemoveParticipants', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canRemoveParticipants: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canModerate).toBe(true);
      });

      it('should be false without moderation permissions', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canPublishAudio: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canModerate).toBe(false);
      });
    });

    describe('canControlMedia', () => {
      it('should be true with audio permission', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canPublishAudio: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canControlMedia).toBe(true);
      });

      it('should be true with video permission', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canPublishVideo: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canControlMedia).toBe(true);
      });

      it('should be true with screen share permission', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canScreenShare: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canControlMedia).toBe(true);
      });

      it('should be false without any media permission', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canChat: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canControlMedia).toBe(false);
      });
    });

    describe('canControlPhases', () => {
      it('should be true with canAdvancePhase', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canAdvancePhase: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canControlPhases).toBe(true);
      });

      it('should be true with canRevertPhase', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canRevertPhase: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canControlPhases).toBe(true);
      });

      it('should be false without any phase control permission', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canPublishAudio: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canControlPhases).toBe(false);
      });
    });

    describe('canManageOutcome', () => {
      it('should be true with canViewOutcome', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canViewOutcome: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canManageOutcome).toBe(true);
      });

      it('should be true with canEditOutcome', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canEditOutcome: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canManageOutcome).toBe(true);
      });

      it('should be true with canApproveOutcome', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canApproveOutcome: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canManageOutcome).toBe(true);
      });

      it('should be false without any outcome permission', () => {
        act(() => {
          setLocalParticipantWithRole('test', {
            canPublishAudio: true,
          });
        });

        const { result } = renderHook(() => useSessionPermissions());
        expect(result.current.canManageOutcome).toBe(false);
      });
    });
  });
});

// =============================================================================
// SessionPermissionGate Component Tests
// =============================================================================

describe('SessionPermissionGate', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should render children when permission is granted', () => {
    act(() => {
      setLocalParticipantWithRole('facilitator', {
        canEndSession: true,
      });
    });

    render(
      <SessionPermissionGate permission="canEndSession">
        <button>End Session</button>
      </SessionPermissionGate>
    );

    expect(screen.getByRole('button', { name: 'End Session' })).toBeInTheDocument();
  });

  it('should not render children when permission is denied', () => {
    act(() => {
      setLocalParticipantWithRole('candidate', {
        canEndSession: false,
      });
    });

    render(
      <SessionPermissionGate permission="canEndSession">
        <button>End Session</button>
      </SessionPermissionGate>
    );

    expect(screen.queryByRole('button', { name: 'End Session' })).not.toBeInTheDocument();
  });

  it('should render fallback when permission is denied', () => {
    act(() => {
      setLocalParticipantWithRole('candidate', {
        canEndSession: false,
      });
    });

    render(
      <SessionPermissionGate
        permission="canEndSession"
        fallback={<span>No access</span>}
      >
        <button>End Session</button>
      </SessionPermissionGate>
    );

    expect(screen.queryByRole('button', { name: 'End Session' })).not.toBeInTheDocument();
    expect(screen.getByText('No access')).toBeInTheDocument();
  });

  it('should not render fallback when permission is granted', () => {
    act(() => {
      setLocalParticipantWithRole('facilitator', {
        canEndSession: true,
      });
    });

    render(
      <SessionPermissionGate
        permission="canEndSession"
        fallback={<span>No access</span>}
      >
        <button>End Session</button>
      </SessionPermissionGate>
    );

    expect(screen.getByRole('button', { name: 'End Session' })).toBeInTheDocument();
    expect(screen.queryByText('No access')).not.toBeInTheDocument();
  });
});
