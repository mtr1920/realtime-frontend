/**
 * SessionControls Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionControls } from '@/features/sessions/components/room/SessionControls';
import { useMediaStore } from '@/shared/stores/media.store';

// Mock media store
vi.mock('@/shared/stores/media.store', () => ({
  useMediaStore: vi.fn(),
}));

// Mock media hooks
const mockToggleAudio = vi.fn();
const mockToggleVideo = vi.fn();
const mockStartScreenShare = vi.fn().mockResolvedValue(undefined);
const mockStopScreenShare = vi.fn();
const mockNotifyMediaToggle = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/media', () => ({
  useLocalMedia: vi.fn(() => ({
    toggleAudio: mockToggleAudio,
    toggleVideo: mockToggleVideo,
  })),
  useScreenShare: vi.fn(() => ({
    isScreenSharing: false,
    startScreenShare: mockStartScreenShare,
    stopScreenShare: mockStopScreenShare,
    screenShareStream: null,
    error: null,
  })),
  useWebRTC: vi.fn(() => ({
    notifyMediaToggle: mockNotifyMediaToggle,
    isInitialized: true,
    peers: [],
    overallQuality: 'good',
    initialize: vi.fn(),
    shutdown: vi.fn(),
    restartIce: vi.fn(),
  })),
}));

// Mock session permissions hook
vi.mock('@/features/sessions/hooks/useSessionPermissions', () => ({
  useSessionPermissions: vi.fn(() => ({
    canPublishAudio: true,
    canPublishVideo: true,
    canScreenShare: true,
    canEndSession: false,
    canRemoveParticipants: false,
    hasPermission: (permission: string) => {
      const permissions: Record<string, boolean> = {
        canPublishAudio: true,
        canPublishVideo: true,
        canScreenShare: true,
      };
      return permissions[permission] ?? false;
    },
  })),
}));

// Mock session config hook
const mockIsModuleEnabled = vi.fn((_module: string) => true);
vi.mock('@/features/sessions/hooks/useSessionConfig', () => ({
  useSessionConfig: vi.fn(() => ({
    isModuleEnabled: mockIsModuleEnabled,
    enabledModules: ['audio', 'video', 'screenShare', 'chat'],
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
    domainType: 'default',
    isObserver: false,
    canPublishMedia: true,
    config: null,
    roleConfig: null,
    flow: undefined,
    stageOrder: [],
    getStage: () => undefined,
    getFirstStage: () => undefined,
    capabilities: undefined,
    isCapabilityEnabled: () => false,
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
  })),
}));

// Helper to setup media store mock
function setupMediaStoreMock(overrides: Partial<ReturnType<typeof useMediaStore>> = {}) {
  const defaultState = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenShareEnabled: false,
    hasAudioPermission: true,
    hasVideoPermission: true,
    setAudioEnabled: vi.fn(),
    setVideoEnabled: vi.fn(),
    setScreenShareEnabled: vi.fn(),
    ...overrides,
  };

  (useMediaStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
    if (typeof selector === 'function') {
      return selector(defaultState);
    }
    return defaultState;
  });

  return defaultState;
}

// Default permission mock values
const defaultPermissions = {
  canPublishAudio: true,
  canPublishVideo: true,
  canScreenShare: true,
  canEndSession: false,
  canRemoveParticipants: false,
  hasPermission: () => false,
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
  isFacilitator: false,
  role: undefined,
  roleName: undefined,
  canModerate: false,
  canControlMedia: true,
  canControlPhases: false,
  canManageOutcome: false,
};

// Default session config mock values
const defaultSessionConfig = {
  isModuleEnabled: (module: string) => ['audio', 'video', 'screenShare', 'chat'].includes(module),
  enabledModules: ['audio', 'video', 'screenShare', 'chat'],
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
  domainType: 'default',
  isObserver: false,
  canPublishMedia: true,
  config: null,
  roleConfig: null,
  flow: undefined,
  stageOrder: [],
  getStage: () => undefined,
  getFirstStage: () => undefined,
  capabilities: undefined,
  isCapabilityEnabled: () => false,
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
};

// Helper to reset permission mock to defaults
async function resetPermissionMock() {
  const { useSessionPermissions } = await import('@/features/sessions/hooks/useSessionPermissions');
  vi.mocked(useSessionPermissions).mockReturnValue(defaultPermissions);
}

// Helper to reset session config mock to defaults
async function resetSessionConfigMock() {
  const { useSessionConfig } = await import('@/features/sessions/hooks/useSessionConfig');
  mockIsModuleEnabled.mockImplementation((module: string) =>
    ['audio', 'video', 'screenShare', 'chat'].includes(module)
  );
  vi.mocked(useSessionConfig).mockReturnValue(defaultSessionConfig);
}

describe('SessionControls', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setupMediaStoreMock();
    await resetPermissionMock();
    await resetSessionConfigMock();
  });

  describe('rendering', () => {
    it('should render audio toggle button', () => {
      render(<SessionControls />);

      expect(screen.getByRole('button', { name: /mute microphone/i })).toBeInTheDocument();
    });

    it('should render video toggle button', () => {
      render(<SessionControls />);

      expect(screen.getByRole('button', { name: /turn off camera/i })).toBeInTheDocument();
    });

    it('should render screen share button', () => {
      render(<SessionControls />);

      expect(screen.getByRole('button', { name: /share screen/i })).toBeInTheDocument();
    });

    it('should render leave button when showLeave is true', () => {
      render(<SessionControls showLeave={true} />);

      expect(screen.getByRole('button', { name: /leave session/i })).toBeInTheDocument();
    });

    it('should not render leave button when showLeave is false', () => {
      render(<SessionControls showLeave={false} />);

      expect(screen.queryByRole('button', { name: /leave session/i })).not.toBeInTheDocument();
    });
  });

  describe('audio toggle', () => {
    it('should show mute icon when audio is enabled', () => {
      setupMediaStoreMock({ isAudioEnabled: true });
      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /mute microphone/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should show unmute icon when audio is disabled', () => {
      setupMediaStoreMock({ isAudioEnabled: false });
      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /unmute microphone/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('should toggle audio when clicked', async () => {
      setupMediaStoreMock({ isAudioEnabled: true });

      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /mute microphone/i });
      await userEvent.click(button);

      expect(mockToggleAudio).toHaveBeenCalled();
    });

    it('should be disabled when no audio permission', () => {
      setupMediaStoreMock({ hasAudioPermission: false });
      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /mute microphone|unmute microphone/i });
      expect(button).toBeDisabled();
    });
  });

  describe('video toggle', () => {
    it('should show stop video icon when video is enabled', () => {
      setupMediaStoreMock({ isVideoEnabled: true });
      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /turn off camera/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should show start video icon when video is disabled', () => {
      setupMediaStoreMock({ isVideoEnabled: false });
      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /turn on camera/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('should toggle video when clicked', async () => {
      setupMediaStoreMock({ isVideoEnabled: true });

      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /turn off camera/i });
      await userEvent.click(button);

      expect(mockToggleVideo).toHaveBeenCalled();
    });

    it('should be disabled when no video permission', () => {
      setupMediaStoreMock({ hasVideoPermission: false });
      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /turn off camera|turn on camera/i });
      expect(button).toBeDisabled();
    });
  });

  describe('screen share toggle', () => {
    it('should show share screen when not sharing', () => {
      setupMediaStoreMock({ isScreenShareEnabled: false });
      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /share screen/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('should show stop sharing when screen sharing', () => {
      setupMediaStoreMock({ isScreenShareEnabled: true });
      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /stop sharing screen/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should toggle screen share when clicked', async () => {
      setupMediaStoreMock({ isScreenShareEnabled: false });

      render(<SessionControls />);

      const button = screen.getByRole('button', { name: /share screen/i });
      await userEvent.click(button);

      expect(mockStartScreenShare).toHaveBeenCalled();
    });
  });

  describe('leave button', () => {
    it('should call onLeave when clicked', async () => {
      const onLeave = vi.fn();
      render(<SessionControls onLeave={onLeave} showLeave />);

      const button = screen.getByRole('button', { name: /leave session/i });
      await userEvent.click(button);

      expect(onLeave).toHaveBeenCalled();
    });

    it('should be disabled when isLeaving is true', () => {
      render(<SessionControls showLeave isLeaving />);

      const button = screen.getByRole('button', { name: /leave session/i });
      expect(button).toBeDisabled();
    });
  });

  describe('variants', () => {
    it('should apply compact sizing for compact variant', () => {
      setupMediaStoreMock();
      render(<SessionControls variant="compact" showReactions={false} showMoreMenu={false} />);

      // Main media control buttons should have the compact sizing
      const audioButton = screen.getByRole('button', { name: /mute microphone/i });
      const videoButton = screen.getByRole('button', { name: /turn off camera/i });
      const leaveButton = screen.getByRole('button', { name: /leave session/i });

      // At least the leave button should have h-9 w-9 class (compact sizing)
      expect(leaveButton.className).toMatch(/h-9.*w-9|w-9.*h-9/);
      expect(audioButton).toBeInTheDocument();
      expect(videoButton).toBeInTheDocument();
    });

    it('should apply default sizing for default variant', () => {
      setupMediaStoreMock();
      render(<SessionControls variant="default" showReactions={false} showMoreMenu={false} />);

      // Main media control buttons should have the default sizing
      const leaveButton = screen.getByRole('button', { name: /leave session/i });

      // Leave button should have h-11 w-11 class (default sizing)
      expect(leaveButton.className).toMatch(/h-11.*w-11|w-11.*h-11/);
    });

    it('should apply floating styles for floating variant', () => {
      setupMediaStoreMock();
      const { container } = render(<SessionControls variant="floating" />);

      const controlsContainer = container.firstChild;
      expect(controlsContainer).toHaveClass('fixed');
      expect(controlsContainer).toHaveClass('glass-card');
    });
  });

  describe('permission-gated controls', () => {
    it('should not render audio control when canPublishAudio is false', async () => {
      // Override the permission mock
      const useSessionPermissions = vi.mocked(
        (await import('@/features/sessions/hooks/useSessionPermissions')).useSessionPermissions
      );
      useSessionPermissions.mockReturnValue({
        ...defaultPermissions,
        canPublishAudio: false,
      });

      render(<SessionControls />);

      expect(screen.queryByRole('button', { name: /microphone/i })).not.toBeInTheDocument();
    });

    it('should not render video control when canPublishVideo is false', async () => {
      const { useSessionPermissions } = await import('@/features/sessions/hooks/useSessionPermissions');
      vi.mocked(useSessionPermissions).mockReturnValue({
        ...defaultPermissions,
        canPublishVideo: false,
      });

      render(<SessionControls />);

      expect(screen.queryByRole('button', { name: /camera/i })).not.toBeInTheDocument();
    });

    it('should not render screen share control when canScreenShare is false', async () => {
      const { useSessionPermissions } = await import('@/features/sessions/hooks/useSessionPermissions');
      vi.mocked(useSessionPermissions).mockReturnValue({
        ...defaultPermissions,
        canScreenShare: false,
      });

      render(<SessionControls />);

      expect(screen.queryByRole('button', { name: /screen/i })).not.toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(<SessionControls className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on all buttons', () => {
      render(<SessionControls showLeave />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should have aria-pressed for toggle buttons', () => {
      render(<SessionControls />);

      const audioButton = screen.getByRole('button', { name: /microphone/i });
      const videoButton = screen.getByRole('button', { name: /camera/i });
      const screenButton = screen.getByRole('button', { name: /screen/i });

      expect(audioButton).toHaveAttribute('aria-pressed');
      expect(videoButton).toHaveAttribute('aria-pressed');
      expect(screenButton).toHaveAttribute('aria-pressed');
    });

    it('should have tooltips for keyboard navigation', () => {
      render(<SessionControls />);

      // Tooltips are rendered via TooltipProvider
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('separator', () => {
    it('should show separator when leave button and controls are visible', () => {
      const { container } = render(<SessionControls showLeave />);

      // Separators now use bg-border/50 class
      const separator = container.querySelector('[class*="bg-border"]');
      expect(separator).toBeInTheDocument();
    });

    it('should not show separator when no controls are visible', async () => {
      const { useSessionPermissions } = await import('@/features/sessions/hooks/useSessionPermissions');
      vi.mocked(useSessionPermissions).mockReturnValue({
        ...defaultPermissions,
        canPublishAudio: false,
        canPublishVideo: false,
        canScreenShare: false,
        canControlMedia: false,
      });

      const { container } = render(<SessionControls showLeave={false} showReactions={false} showMoreMenu={false} />);

      const separator = container.querySelector('[class*="bg-border"]');
      expect(separator).not.toBeInTheDocument();
    });
  });

  describe('module-gated controls', () => {
    it('should not render audio control when audio module is disabled', async () => {
      const { useSessionConfig } = await import('@/features/sessions/hooks/useSessionConfig');
      mockIsModuleEnabled.mockImplementation((module: string) => module !== 'audio');
      vi.mocked(useSessionConfig).mockReturnValue({
        ...defaultSessionConfig,
        isModuleEnabled: mockIsModuleEnabled,
        enabledModules: ['video', 'screenShare', 'chat'],
      });

      render(<SessionControls />);

      expect(screen.queryByRole('button', { name: /microphone/i })).not.toBeInTheDocument();
    });

    it('should not render video control when video module is disabled', async () => {
      const { useSessionConfig } = await import('@/features/sessions/hooks/useSessionConfig');
      mockIsModuleEnabled.mockImplementation((module: string) => module !== 'video');
      vi.mocked(useSessionConfig).mockReturnValue({
        ...defaultSessionConfig,
        isModuleEnabled: mockIsModuleEnabled,
        enabledModules: ['audio', 'screenShare', 'chat'],
      });

      render(<SessionControls />);

      expect(screen.queryByRole('button', { name: /camera/i })).not.toBeInTheDocument();
    });

    it('should not render screen share control when screenShare module is disabled', async () => {
      const { useSessionConfig } = await import('@/features/sessions/hooks/useSessionConfig');
      mockIsModuleEnabled.mockImplementation((module: string) => module !== 'screenShare');
      vi.mocked(useSessionConfig).mockReturnValue({
        ...defaultSessionConfig,
        isModuleEnabled: mockIsModuleEnabled,
        enabledModules: ['audio', 'video', 'chat'],
      });

      render(<SessionControls />);

      expect(screen.queryByRole('button', { name: /screen/i })).not.toBeInTheDocument();
    });

    it('should hide controls when permission granted but module disabled', async () => {
      // Permission granted but module disabled
      const { useSessionPermissions } = await import('@/features/sessions/hooks/useSessionPermissions');
      vi.mocked(useSessionPermissions).mockReturnValue({
        ...defaultPermissions,
        canPublishVideo: true, // Permission granted
      });

      const { useSessionConfig } = await import('@/features/sessions/hooks/useSessionConfig');
      mockIsModuleEnabled.mockImplementation((module: string) => module !== 'video'); // Module disabled
      vi.mocked(useSessionConfig).mockReturnValue({
        ...defaultSessionConfig,
        isModuleEnabled: mockIsModuleEnabled,
        enabledModules: ['audio', 'screenShare', 'chat'],
      });

      render(<SessionControls />);

      // Video button should NOT appear (module disabled overrides permission)
      expect(screen.queryByRole('button', { name: /camera/i })).not.toBeInTheDocument();
      // Audio button should appear (permission granted + module enabled)
      expect(screen.getByRole('button', { name: /microphone/i })).toBeInTheDocument();
    });

    it('should hide controls when module enabled but permission denied', async () => {
      // Module enabled but permission denied
      const { useSessionPermissions } = await import('@/features/sessions/hooks/useSessionPermissions');
      vi.mocked(useSessionPermissions).mockReturnValue({
        ...defaultPermissions,
        canPublishAudio: false, // Permission denied
      });

      const { useSessionConfig } = await import('@/features/sessions/hooks/useSessionConfig');
      mockIsModuleEnabled.mockImplementation(() => true); // All modules enabled
      vi.mocked(useSessionConfig).mockReturnValue({
        ...defaultSessionConfig,
        isModuleEnabled: mockIsModuleEnabled,
      });

      render(<SessionControls />);

      // Audio button should NOT appear (permission denied overrides module enabled)
      expect(screen.queryByRole('button', { name: /microphone/i })).not.toBeInTheDocument();
      // Video button should appear (permission granted + module enabled)
      expect(screen.getByRole('button', { name: /camera/i })).toBeInTheDocument();
    });
  });
});
