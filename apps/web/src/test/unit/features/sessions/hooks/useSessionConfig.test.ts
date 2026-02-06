/**
 * useSessionConfig Hook Tests
 *
 * Tests for configuration-driven UI pattern.
 * This is a MANDATORY architecture pattern per CLAUDE.md.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { useSessionConfig } from '@/features/sessions/hooks/useSessionConfig';
import { useSessionStore } from '@/shared/stores/session.store';

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
    roleConfig: null,
    realtimeToken: null,
    wsEndpoint: null,
  });
}

function setConfig(config: ReturnType<typeof useSessionStore.getState>['config']) {
  useSessionStore.setState({ config });
}

function setLocalParticipant(participant: {
  id: string;
  role?: {
    permissions?: {
      canPublishAudio?: boolean;
      canPublishVideo?: boolean;
    };
  };
}) {
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

describe('useSessionConfig', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===========================================================================
  // Default/Empty State
  // ===========================================================================

  describe('with no config', () => {
    it('should return safe defaults when config is null', () => {
      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isRecordingEnabled).toBe(false);
      expect(result.current.isAIEnabled).toBe(false);
      expect(result.current.isComplianceEnabled).toBe(false);
      expect(result.current.isScreenShareRequired).toBe(false);
      expect(result.current.domainType).toBeUndefined();
      // When not using roleConfig, media modules are enabled by default for backward compatibility
      expect(result.current.enabledModules).toEqual(['audio', 'video', 'screenShare']);
    });

    it('should have media modules enabled by default for backward compatibility', () => {
      const { result } = renderHook(() => useSessionConfig());

      // When not using roleConfig, media modules are enabled by default
      expect(result.current.enabledModules).toContain('audio');
      expect(result.current.enabledModules).toContain('video');
      expect(result.current.enabledModules).toContain('screenShare');
    });
  });

  // ===========================================================================
  // isModuleEnabled
  // ===========================================================================

  describe('isModuleEnabled', () => {
    it('should return true for enabled modules', () => {
      act(() => {
        setConfig({
          enabledModules: ['ai', 'recording', 'chat'],
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isModuleEnabled('ai')).toBe(true);
      expect(result.current.isModuleEnabled('recording')).toBe(true);
      expect(result.current.isModuleEnabled('chat')).toBe(true);
    });

    it('should return false for disabled modules', () => {
      act(() => {
        setConfig({
          enabledModules: ['ai'],
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isModuleEnabled('recording')).toBe(false);
      expect(result.current.isModuleEnabled('chat')).toBe(false);
    });

    it('should return false when no modules enabled', () => {
      act(() => {
        setConfig({
          enabledModules: [],
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isModuleEnabled('ai')).toBe(false);
    });
  });

  // ===========================================================================
  // Recording Config
  // ===========================================================================

  describe('recording config', () => {
    it('should detect enabled recording', () => {
      act(() => {
        setConfig({
          recording: { enabled: true, autoStart: true },
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isRecordingEnabled).toBe(true);
      expect(result.current.isRecordingAutoStart).toBe(true);
    });

    it('should detect disabled recording', () => {
      act(() => {
        setConfig({
          recording: { enabled: false, autoStart: false },
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isRecordingEnabled).toBe(false);
      expect(result.current.isRecordingAutoStart).toBe(false);
    });
  });

  // ===========================================================================
  // AI Config
  // ===========================================================================

  describe('AI config', () => {
    it('should detect enabled AI', () => {
      act(() => {
        setConfig({
          ai: { enabled: true, provider: 'openai' },
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isAIEnabled).toBe(true);
      expect(result.current.aiProvider).toBe('openai');
    });

    it('should detect disabled AI', () => {
      act(() => {
        setConfig({
          ai: { enabled: false },
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isAIEnabled).toBe(false);
    });
  });

  // ===========================================================================
  // Compliance Config
  // ===========================================================================

  describe('compliance config', () => {
    it('should detect enabled compliance', () => {
      act(() => {
        setConfig({
          compliance: {
            enabled: true,
            browserLock: true,
            identityVerification: true,
          },
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isComplianceEnabled).toBe(true);
      expect(result.current.isBrowserLockRequired).toBe(true);
      expect(result.current.isIdentityVerificationRequired).toBe(true);
    });

    it('should detect disabled compliance features', () => {
      act(() => {
        setConfig({
          compliance: {
            enabled: false,
            browserLock: false,
            identityVerification: false,
          },
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isComplianceEnabled).toBe(false);
      expect(result.current.isBrowserLockRequired).toBe(false);
      expect(result.current.isIdentityVerificationRequired).toBe(false);
    });
  });

  // ===========================================================================
  // Screen Share Config
  // ===========================================================================

  describe('screen share config', () => {
    it('should detect required screen share', () => {
      act(() => {
        setConfig({
          compliance: {
            screenShare: {
              required: true,
              requireEntireScreen: true,
              forceReshareOnStop: true,
            },
          },
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isScreenShareRequired).toBe(true);
      expect(result.current.requireEntireScreen).toBe(true);
      expect(result.current.forceReshareOnStop).toBe(true);
    });

    it('should detect optional screen share', () => {
      act(() => {
        setConfig({
          compliance: {
            screenShare: {
              required: false,
              requireEntireScreen: false,
              forceReshareOnStop: false,
            },
          },
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isScreenShareRequired).toBe(false);
      expect(result.current.requireEntireScreen).toBe(false);
      expect(result.current.forceReshareOnStop).toBe(false);
    });
  });

  // ===========================================================================
  // Domain Type
  // ===========================================================================

  describe('domain type', () => {
    it('should return domain type', () => {
      act(() => {
        setConfig({
          domainType: 'interview',
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.domainType).toBe('interview');
    });
  });

  // ===========================================================================
  // Observer Detection
  // ===========================================================================

  describe('observer detection', () => {
    it('should detect observer (no media permissions)', () => {
      act(() => {
        setConfig({} as unknown as Parameters<typeof setConfig>[0]);
        setLocalParticipant({
          id: 'observer-1',
          role: {
            permissions: {
              canPublishAudio: false,
              canPublishVideo: false,
            },
          },
        });
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isObserver).toBe(true);
      expect(result.current.canPublishMedia).toBe(false);
    });

    it('should detect non-observer with audio permission', () => {
      act(() => {
        setConfig({} as unknown as Parameters<typeof setConfig>[0]);
        setLocalParticipant({
          id: 'participant-1',
          role: {
            permissions: {
              canPublishAudio: true,
              canPublishVideo: false,
            },
          },
        });
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isObserver).toBe(false);
      expect(result.current.canPublishMedia).toBe(true);
    });

    it('should detect non-observer with video permission', () => {
      act(() => {
        setConfig({} as unknown as Parameters<typeof setConfig>[0]);
        setLocalParticipant({
          id: 'participant-1',
          role: {
            permissions: {
              canPublishAudio: false,
              canPublishVideo: true,
            },
          },
        });
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isObserver).toBe(false);
      expect(result.current.canPublishMedia).toBe(true);
    });

    it('should treat missing permissions as observer', () => {
      act(() => {
        setConfig({} as unknown as Parameters<typeof setConfig>[0]);
        setLocalParticipant({
          id: 'participant-1',
          // No role or permissions
        });
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isObserver).toBe(true);
      expect(result.current.canPublishMedia).toBe(false);
    });
  });

  // ===========================================================================
  // Raw Config Access
  // ===========================================================================

  describe('raw config', () => {
    it('should expose raw config object', () => {
      const testConfig = {
        domainType: 'interview',
        enabledModules: ['ai'],
      };

      act(() => {
        setConfig(testConfig as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.config).toBeDefined();
      expect(result.current.config?.domainType).toBe('interview');
    });
  });

  // ===========================================================================
  // Memoization
  // ===========================================================================

  describe('memoization', () => {
    it('should return stable references when config unchanged', () => {
      act(() => {
        setConfig({
          enabledModules: ['ai'],
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result, rerender } = renderHook(() => useSessionConfig());
      const firstIsModuleEnabled = result.current.isModuleEnabled;

      rerender();

      expect(result.current.isModuleEnabled).toBe(firstIsModuleEnabled);
    });
  });

  // ===========================================================================
  // Extended Features (roleConfig)
  // ===========================================================================

  describe('extended features (roleConfig)', () => {
    it('should return isRoleConfigFormat false when using bundle config', () => {
      act(() => {
        setConfig({
          enabledModules: ['ai'],
        } as unknown as Parameters<typeof setConfig>[0]);
      });

      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.isRoleConfigFormat).toBe(false);
      expect(result.current.roleConfig).toBeNull();
    });

    it('should return extended defaults when no config', () => {
      const { result } = renderHook(() => useSessionConfig());

      expect(result.current.flow).toBeUndefined();
      expect(result.current.stageOrder).toEqual([]);
      expect(result.current.capabilities).toBeUndefined();
      expect(result.current.meta).toBeUndefined();
      expect(result.current.personaName).toBeUndefined();
      expect(result.current.isProctoringEnabled).toBe(false);
      expect(result.current.isAssessmentEnabled).toBe(false);
      expect(result.current.isCodeExecutionEnabled).toBe(false);
      expect(result.current.supportedCodeLanguages).toEqual([]);
    });

    it('should expose getStage and getFirstStage functions', () => {
      const { result } = renderHook(() => useSessionConfig());

      expect(typeof result.current.getStage).toBe('function');
      expect(typeof result.current.getFirstStage).toBe('function');
      expect(result.current.getStage('nonexistent')).toBeUndefined();
      expect(result.current.getFirstStage()).toBeUndefined();
    });

    it('should expose isCapabilityEnabled function', () => {
      const { result } = renderHook(() => useSessionConfig());

      expect(typeof result.current.isCapabilityEnabled).toBe('function');
      expect(result.current.isCapabilityEnabled('security')).toBe(false);
      expect(result.current.isCapabilityEnabled('assessment')).toBe(false);
    });
  });
});
