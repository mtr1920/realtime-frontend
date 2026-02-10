/* eslint-disable max-depth -- Refactor: TASK-REFACTOR-007 flatten nested stats processing */
/**
 * Stats Monitor Service
 *
 * Collects WebRTC statistics and calculates connection quality:
 * - RTT (round-trip time)
 * - Jitter
 * - Packet loss
 * - Bandwidth
 */

import { logger } from '@/shared/lib/logger';
import type {
  PeerConnectionStats,
  NetworkQualityLevel,
} from '../types/webrtc.types';
import { getWebRTCService } from './webrtc.service';

// =============================================================================
// Types
// =============================================================================

export interface StatsMonitorOptions {
  /** Polling interval in ms (default: 2000) */
  interval?: number;
  /** Callback when stats are updated */
  onStats?: (stats: Map<string, PeerConnectionStats>) => void;
}

// =============================================================================
// Quality Calculation
// =============================================================================

/**
 * Calculate network quality based on metrics
 *
 * | RTT (ms) | Packet Loss | Quality    |
 * |----------|-------------|------------|
 * | < 100    | < 1%        | Excellent  |
 * | < 200    | < 3%        | Good       |
 * | < 400    | < 5%        | Fair       |
 * | >= 400   | >= 5%       | Poor       |
 */
function calculateQuality(
  rtt: number,
  packetLoss: number
): NetworkQualityLevel {
  if (rtt < 100 && packetLoss < 1) {
    return 'excellent';
  }
  if (rtt < 200 && packetLoss < 3) {
    return 'good';
  }
  if (rtt < 400 && packetLoss < 5) {
    return 'fair';
  }
  return 'poor';
}

// =============================================================================
// Stats Extractor
// =============================================================================

interface ExtractedStats {
  rtt: number;
  jitter: number;
  packetLoss: number;
  incomingBandwidth: number;
  outgoingBandwidth: number;
}

async function extractStats(report: RTCStatsReport): Promise<ExtractedStats> {
  let rtt = 0;
  let jitter = 0;
  let packetsLost = 0;
  let packetsReceived = 0;
  let incomingBytes = 0;
  let outgoingBytes = 0;

  report.forEach((stat) => {
    // RTT from candidate-pair
    if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
      rtt = stat.currentRoundTripTime ? stat.currentRoundTripTime * 1000 : 0;
    }

    // Jitter and packet loss from inbound-rtp
    if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
      jitter = stat.jitter ? stat.jitter * 1000 : 0;
      packetsLost += stat.packetsLost || 0;
      packetsReceived += stat.packetsReceived || 0;
      incomingBytes += stat.bytesReceived || 0;
    }

    if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
      packetsLost += stat.packetsLost || 0;
      packetsReceived += stat.packetsReceived || 0;
      incomingBytes += stat.bytesReceived || 0;
    }

    // Outgoing bandwidth from outbound-rtp
    if (stat.type === 'outbound-rtp') {
      outgoingBytes += stat.bytesSent || 0;
    }
  });

  // Calculate packet loss percentage
  const totalPackets = packetsLost + packetsReceived;
  const packetLoss = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;

  return {
    rtt,
    jitter,
    packetLoss,
    incomingBandwidth: incomingBytes * 8, // Convert to bits
    outgoingBandwidth: outgoingBytes * 8,
  };
}

// =============================================================================
// Stats Monitor Service
// =============================================================================

export class StatsMonitorService {
  private interval: number;
  private onStats?: (stats: Map<string, PeerConnectionStats>) => void;
  private timer: ReturnType<typeof setInterval> | null = null;
  private previousStats: Map<string, ExtractedStats> = new Map();
  private previousTimestamp: Map<string, number> = new Map();

  constructor(options: StatsMonitorOptions = {}) {
    this.interval = options.interval ?? 2000;
    this.onStats = options.onStats;
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.collectStats().catch((err) => {
        logger.warn('Stats collection failed:', err);
      });
    }, this.interval);

    // Collect immediately
    this.collectStats().catch((err) => {
      logger.warn('Initial stats collection failed:', err);
    });
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.previousStats.clear();
    this.previousTimestamp.clear();
  }

  /**
   * Collect stats from all peers
   */
  private async collectStats(): Promise<void> {
    const service = getWebRTCService();
    if (!service) return;

    const peers = service.getPeers();
    const allStats = new Map<string, PeerConnectionStats>();
    const now = Date.now();

    for (const peer of peers) {
      try {
        // Get raw stats report from the service
        // Note: This requires exposing getStats through the service
        const report = await this.getPeerStats(peer.participantId);
        if (!report) continue;

        const extracted = await extractStats(report);
        const previousExtracted = this.previousStats.get(peer.participantId);
        const previousTime = this.previousTimestamp.get(peer.participantId);

        // Calculate bandwidth rate (bits per second)
        let incomingBandwidth = 0;
        let outgoingBandwidth = 0;

        if (previousExtracted && previousTime) {
          const timeDelta = (now - previousTime) / 1000; // seconds
          if (timeDelta > 0) {
            incomingBandwidth =
              (extracted.incomingBandwidth -
                previousExtracted.incomingBandwidth) /
              timeDelta;
            outgoingBandwidth =
              (extracted.outgoingBandwidth -
                previousExtracted.outgoingBandwidth) /
              timeDelta;
          }
        }

        // Store for next calculation
        this.previousStats.set(peer.participantId, extracted);
        this.previousTimestamp.set(peer.participantId, now);

        // Build stats object
        const stats: PeerConnectionStats = {
          participantId: peer.participantId,
          roundTripTime: extracted.rtt,
          jitter: extracted.jitter,
          packetLoss: extracted.packetLoss,
          bandwidth: {
            incoming: Math.max(0, incomingBandwidth),
            outgoing: Math.max(0, outgoingBandwidth),
          },
          quality: calculateQuality(extracted.rtt, extracted.packetLoss),
          lastUpdated: now,
        };

        allStats.set(peer.participantId, stats);
      } catch (error) {
        logger.warn(`Failed to get stats for ${peer.participantId}:`, error);
      }
    }

    if (allStats.size > 0) {
      this.onStats?.(allStats);
    }
  }

  /**
   * Get stats for a specific peer
   */
  private async getPeerStats(
    participantId: string
  ): Promise<RTCStatsReport | null> {
    const service = getWebRTCService();
    if (!service) return null;

    return service.getStatsForPeer(participantId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: StatsMonitorService | null = null;

export function createStatsMonitor(
  options: StatsMonitorOptions
): StatsMonitorService {
  if (instance) {
    instance.stop();
  }
  instance = new StatsMonitorService(options);
  return instance;
}

export function getStatsMonitor(): StatsMonitorService | null {
  return instance;
}

export function destroyStatsMonitor(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}
