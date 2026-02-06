/**
 * Media Capture Service
 *
 * Wraps getUserMedia and getDisplayMedia with:
 * - Consistent error handling
 * - Constraint building
 * - Track management
 */

import type {
  MediaConstraints,
  CaptureResult,
  MediaError,
  MediaErrorType,
  ScreenShareOptions,
} from '../types/media.types';
import {
  DEFAULT_VIDEO_CONSTRAINTS,
  DEFAULT_AUDIO_CONSTRAINTS,
} from '../types/media.types';

// =============================================================================
// Error Handling
// =============================================================================

function mapDOMExceptionToMediaError(error: DOMException): MediaError {
  let type: MediaErrorType = 'unknown';
  let message = 'An unexpected error occurred while accessing media devices.';

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      type = 'permission_denied';
      message = 'Permission to access camera/microphone was denied.';
      break;
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      type = 'device_not_found';
      message = 'No camera or microphone was found.';
      break;
    case 'NotReadableError':
    case 'TrackStartError':
      type = 'device_in_use';
      message = 'The camera or microphone is already in use by another application.';
      break;
    case 'OverconstrainedError':
      type = 'overconstrained';
      message = 'The requested media settings are not available.';
      break;
    case 'TypeError':
    case 'NotSupportedError':
      type = 'not_supported';
      message = 'Media capture is not supported in this browser.';
      break;
    default:
      type = 'unknown';
      message = error.message || 'Failed to access media devices.';
  }

  return { type, message, originalError: error };
}

// =============================================================================
// Constraint Building
// =============================================================================

function buildConstraints(options: {
  audio?: boolean | MediaConstraints['audio'];
  video?: boolean | MediaConstraints['video'];
  audioDeviceId?: string;
  videoDeviceId?: string;
}): MediaStreamConstraints {
  const constraints: MediaStreamConstraints = {};

  // Audio constraints
  if (options.audio === false) {
    constraints.audio = false;
  } else if (options.audio === true || options.audioDeviceId) {
    constraints.audio = {
      ...DEFAULT_AUDIO_CONSTRAINTS,
      ...(typeof options.audio === 'object' ? options.audio : {}),
      ...(options.audioDeviceId ? { deviceId: { exact: options.audioDeviceId } } : {}),
    };
  }

  // Video constraints
  if (options.video === false) {
    constraints.video = false;
  } else if (options.video === true || options.videoDeviceId) {
    constraints.video = {
      ...DEFAULT_VIDEO_CONSTRAINTS,
      ...(typeof options.video === 'object' ? options.video : {}),
      ...(options.videoDeviceId ? { deviceId: { exact: options.videoDeviceId } } : {}),
    };
  }

  return constraints;
}

// =============================================================================
// Media Capture Service
// =============================================================================

export interface CaptureOptions {
  audio?: boolean;
  video?: boolean;
  audioDeviceId?: string;
  videoDeviceId?: string;
}

export class MediaCaptureService {
  /**
   * Capture local media (camera/microphone)
   */
  async capture(options: CaptureOptions): Promise<CaptureResult> {
    const constraints = buildConstraints(options);

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioTrack = stream.getAudioTracks()[0] ?? null;
      const videoTrack = stream.getVideoTracks()[0] ?? null;

      return { stream, audioTrack, videoTrack };
    } catch (error) {
      if (error instanceof DOMException) {
        throw mapDOMExceptionToMediaError(error);
      }
      throw {
        type: 'unknown' as MediaErrorType,
        message: 'Failed to capture media.',
        originalError: error instanceof Error ? error : undefined,
      };
    }
  }

  /**
   * Capture screen share
   */
  async captureScreen(options: ScreenShareOptions = {}): Promise<CaptureResult> {
    if (!navigator.mediaDevices.getDisplayMedia) {
      throw {
        type: 'not_supported' as MediaErrorType,
        message: 'Screen sharing is not supported in this browser.',
      };
    }

    // Note: Some properties like 'cursor' and 'displaySurface' may not be
    // in TypeScript's types but are supported by browsers
    const displayMediaOptions: DisplayMediaStreamOptions = {
      video: {
        ...(options.video?.width ? { width: options.video.width } : {}),
        ...(options.video?.height ? { height: options.video.height } : {}),
        ...(options.video?.frameRate ? { frameRate: options.video.frameRate } : {}),
      },
      audio: options.audio ?? false,
    };

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      const audioTrack = stream.getAudioTracks()[0] ?? null;
      const videoTrack = stream.getVideoTracks()[0] ?? null;

      return { stream, audioTrack, videoTrack };
    } catch (error) {
      if (error instanceof DOMException) {
        // User cancelled screen share
        if (error.name === 'AbortError') {
          throw {
            type: 'permission_denied' as MediaErrorType,
            message: 'Screen sharing was cancelled.',
            originalError: error,
          };
        }
        throw mapDOMExceptionToMediaError(error);
      }
      throw {
        type: 'unknown' as MediaErrorType,
        message: 'Failed to start screen sharing.',
        originalError: error instanceof Error ? error : undefined,
      };
    }
  }

  /**
   * Replace a track in an existing stream (for device switching without renegotiation)
   */
  async replaceTrack(
    stream: MediaStream,
    kind: 'audio' | 'video',
    deviceId: string
  ): Promise<MediaStreamTrack> {
    const constraints =
      kind === 'audio'
        ? { audio: { deviceId: { exact: deviceId } } }
        : { video: { ...DEFAULT_VIDEO_CONSTRAINTS, deviceId: { exact: deviceId } } };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = newStream.getTracks()[0];

      if (!newTrack) {
        throw new Error('No track returned from getUserMedia');
      }

      // Find and stop old track
      const oldTracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
      oldTracks.forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });

      // Add new track to stream
      stream.addTrack(newTrack);

      return newTrack;
    } catch (error) {
      if (error instanceof DOMException) {
        throw mapDOMExceptionToMediaError(error);
      }
      throw {
        type: 'unknown' as MediaErrorType,
        message: `Failed to switch ${kind} device.`,
        originalError: error instanceof Error ? error : undefined,
      };
    }
  }

  /**
   * Stop all tracks in a stream
   */
  stopStream(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  /**
   * Enable/disable a track
   */
  setTrackEnabled(track: MediaStreamTrack | null, enabled: boolean): void {
    if (track) {
      track.enabled = enabled;
    }
  }
}

// Singleton instance
export const mediaCaptureService = new MediaCaptureService();

// =============================================================================
// Exported Utilities
// =============================================================================

/**
 * Stop all tracks in a stream with proper cleanup.
 * This is the canonical implementation - use instead of inline patterns.
 */
export function stopStreamTracks(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Stop all tracks and clear onended handlers.
 * Use when you need to prevent cleanup callbacks from firing.
 */
export function stopStreamTracksWithCleanup(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.onended = null;
    track.stop();
  });
}
