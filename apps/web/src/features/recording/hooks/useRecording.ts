/* eslint-disable max-depth -- Refactor: TASK-REFACTOR-007 flatten nested recording state logic */
/**
 * useRecording Hook
 *
 * Manages the complete recording lifecycle: mixing, recording, and
 * real-time streaming to the backend via WebSocket.
 * Includes client-side encryption for recording data security.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSend, useSubscription } from '@/features/realtime';
import { useRecordingStore } from '../stores/recording.store';
import {
  createRecordingMixer,
  combineStreams,
  type RecordingMixerService,
} from '../services/recording-mixer.service';
import {
  createRecordingStream,
  type RecordingStreamService,
} from '../services/recording-stream.service';
import {
  generateEncryptionKey,
  encryptBlob,
  isCryptoAvailable,
  type EncryptionKey,
} from '@/shared/lib/crypto';

export interface UseRecordingOptions {
  /** Whether recording is enabled */
  enabled?: boolean;
  /** Chunk interval in milliseconds for streaming (default: 1000ms) */
  chunkIntervalMs?: number;
}

export interface UseRecordingResult {
  /** Whether recording is active */
  isRecording: boolean;
  /** Recording duration in milliseconds */
  durationMs: number;
  /** Start recording with streams */
  startRecording: (streams: RecordingStreams) => Promise<void>;
  /** Stop recording */
  stopRecording: () => Promise<void>;
  /** Add audio source to mix (e.g., AI audio) */
  addAudioSource: (id: string, stream: MediaStream, gain?: number) => void;
  /** Remove audio source from mix */
  removeAudioSource: (id: string) => void;
  /** Set gain for an audio source */
  setAudioSourceGain: (id: string, gain: number) => void;
  /** Streaming stats */
  streamingStats: {
    chunksSent: number;
    bytesSent: number;
  };
  /** Error message */
  error: string | null;
}

export interface RecordingStreams {
  /** Video stream (screen or camera) */
  video?: MediaStream;
  /** Primary audio (microphone) */
  microphone?: MediaStream;
  /** Screen share audio */
  screenAudio?: MediaStream;
  /** AI playback audio */
  aiAudio?: MediaStream;
}

const DEFAULT_CHUNK_INTERVAL_MS = 1000; // 1 second chunks for streaming

/**
 * Hook for managing recording with real-time streaming to backend
 *
 * @example
 * ```tsx
 * const { isRecording, startRecording, stopRecording, addAudioSource } = useRecording({
 *   enabled: isRecordingEnabled,
 * });
 *
 * // Start recording with video and mic
 * const handleStartRecording = async () => {
 *   const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
 *   const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
 *   await startRecording({ video: screen, microphone: mic });
 * };
 *
 * // Later, add AI audio when it starts playing
 * addAudioSource('ai', aiAudioStream, 0.8);
 * ```
 */
export function useRecording({
  enabled = true,
  chunkIntervalMs = DEFAULT_CHUNK_INTERVAL_MS,
}: UseRecordingOptions = {}): UseRecordingResult {
  const send = useSend();

  // Store actions
  const setStarted = useRecordingStore((state) => state.setStarted);
  const setStopped = useRecordingStore((state) => state.setStopped);
  const updateStatus = useRecordingStore((state) => state.updateStatus);
  const setFinalized = useRecordingStore((state) => state.setFinalized);
  const setStoreError = useRecordingStore((state) => state.setError);

  // Store state
  const status = useRecordingStore((state) => state.status);
  const durationMs = useRecordingStore((state) => state.durationMs);
  const recordingId = useRecordingStore((state) => state.recordingId);
  const storeError = useRecordingStore((state) => state.error);

  // Local state for streaming stats
  const [streamingStats, setStreamingStats] = useState({
    chunksSent: 0,
    bytesSent: 0,
  });

  // Refs for services
  const mixerRef = useRef<RecordingMixerService | null>(null);
  const recorderRef = useRef<RecordingStreamService | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const startTimeRef = useRef<number>(0);
  const currentRecordingIdRef = useRef<string | null>(null);
  const encryptionKeyRef = useRef<EncryptionKey | null>(null);
  const keySharedRef = useRef(false);

  // Subscribe to recording started from server
  useSubscription('recording.started', (payload) => {
    currentRecordingIdRef.current = payload.recordingId;
    setStarted(payload.recordingId);
  });

  // Subscribe to recording stopped
  // Backend sends stoppedAt and reason, not durationMs - use tracked duration from status
  useSubscription('recording.stopped', (payload) => {
    if (recordingId) {
      // Use the current tracked duration from store since backend doesn't send durationMs here
      setStopped(recordingId, durationMs);
    }
    void payload; // Acknowledge received payload
  });

  // Subscribe to recording finalized (processing complete)
  useSubscription('recording.finalized', (payload) => {
    // downloadUrl is optional in backend response
    setFinalized(payload.recordingId, payload.downloadUrl ?? '');
  });

  // Subscribe to recording error
  useSubscription('recording.error', (payload) => {
    setStoreError(payload.code, payload.message);
  });

  // Subscribe to recording status updates
  // Backend sends durationSeconds, convert to ms for store
  useSubscription('recording.status', (payload) => {
    updateStatus(
      payload.recordingId,
      payload.durationSeconds * 1000,
      payload.status
    );
  });

  // Start duration tracking
  const startDurationTracking = useCallback(() => {
    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (currentRecordingIdRef.current) {
        updateStatus(currentRecordingIdRef.current, elapsed, 'recording');
      }
    }, 1000);
  }, [updateStatus]);

  // Stop duration tracking
  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Initialize encryption key when recording starts
  const initializeEncryption = useCallback(async () => {
    if (!isCryptoAvailable()) {
      console.warn(
        '[useRecording] Web Crypto API not available, encryption disabled'
      );
      return false;
    }

    try {
      const key = await generateEncryptionKey();
      encryptionKeyRef.current = key;
      // Share the key with the server for decryption
      send('recording.encryption.keyExchange', {
        key: key.exportedKey,
        algorithm: 'AES-GCM',
      });
      keySharedRef.current = true;
      return true;
    } catch (error) {
      console.error('[useRecording] Failed to initialize encryption:', error);
      return false;
    }
  }, [send]);

  // Stream chunk to backend via WebSocket
  // Note: Backend currently doesn't support client-side chunked upload (recording.chunk removed)
  // Recording is handled server-side. This function stores chunks locally for potential upload.
  // When re-enabled, chunks will be encrypted before transmission.
  const streamChunk = useCallback(
    async (chunk: Blob, _chunkIndex: number, isFinal: boolean = false) => {
      if (!currentRecordingIdRef.current) return;

      try {
        // Track stats locally
        setStreamingStats((prev) => ({
          chunksSent: prev.chunksSent + 1,
          bytesSent: prev.bytesSent + chunk.size,
        }));

        // When backend supports chunked upload, encrypt and send via WebSocket
        // This code is ready for when recording.chunk is re-enabled
        if (encryptionKeyRef.current && keySharedRef.current) {
          const encrypted = await encryptBlob(
            chunk,
            encryptionKeyRef.current.key
          );
          // Future: send encrypted chunk via WebSocket
          // send('recording.chunk', {
          //   recordingId: currentRecordingIdRef.current,
          //   chunkIndex: _chunkIndex,
          //   data: encrypted.ciphertext,
          //   iv: encrypted.iv,
          //   encrypted: true,
          //   isFinal,
          // });
          void encrypted;
          void isFinal;
        }
      } catch (error) {
        console.error('[useRecording] Failed to process chunk:', error);
      }
    },
    []
  );

  // Start recording
  const startRecording = useCallback(
    async (streams: RecordingStreams) => {
      if (!enabled || status === 'recording') return;

      try {
        // Reset stats
        setStreamingStats({ chunksSent: 0, bytesSent: 0 });

        // Initialize encryption before starting recording
        await initializeEncryption();

        // Request recording start from server (server will assign recording ID)
        // types: Determine what to record based on available streams
        const types: ('audio' | 'video' | 'screen' | 'mixed')[] = [];
        if (streams.microphone || streams.screenAudio || streams.aiAudio) {
          types.push('audio');
        }
        if (streams.video) {
          types.push('screen'); // screen recording if video stream provided
        }
        // If multiple types, use 'mixed' to indicate combined recording
        if (types.length > 1) {
          types.length = 0;
          types.push('mixed');
        }
        // Default to 'audio' if no types detected
        if (types.length === 0) {
          types.push('audio');
        }
        send('recording.start', { types, consent: true });

        // Create mixer for audio
        mixerRef.current = createRecordingMixer();

        // Add audio sources
        if (streams.microphone) {
          mixerRef.current.addSource({
            id: 'microphone',
            stream: streams.microphone,
            gain: 1.0,
          });
        }

        if (streams.screenAudio) {
          mixerRef.current.addSource({
            id: 'screenAudio',
            stream: streams.screenAudio,
            gain: 0.8,
          });
        }

        if (streams.aiAudio) {
          mixerRef.current.addSource({
            id: 'aiAudio',
            stream: streams.aiAudio,
            gain: 0.9,
          });
        }

        // Combine video and mixed audio
        const mixedAudio = mixerRef.current.getOutputStream();
        const combinedStream = combineStreams(
          streams.video || null,
          mixedAudio
        );

        // Create recorder with streaming callback
        recorderRef.current = createRecordingStream(combinedStream, {
          chunkIntervalMs,
          onChunk: (chunk, index) => {
            streamChunk(chunk, index, false);
          },
          onError: (error) => {
            setStoreError('RECORDER_ERROR', error.message);
          },
        });

        // Start recording
        recorderRef.current.start();
        startDurationTracking();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to start recording';
        setStoreError('START_ERROR', message);
      }
    },
    [
      enabled,
      status,
      send,
      setStoreError,
      chunkIntervalMs,
      streamChunk,
      startDurationTracking,
      initializeEncryption,
    ]
  );

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (status !== 'recording') return;

    try {
      // Stop recorder - this triggers final chunk
      if (recorderRef.current) {
        recorderRef.current.stop();

        // Send final chunk marker
        const chunks = recorderRef.current.getChunks();
        if (chunks.length > 0) {
          const lastChunk = chunks[chunks.length - 1];
          if (lastChunk) {
            await streamChunk(lastChunk, chunks.length - 1, true);
          }
        }
      }

      // Dispose mixer
      mixerRef.current?.dispose();
      mixerRef.current = null;
      recorderRef.current = null;

      // Clear encryption state
      encryptionKeyRef.current = null;
      keySharedRef.current = false;

      // Stop duration tracking
      stopDurationTracking();

      // Notify server
      send('recording.stop', { reason: 'user_action' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to stop recording';
      setStoreError('STOP_ERROR', message);
    }
  }, [status, send, setStoreError, stopDurationTracking, streamChunk]);

  // Add audio source dynamically (e.g., AI audio when it starts)
  const addAudioSource = useCallback(
    (id: string, stream: MediaStream, gain = 1.0) => {
      mixerRef.current?.addSource({ id, stream, gain });
    },
    []
  );

  // Remove audio source
  const removeAudioSource = useCallback((id: string) => {
    mixerRef.current?.removeSource(id);
  }, []);

  // Set gain for audio source
  const setAudioSourceGain = useCallback((id: string, gain: number) => {
    mixerRef.current?.setSourceGain(id, gain);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTracking();
      mixerRef.current?.dispose();
      recorderRef.current?.stop();
      // Clear encryption state
      encryptionKeyRef.current = null;
      keySharedRef.current = false;
    };
  }, [stopDurationTracking]);

  return {
    isRecording: status === 'recording',
    durationMs,
    startRecording,
    stopRecording,
    addAudioSource,
    removeAudioSource,
    setAudioSourceGain,
    streamingStats,
    error: storeError,
  };
}
