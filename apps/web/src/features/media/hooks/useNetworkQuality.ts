/**
 * useNetworkQuality Hook
 *
 * Provides network quality information:
 * - Per-peer connection stats
 * - Overall connection quality
 * - Auto-starts stats monitoring when initialized
 */

import { useEffect, useCallback, useRef } from 'react';
import { useWebRTCStore } from '../stores/webrtc.store';
import {
  createStatsMonitor,
  destroyStatsMonitor,
  type StatsMonitorService,
} from '../services/stats-monitor.service';
import type {
  PeerConnectionStats,
  NetworkQualityLevel,
} from '../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

interface UseNetworkQualityOptions {
  /** Enable stats monitoring */
  enabled?: boolean;
  /** Polling interval in ms */
  interval?: number;
}

interface UseNetworkQualityReturn {
  /** Overall connection quality (worst among all peers) */
  overallQuality: NetworkQualityLevel;
  /** Stats for all peers */
  allStats: PeerConnectionStats[];
  /** Get stats for a specific participant */
  getStats: (participantId: string) => PeerConnectionStats | undefined;
  /** Get quality level for a specific participant */
  getQuality: (participantId: string) => NetworkQualityLevel;
  /** Start monitoring */
  start: () => void;
  /** Stop monitoring */
  stop: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useNetworkQuality(
  options: UseNetworkQualityOptions = {}
): UseNetworkQualityReturn {
  const { enabled = true, interval = 2000 } = options;

  // Store state
  const isInitialized = useWebRTCStore((s) => s.isInitialized);
  const getOverallQuality = useWebRTCStore((s) => s.getOverallQuality);
  const updateConnectionStats = useWebRTCStore((s) => s.updateConnectionStats);
  const getConnectionStats = useWebRTCStore((s) => s.getConnectionStats);

  // Derive all stats
  const connectionStats = useWebRTCStore((s) => s.connectionStats);
  const allStats = Array.from(connectionStats.values());

  // Monitor ref
  const monitorRef = useRef<StatsMonitorService | null>(null);

  // Handle stats update
  const handleStats = useCallback(
    (stats: Map<string, PeerConnectionStats>) => {
      stats.forEach((stat) => {
        updateConnectionStats(stat);
      });
    },
    [updateConnectionStats]
  );

  // Start monitoring
  const start = useCallback(() => {
    if (monitorRef.current) return;

    monitorRef.current = createStatsMonitor({
      interval,
      onStats: handleStats,
    });
    monitorRef.current.start();
  }, [interval, handleStats]);

  // Stop monitoring
  const stop = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.stop();
      destroyStatsMonitor();
      monitorRef.current = null;
    }
  }, []);

  // Get quality for a specific participant
  const getQuality = useCallback(
    (participantId: string): NetworkQualityLevel => {
      const stats = getConnectionStats(participantId);
      return stats?.quality ?? 'unknown';
    },
    [getConnectionStats]
  );

  // Auto-start/stop based on enabled and initialized state
  useEffect(() => {
    if (enabled && isInitialized) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, isInitialized, start, stop]);

  return {
    overallQuality: getOverallQuality(),
    allStats,
    getStats: getConnectionStats,
    getQuality,
    start,
    stop,
  };
}
