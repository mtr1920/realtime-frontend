/**
 * useAudioCapture Hook
 *
 * React hook for managing AI audio capture lifecycle:
 * - Start/stop capture
 * - Mute control
 * - Audio level monitoring
 * - Error handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { AudioCaptureError } from '../types/audio.types';
import { audioCaptureService } from '../services/audio-capture.service';

// =============================================================================
// Types
// =============================================================================

interface UseAudioCaptureOptions {
  /** Start capture immediately on mount */
  autoStart?: boolean;
  /** Device ID to capture from */
  deviceId?: string;
  /** Callback for audio chunks (required if autoStart is true) */
  onAudioChunk?: (chunk: ArrayBuffer) => void;
}

interface UseAudioCaptureReturn {
  /** Whether audio is currently being captured */
  isCapturing: boolean;
  /** Whether audio is muted (level monitoring continues) */
  isMuted: boolean;
  /** Current audio level (0-1) for VU meter display */
  audioLevel: number;
  /** Error if capture failed */
  error: AudioCaptureError | null;

  /** Start capturing audio */
  start: (deviceId?: string, onAudioChunk?: (chunk: ArrayBuffer) => void) => Promise<void>;
  /** Stop capturing audio */
  stop: () => void;
  /** Set muted state */
  setMuted: (muted: boolean) => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useAudioCapture(options: UseAudioCaptureOptions = {}): UseAudioCaptureReturn {
  const { autoStart = false, deviceId, onAudioChunk } = options;

  // State
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<AudioCaptureError | null>(null);

  // Refs for tracking mount state and preventing duplicate starts
  const mountedRef = useRef(true);
  const startingRef = useRef(false);

  // Store callback in ref to avoid dependency issues
  const onAudioChunkRef = useRef(onAudioChunk);
  useEffect(() => {
    onAudioChunkRef.current = onAudioChunk;
  }, [onAudioChunk]);

  // Start capture
  const start = useCallback(
    async (startDeviceId?: string, startOnAudioChunk?: (chunk: ArrayBuffer) => void) => {
      // Prevent duplicate starts
      if (startingRef.current || audioCaptureService.isCapturing()) {
        return;
      }

      const chunkCallback = startOnAudioChunk ?? onAudioChunkRef.current;
      if (!chunkCallback) {
        const err: AudioCaptureError = {
          type: 'unknown',
          message: 'onAudioChunk callback is required to start capture.',
        };
        setError(err);
        throw err;
      }

      startingRef.current = true;
      setError(null);

      try {
        await audioCaptureService.start(startDeviceId ?? deviceId, {
          onAudioChunk: (chunk) => {
            if (mountedRef.current) {
              chunkCallback(chunk);
            }
          },
          onAudioLevel: (level) => {
            if (mountedRef.current) {
              setAudioLevel(level);
            }
          },
          onError: (err) => {
            if (mountedRef.current) {
              setError(err);
              setIsCapturing(false);
            }
          },
        });

        if (mountedRef.current) {
          setIsCapturing(true);
          setIsMuted(audioCaptureService.getMuted());
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as AudioCaptureError);
          setIsCapturing(false);
        }
        throw err;
      } finally {
        startingRef.current = false;
      }
    },
    [deviceId]
  );

  // Stop capture
  const stop = useCallback(() => {
    audioCaptureService.stop();
    setIsCapturing(false);
    setAudioLevel(0);
    setError(null);
  }, []);

  // Set muted state
  const setMutedState = useCallback((muted: boolean) => {
    audioCaptureService.setMuted(muted);
    setIsMuted(muted);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart && onAudioChunkRef.current && !audioCaptureService.isCapturing()) {
      start().catch(() => {
        // Error is stored in state
      });
    }
  }, [autoStart, start]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Stop capture on unmount to release resources
      audioCaptureService.stop();
    };
  }, []);

  return {
    // State
    isCapturing,
    isMuted,
    audioLevel,
    error,

    // Actions
    start,
    stop,
    setMuted: setMutedState,
  };
}
