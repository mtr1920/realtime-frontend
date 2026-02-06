/**
 * Signaling Adapter
 *
 * Bridges WebRTC signaling to the WebSocket service.
 * Handles:
 * - Sending RTC messages (offer, answer, ICE candidates)
 * - Subscribing to incoming RTC messages
 */

import type {
  RTCOfferServerPayload,
  RTCAnswerServerPayload,
  RTCIceCandidateServerPayload,
  RTCMediaKind,
} from '@/features/realtime/types/messages';
import { getWebSocketService } from '@/features/realtime/services/websocket.service';

// =============================================================================
// Types
// =============================================================================

export interface SignalingCallbacks {
  onOffer: (fromParticipantId: string, sdp: string, mediaKind: RTCMediaKind) => void;
  onAnswer: (fromParticipantId: string, sdp: string, mediaKind: RTCMediaKind) => void;
  onIceCandidate: (fromParticipantId: string, candidate: RTCIceCandidateInit) => void;
  onParticipantJoined: (participantId: string) => void;
  onParticipantLeft: (participantId: string) => void;
}

// =============================================================================
// Signaling Adapter
// =============================================================================

export class SignalingAdapter {
  private unsubscribers: (() => void)[] = [];
  private callbacks: SignalingCallbacks;

  constructor(callbacks: SignalingCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start listening for signaling messages
   */
  subscribe(): void {
    const ws = getWebSocketService();
    if (!ws) {
      throw new Error('SignalingAdapter: WebSocket service not available');
    }

    // Subscribe to RTC messages
    this.unsubscribers.push(
      ws.subscribe('rtc.offer', (payload: RTCOfferServerPayload) => {
        this.callbacks.onOffer(
          payload.fromParticipantId,
          payload.sdp,
          payload.mediaKind
        );
      })
    );

    this.unsubscribers.push(
      ws.subscribe('rtc.answer', (payload: RTCAnswerServerPayload) => {
        this.callbacks.onAnswer(
          payload.fromParticipantId,
          payload.sdp,
          payload.mediaKind
        );
      })
    );

    this.unsubscribers.push(
      ws.subscribe('rtc.ice', (payload: RTCIceCandidateServerPayload) => {
        // Reconstruct RTCIceCandidateInit from decomposed fields
        // Backend sends: { candidate, sdpMid, sdpMLineIndex, fromParticipantId }
        const candidateInit: RTCIceCandidateInit = {
          candidate: payload.candidate,
          sdpMid: payload.sdpMid,
          sdpMLineIndex: payload.sdpMLineIndex,
        };
        this.callbacks.onIceCandidate(payload.fromParticipantId, candidateInit);
      })
    );

    // Subscribe to participant events
    // Backend sends flat fields: participantId, userId, roleId, displayName, joinedAt
    this.unsubscribers.push(
      ws.subscribe('session.participant.joined', (payload) => {
        this.callbacks.onParticipantJoined(payload.participantId);
      })
    );

    this.unsubscribers.push(
      ws.subscribe('session.participant.left', (payload) => {
        this.callbacks.onParticipantLeft(payload.participantId);
      })
    );
  }

  /**
   * Stop listening for signaling messages
   */
  unsubscribe(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  /**
   * Send an offer to a specific participant
   */
  async sendOffer(
    targetParticipantId: string,
    sdp: string,
    mediaKind: RTCMediaKind
  ): Promise<void> {
    const ws = getWebSocketService();
    if (!ws) {
      throw new Error('WebSocket not connected');
    }

    await ws.send('rtc.offer', {
      sdp,
      mediaKind,
      targetParticipantId,
    });
  }

  /**
   * Send an answer to a specific participant
   */
  async sendAnswer(
    targetParticipantId: string,
    sdp: string,
    mediaKind: RTCMediaKind
  ): Promise<void> {
    const ws = getWebSocketService();
    if (!ws) {
      throw new Error('WebSocket not connected');
    }

    await ws.send('rtc.answer', {
      sdp,
      mediaKind,
      targetParticipantId,
    });
  }

  /**
   * Send an ICE candidate to a specific participant
   */
  async sendIceCandidate(
    targetParticipantId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const ws = getWebSocketService();
    if (!ws) {
      throw new Error('WebSocket not connected');
    }

    // Backend expects decomposed ICE candidate fields
    await ws.send('rtc.ice', {
      candidate: candidate.candidate ?? '',
      sdpMid: candidate.sdpMid ?? null,
      sdpMLineIndex: candidate.sdpMLineIndex ?? null,
      targetParticipantId,
    });
  }

  /**
   * Request ICE restart with a specific participant
   */
  async requestIceRestart(targetParticipantId?: string): Promise<void> {
    const ws = getWebSocketService();
    if (!ws) {
      throw new Error('WebSocket not connected');
    }

    await ws.send('rtc.iceRestart', {
      targetParticipantId,
    });
  }

  /**
   * Notify server of media toggle
   */
  async sendMediaToggle(kind: 'audio' | 'video', enabled: boolean): Promise<void> {
    const ws = getWebSocketService();
    if (!ws) {
      throw new Error('WebSocket not connected');
    }

    await ws.send('media.toggle', { kind, enabled });
  }

  /**
   * Notify server of screen share start
   */
  async sendScreenShareStart(streamId: string): Promise<void> {
    const ws = getWebSocketService();
    if (!ws) {
      throw new Error('WebSocket not connected');
    }

    await ws.send('media.screenShare.start', { streamId });
  }

  /**
   * Notify server of screen share stop
   */
  async sendScreenShareStop(reason?: string): Promise<void> {
    const ws = getWebSocketService();
    if (!ws) {
      throw new Error('WebSocket not connected');
    }

    await ws.send('media.screenShare.stop', { reason });
  }
}
