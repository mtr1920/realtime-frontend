/**
 * useRoleConfig Hook Tests
 *
 * Tests for config-driven role display (color, icon, label).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRoleConfig } from '@/features/sessions/hooks/useRoleConfig';
import { useSessionStore } from '@/shared/stores/session.store';
import type { PublicRoleConfig } from '@protocol/index';

function resetStore() {
  useSessionStore.setState({
    sessionId: null,
    session: null,
    participants: new Map(),
    localParticipantId: null,
    status: null,
    config: null,
    roleConfig: null,
    realtimeToken: null,
    wsEndpoint: null,
  });
}

/**
 * Build a minimal PublicRoleConfig with required fields.
 * Only overrides the fields relevant to the test.
 */
function buildRoleConfig(overrides: {
  roleId: string;
  roleName: string;
  meta?: { color?: string; icon?: string };
}): PublicRoleConfig {
  return {
    version: 1,
    roleId: overrides.roleId,
    roleName: overrides.roleName,
    configHash: 'test-hash',
    classification: {
      isPrimary: false,
      isFacilitator: false,
      isSpectator: false,
      isAiAgent: false,
    },
    permissions: {
      canPublishAudio: true,
      canPublishVideo: true,
      canShareScreen: false,
      canViewOthersVideo: true,
      canViewOthersScreen: true,
      canStartSession: false,
      canEndSession: false,
      canPauseSession: false,
      canRemoveParticipants: false,
      canMuteOthers: false,
      canSendMessages: true,
      canSendPrivateMessages: false,
      canViewTranscripts: false,
      canViewRecordings: false,
      canDownloadRecordings: false,
      canExportData: false,
      canInteractWithAI: false,
      canConfigureAI: false,
      canViewAIAnalytics: false,
      canViewComplianceData: false,
      canTriggerComplianceActions: false,
      canViewOutcome: false,
      canEditOutcome: false,
      canApproveOutcome: false,
      canAdvancePhase: false,
      canRevertPhase: false,
    },
    constraints: {
      maxPerSession: 10,
      requiresAuth: false,
      allowedDevices: ['desktop', 'mobile', 'tablet'],
      enforceSingleSession: false,
      requiresInvitation: false,
    },
    aiProfile: null,
    modules: {
      audio: { enabled: true },
      video: { enabled: true },
      compliance: null,
      recording: null,
      transcription: null,
      screenShare: null,
    },
    sessionDefaults: {
      maxDurationMinutes: 60,
      idleTimeoutMinutes: 15,
      maxParticipants: 10,
      autoStart: false,
      autoEnd: false,
    },
    meta: overrides.meta,
  } as PublicRoleConfig;
}

describe('useRoleConfig', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('getRoleColor', () => {
    it('should use config meta.color when available', () => {
      useSessionStore.setState({
        roleConfig: buildRoleConfig({
          roleId: 'custom_role',
          roleName: 'Custom Role',
          meta: { color: 'text-red-500' },
        }),
      });

      const { result } = renderHook(() => useRoleConfig());
      expect(result.current.getRoleColor('custom_role')).toBe('text-red-500');
    });

    it('should fall back to pattern when config has no color', () => {
      useSessionStore.setState({
        roleConfig: buildRoleConfig({
          roleId: 'observer',
          roleName: 'Observer',
        }),
      });

      const { result } = renderHook(() => useRoleConfig());
      expect(result.current.getRoleColor('observer')).toContain('text-gray');
    });
  });

  describe('getRoleIcon', () => {
    it('should use config meta.icon when it matches a known icon name', () => {
      useSessionStore.setState({
        roleConfig: buildRoleConfig({
          roleId: 'custom_role',
          roleName: 'Custom Role',
          meta: { icon: 'bot' },
        }),
      });

      const { result } = renderHook(() => useRoleConfig());
      const icon = result.current.getRoleIcon('custom_role');
      // 'bot' maps to the Bot lucide icon
      expect(icon).not.toBeNull();
    });

    it('should fall back to pattern when config icon is not a known icon name', () => {
      useSessionStore.setState({
        roleConfig: buildRoleConfig({
          roleId: 'candidate',
          roleName: 'Candidate',
          meta: { icon: 'some-unknown-icon' },
        }),
      });

      const { result } = renderHook(() => useRoleConfig());
      const icon = result.current.getRoleIcon('candidate');
      expect(icon).not.toBeNull();
    });

    it('should fall back to pattern when no config icon is set', () => {
      useSessionStore.setState({
        roleConfig: buildRoleConfig({
          roleId: 'interviewer',
          roleName: 'Interviewer',
        }),
      });

      const { result } = renderHook(() => useRoleConfig());
      const icon = result.current.getRoleIcon('interviewer');
      expect(icon).not.toBeNull();
    });

    it('should return null for unrecognized role without config', () => {
      const { result } = renderHook(() => useRoleConfig());
      const icon = result.current.getRoleIcon('xyz_unknown_role');
      expect(icon).toBeNull();
    });
  });

  describe('getRoleLabel', () => {
    it('should use config role name when available', () => {
      useSessionStore.setState({
        roleConfig: buildRoleConfig({
          roleId: 'tech_lead',
          roleName: 'Technical Lead',
        }),
      });

      const { result } = renderHook(() => useRoleConfig());
      expect(result.current.getRoleLabel('tech_lead')).toBe('Technical Lead');
    });

    it('should format role ID as fallback', () => {
      const { result } = renderHook(() => useRoleConfig());
      expect(result.current.getRoleLabel('technical_lead')).toBe('Technical Lead');
    });
  });
});
