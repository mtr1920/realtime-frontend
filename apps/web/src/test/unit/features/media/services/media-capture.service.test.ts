/**
 * Media Capture Service Tests
 *
 * Tests for getUserMedia and getDisplayMedia wrapper service.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MediaCaptureService,
  stopStreamTracks,
  stopStreamTracksWithCleanup,
} from '@/features/media/services/media-capture.service';
import {
  installMockMediaDevices,
  uninstallMockMediaDevices,
  MockMediaStream,
  resetMediaMocks,
} from '@/test/mocks/media-devices.mock';
import type { MediaError } from '@/features/media/types/media.types';

// =============================================================================
// Test Setup
// =============================================================================

describe('MediaCaptureService', () => {
  let service: MediaCaptureService;
  let mockMediaDevices: MediaDevices;

  beforeEach(() => {
    resetMediaMocks();
    mockMediaDevices = installMockMediaDevices();
    service = new MediaCaptureService();
  });

  afterEach(() => {
    uninstallMockMediaDevices();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // capture() Tests
  // ===========================================================================

  describe('capture', () => {
    it('should capture audio and video by default', async () => {
      const result = await service.capture({ audio: true, video: true });

      expect(result.stream).toBeInstanceOf(MockMediaStream);
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.any(Object),
          video: expect.any(Object),
        })
      );
    });

    it('should return audio track when audio is requested', async () => {
      const result = await service.capture({ audio: true, video: false });

      expect(result.audioTrack).not.toBeNull();
      expect(result.audioTrack?.kind).toBe('audio');
    });

    it('should return video track when video is requested', async () => {
      const result = await service.capture({ audio: false, video: true });

      expect(result.videoTrack).not.toBeNull();
      expect(result.videoTrack?.kind).toBe('video');
    });

    it('should include device ID when specified for audio', async () => {
      const deviceId = 'mic-123';
      await service.capture({ audio: true, audioDeviceId: deviceId });

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            deviceId: { exact: deviceId },
          }),
        })
      );
    });

    it('should include device ID when specified for video', async () => {
      const deviceId = 'cam-456';
      await service.capture({ video: true, videoDeviceId: deviceId });

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            deviceId: { exact: deviceId },
          }),
        })
      );
    });

    it('should include default constraints', async () => {
      await service.capture({ audio: true, video: true });

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }),
          video: expect.objectContaining({
            width: expect.any(Object),
            height: expect.any(Object),
            frameRate: expect.any(Object),
          }),
        })
      );
    });

    it('should throw permission_denied error when permission is denied', async () => {
      uninstallMockMediaDevices();
      const error = new DOMException('Permission denied', 'NotAllowedError');
      installMockMediaDevices({ getUserMediaError: error });

      await expect(service.capture({ audio: true })).rejects.toMatchObject({
        type: 'permission_denied',
        message: expect.stringContaining('Permission'),
      });
    });

    it('should throw device_not_found error when no device found', async () => {
      uninstallMockMediaDevices();
      const error = new DOMException('Device not found', 'NotFoundError');
      installMockMediaDevices({ getUserMediaError: error });

      await expect(service.capture({ audio: true })).rejects.toMatchObject({
        type: 'device_not_found',
        message: expect.stringContaining('found'),
      });
    });

    it('should throw device_in_use error when device is busy', async () => {
      uninstallMockMediaDevices();
      const error = new DOMException('Device in use', 'NotReadableError');
      installMockMediaDevices({ getUserMediaError: error });

      await expect(service.capture({ video: true })).rejects.toMatchObject({
        type: 'device_in_use',
        message: expect.stringContaining('in use'),
      });
    });

    it('should throw overconstrained error when constraints cannot be satisfied', async () => {
      uninstallMockMediaDevices();
      const error = new DOMException('Overconstrained', 'OverconstrainedError');
      installMockMediaDevices({ getUserMediaError: error });

      await expect(service.capture({ video: true })).rejects.toMatchObject({
        type: 'overconstrained',
        message: expect.stringContaining('settings'),
      });
    });

    it('should throw not_supported error when media is not supported', async () => {
      uninstallMockMediaDevices();
      const error = new DOMException('Not supported', 'NotSupportedError');
      installMockMediaDevices({ getUserMediaError: error });

      await expect(service.capture({ audio: true })).rejects.toMatchObject({
        type: 'not_supported',
        message: expect.stringContaining('not supported'),
      });
    });

    it('should throw unknown error for unexpected errors', async () => {
      uninstallMockMediaDevices();
      const error = new Error('Unexpected error');
      installMockMediaDevices({ getUserMediaError: error });

      await expect(service.capture({ audio: true })).rejects.toMatchObject({
        type: 'unknown',
        message: expect.any(String),
      });
    });
  });

  // ===========================================================================
  // captureScreen() Tests
  // ===========================================================================

  describe('captureScreen', () => {
    it('should capture screen share', async () => {
      const result = await service.captureScreen();

      expect(result.stream).toBeInstanceOf(MockMediaStream);
      expect(mockMediaDevices.getDisplayMedia).toHaveBeenCalled();
    });

    it('should return video track from screen share', async () => {
      const result = await service.captureScreen();

      expect(result.videoTrack).not.toBeNull();
      expect(result.videoTrack?.kind).toBe('video');
    });

    it('should include audio when requested', async () => {
      await service.captureScreen({ audio: true });

      expect(mockMediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: true,
        })
      );
    });

    it('should apply video constraints', async () => {
      await service.captureScreen({
        video: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        },
      });

      expect(mockMediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            width: 1920,
            height: 1080,
            frameRate: 30,
          }),
        })
      );
    });

    it('should throw not_supported when getDisplayMedia is unavailable', async () => {
      // Temporarily remove getDisplayMedia from the mock
      const originalGetDisplayMedia = mockMediaDevices.getDisplayMedia;
      (mockMediaDevices as any).getDisplayMedia = undefined;

      await expect(service.captureScreen()).rejects.toMatchObject({
        type: 'not_supported',
        message: expect.stringContaining('not supported'),
      });

      // Restore getDisplayMedia
      (mockMediaDevices as any).getDisplayMedia = originalGetDisplayMedia;
    });

    it('should throw permission_denied when user cancels', async () => {
      uninstallMockMediaDevices();
      const error = new DOMException('User cancelled', 'AbortError');
      installMockMediaDevices({ getDisplayMediaError: error });

      await expect(service.captureScreen()).rejects.toMatchObject({
        type: 'permission_denied',
        message: expect.stringContaining('cancelled'),
      });
    });

    it('should throw appropriate error for permission denial', async () => {
      uninstallMockMediaDevices();
      const error = new DOMException('Permission denied', 'NotAllowedError');
      installMockMediaDevices({ getDisplayMediaError: error });

      await expect(service.captureScreen()).rejects.toMatchObject({
        type: 'permission_denied',
      });
    });
  });

  // ===========================================================================
  // replaceTrack() Tests
  // ===========================================================================

  describe('replaceTrack', () => {
    it('should replace audio track in existing stream', async () => {
      const captureResult = await service.capture({ audio: true, video: true });
      const originalTrackId = captureResult.audioTrack?.id;

      const newTrack = await service.replaceTrack(
        captureResult.stream,
        'audio',
        'new-mic-id'
      );

      expect(newTrack).toBeDefined();
      expect(newTrack.kind).toBe('audio');
      expect(newTrack.id).not.toBe(originalTrackId);
    });

    it('should replace video track in existing stream', async () => {
      const captureResult = await service.capture({ audio: true, video: true });
      const originalTrackId = captureResult.videoTrack?.id;

      const newTrack = await service.replaceTrack(
        captureResult.stream,
        'video',
        'new-cam-id'
      );

      expect(newTrack).toBeDefined();
      expect(newTrack.kind).toBe('video');
      expect(newTrack.id).not.toBe(originalTrackId);
    });

    it('should stop old track when replacing', async () => {
      const captureResult = await service.capture({ audio: true });
      const originalTrack = captureResult.audioTrack!;
      const stopSpy = vi.spyOn(originalTrack, 'stop');

      await service.replaceTrack(captureResult.stream, 'audio', 'new-mic-id');

      expect(stopSpy).toHaveBeenCalled();
    });

    it('should throw error when device not found during replace', async () => {
      const captureResult = await service.capture({ audio: true });

      uninstallMockMediaDevices();
      const error = new DOMException('Device not found', 'NotFoundError');
      installMockMediaDevices({ getUserMediaError: error });

      await expect(
        service.replaceTrack(captureResult.stream, 'audio', 'invalid-id')
      ).rejects.toMatchObject({
        type: 'device_not_found',
      });
    });
  });

  // ===========================================================================
  // stopStream() Tests
  // ===========================================================================

  describe('stopStream', () => {
    it('should stop all tracks in stream', async () => {
      const result = await service.capture({ audio: true, video: true });
      const audioStopSpy = vi.spyOn(result.audioTrack!, 'stop');
      const videoStopSpy = vi.spyOn(result.videoTrack!, 'stop');

      service.stopStream(result.stream);

      expect(audioStopSpy).toHaveBeenCalled();
      expect(videoStopSpy).toHaveBeenCalled();
    });

    it('should handle null stream gracefully', () => {
      expect(() => service.stopStream(null)).not.toThrow();
    });
  });

  // ===========================================================================
  // setTrackEnabled() Tests
  // ===========================================================================

  describe('setTrackEnabled', () => {
    it('should enable track', async () => {
      const result = await service.capture({ audio: true });
      const track = result.audioTrack!;
      track.enabled = false;

      service.setTrackEnabled(track, true);

      expect(track.enabled).toBe(true);
    });

    it('should disable track', async () => {
      const result = await service.capture({ audio: true });
      const track = result.audioTrack!;
      track.enabled = true;

      service.setTrackEnabled(track, false);

      expect(track.enabled).toBe(false);
    });

    it('should handle null track gracefully', () => {
      expect(() => service.setTrackEnabled(null, true)).not.toThrow();
    });
  });

  // ===========================================================================
  // Error Type Mapping Tests
  // ===========================================================================

  describe('error type mapping', () => {
    const errorCases: Array<{
      name: string;
      errorName: string;
      expectedType: MediaError['type'];
    }> = [
      {
        name: 'NotAllowedError',
        errorName: 'NotAllowedError',
        expectedType: 'permission_denied',
      },
      {
        name: 'PermissionDeniedError',
        errorName: 'PermissionDeniedError',
        expectedType: 'permission_denied',
      },
      {
        name: 'NotFoundError',
        errorName: 'NotFoundError',
        expectedType: 'device_not_found',
      },
      {
        name: 'DevicesNotFoundError',
        errorName: 'DevicesNotFoundError',
        expectedType: 'device_not_found',
      },
      {
        name: 'NotReadableError',
        errorName: 'NotReadableError',
        expectedType: 'device_in_use',
      },
      {
        name: 'TrackStartError',
        errorName: 'TrackStartError',
        expectedType: 'device_in_use',
      },
      {
        name: 'OverconstrainedError',
        errorName: 'OverconstrainedError',
        expectedType: 'overconstrained',
      },
      {
        name: 'TypeError',
        errorName: 'TypeError',
        expectedType: 'not_supported',
      },
      {
        name: 'NotSupportedError',
        errorName: 'NotSupportedError',
        expectedType: 'not_supported',
      },
    ];

    errorCases.forEach(({ name, errorName, expectedType }) => {
      it(`should map ${name} to ${expectedType}`, async () => {
        uninstallMockMediaDevices();
        const error = new DOMException('Test error', errorName);
        installMockMediaDevices({ getUserMediaError: error });

        let thrownError: MediaError | null = null;
        try {
          await service.capture({ audio: true });
        } catch (e) {
          thrownError = e as MediaError;
        }

        expect(thrownError).not.toBeNull();
        expect(thrownError!.type).toBe(expectedType);
      });
    });
  });

  // ===========================================================================
  // stopStreamTracks() Utility Tests
  // ===========================================================================

  describe('stopStreamTracks', () => {
    it('should stop all tracks in stream', async () => {
      const result = await service.capture({ audio: true, video: true });
      const audioStopSpy = vi.spyOn(result.audioTrack!, 'stop');
      const videoStopSpy = vi.spyOn(result.videoTrack!, 'stop');

      stopStreamTracks(result.stream);

      expect(audioStopSpy).toHaveBeenCalled();
      expect(videoStopSpy).toHaveBeenCalled();
    });

    it('should handle null stream gracefully', () => {
      expect(() => stopStreamTracks(null)).not.toThrow();
    });
  });

  // ===========================================================================
  // stopStreamTracksWithCleanup() Utility Tests
  // ===========================================================================

  describe('stopStreamTracksWithCleanup', () => {
    it('should stop all tracks and clear onended handlers', async () => {
      const result = await service.capture({ audio: true, video: true });
      const audioTrack = result.audioTrack!;
      const videoTrack = result.videoTrack!;

      // Set up mock onended handlers
      audioTrack.onended = vi.fn();
      videoTrack.onended = vi.fn();

      const audioStopSpy = vi.spyOn(audioTrack, 'stop');
      const videoStopSpy = vi.spyOn(videoTrack, 'stop');

      stopStreamTracksWithCleanup(result.stream);

      expect(audioTrack.onended).toBeNull();
      expect(videoTrack.onended).toBeNull();
      expect(audioStopSpy).toHaveBeenCalled();
      expect(videoStopSpy).toHaveBeenCalled();
    });

    it('should handle null stream gracefully', () => {
      expect(() => stopStreamTracksWithCleanup(null)).not.toThrow();
    });

    it('should clear onended before stopping to prevent callbacks', async () => {
      const result = await service.capture({ audio: true });
      const track = result.audioTrack!;

      track.onended = () => {
        // Handler that would be called if not cleared
      };

      stopStreamTracksWithCleanup(result.stream);

      // Verify onended was cleared (not called during stop)
      expect(track.onended).toBeNull();
    });
  });
});
