/**
 * WebRTC Service
 *
 * Manages P2P mesh WebRTC connections:
 * - Creates peer connections for each remote participant
 * - Handles signaling via SignalingAdapter
 * - Manages local tracks across all peers
 * - Implements perfect negotiation pattern
 */

import { PeerConnection } from './peer-connection';
import { SignalingAdapter } from './signaling-adapter';
import { logger } from '@/shared/lib/logger';
import type {
  PeerInfo,
  RemoteTrack,
  PeerConnectionState,
  ICEConnectionState,
  PeerConnectionEvent,
  WebRTCConfig,
} from '../types/webrtc.types';
import { DEFAULT_WEBRTC_CONFIG } from '../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

export interface WebRTCServiceOptions {
  localParticipantId: string;
  config?: WebRTCConfig;
  onEvent?: (event: PeerConnectionEvent) => void;
  /** Observer mode - receive only, no local media transmission */
  isObserver?: boolean;
}

// =============================================================================
// WebRTC Service
// =============================================================================

export class WebRTCService {
  private localParticipantId: string;
  private config: WebRTCConfig;
  private onEvent?: (event: PeerConnectionEvent) => void;
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenShareStream: MediaStream | null = null;
  private signalingAdapter: SignalingAdapter;
  private remoteTracks: Map<string, RemoteTrack> = new Map();
  /** Observer mode - receive only, no local media transmission */
  private isObserver: boolean;
  /** Track peers that have had local tracks added to prevent duplicate additions */
  private peersWithTracksAdded: Set<string> = new Set();
  /** Tracks which peers currently have a remote offer being processed.
   * Suppresses negotiationneeded only for the specific peer whose offer is in flight,
   * allowing other peers' negotiationneeded events to proceed normally in N>2 sessions. */
  private processingRemoteOfferFrom: Set<string> = new Set();

  constructor(options: WebRTCServiceOptions) {
    this.localParticipantId = options.localParticipantId;
    this.config = options.config ?? DEFAULT_WEBRTC_CONFIG;
    this.onEvent = options.onEvent;
    this.isObserver = options.isObserver ?? false;

    // Initialize signaling adapter
    this.signalingAdapter = new SignalingAdapter({
      onOffer: this.handleRemoteOffer.bind(this),
      onAnswer: this.handleRemoteAnswer.bind(this),
      onIceCandidate: this.handleRemoteIceCandidate.bind(this),
      onParticipantJoined: this.handleParticipantJoined.bind(this),
      onParticipantLeft: this.handleParticipantLeft.bind(this),
    });
  }

  // ===========================================================================
  // Track Management Helpers
  // ===========================================================================

  /**
   * Add all tracks from a stream to a peer connection.
   */
  private addStreamTracksToPeer(
    peer: PeerConnection,
    stream: MediaStream | null
  ): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });
  }

  /**
   * Remove all tracks from a stream from a peer connection.
   */
  private removeStreamTracksFromPeer(
    peer: PeerConnection,
    stream: MediaStream | null
  ): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      peer.removeTrack(track.id);
    });
  }

  /**
   * Add local media tracks to a peer connection.
   * Sets up recvonly transceivers if no local stream.
   * Marks peer as having tracks added to prevent duplicates.
   */
  private addLocalTracksToPeer(
    peer: PeerConnection,
    participantId: string
  ): void {
    if (this.peersWithTracksAdded.has(participantId)) {
      return;
    }

    if (this.localStream) {
      this.addStreamTracksToPeer(peer, this.localStream);
    } else {
      // No local stream but still need transceivers to receive media
      peer.addTransceiver('audio', { direction: 'recvonly' });
      peer.addTransceiver('video', { direction: 'recvonly' });
    }

    this.addStreamTracksToPeer(peer, this.screenShareStream);
    this.peersWithTracksAdded.add(participantId);
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Start the service and begin listening for signaling
   */
  start(): void {
    this.signalingAdapter.subscribe();
  }

  /**
   * Stop the service and close all connections
   */
  stop(): void {
    this.signalingAdapter.unsubscribe();
    this.closeAllPeers();
  }

  /**
   * Check if this participant should be the "polite" peer in perfect negotiation.
   * Uses localeCompare for consistent ordering across different ID formats.
   */
  private isPoliteWith(participantId: string): boolean {
    return this.localParticipantId.localeCompare(participantId) > 0;
  }

  /**
   * Check if this participant should initiate the connection.
   * Uses localeCompare for consistent ordering across different ID formats.
   */
  private isInitiatorWith(participantId: string): boolean {
    return this.localParticipantId.localeCompare(participantId) < 0;
  }

  /**
   * Set the local media stream to share with all peers
   * No-op for observers who don't send media
   */
  setLocalStream(stream: MediaStream | null): void {
    // Observers don't send local media
    if (this.isObserver) {
      return;
    }

    const oldStream = this.localStream;
    this.localStream = stream;

    // Update all existing peer connections
    this.peers.forEach((peer, participantId) => {
      this.removeStreamTracksFromPeer(peer, oldStream);

      if (stream) {
        this.addStreamTracksToPeer(peer, stream);
        this.initiateNegotiation(participantId);
      }
    });
  }

  /**
   * Set screen share stream
   * No-op for observers who don't send media
   */
  setScreenShareStream(stream: MediaStream | null): void {
    // Observers don't send screen share
    if (this.isObserver) {
      return;
    }

    const oldStream = this.screenShareStream;
    this.screenShareStream = stream;

    this.peers.forEach((peer, participantId) => {
      this.removeStreamTracksFromPeer(peer, oldStream);

      if (stream) {
        this.addStreamTracksToPeer(peer, stream);
        this.initiateNegotiation(participantId);
      }
    });

    // Notify server (best-effort, failures don't block local operation)
    if (stream) {
      this.signalingAdapter.sendScreenShareStart(stream.id).catch(() => {
        // Best-effort notification - local screen share still works
      });
    } else if (oldStream) {
      this.signalingAdapter.sendScreenShareStop().catch(() => {
        // Best-effort notification - local screen share still stops
      });
    }
  }

  /**
   * Replace a track across all peer connections (for device switching)
   */
  async replaceTrack(
    oldTrackId: string,
    newTrack: MediaStreamTrack
  ): Promise<void> {
    const promises = Array.from(this.peers.entries()).map(([participantId, peer]) =>
      peer.replaceTrack(oldTrackId, newTrack).catch((err) => {
        this.onEvent?.({ type: 'failed', participantId, error: String(err) });
      })
    );
    await Promise.all(promises);
  }

  /**
   * Connect to a specific participant
   */
  async connectToParticipant(
    participantId: string,
    _displayName?: string
  ): Promise<void> {
    if (this.peers.has(participantId)) {
      return; // Already connected
    }

    const peer = this.createPeerConnection(participantId);

    // Add local tracks only if NOT an observer
    // Observers receive media but don't send
    if (!this.isObserver) {
      this.addLocalTracksToPeer(peer, participantId);
    }

    // Observers should NOT initiate - they wait for offers from publishers
    // Non-observers (publishers) always initiate to ensure observers receive media.
    // For two non-observers, ID ordering is used by perfect negotiation to handle collisions:
    // - Lower ID = impolite peer (their offer wins on collision)
    // - Higher ID = polite peer (they rollback and accept the other's offer)
    // Since we initiate unconditionally for non-observers, perfect negotiation
    // handles the case where both sides create offers simultaneously.
    if (!this.isObserver) {
      await this.initiateNegotiation(participantId);
    }
  }

  /**
   * Disconnect from a specific participant
   */
  disconnectFromParticipant(participantId: string): void {
    const peer = this.peers.get(participantId);
    if (peer) {
      peer.close();
      this.peers.delete(participantId);
      this.peersWithTracksAdded.delete(participantId);

      // Remove remote tracks from this participant
      for (const [trackId, track] of this.remoteTracks) {
        if (track.participantId === participantId) {
          this.remoteTracks.delete(trackId);
          this.onEvent?.({ type: 'trackRemoved', participantId, trackId });
        }
      }

      this.onEvent?.({ type: 'disconnected', participantId });
    }
  }

  /**
   * Get all peer info
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.entries()).map(([participantId, peer]) => ({
      participantId,
      displayName: '', // Will be filled by consumer
      connectionState: peer.connectionState,
      iceConnectionState: peer.iceConnectionState,
      isPolite: this.isPoliteWith(participantId),
      audioTrack: this.getRemoteTrack(participantId, 'audio')?.track ?? null,
      videoTrack: this.getRemoteTrack(participantId, 'video')?.track ?? null,
      screenTrack: this.getRemoteTrack(participantId, 'screen')?.track ?? null,
    }));
  }

  /**
   * Get remote tracks
   */
  getRemoteTracks(): RemoteTrack[] {
    return Array.from(this.remoteTracks.values());
  }

  /**
   * Get a specific remote track
   */
  getRemoteTrack(
    participantId: string,
    kind: 'audio' | 'video' | 'screen'
  ): RemoteTrack | undefined {
    for (const track of this.remoteTracks.values()) {
      if (track.participantId === participantId && track.kind === kind) {
        return track;
      }
    }
    return undefined;
  }

  /**
   * Request ICE restart for a specific peer
   */
  async restartIce(participantId: string): Promise<void> {
    const peer = this.peers.get(participantId);
    if (!peer) return;

    const offer = await peer.restartIce();
    if (!offer) return;
    await this.signalingAdapter.sendOffer(
      participantId,
      offer.sdp!,
      'media'
    );
  }

  /**
   * Get WebRTC stats for a specific peer connection
   */
  async getStatsForPeer(participantId: string): Promise<RTCStatsReport | null> {
    const peer = this.peers.get(participantId);
    if (!peer) return null;

    return peer.getStats();
  }

  /**
   * Notify server of media toggle
   */
  async notifyMediaToggle(
    kind: 'audio' | 'video',
    enabled: boolean
  ): Promise<void> {
    await this.signalingAdapter.sendMediaToggle(kind, enabled);
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private createPeerConnection(participantId: string): PeerConnection {
    // Perfect negotiation: polite peer = one with higher ID
    const isPolite = this.isPoliteWith(participantId);

    const peer = new PeerConnection({
      participantId,
      isPolite,
      config: this.config,
      callbacks: {
        onConnectionStateChange: (state) =>
          this.handleConnectionStateChange(participantId, state),
        onIceConnectionStateChange: (state) =>
          this.handleIceConnectionStateChange(participantId, state),
        onIceCandidate: (candidate) =>
          this.handleLocalIceCandidate(participantId, candidate),
        onNegotiationNeeded: () =>
          this.handleNegotiationNeeded(participantId),
        onTrack: (track) => this.handleRemoteTrack(track),
        onTrackEnded: (trackId) =>
          this.handleRemoteTrackEnded(participantId, trackId),
      },
    });

    this.peers.set(participantId, peer);
    return peer;
  }

  private async initiateNegotiation(participantId: string): Promise<void> {
    const peer = this.peers.get(participantId);
    if (!peer) return;

    try {
      const offer = await peer.createOffer();
      await this.signalingAdapter.sendOffer(
        participantId,
        offer.sdp!,
        'media'
      );
    } catch (error) {
      this.onEvent?.({ type: 'failed', participantId, error: `Failed to create offer: ${error}` });
    }
  }

  private closeAllPeers(): void {
    this.peers.forEach((peer, participantId) => {
      peer.close();
      this.onEvent?.({ type: 'disconnected', participantId });
    });
    this.peers.clear();
    this.remoteTracks.clear();
    this.peersWithTracksAdded.clear();
    this.processingRemoteOfferFrom.clear();
  }

  // ===========================================================================
  // Signaling Handlers
  // ===========================================================================

  private async handleRemoteOffer(
    fromParticipantId: string,
    sdp: string,
    _mediaKind: string
  ): Promise<void> {
    let peer = this.peers.get(fromParticipantId);

    // Suppress negotiationneeded for THIS peer during remote offer processing to prevent
    // competing offers from addTrack/recreateConnection racing with handleOffer.
    this.processingRemoteOfferFrom.add(fromParticipantId);
    try {
      // If existing peer's connection is failed/closed (e.g., after resume from network loss),
      // recreate the connection and re-add local tracks for a clean restart.
      if (peer) {
        const state = peer.connectionState;
        if (state === 'failed' || state === 'closed') {
          logger.warn('Recreating failed/closed PeerConnection for incoming offer', {
            remoteParticipantId: fromParticipantId,
            connectionState: state,
          });
          peer.recreateConnection();
          this.peersWithTracksAdded.delete(fromParticipantId);
          if (!this.isObserver) {
            this.addLocalTracksToPeer(peer, fromParticipantId);
          }
        }
      }

      if (!peer) {
        // Create new peer for incoming connection
        peer = this.createPeerConnection(fromParticipantId);

        // Add local tracks only if NOT an observer
        // Observers receive media but don't send
        if (!this.isObserver) {
          this.addLocalTracksToPeer(peer, fromParticipantId);
        }
      }

      // Process the incoming offer — the single negotiation for this exchange.
      // Observers still respond to offers to receive media.
      const answer = await peer.handleOffer({ type: 'offer', sdp });
      if (answer) {
        await this.signalingAdapter.sendAnswer(
          fromParticipantId,
          answer.sdp!,
          'media'
        );
      }
    } catch (error) {
      this.onEvent?.({ type: 'failed', participantId: fromParticipantId, error: `Failed to handle offer: ${error}` });
    } finally {
      this.processingRemoteOfferFrom.delete(fromParticipantId);
    }
  }

  private async handleRemoteAnswer(
    fromParticipantId: string,
    sdp: string,
    _mediaKind: string
  ): Promise<void> {
    const peer = this.peers.get(fromParticipantId);
    if (!peer) return;

    try {
      await peer.handleAnswer({ type: 'answer', sdp });
    } catch (error) {
      this.onEvent?.({ type: 'failed', participantId: fromParticipantId, error: `Failed to handle answer: ${error}` });
    }
  }

  private async handleRemoteIceCandidate(
    fromParticipantId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peer = this.peers.get(fromParticipantId);
    if (!peer) return;

    try {
      await peer.addIceCandidate(candidate);
    } catch (error) {
      logger.error(`Failed to add ICE candidate from ${fromParticipantId}:`, error);
    }
  }

  private handleParticipantJoined(_participantId: string): void {
    // Will be handled by the hook/component that tracks participants
    // The actual connection is initiated when connectToParticipant is called
  }

  private handleParticipantLeft(participantId: string): void {
    this.disconnectFromParticipant(participantId);
  }

  // ===========================================================================
  // Peer Connection Handlers
  // ===========================================================================

  private handleConnectionStateChange(
    participantId: string,
    state: PeerConnectionState
  ): void {
    if (state === 'connected') {
      this.onEvent?.({ type: 'connected', participantId });
    } else if (state === 'disconnected') {
      this.onEvent?.({ type: 'disconnected', participantId });
    } else if (state === 'failed') {
      this.onEvent?.({ type: 'failed', participantId, error: 'Connection failed' });
    }
  }

  private handleIceConnectionStateChange(
    participantId: string,
    state: ICEConnectionState
  ): void {
    // Auto-restart ICE on failure
    if (state === 'failed') {
      this.restartIce(participantId).catch((err) => {
        this.onEvent?.({ type: 'failed', participantId, error: `ICE restart failed: ${err}` });
      });
    }
  }

  private async handleLocalIceCandidate(
    participantId: string,
    candidate: RTCIceCandidate
  ): Promise<void> {
    try {
      await this.signalingAdapter.sendIceCandidate(
        participantId,
        candidate.toJSON()
      );
    } catch (error) {
      logger.error(`Failed to send ICE candidate to ${participantId}:`, error);
    }
  }

  private handleNegotiationNeeded(participantId: string): void {
    // Observers don't send media, so they won't trigger renegotiation
    if (this.isObserver) return;
    // Suppress during remote offer processing for THIS specific peer only
    if (this.processingRemoteOfferFrom.has(participantId)) return;

    // For renegotiation between two non-observers, use ID ordering to determine
    // who creates the offer. Lower ID = impolite peer = creates offers.
    // Perfect negotiation handles any collisions if both sides happen to
    // trigger negotiationneeded simultaneously.
    const isInitiator = this.isInitiatorWith(participantId);
    if (isInitiator) {
      this.initiateNegotiation(participantId).catch((err) => {
        this.onEvent?.({ type: 'failed', participantId, error: `Negotiation failed: ${err}` });
      });
    }
  }

  private handleRemoteTrack(track: RemoteTrack): void {
    this.remoteTracks.set(track.trackId, track);
    this.onEvent?.({
      type: 'trackAdded',
      participantId: track.participantId,
      track,
    });
  }

  private handleRemoteTrackEnded(
    participantId: string,
    trackId: string
  ): void {
    this.remoteTracks.delete(trackId);
    this.onEvent?.({ type: 'trackRemoved', participantId, trackId });
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: WebRTCService | null = null;

export function createWebRTCService(options: WebRTCServiceOptions): WebRTCService {
  if (instance) {
    instance.stop();
  }
  instance = new WebRTCService(options);
  return instance;
}

export function getWebRTCService(): WebRTCService | null {
  return instance;
}

export function destroyWebRTCService(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}
