/**
 * MediaInitializer Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// Mock useTransition so startTransition calls the callback synchronously
// This is necessary because React 19 async transitions don't fully
// flush in jsdom test environments
vi.mock('react', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useTransition: () => [false, (cb: () => void) => cb()],
  };
});

import { MediaInitializer } from '@/features/sessions/components/room/MediaInitializer';

// Mock hooks
vi.mock('@/features/media', () => ({
  useLocalMedia: vi.fn(),
  useMediaDevices: vi.fn(),
  useWebRTC: vi.fn(),
}));

vi.mock('@/features/realtime', () => ({
  useSend: vi.fn(),
}));

vi.mock('@/shared/stores/session.store', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('@/shared/stores/media.store', () => ({
  useMediaStore: vi.fn(),
}));

vi.mock('@/features/sessions/hooks/useSessionPermissions', () => ({
  useSessionPermissions: vi.fn(),
}));

vi.mock('@/features/sessions/hooks/useSessionConfig', () => ({
  useSessionConfig: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { useLocalMedia, useMediaDevices, useWebRTC } from '@/features/media';
import { useSend } from '@/features/realtime';
import { useSessionStore } from '@/shared/stores/session.store';
import { useMediaStore } from '@/shared/stores/media.store';
import { useSessionPermissions } from '@/features/sessions/hooks/useSessionPermissions';
import { useSessionConfig } from '@/features/sessions/hooks/useSessionConfig';

const mockUseLocalMedia = vi.mocked(useLocalMedia);
const mockUseMediaDevices = vi.mocked(useMediaDevices);
const mockUseWebRTC = vi.mocked(useWebRTC);
const mockUseSend = vi.mocked(useSend);
const mockUseSessionStore = vi.mocked(useSessionStore);
const mockUseMediaStore = vi.mocked(useMediaStore);
const mockUseSessionPermissions = vi.mocked(useSessionPermissions);
const mockUseSessionConfig = vi.mocked(useSessionConfig);

/** Flush all pending microtasks and React updates */
async function flushAsync() {
  await act(async () => {
    // Allow all microtasks (chained awaits in startTransition) to complete
    await vi.waitFor(() => {}, { timeout: 100 });
  });
}

describe('MediaInitializer', () => {
  const mockStartCapture = vi.fn();
  const mockStopCapture = vi.fn();
  const mockRequestPermissions = vi.fn();
  const localParticipant = { id: 'participant-1' };

  beforeEach(() => {
    mockUseSend.mockReturnValue(vi.fn().mockResolvedValue(undefined));

    mockUseLocalMedia.mockReturnValue({
      startCapture: mockStartCapture,
      stopCapture: mockStopCapture,
      error: null,
      localStream: null,
      audioTrack: null,
      videoTrack: null,
      isAudioEnabled: false,
      isVideoEnabled: false,
      isCapturing: false,
      videoInitializationFailed: false,
      videoInitializationError: null,
      audioInitializationFailed: false,
      audioInitializationError: null,
      toggleAudio: vi.fn(),
      toggleVideo: vi.fn(),
      setAudioEnabled: vi.fn(),
      setVideoEnabled: vi.fn(),
      switchAudioDevice: vi.fn(),
      switchVideoDevice: vi.fn(),
    });

    mockUseMediaDevices.mockReturnValue({
      requestPermissions: mockRequestPermissions,
      hasAudioPermission: false,
      hasVideoPermission: false,
      audioInputDevices: [],
      audioOutputDevices: [],
      videoInputDevices: [],
      selectedAudioInput: null,
      selectedAudioOutput: null,
      selectedVideoInput: null,
      selectAudioInput: vi.fn(),
      selectAudioOutput: vi.fn(),
      selectVideoInput: vi.fn(),
      refreshDevices: vi.fn(),
      permissionError: null,
    });

    mockUseWebRTC.mockReturnValue({
      isInitialized: true,
      peers: [],
      overallQuality: 'good',
      initialize: vi.fn(),
      shutdown: vi.fn(),
      restartIce: vi.fn(),
      notifyMediaToggle: vi.fn(),
    });

    mockUseSessionStore.mockImplementation((selector) => {
      const state = {
        localParticipantId: 'participant-1',
        getLocalParticipant: () => localParticipant,
        updateParticipantMedia: vi.fn(),
      };
      return selector(state as never);
    });

    const mediaState = { isAudioEnabled: true, isVideoEnabled: true };
    mockUseMediaStore.mockImplementation((selector) => {
      return selector(mediaState as never);
    });
    (mockUseMediaStore as unknown as { getState: () => unknown }).getState = () => mediaState;

    mockUseSessionPermissions.mockReturnValue({
      canPublishAudio: true,
      canPublishVideo: true,
      canScreenShare: true,
      canEndSession: false,
      canRemoveParticipants: false,
      canModerate: false,
      canControlMedia: true,
      canControlPhases: false,
      canManageOutcome: false,
      isFacilitator: false,
      canChat: false,
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
      hasPermission: vi.fn(),
      role: undefined,
      roleName: undefined,
    });

    mockUseSessionConfig.mockReturnValue({
      canPublishMedia: true,
      isModuleEnabled: vi.fn(
        (module) => module === 'video' || module === 'audio'
      ),
      isRecordingEnabled: false,
      isRecordingAutoStart: false,
      isAIEnabled: false,
      aiProvider: undefined,
      isComplianceEnabled: false,
      isBrowserLockRequired: false,
      isIdentityVerificationRequired: false,
      isScreenShareRequired: false,
      requireEntireScreen: false,
      forceReshareOnStop: false,
      domainType: undefined,
      enabledModules: ['video', 'audio'],
      isObserver: false,
      config: null,
      roleConfig: null,
      flow: undefined,
      stageOrder: [],
      getStage: vi.fn(),
      getFirstStage: vi.fn(),
      capabilities: undefined,
      isCapabilityEnabled: vi.fn(() => false),
      meta: undefined,
      personaName: undefined,
      personaTitle: undefined,
      organizationName: undefined,
      conversationLanguage: undefined,
      isProctoringEnabled: false,
      isAssessmentEnabled: false,
      isCodeExecutionEnabled: false,
      supportedCodeLanguages: [],
      isRoleConfigFormat: false,
    });

    mockRequestPermissions.mockResolvedValue(true);
    mockStartCapture.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <MediaInitializer>
        <div data-testid="child">Child content</div>
      </MediaInitializer>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child content');
  });

  it('should request permissions when participant joins', async () => {
    render(
      <MediaInitializer>
        <div>Child</div>
      </MediaInitializer>
    );

    await flushAsync();

    expect(mockRequestPermissions).toHaveBeenCalledWith(true, true);
  });

  it('should start capture after permissions granted', async () => {
    render(
      <MediaInitializer>
        <div>Child</div>
      </MediaInitializer>
    );

    await flushAsync();

    expect(mockStartCapture).toHaveBeenCalledWith({
      audio: true,
      video: true,
    });
  });

  it('should call onReady when media is ready', async () => {
    const onReady = vi.fn();

    render(
      <MediaInitializer onReady={onReady}>
        <div>Child</div>
      </MediaInitializer>
    );

    await flushAsync();

    expect(onReady).toHaveBeenCalled();
  });

  it('should call onError when permissions denied', async () => {
    mockRequestPermissions.mockResolvedValue(false);
    const onError = vi.fn();

    render(
      <MediaInitializer onError={onError}>
        <div>Child</div>
      </MediaInitializer>
    );

    await flushAsync();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Media permissions denied',
      })
    );
  });

  it('should call onError when capture fails', async () => {
    mockStartCapture.mockRejectedValue(new Error('Capture failed'));
    const onError = vi.fn();

    render(
      <MediaInitializer onError={onError}>
        <div>Child</div>
      </MediaInitializer>
    );

    await flushAsync();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Capture failed',
      })
    );
  });

  it('should not initialize when no participant', () => {
    mockUseSessionStore.mockImplementation((selector) => {
      const state = {
        localParticipantId: null,
        getLocalParticipant: () => undefined,
      };
      return selector(state as never);
    });

    render(
      <MediaInitializer>
        <div>Child</div>
      </MediaInitializer>
    );

    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('should wait for local participant before initializing', async () => {
    let participant: { id: string } | undefined = undefined;

    mockUseSessionStore.mockImplementation((selector) => {
      const state = {
        localParticipantId: 'participant-1',
        getLocalParticipant: () => participant,
      };
      return selector(state as never);
    });

    const { rerender } = render(
      <MediaInitializer>
        <div>Child</div>
      </MediaInitializer>
    );

    expect(mockRequestPermissions).not.toHaveBeenCalled();

    participant = { id: 'participant-1' };
    rerender(
      <MediaInitializer>
        <div>Child</div>
      </MediaInitializer>
    );

    await flushAsync();

    expect(mockRequestPermissions).toHaveBeenCalledWith(true, true);
  });

  it('should not initialize when canPublishMedia is false', () => {
    mockUseSessionConfig.mockReturnValue({
      canPublishMedia: false,
      isModuleEnabled: vi.fn(),
      isRecordingEnabled: false,
      isRecordingAutoStart: false,
      isAIEnabled: false,
      aiProvider: undefined,
      isComplianceEnabled: false,
      isBrowserLockRequired: false,
      isIdentityVerificationRequired: false,
      isScreenShareRequired: false,
      requireEntireScreen: false,
      forceReshareOnStop: false,
      domainType: undefined,
      enabledModules: [],
      isObserver: false,
      config: null,
      roleConfig: null,
      flow: undefined,
      stageOrder: [],
      getStage: vi.fn(),
      getFirstStage: vi.fn(),
      capabilities: undefined,
      isCapabilityEnabled: vi.fn(() => false),
      meta: undefined,
      personaName: undefined,
      personaTitle: undefined,
      organizationName: undefined,
      conversationLanguage: undefined,
      isProctoringEnabled: false,
      isAssessmentEnabled: false,
      isCodeExecutionEnabled: false,
      supportedCodeLanguages: [],
      isRoleConfigFormat: false,
    });

    render(
      <MediaInitializer>
        <div>Child</div>
      </MediaInitializer>
    );

    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('should only init audio when video module disabled', async () => {
    mockUseSessionConfig.mockReturnValue({
      canPublishMedia: true,
      isModuleEnabled: vi.fn((module) => module === 'audio'),
      isRecordingEnabled: false,
      isRecordingAutoStart: false,
      isAIEnabled: false,
      aiProvider: undefined,
      isComplianceEnabled: false,
      isBrowserLockRequired: false,
      isIdentityVerificationRequired: false,
      isScreenShareRequired: false,
      requireEntireScreen: false,
      forceReshareOnStop: false,
      domainType: undefined,
      enabledModules: ['audio'],
      isObserver: false,
      config: null,
      roleConfig: null,
      flow: undefined,
      stageOrder: [],
      getStage: vi.fn(),
      getFirstStage: vi.fn(),
      capabilities: undefined,
      isCapabilityEnabled: vi.fn(() => false),
      meta: undefined,
      personaName: undefined,
      personaTitle: undefined,
      organizationName: undefined,
      conversationLanguage: undefined,
      isProctoringEnabled: false,
      isAssessmentEnabled: false,
      isCodeExecutionEnabled: false,
      supportedCodeLanguages: [],
      isRoleConfigFormat: false,
    });

    render(
      <MediaInitializer>
        <div>Child</div>
      </MediaInitializer>
    );

    await flushAsync();

    expect(mockStartCapture).toHaveBeenCalledWith({
      audio: true,
      video: false,
    });
  });

  it('should not stop capture on unmount (stream persists for session lifetime)', () => {
    const { unmount } = render(
      <MediaInitializer>
        <div>Child</div>
      </MediaInitializer>
    );

    unmount();

    // Component deliberately does NOT call stopCapture on unmount.
    // Stream cleanup only happens when explicitly leaving the session.
    expect(mockStopCapture).not.toHaveBeenCalled();
  });
});
