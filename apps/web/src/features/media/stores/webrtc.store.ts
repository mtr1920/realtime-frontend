/**
 * WebRTC Store
 *
 * Zustand store for WebRTC peer connection state:
 * - Peer connection status per participant
 * - Remote tracks
 * - Connection quality
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  PeerInfo,
  RemoteTrack,
  PeerConnectionStats,
  PeerConnectionState,
  NetworkQualityLevel,
} from '../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

interface WebRTCState {
  // State
  isInitialized: boolean;
  localParticipantId: string | null;
  peers: Map<string, PeerInfo>;
  remoteTracks: Map<string, RemoteTrack>;
  connectionStats: Map<string, PeerConnectionStats>;

  // Derived
  getPeer: (participantId: string) => PeerInfo | undefined;
  getRemoteTrack: (trackId: string) => RemoteTrack | undefined;
  getRemoteTracksForParticipant: (participantId: string) => RemoteTrack[];
  getConnectionStats: (participantId: string) => PeerConnectionStats | undefined;
  getOverallQuality: () => NetworkQualityLevel;
  getAllPeers: () => PeerInfo[];
  getAllRemoteTracks: () => RemoteTrack[];

  // Actions
  initialize: (localParticipantId: string) => void;
  addPeer: (peer: PeerInfo) => void;
  updatePeer: (participantId: string, updates: Partial<PeerInfo>) => void;
  removePeer: (participantId: string) => void;
  updatePeerConnectionState: (participantId: string, state: PeerConnectionState) => void;

  addRemoteTrack: (track: RemoteTrack) => void;
  removeRemoteTrack: (trackId: string) => void;
  clearRemoteTracksForParticipant: (participantId: string) => void;

  updateConnectionStats: (stats: PeerConnectionStats) => void;

  reset: () => void;
}

const initialState = {
  isInitialized: false,
  localParticipantId: null,
  peers: new Map<string, PeerInfo>(),
  remoteTracks: new Map<string, RemoteTrack>(),
  connectionStats: new Map<string, PeerConnectionStats>(),
};

// =============================================================================
// Store
// =============================================================================

export const useWebRTCStore = create<WebRTCState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // =========================================================================
      // Derived State
      // =========================================================================

      getPeer: (participantId) => get().peers.get(participantId),

      getRemoteTrack: (trackId) => get().remoteTracks.get(trackId),

      getRemoteTracksForParticipant: (participantId) => {
        const tracks: RemoteTrack[] = [];
        get().remoteTracks.forEach((track) => {
          if (track.participantId === participantId) {
            tracks.push(track);
          }
        });
        return tracks;
      },

      getConnectionStats: (participantId) =>
        get().connectionStats.get(participantId),

      getOverallQuality: () => {
        const stats = Array.from(get().connectionStats.values());
        if (stats.length === 0) return 'unknown';

        // Return worst quality among all peers
        const qualities: NetworkQualityLevel[] = ['excellent', 'good', 'fair', 'poor'];
        let worstIndex = 0;

        stats.forEach((s) => {
          const index = qualities.indexOf(s.quality);
          if (index > worstIndex) {
            worstIndex = index;
          }
        });

        return qualities[worstIndex] ?? 'unknown';
      },

      getAllPeers: () => Array.from(get().peers.values()),

      getAllRemoteTracks: () => Array.from(get().remoteTracks.values()),

      // =========================================================================
      // Actions
      // =========================================================================

      initialize: (localParticipantId) =>
        set((state) => {
          state.isInitialized = true;
          state.localParticipantId = localParticipantId;
        }),

      addPeer: (peer) =>
        set((state) => {
          state.peers.set(peer.participantId, peer);
        }),

      updatePeer: (participantId, updates) =>
        set((state) => {
          const peer = state.peers.get(participantId);
          if (peer) {
            state.peers.set(participantId, { ...peer, ...updates });
          }
        }),

      removePeer: (participantId) =>
        set((state) => {
          state.peers.delete(participantId);
          state.connectionStats.delete(participantId);

          // Stop and remove associated tracks
          for (const [trackId, track] of state.remoteTracks) {
            if (track.participantId === participantId) {
              track.track.stop();
              state.remoteTracks.delete(trackId);
            }
          }
        }),

      updatePeerConnectionState: (participantId, connectionState) =>
        set((state) => {
          const peer = state.peers.get(participantId);
          if (peer) {
            state.peers.set(participantId, { ...peer, connectionState });
          }
        }),

      addRemoteTrack: (track) =>
        set((state) => {
          state.remoteTracks.set(track.trackId, track);

          // Update peer with track reference
          const peer = state.peers.get(track.participantId);
          if (peer) {
            const updates: Partial<PeerInfo> = {};
            if (track.kind === 'audio') {
              updates.audioTrack = track.track;
            } else if (track.kind === 'video') {
              updates.videoTrack = track.track;
            } else if (track.kind === 'screen') {
              updates.screenTrack = track.track;
            }
            state.peers.set(track.participantId, { ...peer, ...updates });
          }
        }),

      removeRemoteTrack: (trackId) =>
        set((state) => {
          const track = state.remoteTracks.get(trackId);
          if (track) {
            // Stop the track to release resources
            track.track.stop();

            state.remoteTracks.delete(trackId);

            // Update peer to remove track reference
            const peer = state.peers.get(track.participantId);
            if (peer) {
              const updates: Partial<PeerInfo> = {};
              if (track.kind === 'audio') {
                updates.audioTrack = null;
              } else if (track.kind === 'video') {
                updates.videoTrack = null;
              } else if (track.kind === 'screen') {
                updates.screenTrack = null;
              }
              state.peers.set(track.participantId, { ...peer, ...updates });
            }
          }
        }),

      clearRemoteTracksForParticipant: (participantId) =>
        set((state) => {
          for (const [trackId, track] of state.remoteTracks) {
            if (track.participantId === participantId) {
              // Stop the track before removing
              track.track.stop();
              state.remoteTracks.delete(trackId);
            }
          }
        }),

      updateConnectionStats: (stats) =>
        set((state) => {
          state.connectionStats.set(stats.participantId, stats);
        }),

      reset: () =>
        set(() => ({
          ...initialState,
          peers: new Map(),
          remoteTracks: new Map(),
          connectionStats: new Map(),
        })),
    }))
  )
);

// =============================================================================
// Subscriptions
// =============================================================================

/**
 * Subscribe to peer changes
 */
export const subscribeToPeers = (
  callback: (peers: Map<string, PeerInfo>) => void
) => {
  return useWebRTCStore.subscribe(
    (state) => state.peers,
    (peers) => callback(peers)
  );
};

/**
 * Subscribe to remote tracks changes
 */
export const subscribeToRemoteTracks = (
  callback: (tracks: Map<string, RemoteTrack>) => void
) => {
  return useWebRTCStore.subscribe(
    (state) => state.remoteTracks,
    (tracks) => callback(tracks)
  );
};
