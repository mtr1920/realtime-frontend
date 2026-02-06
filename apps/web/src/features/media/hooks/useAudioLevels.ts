/**
 * useAudioLevels Hook
 *
 * Monitors audio levels for all participants to enable speaker detection.
 * Uses Web Audio API to analyze audio streams.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useMediaStore } from '@/shared/stores/media.store';
import { useRemoteStreams, type RemoteStreamInfo } from './useRemoteStreams';
import {
  createAudioAnalyzer,
  destroyAudioAnalyzer,
  type AudioAnalyzerService,
  type AudioLevelInfo,
} from '../services/audio-analyzer.service';
import { logger } from '@/shared/lib/logger';

// =============================================================================
// Types
// =============================================================================

export interface UseAudioLevelsOptions {
  /** Enable audio level monitoring */
  enabled?: boolean;
  /** Threshold for speaking detection (0-255, default: 30) */
  speakingThreshold?: number;
  /** Local participant ID */
  localParticipantId?: string | null;
}

export interface UseAudioLevelsReturn {
  /** Map of participant ID to speaking state */
  speakingMap: Map<string, boolean>;
  /** Map of participant ID to audio level (0-255) */
  levelsMap: Map<string, number>;
  /** Check if a specific participant is speaking */
  isSpeaking: (participantId: string) => boolean;
  /** Get audio level for a specific participant */
  getLevel: (participantId: string) => number;
}

// =============================================================================
// Hook
// =============================================================================

export function useAudioLevels(
  options: UseAudioLevelsOptions = {}
): UseAudioLevelsReturn {
  const {
    enabled = true,
    speakingThreshold = 30,
    localParticipantId,
  } = options;

  // State for reactive updates
  const [speakingMap, setSpeakingMap] = useState<Map<string, boolean>>(
    () => new Map()
  );
  const [levelsMap, setLevelsMap] = useState<Map<string, number>>(
    () => new Map()
  );

  // Service ref
  const analyzerRef = useRef<AudioAnalyzerService | null>(null);
  const mountedRef = useRef(true);

  // Track previous remote streams to detect removed participants
  const previousRemoteIdsRef = useRef<Set<string>>(new Set());

  // Local stream
  const localStream = useMediaStore((s) => s.localStream);

  // Remote streams
  const { streams: remoteStreams } = useRemoteStreams();

  // Handle audio level updates - stable callback (uses only state setters which are stable)
  const handleLevelUpdate = useCallback(
    (participantId: string, info: AudioLevelInfo) => {
      if (!mountedRef.current) return;

      setSpeakingMap((prev) => {
        const current = prev.get(participantId);
        if (current === info.isSpeaking) return prev;
        const next = new Map(prev);
        next.set(participantId, info.isSpeaking);
        return next;
      });

      setLevelsMap((prev) => {
        // Only update if level changed significantly (reduce re-renders)
        const current = prev.get(participantId) ?? 0;
        if (Math.abs(current - info.level) < 5) return prev;
        const next = new Map(prev);
        next.set(participantId, info.level);
        return next;
      });
    },
    []
  );

  // Initialize analyzer
  useEffect(() => {
    if (!enabled) {
      destroyAudioAnalyzer();
      analyzerRef.current = null;
      return;
    }

    analyzerRef.current = createAudioAnalyzer({ speakingThreshold });
    analyzerRef.current.start(handleLevelUpdate);

    logger.info('[useAudioLevels] Initialized audio analyzer');

    return () => {
      destroyAudioAnalyzer();
      analyzerRef.current = null;
    };
  }, [enabled, speakingThreshold, handleLevelUpdate]);

  // Track local stream
  useEffect(() => {
    if (!enabled || !analyzerRef.current || !localParticipantId) return;

    if (localStream) {
      analyzerRef.current.addStream(localParticipantId, localStream);
    } else {
      analyzerRef.current.removeStream(localParticipantId);
    }
  }, [enabled, localStream, localParticipantId]);

  // Track remote streams with proper cleanup for departed participants
  useEffect(() => {
    if (!enabled || !analyzerRef.current) return;

    const analyzer = analyzerRef.current;
    const currentRemoteIds = new Set<string>();

    // Add/update all current remote streams
    remoteStreams.forEach((info: RemoteStreamInfo, participantId: string) => {
      currentRemoteIds.add(participantId);
      if (info.mediaStream) {
        analyzer.addStream(participantId, info.mediaStream);
      }
    });

    // Remove streams for participants who left
    previousRemoteIdsRef.current.forEach((participantId) => {
      if (!currentRemoteIds.has(participantId)) {
        analyzer.removeStream(participantId);
        logger.info(`[useAudioLevels] Removed departed participant: ${participantId}`);

        // Clean up state maps
        setSpeakingMap((prev) => {
          if (!prev.has(participantId)) return prev;
          const next = new Map(prev);
          next.delete(participantId);
          return next;
        });
        setLevelsMap((prev) => {
          if (!prev.has(participantId)) return prev;
          const next = new Map(prev);
          next.delete(participantId);
          return next;
        });
      }
    });

    // Update previous IDs for next comparison
    previousRemoteIdsRef.current = currentRemoteIds;
  }, [enabled, remoteStreams]);

  // Mount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Helpers - memoized with useCallback
  const isSpeaking = useCallback(
    (participantId: string): boolean => {
      return speakingMap.get(participantId) ?? false;
    },
    [speakingMap]
  );

  const getLevel = useCallback(
    (participantId: string): number => {
      return levelsMap.get(participantId) ?? 0;
    },
    [levelsMap]
  );

  return {
    speakingMap,
    levelsMap,
    isSpeaking,
    getLevel,
  };
}
