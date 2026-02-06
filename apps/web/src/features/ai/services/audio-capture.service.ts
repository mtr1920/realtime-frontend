/**
 * Audio Capture Service
 *
 * Captures microphone audio for AI interaction using AudioWorklet.
 * Outputs 16kHz mono PCM suitable for speech recognition.
 *
 * Features:
 * - AudioWorklet for low-latency processing
 * - Automatic resampling to 16kHz
 * - Mute control without stopping capture
 * - Audio level monitoring for VU meter
 */

import type {
  AudioCaptureConfig,
  AudioCaptureError,
  AudioCaptureErrorType,
  AudioCaptureState,
  AudioCaptureCallbacks,
  WorkletOutboundMessage,
} from '../types/audio.types';
import { DEFAULT_AI_AUDIO_CONFIG } from '../types/audio.types';

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Map DOMException to typed audio capture error.
 */
function mapDOMExceptionToAudioError(error: DOMException): AudioCaptureError {
  let type: AudioCaptureErrorType = 'unknown';
  let message = 'An unexpected error occurred while accessing the microphone.';

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      type = 'permission_denied';
      message = 'Microphone permission was denied.';
      break;
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      type = 'device_not_found';
      message = 'No microphone was found.';
      break;
    case 'NotReadableError':
    case 'TrackStartError':
      type = 'device_in_use';
      message = 'The microphone is already in use by another application.';
      break;
    default:
      type = 'unknown';
      message = error.message || 'Failed to access microphone.';
  }

  return { type, message, originalError: error };
}

// =============================================================================
// Audio Capture Service
// =============================================================================

class AudioCaptureService {
  // Audio processing state
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;

  // Callbacks
  private onAudioChunk: ((chunk: ArrayBuffer) => void) | null = null;
  private onAudioLevel: ((level: number) => void) | null = null;
  private onError: ((error: AudioCaptureError) => void) | null = null;

  // State
  private state: AudioCaptureState = 'idle';
  private isMuted = false;

  // Device change tracking
  private deviceChangeHandler: (() => void) | null = null;
  private trackEndedHandler: (() => void) | null = null;
  private currentDeviceId: string | undefined;

  /**
   * Start capturing audio from the specified device.
   *
   * @param deviceId - Optional device ID to capture from
   * @param callbacks - Callbacks for audio data, level, and errors
   * @param config - Optional audio configuration override
   */
  async start(
    deviceId: string | undefined,
    callbacks: AudioCaptureCallbacks,
    config: AudioCaptureConfig = DEFAULT_AI_AUDIO_CONFIG
  ): Promise<void> {
    if (this.state === 'capturing' || this.state === 'starting') {
      return;
    }

    this.state = 'starting';
    this.onAudioChunk = callbacks.onAudioChunk;
    this.onAudioLevel = callbacks.onAudioLevel ?? null;
    this.onError = callbacks.onError ?? null;
    this.currentDeviceId = deviceId;

    try {
      // Create AudioContext at target sample rate
      // Browser will automatically resample if device doesn't support 16kHz
      this.audioContext = new AudioContext({
        sampleRate: config.sampleRate,
      });

      // Load the AudioWorklet processor
      await this.loadWorklet();

      // Get microphone stream
      this.mediaStream = await this.getMediaStream(deviceId, config);

      // Connect audio graph
      this.connectAudioGraph();

      // Set up device change detection
      this.setupDeviceChangeDetection();

      // Set up track ended detection (device disconnection)
      this.setupTrackEndedDetection();

      this.state = 'capturing';
    } catch (error) {
      this.state = 'error';
      await this.cleanup();

      const captureError = this.normalizeError(error);
      this.onError?.(captureError);
      throw captureError;
    }
  }

  /**
   * Stop capturing and release all resources.
   */
  stop(): void {
    this.cleanup();
    this.state = 'idle';
    this.onAudioChunk = null;
    this.onAudioLevel = null;
    this.onError = null;
  }

  /**
   * Mute/unmute audio capture.
   * When muted, no audio chunks are sent but level monitoring continues.
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;

    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'mute', muted });
    }
  }

  /**
   * Check if currently capturing.
   */
  isCapturing(): boolean {
    return this.state === 'capturing';
  }

  /**
   * Get current capture state.
   */
  getState(): AudioCaptureState {
    return this.state;
  }

  /**
   * Check if muted.
   */
  getMuted(): boolean {
    return this.isMuted;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * Load the AudioWorklet processor module.
   */
  private async loadWorklet(): Promise<void> {
    if (!this.audioContext) {
      throw this.createError('context_failed', 'AudioContext not initialized.');
    }

    try {
      await this.audioContext.audioWorklet.addModule('/audio-processor.worklet.js');
    } catch (error) {
      throw this.createError(
        'worklet_failed',
        'Failed to load audio processor.',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get media stream from microphone.
   */
  private async getMediaStream(
    deviceId: string | undefined,
    config: AudioCaptureConfig
  ): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        channelCount: config.channelCount,
        sampleRate: config.sampleRate,
        echoCancellation: config.echoCancellation,
        noiseSuppression: config.noiseSuppression,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
      video: false,
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      if (error instanceof DOMException) {
        throw mapDOMExceptionToAudioError(error);
      }
      throw this.createError('unknown', 'Failed to access microphone.');
    }
  }

  /**
   * Connect the audio processing graph.
   */
  private connectAudioGraph(): void {
    if (!this.audioContext || !this.mediaStream) {
      throw this.createError('context_failed', 'Audio context or stream not initialized.');
    }

    // Create source from media stream
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Create worklet node
    this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

    // Handle messages from worklet
    this.workletNode.port.onmessage = (event: MessageEvent<WorkletOutboundMessage>) => {
      const { type } = event.data;

      switch (type) {
        case 'audio':
          if (!this.isMuted && this.onAudioChunk) {
            this.onAudioChunk(event.data.buffer);
          }
          break;
        case 'level':
          this.onAudioLevel?.(event.data.level);
          break;
      }
    };

    // Handle worklet errors
    this.workletNode.port.onmessageerror = () => {
      const error = this.createError('worklet_failed', 'Audio processor communication error.');
      this.onError?.(error);
    };

    // Connect: source -> worklet
    // Note: We don't connect to destination since we're not playing back
    this.sourceNode.connect(this.workletNode);

    // Set initial mute state
    this.workletNode.port.postMessage({ type: 'mute', muted: this.isMuted });
  }

  /**
   * Clean up all audio resources.
   */
  private cleanup(): void {
    // Remove device change listener
    if (this.deviceChangeHandler) {
      navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeHandler);
      this.deviceChangeHandler = null;
    }

    // Remove track ended listener
    if (this.trackEndedHandler && this.mediaStream) {
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      audioTrack?.removeEventListener('ended', this.trackEndedHandler);
      this.trackEndedHandler = null;
    }

    // Disconnect and clean up worklet
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.close();
      this.workletNode = null;
    }

    // Disconnect source
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Stop all tracks in media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {
        // Ignore close errors
      });
      this.audioContext = null;
    }

    // Reset device tracking
    this.currentDeviceId = undefined;
  }

  /**
   * Set up device change detection.
   * Notifies when the selected device is disconnected.
   */
  private setupDeviceChangeDetection(): void {
    this.deviceChangeHandler = () => {
      this.handleDeviceChange();
    };
    navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeHandler);
  }

  /**
   * Handle device change events.
   * Checks if the currently selected device is still available.
   */
  private async handleDeviceChange(): Promise<void> {
    if (!this.currentDeviceId || !this.isCapturing()) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      const deviceStillExists = audioInputs.some(
        (d) => d.deviceId === this.currentDeviceId
      );

      if (!deviceStillExists) {
        this.onError?.({
          type: 'device_not_found',
          message: 'Selected audio device is no longer available',
        });
      }
    } catch {
      // Ignore enumeration errors
    }
  }

  /**
   * Set up track ended detection.
   * Notifies when the audio track ends (e.g., device disconnected).
   */
  private setupTrackEndedDetection(): void {
    if (!this.mediaStream) return;

    const audioTrack = this.mediaStream.getAudioTracks()[0];
    if (audioTrack) {
      this.trackEndedHandler = () => {
        if (this.isCapturing()) {
          this.onError?.({
            type: 'device_not_found',
            message: 'Audio device was disconnected',
          });
          this.stop();
        }
      };
      audioTrack.addEventListener('ended', this.trackEndedHandler);
    }
  }

  /**
   * Create a typed audio capture error.
   */
  private createError(
    type: AudioCaptureErrorType,
    message: string,
    originalError?: Error
  ): AudioCaptureError {
    return { type, message, originalError };
  }

  /**
   * Normalize any error to AudioCaptureError.
   */
  private normalizeError(error: unknown): AudioCaptureError {
    if (this.isAudioCaptureError(error)) {
      return error;
    }

    if (error instanceof DOMException) {
      return mapDOMExceptionToAudioError(error);
    }

    if (error instanceof Error) {
      return this.createError('unknown', error.message, error);
    }

    return this.createError('unknown', 'An unexpected error occurred.');
  }

  /**
   * Type guard for AudioCaptureError.
   */
  private isAudioCaptureError(error: unknown): error is AudioCaptureError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'message' in error
    );
  }
}

// Singleton instance
export const audioCaptureService = new AudioCaptureService();
