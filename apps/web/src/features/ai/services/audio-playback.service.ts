/**
 * Audio Playback Service
 *
 * Plays AI voice output using Web Audio API.
 * Accepts 24kHz mono Int16 PCM audio chunks.
 *
 * Features:
 * - Seamless audio queue for continuous playback
 * - Volume control
 * - Playback interruption (for user interrupts)
 * - Int16 to Float32 conversion
 */

import type {
  AudioPlaybackConfig,
  AudioPlaybackError,
  AudioPlaybackErrorType,
  AudioPlaybackState,
  AudioPlaybackCallbacks,
} from '../types/audio.types';
import { DEFAULT_AI_PLAYBACK_CONFIG } from '../types/audio.types';

// =============================================================================
// Audio Playback Service
// =============================================================================

class AudioPlaybackService {
  // Audio context and nodes
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  // Playback queue
  private audioQueue: AudioBuffer[] = [];
  private currentSource: AudioBufferSourceNode | null = null;
  private nextScheduledTime = 0;

  // State
  private state: AudioPlaybackState = 'idle';
  private volume = 1.0;
  private config: AudioPlaybackConfig = DEFAULT_AI_PLAYBACK_CONFIG;

  // Buffer underrun tracking
  private bufferUnderrunCount = 0;

  // Visibility change handler for tab backgrounding
  private visibilityHandler: (() => void) | null = null;

  // Initialization guard to prevent race conditions
  private isDestroying = false;

  // Callbacks
  private callbacks: AudioPlaybackCallbacks = {};

  /**
   * Initialize the playback service.
   * Must be called after a user gesture due to autoplay policy.
   */
  async initialize(
    callbacks: AudioPlaybackCallbacks = {},
    config: AudioPlaybackConfig = DEFAULT_AI_PLAYBACK_CONFIG
  ): Promise<void> {
    if (this.audioContext || this.isDestroying) {
      return; // Already initialized or being destroyed
    }

    this.callbacks = callbacks;
    this.config = config;
    this.volume = config.volume;

    try {
      // Create AudioContext at 24kHz for AI voice playback
      this.audioContext = new AudioContext({
        sampleRate: config.sampleRate,
      });

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);

      // Resume context if suspended (autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Set up context state monitoring for suspension handling
      this.setupContextStateHandler();

      // Set up visibility change handler for tab backgrounding
      this.setupVisibilityHandler();

      this.setState('idle');
    } catch (error) {
      const playbackError = this.createError(
        'context_failed',
        'Failed to initialize audio playback.',
        error instanceof Error ? error : undefined
      );
      this.callbacks.onError?.(playbackError);
      throw playbackError;
    }
  }

  /**
   * Enqueue audio data for playback.
   * Audio is expected to be Int16 PCM at 24kHz mono.
   *
   * @param audioData - Int16 PCM audio data as ArrayBuffer
   */
  enqueue(audioData: ArrayBuffer): void {
    if (!this.audioContext || !this.gainNode) {
      const error = this.createError('context_failed', 'Audio playback not initialized.');
      this.callbacks.onError?.(error);
      return;
    }

    // Detect buffer underrun - queue was empty while we were playing
    if (this.audioQueue.length === 0 && this.state === 'playing') {
      this.bufferUnderrunCount++;
      this.callbacks.onBufferUnderrun?.(this.bufferUnderrunCount);
    }

    try {
      // Convert Int16 to Float32 AudioBuffer
      const audioBuffer = this.int16ToAudioBuffer(audioData);
      this.audioQueue.push(audioBuffer);

      // Start playback if not already playing
      if (this.state === 'idle') {
        this.playNext();
      }
    } catch (error) {
      const playbackError = this.createError(
        'decode_failed',
        'Failed to decode audio data.',
        error instanceof Error ? error : undefined
      );
      this.callbacks.onError?.(playbackError);
    }
  }

  /**
   * Interrupt current playback and clear queue.
   * Used when user interrupts the AI.
   */
  interrupt(): void {
    // Stop current source
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Ignore errors if already stopped
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }

    // Clear queue and reset underrun tracking
    this.audioQueue = [];
    this.nextScheduledTime = 0;
    this.bufferUnderrunCount = 0;

    this.setState('idle');
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (this.audioContext && this.state === 'playing') {
      this.audioContext.suspend();
      this.setState('paused');
    }
  }

  /**
   * Resume playback after pause.
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.state === 'paused') {
      await this.audioContext.resume();
      this.setState('playing');
    }
  }

  /**
   * Set playback volume (0-1).
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.gainNode) {
      // Smooth volume change to avoid clicks
      this.gainNode.gain.setTargetAtTime(
        this.volume,
        this.audioContext?.currentTime ?? 0,
        0.01
      );
    }
  }

  /**
   * Get current volume.
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Get current playback state.
   */
  getState(): AudioPlaybackState {
    return this.state;
  }

  /**
   * Check if currently playing.
   */
  isPlaying(): boolean {
    return this.state === 'playing';
  }

  /**
   * Get number of queued audio buffers.
   */
  getQueueLength(): number {
    return this.audioQueue.length;
  }

  /**
   * Clean up and release resources.
   */
  async destroy(): Promise<void> {
    if (this.isDestroying) return;
    this.isDestroying = true;

    this.interrupt();

    // Remove visibility handler
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    // Clear context state handler
    if (this.audioContext) {
      this.audioContext.onstatechange = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch {
        // Ignore close errors
      }
      this.audioContext = null;
    }

    this.callbacks = {};
    this.setState('idle');
    this.isDestroying = false;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * Convert Int16 PCM data to AudioBuffer.
   */
  private int16ToAudioBuffer(int16Data: ArrayBuffer): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const int16Array = new Int16Array(int16Data);
    const numSamples = int16Array.length;

    // Create mono AudioBuffer
    const audioBuffer = this.audioContext.createBuffer(
      this.config.channelCount,
      numSamples,
      this.config.sampleRate
    );

    // Get the channel data
    const channelData = audioBuffer.getChannelData(0);

    // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
    for (let i = 0; i < numSamples; i++) {
      // TypeScript knows int16Array[i] exists because i < numSamples
      channelData[i] = int16Array[i]! / 32768;
    }

    return audioBuffer;
  }

  /**
   * Play the next audio buffer in the queue.
   */
  private playNext(): void {
    if (!this.audioContext || !this.gainNode) {
      return;
    }

    // Check if queue is empty
    if (this.audioQueue.length === 0) {
      this.setState('idle');
      this.callbacks.onQueueEmpty?.();
      return;
    }

    // Get next buffer
    const audioBuffer = this.audioQueue.shift()!;

    // Create source node
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    // Schedule playback
    const startTime = Math.max(this.audioContext.currentTime, this.nextScheduledTime);
    source.start(startTime);

    // Update next scheduled time for seamless playback
    this.nextScheduledTime = startTime + audioBuffer.duration;

    // Store reference for interruption
    this.currentSource = source;

    // Handle end of buffer
    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
        this.playNext();
      }
    };

    this.setState('playing');
  }

  /**
   * Update state and notify callbacks.
   */
  private setState(state: AudioPlaybackState): void {
    if (this.state !== state) {
      this.state = state;
      this.callbacks.onStateChange?.(state);
    }
  }

  /**
   * Set up AudioContext state change handler.
   * Handles browser suspension of audio context.
   */
  private setupContextStateHandler(): void {
    if (!this.audioContext) return;

    this.audioContext.onstatechange = () => {
      if (this.audioContext?.state === 'suspended' && this.state === 'playing') {
        // Context suspended while playing - attempt to resume
        this.audioContext.resume().catch(() => {
          this.callbacks.onError?.({
            type: 'context_suspended',
            message: 'Audio playback suspended by browser',
          });
        });
      }
    };
  }

  /**
   * Set up visibility change handler.
   * Resumes audio context when tab becomes visible again.
   */
  private setupVisibilityHandler(): void {
    this.visibilityHandler = () => {
      if (
        document.visibilityState === 'visible' &&
        this.audioContext?.state === 'suspended'
      ) {
        this.audioContext.resume().catch(() => {
          // Ignore resume errors - user may need to interact
        });
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Create a typed playback error.
   */
  private createError(
    type: AudioPlaybackErrorType,
    message: string,
    originalError?: Error
  ): AudioPlaybackError {
    return { type, message, originalError };
  }
}

// Singleton instance
export const audioPlaybackService = new AudioPlaybackService();
