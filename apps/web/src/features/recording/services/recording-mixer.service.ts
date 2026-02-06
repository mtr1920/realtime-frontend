/**
 * Recording Mixer Service
 *
 * Web Audio API mixer for combining multiple audio streams
 * (microphone, screen audio, AI playback) into a single output.
 */

import { logger } from '@/shared/lib/logger';

export interface AudioSource {
  /** Unique identifier for the source */
  id: string;
  /** Media stream to mix */
  stream: MediaStream;
  /** Gain level (0-1) */
  gain?: number;
}

export interface MixerOptions {
  /** Sample rate for output (default: 48000) */
  sampleRate?: number;
  /** Number of output channels (default: 2) */
  channelCount?: number;
}

export interface RecordingMixerService {
  /** Add an audio source to the mix */
  addSource: (source: AudioSource) => void;
  /** Remove an audio source from the mix */
  removeSource: (id: string) => void;
  /** Set gain for a specific source */
  setSourceGain: (id: string, gain: number) => void;
  /** Get the mixed output stream */
  getOutputStream: () => MediaStream;
  /** Dispose of resources */
  dispose: () => void;
}

interface ManagedSource {
  stream: MediaStream;
  sourceNode: MediaStreamAudioSourceNode;
  gainNode: GainNode;
}

/**
 * Create a recording mixer service
 *
 * @example
 * ```typescript
 * const mixer = createRecordingMixer();
 *
 * // Add microphone
 * mixer.addSource({ id: 'mic', stream: micStream, gain: 1.0 });
 *
 * // Add screen audio
 * mixer.addSource({ id: 'screen', stream: screenStream, gain: 0.8 });
 *
 * // Get mixed output for recording
 * const outputStream = mixer.getOutputStream();
 * ```
 */
export function createRecordingMixer(options: MixerOptions = {}): RecordingMixerService {
  const { sampleRate = 48000, channelCount = 2 } = options;

  // Create audio context
  const audioContext = new AudioContext({ sampleRate });

  // Create destination for mixing
  const destination = audioContext.createMediaStreamDestination();
  destination.channelCount = channelCount;

  // Track managed sources
  const sources = new Map<string, ManagedSource>();

  // Add a source to the mix
  function addSource(source: AudioSource): void {
    // Remove existing source with same ID
    if (sources.has(source.id)) {
      removeSource(source.id);
    }

    // Check if stream has audio tracks
    const audioTracks = source.stream.getAudioTracks();
    if (audioTracks.length === 0) {
      logger.warn(`[RecordingMixer] Source ${source.id} has no audio tracks`);
      return;
    }

    try {
      // Create nodes
      const sourceNode = audioContext.createMediaStreamSource(source.stream);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = source.gain ?? 1.0;

      // Connect: source -> gain -> destination
      sourceNode.connect(gainNode);
      gainNode.connect(destination);

      // Store for later management
      sources.set(source.id, {
        stream: source.stream,
        sourceNode,
        gainNode,
      });
    } catch (error) {
      logger.error(`[RecordingMixer] Failed to add source ${source.id}:`, error);
    }
  }

  // Remove a source from the mix
  function removeSource(id: string): void {
    const managed = sources.get(id);
    if (!managed) {
      return;
    }

    try {
      // Disconnect nodes
      managed.gainNode.disconnect();
      managed.sourceNode.disconnect();

      sources.delete(id);
    } catch (error) {
      logger.error(`[RecordingMixer] Failed to remove source ${id}:`, error);
    }
  }

  // Set gain for a source
  function setSourceGain(id: string, gain: number): void {
    const managed = sources.get(id);
    if (!managed) {
      logger.warn(`[RecordingMixer] Source not found: ${id}`);
      return;
    }

    // Clamp gain to valid range
    const clampedGain = Math.max(0, Math.min(1, gain));
    managed.gainNode.gain.value = clampedGain;
  }

  // Get the mixed output stream
  function getOutputStream(): MediaStream {
    return destination.stream;
  }

  // Clean up resources
  function dispose(): void {
    // Disconnect all sources
    for (const id of sources.keys()) {
      removeSource(id);
    }

    // Close audio context
    if (audioContext.state !== 'closed') {
      audioContext.close().catch((error) => {
        logger.error('[RecordingMixer] Error closing audio context:', error);
      });
    }
  }

  return {
    addSource,
    removeSource,
    setSourceGain,
    getOutputStream,
    dispose,
  };
}

/**
 * Combine video and audio streams into a single MediaStream
 *
 * @param videoStream - Stream containing video track
 * @param audioStream - Stream containing audio track(s)
 * @returns Combined MediaStream
 */
export function combineStreams(
  videoStream: MediaStream | null,
  audioStream: MediaStream | null
): MediaStream {
  const combinedStream = new MediaStream();

  // Add video tracks
  if (videoStream) {
    videoStream.getVideoTracks().forEach((track) => {
      combinedStream.addTrack(track);
    });
  }

  // Add audio tracks
  if (audioStream) {
    audioStream.getAudioTracks().forEach((track) => {
      combinedStream.addTrack(track);
    });
  }

  return combinedStream;
}
