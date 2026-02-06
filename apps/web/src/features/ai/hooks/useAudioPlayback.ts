/**
 * useAudioPlayback Hook
 *
 * React hook for managing AI audio playback:
 * - Initialize/destroy playback
 * - Enqueue audio chunks
 * - Volume control
 * - Interruption
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { AudioPlaybackError, AudioPlaybackState } from '../types/audio.types';
import { audioPlaybackService } from '../services/audio-playback.service';

// =============================================================================
// Types
// =============================================================================

interface UseAudioPlaybackOptions {
  /** Initialize playback on mount */
  autoInitialize?: boolean;
  /** Initial volume (0-1) */
  initialVolume?: number;
  /** Callback when queue becomes empty */
  onQueueEmpty?: () => void;
}

interface UseAudioPlaybackReturn {
  /** Current playback state */
  state: AudioPlaybackState;
  /** Current volume (0-1) */
  volume: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Error if initialization or playback failed */
  error: AudioPlaybackError | null;

  /** Initialize playback (required before use, needs user gesture) */
  initialize: () => Promise<void>;
  /** Enqueue audio data for playback */
  enqueue: (audioData: ArrayBuffer) => void;
  /** Interrupt playback and clear queue */
  interrupt: () => void;
  /** Pause playback */
  pause: () => void;
  /** Resume playback */
  resume: () => Promise<void>;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Clean up resources */
  destroy: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useAudioPlayback(
  options: UseAudioPlaybackOptions = {}
): UseAudioPlaybackReturn {
  const { autoInitialize = false, initialVolume = 1.0, onQueueEmpty } = options;

  // State
  const [state, setState] = useState<AudioPlaybackState>('idle');
  const [volume, setVolumeState] = useState(initialVolume);
  const [error, setError] = useState<AudioPlaybackError | null>(null);

  // Refs for tracking
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  // Store callback in ref
  const onQueueEmptyRef = useRef(onQueueEmpty);
  useEffect(() => {
    onQueueEmptyRef.current = onQueueEmpty;
  }, [onQueueEmpty]);

  // Initialize playback
  const initialize = useCallback(async () => {
    if (initializedRef.current) {
      return;
    }

    setError(null);

    try {
      await audioPlaybackService.initialize(
        {
          onStateChange: (newState) => {
            if (mountedRef.current) {
              setState(newState);
            }
          },
          onQueueEmpty: () => {
            onQueueEmptyRef.current?.();
          },
          onError: (err) => {
            if (mountedRef.current) {
              setError(err);
            }
          },
        },
        {
          sampleRate: 24000,
          channelCount: 1,
          volume: initialVolume,
        }
      );

      initializedRef.current = true;
    } catch (err) {
      if (mountedRef.current) {
        setError(err as AudioPlaybackError);
      }
      throw err;
    }
  }, [initialVolume]);

  // Enqueue audio data
  const enqueue = useCallback((audioData: ArrayBuffer) => {
    audioPlaybackService.enqueue(audioData);
  }, []);

  // Interrupt playback
  const interrupt = useCallback(() => {
    audioPlaybackService.interrupt();
  }, []);

  // Pause playback
  const pause = useCallback(() => {
    audioPlaybackService.pause();
  }, []);

  // Resume playback
  const resume = useCallback(async () => {
    await audioPlaybackService.resume();
  }, []);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    audioPlaybackService.setVolume(newVolume);
    setVolumeState(newVolume);
  }, []);

  // Destroy playback
  const destroy = useCallback(() => {
    audioPlaybackService.destroy();
    initializedRef.current = false;
    setState('idle');
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initialize().catch(() => {
        // Error is stored in state
      });
    }
  }, [autoInitialize, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Destroy playback on unmount
      audioPlaybackService.destroy();
      initializedRef.current = false;
    };
  }, []);

  return {
    // State
    state,
    volume,
    isPlaying: state === 'playing',
    error,

    // Actions
    initialize,
    enqueue,
    interrupt,
    pause,
    resume,
    setVolume,
    destroy,
  };
}
