/**
 * Audio Analyzer Service
 *
 * Uses Web Audio API to detect audio levels for speaker detection.
 * Analyzes MediaStream audio tracks and reports volume levels.
 */

import { logger } from '@/shared/lib/logger';

// =============================================================================
// Types
// =============================================================================

export interface AudioAnalyzerOptions {
  /** Threshold for considering someone "speaking" (0-255, default: 30) */
  speakingThreshold?: number;
  /** How many consecutive frames above threshold to be "speaking" (default: 3) */
  consecutiveFrames?: number;
  /** FFT size for frequency analysis (default: 256) */
  fftSize?: number;
}

export interface AudioLevelInfo {
  /** Current audio level (0-255) */
  level: number;
  /** Whether the participant is currently speaking */
  isSpeaking: boolean;
  /** Last time level was updated */
  lastUpdated: number;
}

export type AudioLevelCallback = (
  participantId: string,
  info: AudioLevelInfo
) => void;

// =============================================================================
// Audio Analyzer
// =============================================================================

class ParticipantAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer>;
  private speakingThreshold: number;
  private consecutiveFrames: number;
  private frameCount: number = 0;
  private isSpeaking: boolean = false;

  constructor(audioContext: AudioContext, options: AudioAnalyzerOptions = {}) {
    this.audioContext = audioContext;
    this.speakingThreshold = options.speakingThreshold ?? 30;
    this.consecutiveFrames = options.consecutiveFrames ?? 3;

    // Create analyzer node
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = options.fftSize ?? 256;
    this.analyser.smoothingTimeConstant = 0.3;
    // Explicitly create ArrayBuffer to satisfy TypeScript's strict type checking
    const buffer = new ArrayBuffer(this.analyser.frequencyBinCount);
    this.dataArray = new Uint8Array(buffer);
  }

  /**
   * Connect a MediaStream for analysis
   */
  connect(stream: MediaStream): boolean {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      return false;
    }

    this.disconnect();

    try {
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      return true;
    } catch (error) {
      logger.warn('[AudioAnalyzer] Failed to connect audio stream:', error);
      return false;
    }
  }

  /**
   * Disconnect the current stream
   */
  disconnect(): void {
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.source = null;
    }
    this.frameCount = 0;
    this.isSpeaking = false;
  }

  /**
   * Get current audio level and speaking state
   */
  getLevel(): AudioLevelInfo {
    if (!this.source) {
      return { level: 0, isSpeaking: false, lastUpdated: Date.now() };
    }

    // Get time-domain data
    this.analyser.getByteTimeDomainData(this.dataArray);

    // Calculate RMS (root mean square) for volume level
    let sum = 0;
    const dataLength = this.dataArray.length;

    // Guard against division by zero
    if (dataLength === 0) {
      return { level: 0, isSpeaking: false, lastUpdated: Date.now() };
    }

    for (let i = 0; i < dataLength; i++) {
      const sample = this.dataArray[i];
      if (sample !== undefined) {
        const value = (sample - 128) / 128;
        sum += value * value;
      }
    }
    const rms = Math.sqrt(sum / dataLength);
    const level = Math.min(255, Math.round(rms * 255 * 2)); // Scale to 0-255

    // Update speaking state with hysteresis
    if (level >= this.speakingThreshold) {
      this.frameCount++;
      if (this.frameCount >= this.consecutiveFrames) {
        this.isSpeaking = true;
      }
    } else {
      if (this.frameCount > 0) {
        this.frameCount--;
      } else {
        this.isSpeaking = false;
      }
    }

    return {
      level,
      isSpeaking: this.isSpeaking,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
  }
}

// =============================================================================
// Audio Analyzer Service (Singleton)
// =============================================================================

export class AudioAnalyzerService {
  private audioContext: AudioContext | null = null;
  private analyzers: Map<string, ParticipantAnalyzer> = new Map();
  private options: AudioAnalyzerOptions;
  private animationFrameId: number | null = null;
  private callback: AudioLevelCallback | null = null;
  private isRunning: boolean = false;

  constructor(options: AudioAnalyzerOptions = {}) {
    this.options = options;
  }

  /**
   * Initialize or get the audio context
   * Handles suspended state for browser autoplay policies
   */
  private async getOrCreateContext(): Promise<AudioContext> {
    // Check if context needs to be created or recreated
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
      logger.info('[AudioAnalyzer] Created new AudioContext');
    }

    // Resume if suspended (required for autoplay policy)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        logger.info('[AudioAnalyzer] Resumed AudioContext');
      } catch (error) {
        logger.warn('[AudioAnalyzer] Failed to resume AudioContext:', error);
      }
    }

    return this.audioContext;
  }

  /**
   * Add a participant's stream for monitoring
   */
  addStream(participantId: string, stream: MediaStream): void {
    // Remove existing analyzer if any
    this.removeStream(participantId);

    // Use async initialization
    this.getOrCreateContext()
      .then((context) => {
        const analyzer = new ParticipantAnalyzer(context, this.options);

        if (analyzer.connect(stream)) {
          this.analyzers.set(participantId, analyzer);
          logger.info(`[AudioAnalyzer] Added stream for ${participantId}`);
        }
      })
      .catch((error) => {
        logger.error(`[AudioAnalyzer] Failed to add stream for ${participantId}:`, error);
      });
  }

  /**
   * Remove a participant's stream
   */
  removeStream(participantId: string): void {
    const analyzer = this.analyzers.get(participantId);
    if (analyzer) {
      analyzer.destroy();
      this.analyzers.delete(participantId);
      logger.info(`[AudioAnalyzer] Removed stream for ${participantId}`);
    }
  }

  /**
   * Start monitoring audio levels
   */
  start(callback: AudioLevelCallback): void {
    if (this.isRunning) return;

    this.callback = callback;
    this.isRunning = true;
    this.tick();
    logger.info('[AudioAnalyzer] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.callback = null;
    logger.info('[AudioAnalyzer] Stopped monitoring');
  }

  /**
   * Animation frame tick with error handling
   */
  private tick = (): void => {
    if (!this.isRunning) return;

    try {
      // Get levels for all participants
      this.analyzers.forEach((analyzer, participantId) => {
        const info = analyzer.getLevel();
        this.callback?.(participantId, info);
      });
    } catch (error) {
      logger.error('[AudioAnalyzer] Error in tick:', error);
      // Stop on repeated errors to prevent infinite loop
      this.stop();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Get current level for a participant
   */
  getLevel(participantId: string): AudioLevelInfo | null {
    const analyzer = this.analyzers.get(participantId);
    return analyzer?.getLevel() ?? null;
  }

  /**
   * Get all current levels
   */
  getAllLevels(): Map<string, AudioLevelInfo> {
    const levels = new Map<string, AudioLevelInfo>();
    this.analyzers.forEach((analyzer, participantId) => {
      levels.set(participantId, analyzer.getLevel());
    });
    return levels;
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.stop();
    this.analyzers.forEach((analyzer) => analyzer.destroy());
    this.analyzers.clear();

    if (this.audioContext) {
      this.audioContext.close().catch(() => {
        // Ignore close errors
      });
      this.audioContext = null;
    }
  }
}

// =============================================================================
// Singleton Factory
// =============================================================================

let instance: AudioAnalyzerService | null = null;

export function createAudioAnalyzer(
  options?: AudioAnalyzerOptions
): AudioAnalyzerService {
  if (instance) {
    instance.destroy();
  }
  instance = new AudioAnalyzerService(options);
  return instance;
}

export function getAudioAnalyzer(): AudioAnalyzerService | null {
  return instance;
}

export function destroyAudioAnalyzer(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
