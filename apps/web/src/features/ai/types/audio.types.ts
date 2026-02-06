/**
 * Audio Types
 *
 * Types for AI audio capture (input) and playback (output).
 * - Capture: 16kHz mono PCM for speech recognition
 * - Playback: 24kHz mono PCM for AI voice synthesis
 */

// =============================================================================
// Audio Configuration
// =============================================================================

/**
 * Configuration for audio capture optimized for AI speech input.
 * Uses 16kHz mono PCM which is the standard for speech recognition.
 */
export interface AudioCaptureConfig {
  /** Sample rate in Hz (fixed at 16000 for AI input) */
  sampleRate: 16000;
  /** Number of audio channels (fixed at 1 for mono) */
  channelCount: 1;
  /** Enable browser echo cancellation */
  echoCancellation: boolean;
  /** Enable browser noise suppression */
  noiseSuppression: boolean;
}

/**
 * Default audio capture configuration for AI input.
 */
export const DEFAULT_AI_AUDIO_CONFIG: AudioCaptureConfig = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
};

// =============================================================================
// Audio Data
// =============================================================================

/**
 * A chunk of captured audio data ready for transmission.
 */
export interface AudioChunk {
  /** Raw PCM audio data as Int16 samples */
  buffer: ArrayBuffer;
  /** Timestamp when this chunk was captured (performance.now()) */
  timestamp: number;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Categorized error types for audio capture failures.
 */
export type AudioCaptureErrorType =
  | 'permission_denied'
  | 'device_not_found'
  | 'device_in_use'
  | 'worklet_failed'
  | 'context_failed'
  | 'unknown';

/**
 * Structured error for audio capture operations.
 */
export interface AudioCaptureError {
  /** Categorized error type for handling */
  type: AudioCaptureErrorType;
  /** Human-readable error message */
  message: string;
  /** Original error if available */
  originalError?: Error;
}

// =============================================================================
// State Types
// =============================================================================

/**
 * Current state of the audio capture service.
 */
export type AudioCaptureState = 'idle' | 'starting' | 'capturing' | 'error';

// =============================================================================
// Callback Types
// =============================================================================

/**
 * Callbacks for audio capture events.
 */
export interface AudioCaptureCallbacks {
  /** Called when a new audio chunk is ready */
  onAudioChunk: (chunk: ArrayBuffer) => void;
  /** Called with audio level (0-1) for VU meter display */
  onAudioLevel?: (level: number) => void;
  /** Called when an error occurs */
  onError?: (error: AudioCaptureError) => void;
}

// =============================================================================
// AudioWorklet Message Types
// =============================================================================

/**
 * Messages sent from main thread to AudioWorklet processor.
 */
export type WorkletInboundMessage =
  | { type: 'mute'; muted: boolean }
  | { type: 'set-buffer-size'; size: number };

/**
 * Messages sent from AudioWorklet processor to main thread.
 */
export type WorkletOutboundMessage =
  | { type: 'audio'; buffer: ArrayBuffer; timestamp: number }
  | { type: 'level'; level: number };

// =============================================================================
// Audio Playback Types
// =============================================================================

/**
 * Configuration for audio playback of AI voice output.
 * Uses 24kHz mono PCM which is the standard for AI voice synthesis.
 */
export interface AudioPlaybackConfig {
  /** Sample rate in Hz (fixed at 24000 for AI output) */
  sampleRate: 24000;
  /** Number of audio channels (fixed at 1 for mono) */
  channelCount: 1;
  /** Initial volume level (0-1) */
  volume: number;
}

/**
 * Default audio playback configuration for AI output.
 */
export const DEFAULT_AI_PLAYBACK_CONFIG: AudioPlaybackConfig = {
  sampleRate: 24000,
  channelCount: 1,
  volume: 1.0,
};

/**
 * Current state of the audio playback service.
 */
export type AudioPlaybackState = 'idle' | 'playing' | 'paused' | 'error';

/**
 * Error types for audio playback failures.
 */
export type AudioPlaybackErrorType =
  | 'context_failed'
  | 'context_suspended'
  | 'decode_failed'
  | 'playback_failed'
  | 'unknown';

/**
 * Structured error for audio playback operations.
 */
export interface AudioPlaybackError {
  /** Categorized error type for handling */
  type: AudioPlaybackErrorType;
  /** Human-readable error message */
  message: string;
  /** Original error if available */
  originalError?: Error;
}

/**
 * Callbacks for audio playback events.
 */
export interface AudioPlaybackCallbacks {
  /** Called when playback state changes */
  onStateChange?: (state: AudioPlaybackState) => void;
  /** Called when the audio queue becomes empty */
  onQueueEmpty?: () => void;
  /** Called when buffer underrun occurs (queue empty while playing) */
  onBufferUnderrun?: (count: number) => void;
  /** Called when an error occurs */
  onError?: (error: AudioPlaybackError) => void;
}
