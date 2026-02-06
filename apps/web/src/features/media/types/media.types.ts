/**
 * Media Types
 *
 * Types for media capture, constraints, and error handling.
 */

// =============================================================================
// Media Constraints
// =============================================================================

export interface VideoConstraints {
  width?: number | { ideal: number; min?: number; max?: number };
  height?: number | { ideal: number; min?: number; max?: number };
  frameRate?: number | { ideal: number; min?: number; max?: number };
  facingMode?: 'user' | 'environment';
  deviceId?: string | { exact: string };
}

export interface AudioConstraints {
  deviceId?: string | { exact: string };
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  channelCount?: number;
  sampleRate?: number;
}

export interface MediaConstraints {
  audio?: boolean | AudioConstraints;
  video?: boolean | VideoConstraints;
}

// =============================================================================
// Capture Result
// =============================================================================

export interface CaptureResult {
  stream: MediaStream;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
}

// =============================================================================
// Media Errors
// =============================================================================

export type MediaErrorType =
  | 'permission_denied'
  | 'device_not_found'
  | 'device_in_use'
  | 'overconstrained'
  | 'not_supported'
  | 'unknown';

export interface MediaError {
  type: MediaErrorType;
  message: string;
  originalError?: Error;
}

// =============================================================================
// Device State
// =============================================================================

export interface DevicePreferences {
  audioInputId: string | null;
  audioOutputId: string | null;
  videoInputId: string | null;
}

export type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

// =============================================================================
// Track State
// =============================================================================

export interface TrackState {
  id: string;
  kind: 'audio' | 'video';
  enabled: boolean;
  muted: boolean;
  label: string;
}

// =============================================================================
// Screen Share
// =============================================================================

export interface ScreenShareOptions {
  audio?: boolean;
  video?: {
    displaySurface?: 'monitor' | 'window' | 'browser';
    cursor?: 'always' | 'motion' | 'never';
    width?: number;
    height?: number;
    frameRate?: number;
  };
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_VIDEO_CONSTRAINTS: VideoConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
};

export const DEFAULT_AUDIO_CONSTRAINTS: AudioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

// Storage key for device preferences
export const DEVICE_PREFERENCES_KEY = 'media-device-preferences';
