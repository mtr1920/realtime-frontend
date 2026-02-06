/**
 * PeerConnection Wrapper
 *
 * Wraps a single RTCPeerConnection with:
 * - Perfect negotiation pattern for glare handling
 * - ICE candidate management
 * - Track management
 * - Connection state monitoring
 */

import type {
  PeerConnectionState,
  ICEConnectionState,
  RemoteTrack,
  TrackKind,
  WebRTCConfig,
} from '../types/webrtc.types';
import { DEFAULT_WEBRTC_CONFIG } from '../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

export interface PeerConnectionCallbacks {
  onConnectionStateChange: (state: PeerConnectionState) => void;
  onIceConnectionStateChange: (state: ICEConnectionState) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onNegotiationNeeded: () => void;
  onTrack: (track: RemoteTrack) => void;
  onTrackEnded: (trackId: string) => void;
}

export interface PeerConnectionOptions {
  participantId: string;
  isPolite: boolean; // For perfect negotiation
  config?: WebRTCConfig;
  callbacks: PeerConnectionCallbacks;
}

// =============================================================================
// PeerConnection Class
// =============================================================================

export class PeerConnection {
  private pc: RTCPeerConnection;
  private participantId: string;
  private isPolite: boolean;
  private makingOffer = false;
  private ignoreOffer = false;
  private senders: Map<string, RTCRtpSender> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private callbacks: PeerConnectionCallbacks;

  /**
   * ICE candidate buffering for candidates that arrive before remote description.
   * WebRTC requires setRemoteDescription() before addIceCandidate().
   */
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private hasRemoteDescription = false;

  /**
   * Track remote tracks with onended handlers for cleanup
   */
  private trackedTracks: Set<MediaStreamTrack> = new Set();

  constructor(options: PeerConnectionOptions) {
    this.participantId = options.participantId;
    this.isPolite = options.isPolite;
    this.callbacks = options.callbacks;

    const config = options.config ?? DEFAULT_WEBRTC_CONFIG;

    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers,
      iceCandidatePoolSize: config.iceCandidatePoolSize,
    });

    this.setupEventHandlers();
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  get connectionState(): PeerConnectionState {
    return this.pc.connectionState as PeerConnectionState;
  }

  get iceConnectionState(): ICEConnectionState {
    return this.pc.iceConnectionState as ICEConnectionState;
  }

  /**
   * Add a local track to be sent to the remote peer
   */
  addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender {
    const sender = this.pc.addTrack(track, stream);
    this.senders.set(track.id, sender);
    return sender;
  }

  /**
   * Add a transceiver for receiving media without a local track.
   * Used when the user has no camera/mic but still wants to receive media.
   */
  addTransceiver(
    kind: 'audio' | 'video',
    init?: RTCRtpTransceiverInit
  ): RTCRtpTransceiver {
    return this.pc.addTransceiver(kind, init);
  }

  /**
   * Remove a local track
   */
  removeTrack(trackId: string): void {
    const sender = this.senders.get(trackId);
    if (sender) {
      this.pc.removeTrack(sender);
      this.senders.delete(trackId);
    }
  }

  /**
   * Replace a track without renegotiation
   */
  async replaceTrack(
    oldTrackId: string,
    newTrack: MediaStreamTrack
  ): Promise<void> {
    const sender = this.senders.get(oldTrackId);
    if (sender) {
      await sender.replaceTrack(newTrack);
      this.senders.delete(oldTrackId);
      this.senders.set(newTrack.id, sender);
    }
  }

  /**
   * Create an offer (initiator side)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.makingOffer = true;
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      return this.pc.localDescription!;
    } finally {
      this.makingOffer = false;
    }
  }

  /**
   * Handle a remote offer (receiver side)
   */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    // Perfect negotiation: Handle glare condition
    const offerCollision =
      this.makingOffer ||
      this.pc.signalingState !== 'stable';

    this.ignoreOffer = !this.isPolite && offerCollision;

    if (this.ignoreOffer) {
      return null;
    }

    await this.pc.setRemoteDescription(offer);
    this.hasRemoteDescription = true;
    this.ignoreOffer = false; // Reset after successful handling

    // Flush any buffered ICE candidates now that remote description is set
    await this.flushPendingIceCandidates();

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return this.pc.localDescription!;
  }

  /**
   * Handle a remote answer (initiator side)
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(answer);
    this.hasRemoteDescription = true;
    this.ignoreOffer = false; // Reset after successful handling

    // Flush any buffered ICE candidates now that remote description is set
    await this.flushPendingIceCandidates();
  }

  /**
   * Add an ICE candidate from remote peer.
   * Buffers candidates if remote description hasn't been set yet.
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    // Buffer candidates until remote description is set
    // This prevents "Error processing ICE candidate" when candidates arrive
    // before the offer/answer exchange completes
    if (!this.hasRemoteDescription) {
      this.pendingIceCandidates.push(candidate);
      return;
    }

    try {
      await this.pc.addIceCandidate(candidate);
    } catch (error) {
      if (!this.ignoreOffer) {
        throw error;
      }
    }
  }

  /**
   * Restart ICE (for recovering failed connections)
   */
  async restartIce(): Promise<RTCSessionDescriptionInit> {
    this.makingOffer = true;
    try {
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      return this.pc.localDescription!;
    } finally {
      this.makingOffer = false;
    }
  }

  /**
   * Get connection statistics
   */
  async getStats(): Promise<RTCStatsReport> {
    return this.pc.getStats();
  }

  /**
   * Close the connection
   */
  close(): void {
    // Clean up track.onended handlers to prevent memory leaks
    for (const track of this.trackedTracks) {
      track.onended = null;
    }
    this.trackedTracks.clear();

    // Remove all event handlers
    this.pc.onconnectionstatechange = null;
    this.pc.oniceconnectionstatechange = null;
    this.pc.onicecandidate = null;
    this.pc.onnegotiationneeded = null;
    this.pc.ontrack = null;

    // Close the connection
    this.pc.close();

    // Clear internal state
    this.senders.clear();
    this.remoteStreams.clear();
    this.pendingIceCandidates = [];
    this.hasRemoteDescription = false;
  }

  // ===========================================================================
  // ICE Candidate Buffering
  // ===========================================================================

  /**
   * Flush buffered ICE candidates after remote description is set.
   * Called internally after setRemoteDescription succeeds.
   */
  private async flushPendingIceCandidates(): Promise<void> {
    if (this.pendingIceCandidates.length === 0) {
      return;
    }

    const candidates = this.pendingIceCandidates;
    this.pendingIceCandidates = [];

    for (const candidate of candidates) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (error) {
        // Log but don't fail - some candidates may be stale
        console.warn('[PeerConnection] Failed to add buffered ICE candidate:', error);
      }
    }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private setupEventHandlers(): void {
    // Connection state
    this.pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange(
        this.pc.connectionState as PeerConnectionState
      );
    };

    // ICE connection state
    this.pc.oniceconnectionstatechange = () => {
      this.callbacks.onIceConnectionStateChange(
        this.pc.iceConnectionState as ICEConnectionState
      );
    };

    // ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };

    // Negotiation needed
    this.pc.onnegotiationneeded = () => {
      this.callbacks.onNegotiationNeeded();
    };

    // Remote tracks
    this.pc.ontrack = (event) => {
      const stream = event.streams[0];
      const track = event.track;

      if (!stream) {
        // Create a stream if none provided
        const newStream = new MediaStream([track]);
        this.remoteStreams.set(track.id, newStream);
      } else if (!this.remoteStreams.has(stream.id)) {
        this.remoteStreams.set(stream.id, stream);
      }

      // Determine track kind
      let kind: TrackKind = track.kind as 'audio' | 'video';
      // Check if this is a screen share track
      // Screen share tracks typically have a label containing 'screen' or 'display'
      if (track.kind === 'video' && track.label.toLowerCase().includes('screen')) {
        kind = 'screen';
      }

      const remoteTrack: RemoteTrack = {
        participantId: this.participantId,
        trackId: track.id,
        track,
        kind,
        stream: stream || this.remoteStreams.get(track.id)!,
      };

      this.callbacks.onTrack(remoteTrack);

      // Handle track ended - track for cleanup to prevent memory leaks
      this.trackedTracks.add(track);
      track.onended = () => {
        this.trackedTracks.delete(track);
        this.callbacks.onTrackEnded(track.id);
      };
    };
  }
}
