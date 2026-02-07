/**
 * PeerConnection Wrapper
 *
 * Wraps a single RTCPeerConnection with:
 * - Perfect negotiation pattern for glare handling
 * - ICE candidate management
 * - Track management
 * - Connection state monitoring
 */

import { logger } from '@/shared/lib/logger';

import type {
  PeerConnectionState,
  ICEConnectionState,
  RemoteTrack,
  TrackKind,
  WebRTCConfig,
} from '../types/webrtc.types';
import { DEFAULT_WEBRTC_CONFIG } from '../types/webrtc.types';

const STALE_OFFER_TIMEOUT_MS = 8_000;
const ICE_RESTART_MAX_ATTEMPTS = 5;
const ICE_RESTART_BASE_DELAY_MS = 2_000;
const ICE_RESTART_MAX_DELAY_MS = 16_000;

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
  /** Called when ICE restart attempts are exhausted */
  onConnectionFailed?: (participantId: string) => void;
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
  // Tracks when the last local offer was created, used for stale offer detection.
  // The `> 0` guard in isStaleOffer prevents treating the initial state (0) as stale.
  private lastOfferCreatedAt = 0;
  private senders: Map<string, RTCRtpSender> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private callbacks: PeerConnectionCallbacks;
  private config: WebRTCConfig;

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

  /**
   * ICE restart backoff state
   */
  private iceRestartAttempts = 0;
  private iceRestartTimerId: ReturnType<typeof setTimeout> | null = null;
  private iceRestartPromiseCallbacks: {
    resolve: (value: RTCSessionDescriptionInit | null) => void;
    reject: (reason: Error) => void;
  } | null = null;

  constructor(options: PeerConnectionOptions) {
    this.participantId = options.participantId;
    this.isPolite = options.isPolite;
    this.callbacks = options.callbacks;
    this.config = options.config ?? DEFAULT_WEBRTC_CONFIG;

    this.pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
      iceCandidatePoolSize: this.config.iceCandidatePoolSize,
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
      this.lastOfferCreatedAt = Date.now();
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

    // Detect stale local offer: impolite peer has a pending offer that's been
    // unanswered for too long, indicating the remote never received it
    const isStaleOffer = offerCollision &&
      !this.makingOffer &&
      this.lastOfferCreatedAt > 0 &&
      Date.now() - this.lastOfferCreatedAt > STALE_OFFER_TIMEOUT_MS;

    this.ignoreOffer = !this.isPolite && offerCollision && !isStaleOffer;

    if (this.ignoreOffer) {
      return null;
    }

    // Explicit rollback for Safari <15.4 compatibility
    if (isStaleOffer && this.pc.signalingState === 'have-local-offer') {
      logger.warn('Stale offer detected, rolling back local offer to accept remote', {
        remoteParticipantId: this.participantId,
        offerAgeMs: Date.now() - this.lastOfferCreatedAt,
        signalingState: this.pc.signalingState,
      });
      await this.pc.setLocalDescription({ type: 'rollback' });
      this.lastOfferCreatedAt = 0;
    }

    await this.pc.setRemoteDescription(offer);
    this.hasRemoteDescription = true;
    this.ignoreOffer = false;

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
    this.lastOfferCreatedAt = 0;
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
   * Restart ICE with exponential backoff (for recovering failed connections).
   *
   * Delay: min(2^attempts * 2000, 16000) ms
   * Max attempts: 5, then emits onConnectionFailed
   *
   * @returns The offer description, or null if max attempts exceeded
   */
  async restartIce(): Promise<RTCSessionDescriptionInit | null> {
    if (this.iceRestartAttempts >= ICE_RESTART_MAX_ATTEMPTS) {
      logger.warn('ICE restart max attempts reached', {
        participantId: this.participantId,
        attempts: this.iceRestartAttempts,
      });
      this.callbacks.onConnectionFailed?.(this.participantId);
      return null;
    }

    // Cancel any previously pending backoff timer and settle its promise
    this.cancelPendingIceRestart('superseded');

    const delay = Math.min(
      Math.pow(2, this.iceRestartAttempts) * ICE_RESTART_BASE_DELAY_MS,
      ICE_RESTART_MAX_DELAY_MS
    );

    this.iceRestartAttempts++;

    logger.info('Scheduling ICE restart with backoff', {
      participantId: this.participantId,
      attempt: this.iceRestartAttempts,
      delayMs: delay,
    });

    return new Promise<RTCSessionDescriptionInit | null>((resolve, reject) => {
      this.iceRestartPromiseCallbacks = { resolve, reject };
      this.iceRestartTimerId = setTimeout(async () => {
        this.iceRestartTimerId = null;
        this.iceRestartPromiseCallbacks = null;
        this.makingOffer = true;
        try {
          const offer = await this.pc.createOffer({ iceRestart: true });
          await this.pc.setLocalDescription(offer);
          resolve(this.pc.localDescription!);
        } catch (error) {
          logger.warn('ICE restart offer failed', {
            participantId: this.participantId,
            attempt: this.iceRestartAttempts,
            error: error instanceof Error ? error.message : String(error),
          });
          resolve(null);
        } finally {
          this.makingOffer = false;
        }
      }, delay);
    });
  }

  /**
   * Reset ICE restart attempt counter.
   * Call this when the connection successfully establishes.
   */
  resetIceRestartAttempts(): void {
    this.iceRestartAttempts = 0;
    this.cancelPendingIceRestart('reset');
  }

  /**
   * Cancel any pending ICE restart timer and settle the pending promise.
   * - 'superseded': resolved with null (new restart replaces old one)
   * - 'closed': rejected with Error (connection was closed)
   * - 'reset': resolved with null (connection recovered)
   */
  private cancelPendingIceRestart(reason: 'superseded' | 'closed' | 'reset'): void {
    if (this.iceRestartTimerId !== null) {
      clearTimeout(this.iceRestartTimerId);
      this.iceRestartTimerId = null;
    }
    if (this.iceRestartPromiseCallbacks) {
      if (reason === 'closed') {
        this.iceRestartPromiseCallbacks.reject(new Error('PeerConnection closed'));
      } else {
        this.iceRestartPromiseCallbacks.resolve(null);
      }
      this.iceRestartPromiseCallbacks = null;
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
    // Clean up ICE restart timer and reject pending promise
    this.cancelPendingIceRestart('closed');

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
    this.lastOfferCreatedAt = 0;
    this.iceRestartAttempts = 0;
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

  /**
   * Recreate the underlying RTCPeerConnection after it enters failed/closed state.
   * The caller must re-add local tracks after calling this method.
   */
  recreateConnection(): void {
    // Clean up ICE restart timer and settle pending promise
    this.cancelPendingIceRestart('reset');

    // Clean up old connection
    this.pc.onconnectionstatechange = null;
    this.pc.oniceconnectionstatechange = null;
    this.pc.onicecandidate = null;
    this.pc.onnegotiationneeded = null;
    this.pc.ontrack = null;
    this.pc.close();

    // Reset negotiation state
    this.senders.clear();
    this.remoteStreams.clear();
    this.pendingIceCandidates = [];
    this.hasRemoteDescription = false;
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.lastOfferCreatedAt = 0;
    this.iceRestartAttempts = 0;

    for (const track of this.trackedTracks) {
      track.onended = null;
    }
    this.trackedTracks.clear();

    // Create fresh connection with same config
    this.pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
      iceCandidatePoolSize: this.config.iceCandidatePoolSize,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Connection state
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState as PeerConnectionState;

      // Reset ICE restart attempts on successful connection
      if (state === 'connected') {
        this.resetIceRestartAttempts();
      }

      this.callbacks.onConnectionStateChange(state);
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
