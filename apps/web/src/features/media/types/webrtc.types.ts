/**
 * WebRTC Types
 *
 * Types for P2P mesh WebRTC connections.
 */

// =============================================================================
// Connection State
// =============================================================================

export type PeerConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export type ICEConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed';

export type ICEGatheringState = 'new' | 'gathering' | 'complete';

// =============================================================================
// Peer Info
// =============================================================================

export interface PeerInfo {
  participantId: string;
  displayName: string;
  connectionState: PeerConnectionState;
  iceConnectionState: ICEConnectionState;
  isPolite: boolean; // For perfect negotiation pattern
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  screenTrack: MediaStreamTrack | null;
}

// =============================================================================
// Connection Stats
// =============================================================================

export type NetworkQualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface PeerConnectionStats {
  participantId: string;
  roundTripTime: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage (0-100)
  bandwidth: {
    incoming: number; // bps
    outgoing: number; // bps
  };
  quality: NetworkQualityLevel;
  lastUpdated: number; // timestamp
}

// =============================================================================
// Track Types
// =============================================================================

export type TrackKind = 'audio' | 'video' | 'screen';

export interface RemoteTrack {
  participantId: string;
  trackId: string;
  track: MediaStreamTrack;
  kind: TrackKind;
  stream: MediaStream;
}

// =============================================================================
// Signaling Messages
// =============================================================================

export interface RTCOfferPayload {
  sdp: string;
  mediaKind: string;
  targetParticipantId?: string; // For client -> server
  fromParticipantId?: string; // For server -> client
}

export interface RTCAnswerPayload {
  sdp: string;
  mediaKind: string;
  targetParticipantId?: string;
  fromParticipantId?: string;
}

export interface RTCIceCandidatePayload {
  candidate: RTCIceCandidateInit;
  targetParticipantId?: string;
  fromParticipantId?: string;
}

export interface RTCIceRestartPayload {
  targetParticipantId?: string;
}

export interface MediaTogglePayload {
  kind: 'audio' | 'video';
  enabled: boolean;
}

export interface MediaScreenShareStartPayload {
  streamId: string;
}

export interface MediaScreenShareStopPayload {
  reason?: string;
}

export interface MediaStateChangedPayload {
  participantId: string;
  kind: string;
  enabled: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
}

export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

// =============================================================================
// Events
// =============================================================================

export type PeerConnectionEvent =
  | { type: 'connected'; participantId: string }
  | { type: 'disconnected'; participantId: string }
  | { type: 'failed'; participantId: string; error?: string }
  | { type: 'trackAdded'; participantId: string; track: RemoteTrack }
  | { type: 'trackRemoved'; participantId: string; trackId: string }
  | { type: 'statsUpdated'; stats: PeerConnectionStats };
