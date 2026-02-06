/**
 * useScreenShareEnforcement Hook Tests
 *
 * Tests for screen share requirement enforcement.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScreenShareEnforcement } from '@/features/media/hooks/useScreenShareEnforcement';
import {
  installMockMediaDevices,
  uninstallMockMediaDevices,
  MockMediaStream,
  MockMediaStreamTrack,
  resetMediaMocks,
} from '@/test/mocks/media-devices.mock';

// Mock useScreenShare
const mockScreenShareState = {
  isScreenSharing: false,
  screenShareStream: null as MediaStream | null,
  error: null as { type: string; message: string } | null,
  startScreenShare: vi.fn(),
  stopScreenShare: vi.fn(),
};

vi.mock('@/features/media/hooks/useScreenShare', () => ({
  useScreenShare: () => mockScreenShareState,
}));

// Mock useSessionConfig
const mockSessionConfig = {
  isScreenShareRequired: false,
  requireEntireScreen: false,
  forceReshareOnStop: false,
  isObserver: false,
  canPublishMedia: true,
  isComplianceEnabled: true,
};

vi.mock('@/features/sessions', () => ({
  useSessionConfig: () => mockSessionConfig,
}));

// Mock useSend
const mockSend = vi.fn();

vi.mock('@/features/realtime', () => ({
  useSend: () => mockSend,
}));

// =============================================================================
// Test Setup
// =============================================================================

describe('useScreenShareEnforcement', () => {
  beforeEach(() => {
    resetMediaMocks();
    installMockMediaDevices();
    vi.clearAllMocks();

    // Reset mock states
    mockScreenShareState.isScreenSharing = false;
    mockScreenShareState.screenShareStream = null;
    mockScreenShareState.error = null;
    mockScreenShareState.startScreenShare.mockReset();
    mockScreenShareState.stopScreenShare.mockReset();

    mockSessionConfig.isScreenShareRequired = false;
    mockSessionConfig.requireEntireScreen = false;
    mockSessionConfig.forceReshareOnStop = false;
    mockSessionConfig.isObserver = false;
    mockSessionConfig.canPublishMedia = true;
    mockSessionConfig.isComplianceEnabled = true;
  });

  afterEach(() => {
    uninstallMockMediaDevices();
    vi.resetAllMocks();
  });

  // Helper to create mock screen share stream
  function createMockScreenShareStream(displaySurface?: string) {
    const videoTrack = new MockMediaStreamTrack({ kind: 'video', label: 'Screen Share' });

    // Mock getSettings to return displaySurface
    vi.spyOn(videoTrack, 'getSettings').mockReturnValue({
      deviceId: 'screen',
      displaySurface,
    } as MediaTrackSettings);

    const stream = new MockMediaStream({
      videoTracks: [{ kind: 'video', label: 'Screen Share' }],
    });

    // Replace the track with our mock
    (stream as unknown as { _tracks: MockMediaStreamTrack[] })._tracks = [videoTrack];

    return stream;
  }

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should return not sharing initially', () => {
      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isSharing).toBe(false);
    });

    it('should return not required when config says so', () => {
      mockSessionConfig.isScreenShareRequired = false;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isRequired).toBe(false);
    });

    it('should return required when config says so', () => {
      mockSessionConfig.isScreenShareRequired = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isRequired).toBe(true);
    });

    it('should return not exempt for regular participants', () => {
      mockSessionConfig.isObserver = false;
      mockSessionConfig.canPublishMedia = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isExempt).toBe(false);
    });

    it('should return exempt for observers', () => {
      mockSessionConfig.isObserver = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isExempt).toBe(true);
    });

    it('should return exempt when cannot publish media', () => {
      mockSessionConfig.canPublishMedia = false;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isExempt).toBe(true);
    });

    it('should not show reshare prompt initially', () => {
      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.showResharePrompt).toBe(false);
    });

    it('should not have permission denied initially', () => {
      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.permissionDenied).toBe(false);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // requestScreenShare
  // ===========================================================================

  describe('requestScreenShare', () => {
    it('should call startScreenShare', async () => {
      mockScreenShareState.startScreenShare.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useScreenShareEnforcement());

      await act(async () => {
        await result.current.requestScreenShare();
      });

      expect(mockScreenShareState.startScreenShare).toHaveBeenCalled();
    });

    it('should clear isLoading after request completes', async () => {
      mockScreenShareState.startScreenShare.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useScreenShareEnforcement());

      await act(async () => {
        await result.current.requestScreenShare();
      });

      // After completion, isLoading should be false
      expect(result.current.isLoading).toBe(false);
    });

    it('should do nothing if exempt', async () => {
      mockSessionConfig.isObserver = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      await act(async () => {
        await result.current.requestScreenShare();
      });

      expect(mockScreenShareState.startScreenShare).not.toHaveBeenCalled();
    });

    it('should build options with displaySurface when requireEntireScreen is true', async () => {
      mockSessionConfig.requireEntireScreen = true;
      mockScreenShareState.startScreenShare.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useScreenShareEnforcement());

      await act(async () => {
        await result.current.requestScreenShare();
      });

      expect(mockScreenShareState.startScreenShare).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            displaySurface: 'monitor',
          }),
        })
      );
    });

    it('should set permissionDenied on permission error', async () => {
      const error = { type: 'permission_denied', message: 'Permission denied' };
      mockScreenShareState.startScreenShare.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useScreenShareEnforcement());

      await act(async () => {
        await result.current.requestScreenShare();
      });

      expect(result.current.permissionDenied).toBe(true);
      expect(result.current.error).toContain('permission');
    });

    it('should report violation when required and permission denied', async () => {
      mockSessionConfig.isScreenShareRequired = true;
      const error = { type: 'permission_denied', message: 'Permission denied' };
      mockScreenShareState.startScreenShare.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useScreenShareEnforcement());

      await act(async () => {
        await result.current.requestScreenShare();
      });

      expect(mockSend).toHaveBeenCalledWith(
        'compliance.violation',
        expect.objectContaining({
          type: 'screen_capture_attempt',
          severity: 'medium',
          timestamp: expect.any(String),
        })
      );
    });
  });

  // ===========================================================================
  // stopScreenShare
  // ===========================================================================

  describe('stopScreenShare', () => {
    it('should call base stopScreenShare', () => {
      const { result } = renderHook(() => useScreenShareEnforcement());

      act(() => {
        result.current.stopScreenShare();
      });

      expect(mockScreenShareState.stopScreenShare).toHaveBeenCalled();
    });

    it('should show reshare prompt when forceReshareOnStop is true', async () => {
      mockSessionConfig.forceReshareOnStop = true;
      mockScreenShareState.startScreenShare.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useScreenShareEnforcement());

      // First start sharing (to set hasEverSharedRef)
      mockScreenShareState.isScreenSharing = true;
      await act(async () => {
        await result.current.requestScreenShare();
      });

      // Then stop
      act(() => {
        result.current.stopScreenShare();
      });

      expect(result.current.showResharePrompt).toBe(true);
    });

    it('should report violation when stopping with forceReshareOnStop', async () => {
      mockSessionConfig.forceReshareOnStop = true;
      mockScreenShareState.startScreenShare.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useScreenShareEnforcement());

      // First start sharing
      mockScreenShareState.isScreenSharing = true;
      await act(async () => {
        await result.current.requestScreenShare();
      });

      mockSend.mockClear();

      // Then stop
      act(() => {
        result.current.stopScreenShare();
      });

      expect(mockSend).toHaveBeenCalledWith(
        'compliance.violation',
        expect.objectContaining({
          type: 'screen_capture_attempt',
          severity: 'low',
          details: expect.objectContaining({ forceReshare: true }),
          timestamp: expect.any(String),
        })
      );
    });

    it('should not show reshare prompt for exempt users', async () => {
      mockSessionConfig.forceReshareOnStop = true;
      mockSessionConfig.isObserver = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      act(() => {
        result.current.stopScreenShare();
      });

      expect(result.current.showResharePrompt).toBe(false);
    });
  });

  // ===========================================================================
  // dismissResharePrompt
  // ===========================================================================

  describe('dismissResharePrompt', () => {
    it('should hide reshare prompt', async () => {
      mockSessionConfig.forceReshareOnStop = true;
      mockScreenShareState.startScreenShare.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useScreenShareEnforcement());

      // Start and stop to trigger prompt
      mockScreenShareState.isScreenSharing = true;
      await act(async () => {
        await result.current.requestScreenShare();
      });

      act(() => {
        result.current.stopScreenShare();
      });

      expect(result.current.showResharePrompt).toBe(true);

      act(() => {
        result.current.dismissResharePrompt();
      });

      expect(result.current.showResharePrompt).toBe(false);
    });

    it('should report violation when dismissing and screen share required', async () => {
      mockSessionConfig.isScreenShareRequired = true;
      mockSessionConfig.forceReshareOnStop = true;
      mockScreenShareState.startScreenShare.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useScreenShareEnforcement());

      // Start and stop to trigger prompt
      mockScreenShareState.isScreenSharing = true;
      await act(async () => {
        await result.current.requestScreenShare();
      });

      act(() => {
        result.current.stopScreenShare();
      });

      mockSend.mockClear();

      act(() => {
        result.current.dismissResharePrompt();
      });

      expect(mockSend).toHaveBeenCalledWith(
        'compliance.violation',
        expect.objectContaining({
          type: 'screen_capture_attempt',
          severity: 'medium',
          details: expect.objectContaining({ required: true }),
          timestamp: expect.any(String),
        })
      );
    });
  });

  // ===========================================================================
  // clearError
  // ===========================================================================

  describe('clearError', () => {
    it('should clear error state', async () => {
      const error = { type: 'permission_denied', message: 'Permission denied' };
      mockScreenShareState.startScreenShare.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useScreenShareEnforcement());

      await act(async () => {
        await result.current.requestScreenShare();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.permissionDenied).toBe(true);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.permissionDenied).toBe(false);
    });
  });

  // ===========================================================================
  // Display Surface Validation
  // ===========================================================================

  describe('display surface validation', () => {
    it('should accept monitor when entire screen required', () => {
      mockSessionConfig.requireEntireScreen = true;

      const stream = createMockScreenShareStream('monitor');
      mockScreenShareState.screenShareStream = stream;
      mockScreenShareState.isScreenSharing = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      // No error should be set
      expect(result.current.error).toBeNull();
    });

    it('should reject tab when entire screen required', async () => {
      mockSessionConfig.requireEntireScreen = true;

      const { result, rerender } = renderHook(() => useScreenShareEnforcement());

      // Simulate stream being set with tab surface
      const stream = createMockScreenShareStream('browser');
      mockScreenShareState.screenShareStream = stream;
      mockScreenShareState.isScreenSharing = true;

      rerender();

      await waitFor(() => {
        expect(result.current.error).toContain('entire screen');
      });

      expect(mockScreenShareState.stopScreenShare).toHaveBeenCalled();
    });

    it('should reject window when entire screen required', async () => {
      mockSessionConfig.requireEntireScreen = true;

      const { result, rerender } = renderHook(() => useScreenShareEnforcement());

      // Simulate stream being set with window surface
      const stream = createMockScreenShareStream('window');
      mockScreenShareState.screenShareStream = stream;
      mockScreenShareState.isScreenSharing = true;

      rerender();

      await waitFor(() => {
        expect(result.current.error).toContain('entire screen');
      });

      expect(mockScreenShareState.stopScreenShare).toHaveBeenCalled();
    });

    it('should show reshare prompt after invalid surface', async () => {
      mockSessionConfig.requireEntireScreen = true;

      const { result, rerender } = renderHook(() => useScreenShareEnforcement());

      // Simulate stream being set with tab surface
      const stream = createMockScreenShareStream('browser');
      mockScreenShareState.screenShareStream = stream;
      mockScreenShareState.isScreenSharing = true;

      rerender();

      await waitFor(() => {
        expect(result.current.showResharePrompt).toBe(true);
      });
    });

    it('should report violation for invalid surface', async () => {
      mockSessionConfig.requireEntireScreen = true;

      const { rerender } = renderHook(() => useScreenShareEnforcement());

      // Simulate stream being set with tab surface
      const stream = createMockScreenShareStream('browser');
      mockScreenShareState.screenShareStream = stream;
      mockScreenShareState.isScreenSharing = true;

      rerender();

      await waitFor(() => {
        expect(mockSend).toHaveBeenCalledWith(
          'compliance.violation',
          expect.objectContaining({
            type: 'screen_capture_attempt',
            severity: 'medium',
            details: expect.objectContaining({
              required: 'monitor',
              selected: 'tab_or_window',
            }),
            timestamp: expect.any(String),
          })
        );
      });
    });

    it('should accept any surface when entire screen not required', () => {
      mockSessionConfig.requireEntireScreen = false;

      const stream = createMockScreenShareStream('browser');
      mockScreenShareState.screenShareStream = stream;
      mockScreenShareState.isScreenSharing = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.error).toBeNull();
      expect(mockScreenShareState.stopScreenShare).not.toHaveBeenCalled();
    });

    it('should skip validation for exempt users', () => {
      mockSessionConfig.requireEntireScreen = true;
      mockSessionConfig.isObserver = true;

      const stream = createMockScreenShareStream('browser');
      mockScreenShareState.screenShareStream = stream;
      mockScreenShareState.isScreenSharing = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.error).toBeNull();
      expect(mockScreenShareState.stopScreenShare).not.toHaveBeenCalled();
    });

    it('should handle browsers without displaySurface support', () => {
      mockSessionConfig.requireEntireScreen = true;

      // Create stream where getSettings doesn't return displaySurface
      const videoTrack = new MockMediaStreamTrack({ kind: 'video', label: 'Screen Share' });
      vi.spyOn(videoTrack, 'getSettings').mockReturnValue({
        deviceId: 'screen',
      } as MediaTrackSettings);

      const stream = new MockMediaStream({
        videoTracks: [{ kind: 'video', label: 'Screen Share' }],
      });
      (stream as unknown as { _tracks: MockMediaStreamTrack[] })._tracks = [videoTrack];

      mockScreenShareState.screenShareStream = stream;
      mockScreenShareState.isScreenSharing = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      // Should pass validation when displaySurface not supported
      expect(result.current.error).toBeNull();
    });
  });

  // ===========================================================================
  // isRequired computation
  // ===========================================================================

  describe('isRequired computation', () => {
    it('should be false when config says not required', () => {
      mockSessionConfig.isScreenShareRequired = false;
      mockSessionConfig.isObserver = false;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isRequired).toBe(false);
    });

    it('should be true when config says required and not exempt', () => {
      mockSessionConfig.isScreenShareRequired = true;
      mockSessionConfig.isObserver = false;
      mockSessionConfig.canPublishMedia = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isRequired).toBe(true);
    });

    it('should be false when config says required but exempt', () => {
      mockSessionConfig.isScreenShareRequired = true;
      mockSessionConfig.isObserver = true;

      const { result } = renderHook(() => useScreenShareEnforcement());

      expect(result.current.isRequired).toBe(false);
    });
  });
});
