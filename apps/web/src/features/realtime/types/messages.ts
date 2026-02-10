/**
 * WebSocket message types and payloads
 *
 * These types extend the protocol envelope types with specific payloads
 * for each message type.
 */

import type {
  Session,
  Participant,
  SessionStatus,
  MediaState,
  ConnectionState,
  PublicRoleConfig,
} from '@protocol/index';
import type { ParticipantStatus } from '@/types';

// =============================================================================
// Connection State
// =============================================================================

/**
 * WebSocket connection state
 */
export type WebSocketConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

// =============================================================================
// Client Message Payloads (Client -> Server)
// =============================================================================

/**
 * session.join payload (Client -> Server)
 * NOTE: Authentication is via realtime token in WebSocket subprotocol header,
 * NOT in the message payload. The accessToken field was removed per backend contract.
 */
export interface JoinSessionPayload {
  /** Role ID the user is joining as (required by backend) */
  roleId: string;
  /** Display name shown to other participants */
  displayName: string;
  /** Device information for analytics and debugging */
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
  };
}

/**
 * session.resume payload (Client -> Server)
 * Used for reconnection to resume a session with replay of missed events.
 */
export interface ResumeSessionPayload {
  /** Last server sequence number received before disconnect */
  lastServerSeq: number;
  /** Optional connection ID from previous connection */
  connectionId?: string;
}

export interface LeaveSessionPayload {
  /** Reason for leaving - matches backend enum */
  reason?: 'user_action' | 'timeout' | 'error';
}

/**
 * session.ready payload (Client -> Server)
 * Sent after room UI and media are initialized, triggers participant.joined broadcast.
 */
export interface SessionReadyPayload {
  /** Status of media initialization */
  mediaStatus: 'initialized' | 'skipped' | 'failed';
  /** Reason if media was skipped (observer role, no media modules, permissions denied) */
  skipReason?: 'observer' | 'no_media_modules' | 'permissions_denied';
}

/**
 * session.ready.response payload (Server -> Client)
 * Confirms whether the participant announcement was broadcast.
 */
export interface SessionReadyResponsePayload {
  announced: boolean;
  participantId: string;
}

export interface KickParticipantPayload {
  /** ID of the participant to remove from the session */
  participantId: string;
  /** Optional reason for kicking the participant */
  reason?: string;
}

export interface MediaPublishPayload {
  trackId: string;
  kind: 'audio' | 'video' | 'screen';
  enabled: boolean;
}

export interface MediaUnpublishPayload {
  trackId: string;
}

export interface MediaSubscribePayload {
  participantId: string;
  trackId: string;
}

export interface ChatMessagePayload {
  content: string;
  recipientId?: string; // For private messages
}

export interface AIStartPayload {
  provider?: string;
}

export interface AIStopPayload {
  reason?: string;
}

// =============================================================================
// AI Session Payloads (Client -> Server)
// =============================================================================

export interface AISessionStartPayload {
  participantId: string;
  language?: string;
  voiceId?: string;
}

export interface AISessionEndPayload {
  reason?: 'completed' | 'user_action' | 'error';
}

export interface AITurnStartPayload {
  turnId: string;
}

export interface AITurnEndPayload {
  turnId: string;
}

export interface AIInputAudioAppendPayload {
  /** Base64 encoded PCM audio (16kHz, 16-bit, mono) */
  audio: string;
  turnId?: string;
}

export interface AIInputAudioCommitPayload {
  turnId?: string;
}

// =============================================================================
// RTC Signaling Payloads (Client -> Server)
// =============================================================================

export interface RTCOfferClientPayload {
  sdp: string;
  mediaKind: RTCMediaKind;
  targetParticipantId?: string;
}

export interface RTCAnswerClientPayload {
  sdp: string;
  mediaKind: RTCMediaKind;
  targetParticipantId?: string;
}

export interface RTCIceCandidateClientPayload {
  /** ICE candidate string (extracted from RTCIceCandidateInit.candidate) */
  candidate: string;
  /** SDP media ID (extracted from RTCIceCandidateInit.sdpMid) */
  sdpMid: string | null;
  /** SDP m-line index (extracted from RTCIceCandidateInit.sdpMLineIndex) */
  sdpMLineIndex: number | null;
  /** Target participant for the ICE candidate */
  targetParticipantId?: string;
}

export interface RTCIceRestartPayload {
  targetParticipantId?: string;
}

export interface MediaTogglePayload {
  kind: 'audio' | 'video';
  enabled: boolean;
}

export interface ScreenShareStartPayload {
  streamId: string;
}

export interface ScreenShareStopPayload {
  reason?: string;
}

// =============================================================================
// Compliance Payloads (Client -> Server)
// =============================================================================

export interface ComplianceViolationClientPayload {
  /** Violation type (flat structure - not nested in 'violation' object to match backend) */
  type: ViolationType;
  /** Severity level */
  severity: ViolationSeverity;
  /** Additional details about the violation */
  details?: Record<string, unknown>;
  /** ISO 8601 timestamp when violation occurred */
  timestamp: string;
}

export interface ComplianceScreenshotSavePayload {
  /** Base64 encoded image data (encrypted if 'encrypted' is true) */
  imageData: string;
  /** Initialization vector for encrypted data (required if encrypted) */
  iv?: string;
  /** Whether the imageData is encrypted */
  encrypted?: boolean;
  /** Image format */
  format: 'png' | 'jpeg';
  /** Reason for capture */
  reason: 'scheduled' | 'violation' | 'manual';
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface EncryptionKeyExchangePayload {
  /** Base64 encoded encryption key */
  key: string;
  /** Algorithm used for encryption */
  algorithm: 'AES-GCM';
}

/**
 * compliance.verification.result payload (Client -> Server)
 * Field names match backend VerificationResultPayload contract.
 */
export interface ComplianceVerificationResultPayload {
  /** Verification ID from the request (renamed from challengeId to match backend) */
  verificationId: string;
  /** Whether verification passed (renamed from success to match backend) */
  passed: boolean;
  /** Optional response text */
  response?: string;
  /** Optional confidence score */
  confidence?: number;
}

// =============================================================================
// Recording Payloads (Client -> Server)
// =============================================================================

/**
 * Recording type options.
 * Matches backend RecordingType enum.
 */
export type RecordingType = 'audio' | 'video' | 'screen' | 'mixed';

export interface RecordingStartPayload {
  /** Types of recording to start (required by backend) */
  types: RecordingType[];
  /** User consent for recording */
  consent: boolean;
}

export interface RecordingStopPayload {
  reason: 'user_action' | 'session_end' | 'error';
}

export interface RecordingChunkPayload {
  /** Recording ID from server */
  recordingId: string;
  /** Chunk index (0-based) */
  chunkIndex: number;
  /** Base64 encoded chunk data */
  data: string;
  /** MIME type of the recording */
  mimeType: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Whether this is the final chunk */
  isFinal: boolean;
}

// =============================================================================
// Transcript Payloads (Client -> Server)
// =============================================================================

export interface TranscriptSyncRequestPayload {
  fromTurnId?: string;
}

// =============================================================================
// Server Message Payloads (Server -> Client)
// =============================================================================

// =============================================================================
// Session Snapshot Types (for session.snapshot message)
// Matches backend SessionSnapshotPayload from protocol/messages/session.ts
// Backend sends session.snapshot in response to session.join (single source of truth)
// =============================================================================

export interface IceServerConfig {
  urls: string | readonly string[];
  username?: string;
  credential?: string;
}

export interface RolePermissionsSnapshot {
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canShareScreen: boolean;
  canInteractWithAI: boolean;
  canEndSession: boolean;
  canViewComplianceData: boolean;
  canRemoveParticipants: boolean;
  canStartRecording: boolean;
  canViewTranscript: boolean;
  canChat: boolean;
  // Communication
  canSendPrivateMessages: boolean;
  // Outcome permissions
  canViewOutcome: boolean;
  canEditOutcome: boolean;
  canApproveOutcome: boolean;
  // Phase control
  canAdvancePhase: boolean;
  canRevertPhase: boolean;
}

export interface RoleSnapshot {
  id: string;
  name: string;
  permissions: RolePermissionsSnapshot;
}

export interface ModulesSnapshot {
  ai: boolean;
  compliance: boolean;
  recording: boolean;
  transcription: boolean;
}

export interface ConstraintsSnapshot {
  maxDurationMinutes: number;
  maxParticipants: number;
}

export interface SessionConfigSnapshot {
  domainType: string;
  roles: RoleSnapshot[];
  modules: ModulesSnapshot;
  constraints: ConstraintsSnapshot;
}

// Re-export ParticipantStatus from domain types for convenience
export type { ParticipantStatus };

export interface ParticipantMediaState {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
}

export interface ParticipantSnapshot {
  id: string;
  userId?: string;
  roleId: string;
  /** Human-readable role name (if available) */
  roleName?: string;
  /** Role permissions snapshot for UI rendering */
  rolePermissions?: ParticipantRolePermissionsSnapshot;
  /** Role-based avatar URL or asset path */
  avatarUrl?: string;
  displayName: string;
  status: ParticipantStatus;
  connectionId?: string;
  mediaState: ParticipantMediaState;
  joinedAt?: string;
}

/**
 * Participant role permissions snapshot for UI rendering.
 * This mirrors the frontend participant role permission shape.
 */
export interface ParticipantRolePermissionsSnapshot {
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canScreenShare: boolean;
  canChat: boolean;
  canEndSession: boolean;
  canRemoveParticipants: boolean;
  canStartRecording: boolean;
  canViewTranscript: boolean;
  canInteractWithAI: boolean;
  canViewComplianceData: boolean;
  // Communication
  canSendPrivateMessages: boolean;
  // Outcome permissions
  canViewOutcome: boolean;
  canEditOutcome: boolean;
  canApproveOutcome: boolean;
  // Phase control
  canAdvancePhase: boolean;
  canRevertPhase: boolean;
}

export interface MissedEvent {
  type: string;
  serverSeq: number;
  ts: string;
  payload: unknown;
}

/**
 * session.snapshot payload (Server -> Client)
 * Rich session state sent on join/resume. Matches backend SessionSnapshotPayload.
 *
 * Standard format:
 * - roleConfig is the canonical role-centric configuration for the joining participant.
 * - config is optional and only present when provided by the session service.
 */
export interface SessionSnapshotPayload {
  sessionId: string;
  status: SessionStatus;
  phase?: string;
  /** Canonical role-centric config for the joining participant */
  roleConfig: PublicRoleConfig;
  /** Optional session config payload (if provided by the session service) */
  config?: SessionConfigSnapshot;
  participants: ParticipantSnapshot[];
  serverSeq: number;
  startedAt?: string;
  expiresAt: string;
  /** ICE servers for WebRTC connectivity (TURN/STUN) */
  iceServers?: readonly IceServerConfig[];
  /** ICE server credential expiration time (ISO string) */
  iceServersExpiresAt?: string;
  /** Missed events for replay on session.resume */
  missedEvents?: readonly MissedEvent[];
  /**
   * ID of the local participant (the user receiving this snapshot).
   * Used to identify which participant the local user is.
   */
  localParticipantId?: string;
}

/**
 * Type guard to check if a snapshot has role config.
 */
export function hasRoleConfig(
  snapshot: SessionSnapshotPayload
): snapshot is SessionSnapshotPayload & { roleConfig: PublicRoleConfig } {
  return !!snapshot.roleConfig;
}

export interface SessionLeftPayload {
  reason: 'user_left' | 'kicked' | 'session_ended' | 'error';
  message?: string;
}

export interface SessionStatePayload {
  session: Session;
  participants: Participant[];
}

/**
 * Participant joined payload (Server -> Client).
 * Backend sends flat fields, not a nested participant object.
 */
export interface ParticipantJoinedPayload {
  participantId: string;
  userId?: string;
  roleId: string;
  /** Human-readable role name (if available) */
  roleName?: string;
  /** Role permissions snapshot for UI rendering */
  rolePermissions?: ParticipantRolePermissionsSnapshot;
  /** Role-based avatar URL or asset path */
  avatarUrl?: string;
  displayName: string;
  joinedAt: string;
}

/**
 * Participant left payload.
 * Reason enum matches backend ParticipantLeftPayload.
 */
export interface ParticipantLeftPayload {
  participantId: string;
  /** Reason for leaving - matches backend enum */
  reason: 'user_action' | 'timeout' | 'removed' | 'error';
  /** When the participant left (ISO string) */
  leftAt: string;
}

export interface ParticipantUpdatedPayload {
  participantId: string;
  changes: {
    displayName?: string;
    connectionState?: ConnectionState;
    mediaState?: Partial<MediaState>;
    role?: Participant['role'];
  };
}

export interface SessionStatusChangedPayload {
  status: SessionStatus;
  reason?: string;
}

export interface MediaTrackAddedPayload {
  participantId: string;
  trackId: string;
  kind: 'audio' | 'video' | 'screen';
}

export interface MediaTrackRemovedPayload {
  participantId: string;
  trackId: string;
}

export interface ChatMessageReceivedPayload {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isPrivate: boolean;
}

export interface AITranscriptPayload {
  participantId: string;
  text: string;
  isFinal: boolean;
  timestamp: string;
}

export interface AIStatusPayload {
  active: boolean;
  provider?: string;
  error?: string;
}

// =============================================================================
// AI Session Payloads (Server -> Client)
// =============================================================================

export type AIProviderName = 'gemini-live' | 'openai-realtime';

export interface AICapabilities {
  supportsVad: boolean;
  supportsTools: boolean;
  supportsResumption: boolean;
  supportsTranscription: boolean;
  inputAudioFormat: { encoding: string; sampleRate: number; channels: number };
  outputAudioFormat: { encoding: string; sampleRate: number; channels: number };
}

export interface AISessionStartedPayload {
  aiSessionId: string;
  provider: AIProviderName;
  capabilities: AICapabilities;
}

export interface AISessionEndedPayload {
  aiSessionId: string;
  reason: 'completed' | 'error' | 'timeout' | 'user_action';
  stats?: {
    turnCount: number;
    inputAudioSeconds: number;
    outputAudioSeconds: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface AIOutputAudioChunkPayload {
  /** Base64 encoded PCM audio */
  audio: string;
  turnId?: string;
  chunkIndex: number;
}

export interface AIOutputAudioCompletePayload {
  turnId?: string;
  totalChunks: number;
  durationMs: number;
}

export interface AIOutputTextDeltaPayload {
  text: string;
  turnId?: string;
  isFinal: boolean;
}

export interface AIOutputTextCompletePayload {
  text: string;
  turnId?: string;
}

/**
 * AI turn complete payload (Server -> Client)
 * Sent when an AI turn completes with usage statistics.
 */
export interface AITurnCompletePayload {
  turnId: string;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIErrorPayload {
  code: string;
  message: string;
  recoverable: boolean;
  turnId?: string;
}

export interface AIProviderSwitchedPayload {
  from: AIProviderName;
  to: AIProviderName;
  reason: 'fallback' | 'manual' | 'health';
}

export interface AIVadSpeechStartPayload {
  turnId: string;
}

export interface AIVadSpeechEndPayload {
  turnId: string;
  durationMs: number;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Compliance Payloads (Server -> Client)
// =============================================================================

export type ViolationType =
  | 'tab_switch'
  | 'window_blur'
  | 'copy_paste'
  | 'keyboard_shortcut'
  | 'screen_capture_attempt'
  | 'multiple_faces'
  | 'no_face'
  | 'suspicious_audio'
  | 'custom';

export type ViolationSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type ViolationAction = 'logged' | 'warned' | 'paused' | 'terminated';

export interface ComplianceViolation {
  id: string;
  type: ViolationType;
  severity: ViolationSeverity;
  action: ViolationAction;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ComplianceViolationPayload {
  violation: ComplianceViolation;
}

export interface OutcomeReadyPayload {
  outcomeId: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface OutcomeUpdatedPayload {
  outcomeId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

// =============================================================================
// Compliance Payloads (Server -> Client) - Extended
// =============================================================================

/**
 * Screenshot saved payload (Server -> Client).
 * Matches backend ScreenshotSavedPayload.
 */
export interface ComplianceScreenshotSavedPayload {
  screenshotId: string;
  /** When the screenshot was saved (ISO string) */
  savedAt: string;
}

/**
 * Verification type enum.
 * Matches backend VerificationType.
 */
export type VerificationType = 'challenge_question' | 'biometric' | 'custom';

/**
 * Verification request payload (Server -> Client).
 * Field names match backend VerificationRequestPayload.
 */
export interface ComplianceVerificationRequestPayload {
  /** Verification ID (renamed from challengeId to match backend) */
  verificationId: string;
  type: VerificationType;
  /** Optional prompt text */
  prompt?: string;
  timeoutSeconds: number;
  /** Optional choice options */
  options?: string[];
}

// =============================================================================
// Recording Payloads (Server -> Client)
// =============================================================================

export type RecordingStatus =
  | 'pending'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Recording started payload (Server -> Client).
 * Matches backend RecordingStartedPayload.
 */
export interface RecordingStartedPayload {
  recordingId: string;
  /** Types of recording active */
  types: RecordingType[];
  /** When recording started (ISO string) */
  startedAt: string;
}

/**
 * Recording stopped payload (Server -> Client).
 * Matches backend RecordingStoppedPayload.
 */
export interface RecordingStoppedPayload {
  recordingId: string;
  /** When recording stopped (ISO string) */
  stoppedAt: string;
  /** Reason for stopping - matches backend enum */
  reason: 'user_action' | 'session_end' | 'error' | 'limit_reached';
}

/**
 * Recording status update payload (Server -> Client).
 * Matches backend RecordingStatusPayload.
 */
export interface RecordingStatusPayload {
  recordingId: string;
  status: RecordingStatus;
  /** Duration in seconds (not ms - matches backend) */
  durationSeconds: number;
  /** Optional size in bytes */
  sizeBytes?: number;
}

/**
 * Recording finalized payload (Server -> Client).
 * Matches backend RecordingFinalizedPayload.
 */
export interface RecordingFinalizedPayload {
  recordingId: string;
  /** When recording was finalized (ISO string) */
  finalizedAt: string;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Total size in bytes */
  sizeBytes: number;
  /** Optional download URL (may require auth) */
  downloadUrl?: string;
  /** When the download URL expires (ISO string) */
  expiresAt?: string;
}

/**
 * Recording error codes.
 * Matches backend RecordingErrorCode type.
 */
export type RecordingErrorCode =
  | 'STORAGE_ERROR'
  | 'ENCODING_ERROR'
  | 'LIMIT_EXCEEDED'
  | 'PERMISSION_DENIED'
  | 'INTERNAL_ERROR';

/**
 * Recording error payload (Server -> Client).
 * Matches backend RecordingErrorPayload.
 */
export interface RecordingErrorPayload {
  recordingId?: string;
  code: RecordingErrorCode;
  message: string;
}

// =============================================================================
// Transcript Payloads (Server -> Client)
// =============================================================================

export interface TranscriptTurn {
  turnId: string;
  speakerRole: string;
  speakerId?: string;
  speakerName?: string;
  content: string;
  isFinal: boolean;
  confidence?: number;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
}

export interface TranscriptAppendPayload {
  turnId: string;
  speakerRole: string;
  speakerId?: string;
  speakerName?: string;
  content: string;
  isFinal: boolean;
  confidence?: number;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
}

export interface TranscriptUpdatePayload {
  turnId: string;
  content: string;
  isFinal: boolean;
}

export interface TranscriptSyncResponsePayload {
  turns: TranscriptTurn[];
  hasMore: boolean;
  nextCursor?: string;
}

// =============================================================================
// RTC Signaling Payloads (Server -> Client)
// =============================================================================

export type RTCMediaKind = 'camera' | 'microphone' | 'screen' | 'media';

export interface RTCOfferServerPayload {
  sdp: string;
  mediaKind: RTCMediaKind;
  fromParticipantId: string;
}

export interface RTCAnswerServerPayload {
  sdp: string;
  mediaKind: RTCMediaKind;
  fromParticipantId: string;
}

/**
 * RTC ICE Candidate Server Payload (Server -> Client)
 * Backend sends decomposed ICE candidate fields, not the full RTCIceCandidateInit object.
 */
export interface RTCIceCandidateServerPayload {
  /** ICE candidate string */
  candidate: string;
  /** SDP media ID */
  sdpMid: string | null;
  /** SDP m-line index */
  sdpMLineIndex: number | null;
  /** ID of the participant who sent the candidate */
  fromParticipantId: string;
}

/**
 * rtc.iceRestart relay payload (Server -> Client)
 */
export interface RTCIceRestartServerPayload {
  fromParticipantId: string;
}

/**
 * rtc.offer/rtc.answer/rtc.ice response payloads (Server -> Client)
 */
export interface RTCRelayStatusPayload {
  relayed: boolean;
}

/**
 * rtc.iceRestart.initiated response payload (Server -> Client)
 */
export interface RTCIceRestartInitiatedPayload {
  restartInitiated: boolean;
}

export interface MediaStateChangedPayload {
  participantId: string;
  kind: 'audio' | 'video' | 'screen';
  enabled: boolean;
}

// =============================================================================
// RTC Producer/Consumer Payloads (Server -> Client)
// Backend uses rtc.producer.* and rtc.consumer.* instead of media.publish/subscribe
// =============================================================================

export interface RTCProducerAddPayload {
  participantId: string;
  producerId: string;
  kind: 'audio' | 'video';
  trackId?: string;
}

export interface RTCProducerRemovePayload {
  participantId: string;
  producerId: string;
}

export interface RTCConsumerAddPayload {
  participantId: string;
  consumerId: string;
  producerId: string;
  kind: 'audio' | 'video';
  trackId?: string;
  rtpParameters?: Record<string, unknown>;
}

export interface RTCConsumerRemovePayload {
  consumerId: string;
}

// =============================================================================
// Session Lifecycle Payloads (Server -> Client)
// =============================================================================

export interface SessionCompletedPayload {
  sessionId: string;
  completedAt: string;
  duration: number;
  summary?: {
    participantCount: number;
    eventCount: number;
    aiTurnCount?: number;
    recordingAvailable: boolean;
    transcriptAvailable: boolean;
  };
}

export interface SessionExpiredPayload {
  sessionId: string;
  expiresAt: string;
}

// =============================================================================
// Media Screen Share Payloads (Server -> Client)
// =============================================================================

export interface MediaScreenShareRequestPayload {
  requesterId: string;
  requesterName: string;
}

export interface MediaScreenShareStatusPayload {
  participantId: string;
  isSharing: boolean;
  streamId?: string;
}

// =============================================================================
// AI Tool Call Payload (Server -> Client)
// =============================================================================

/**
 * AI tool call payload.
 * Field names match backend AIToolCallPayload contract.
 */
export interface AIToolCallPayload {
  toolCallId: string;
  /** Tool name (renamed from toolName to match backend) */
  name: string;
  arguments: Record<string, unknown>;
}

// =============================================================================
// Transcript Ack Payload (Server -> Client)
// =============================================================================

export interface TranscriptAckPayload {
  turnId: string;
  storedAt: string;
}

// =============================================================================
// Message Type Mapping
// =============================================================================

/**
 * Maps client message types to their payloads
 */
export interface ClientMessagePayloads {
  'session.join': JoinSessionPayload;
  'session.ready': SessionReadyPayload;
  'session.resume': ResumeSessionPayload;
  'session.leave': LeaveSessionPayload;
  'session.participant.kick': KickParticipantPayload;
  'session.state.request': Record<string, never>;
  // Removed media.publish/unpublish/subscribe/unsubscribe - backend uses rtc.producer/consumer
  'media.toggle': MediaTogglePayload;
  'media.screenShare.start': ScreenShareStartPayload;
  'media.screenShare.stop': ScreenShareStopPayload;
  'rtc.offer': RTCOfferClientPayload;
  'rtc.answer': RTCAnswerClientPayload;
  'rtc.ice': RTCIceCandidateClientPayload;
  'rtc.iceRestart': RTCIceRestartPayload;
  'chat.message': ChatMessagePayload;
  'ai.start': AIStartPayload;
  'ai.stop': AIStopPayload;
  'ai.session.start': AISessionStartPayload;
  'ai.session.end': AISessionEndPayload;
  'ai.turn.start': AITurnStartPayload;
  'ai.turn.end': AITurnEndPayload;
  'ai.input.audio.append': AIInputAudioAppendPayload;
  'ai.input.audio.commit': AIInputAudioCommitPayload;
  'compliance.violation': ComplianceViolationClientPayload;
  'compliance.screenshot.save': ComplianceScreenshotSavePayload;
  'compliance.verification.result': ComplianceVerificationResultPayload;
  'compliance.encryption.keyExchange': EncryptionKeyExchangePayload;
  'recording.start': RecordingStartPayload;
  'recording.stop': RecordingStopPayload;
  'recording.encryption.keyExchange': EncryptionKeyExchangePayload;
  // Removed recording.chunk - backend doesn't support chunked upload from client
  'transcript.sync.request': TranscriptSyncRequestPayload;
  ping: Record<string, never>;
}

/**
 * Extended client message type that includes all locally defined message types
 * This allows the frontend to send messages beyond what the protocol defines
 */
export type ExtendedClientMessageType = keyof ClientMessagePayloads;

/**
 * Maps server message types to their payloads
 */
export interface ServerMessagePayloads {
  'session.snapshot': SessionSnapshotPayload;
  'session.ready.response': SessionReadyResponsePayload;
  'session.left': SessionLeftPayload;
  'session.state': SessionStatePayload;
  'session.participant.joined': ParticipantJoinedPayload;
  'session.participant.left': ParticipantLeftPayload;
  'session.participant.updated': ParticipantUpdatedPayload;
  'session.status.changed': SessionStatusChangedPayload;
  // Added session lifecycle events sent by backend
  'session.completed': SessionCompletedPayload;
  'session.expired': SessionExpiredPayload;
  'media.track.added': MediaTrackAddedPayload;
  'media.track.removed': MediaTrackRemovedPayload;
  'media.state.changed': MediaStateChangedPayload;
  // Added screen share status from backend
  'media.screenShare.request': MediaScreenShareRequestPayload;
  'media.screenShare.status': MediaScreenShareStatusPayload;
  // RTC producer/consumer events from backend (instead of media.publish/subscribe)
  'rtc.producer.add': RTCProducerAddPayload;
  'rtc.producer.remove': RTCProducerRemovePayload;
  'rtc.consumer.add': RTCConsumerAddPayload;
  'rtc.consumer.remove': RTCConsumerRemovePayload;
  'rtc.offer': RTCOfferServerPayload;
  'rtc.answer': RTCAnswerServerPayload;
  'rtc.ice': RTCIceCandidateServerPayload;
  'rtc.iceRestart': RTCIceRestartServerPayload;
  'rtc.offer.relayed': RTCRelayStatusPayload;
  'rtc.answer.relayed': RTCRelayStatusPayload;
  'rtc.ice.relayed': RTCRelayStatusPayload;
  'rtc.iceRestart.initiated': RTCIceRestartInitiatedPayload;
  'chat.message': ChatMessageReceivedPayload;
  'ai.transcript': AITranscriptPayload;
  'ai.status': AIStatusPayload;
  'ai.session.started': AISessionStartedPayload;
  'ai.session.ended': AISessionEndedPayload;
  'ai.output.audio.chunk': AIOutputAudioChunkPayload;
  'ai.output.audio.complete': AIOutputAudioCompletePayload;
  'ai.output.text.delta': AIOutputTextDeltaPayload;
  'ai.output.text.complete': AIOutputTextCompletePayload;
  'ai.turn.complete': AITurnCompletePayload;
  'ai.error': AIErrorPayload;
  'ai.provider.switched': AIProviderSwitchedPayload;
  'ai.vad.speechStart': AIVadSpeechStartPayload;
  'ai.vad.speechEnd': AIVadSpeechEndPayload;
  // Added AI tool call from backend
  'ai.tool.call': AIToolCallPayload;
  'outcome.ready': OutcomeReadyPayload;
  'outcome.updated': OutcomeUpdatedPayload;
  'compliance.violation': ComplianceViolationPayload;
  'compliance.screenshot.saved': ComplianceScreenshotSavedPayload;
  'compliance.verification.request': ComplianceVerificationRequestPayload;
  'recording.started': RecordingStartedPayload;
  'recording.stopped': RecordingStoppedPayload;
  'recording.status': RecordingStatusPayload;
  'recording.finalized': RecordingFinalizedPayload;
  'recording.error': RecordingErrorPayload;
  'transcript.append': TranscriptAppendPayload;
  'transcript.update': TranscriptUpdatePayload;
  'transcript.sync.response': TranscriptSyncResponsePayload;
  // Added transcript acknowledgment from backend
  'transcript.ack': TranscriptAckPayload;
  error: ErrorPayload;
  pong: Record<string, never>;
}

// =============================================================================
// Typed Message Envelopes
// =============================================================================

/**
 * Protocol version type (matches backend protocol)
 */
export type ProtocolVersion = 1;

/**
 * Current protocol version
 */
export const PROTOCOL_VERSION: ProtocolVersion = 1;

/**
 * Message acknowledgment from server (per-message delivery confirmation)
 */
export interface MessageAck {
  /** ID of the acknowledged client message */
  id: string;
  /** Status of the acknowledgment */
  status: 'ok' | 'error';
  /** Error details if status is 'error' */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Typed client message with specific payload
 * Matches backend protocol/envelope.ts ClientMessage interface
 */
export interface TypedClientMessage<T extends ExtendedClientMessageType> {
  /** Protocol version */
  v: ProtocolVersion;
  /** Unique message ID for idempotency */
  id: string;
  /** ISO 8601 timestamp */
  ts: string;
  /** Message type */
  type: T;
  /** Session ID */
  sessionId: string;
  /** Client-side sequence number */
  clientSeq: number;
  /** Last seen server sequence number */
  lastServerSeq: number;
  /** Message payload */
  payload: ClientMessagePayloads[T];
}

/**
 * Typed server message with specific payload
 * Matches backend protocol/envelope.ts ServerMessage interface
 */
export interface TypedServerMessage<T extends keyof ServerMessagePayloads> {
  /** Protocol version */
  v: ProtocolVersion;
  /** Unique message ID */
  id: string;
  /** ISO 8601 timestamp */
  ts: string;
  /** Message type */
  type: T;
  /** Monotonic server sequence number per session */
  serverSeq: number;
  /** Message payload */
  payload: ServerMessagePayloads[T];
  /** Optional acknowledgment for client message */
  ack?: MessageAck;
}

/**
 * Generic server message (for type-narrowing)
 */
export type AnyServerMessage = {
  [K in keyof ServerMessagePayloads]: TypedServerMessage<K>;
}[keyof ServerMessagePayloads];

// =============================================================================
// Message Handler Types
// =============================================================================

/**
 * Handler for a specific server message type
 */
export type MessageHandler<T extends keyof ServerMessagePayloads> = (
  payload: ServerMessagePayloads[T],
  message: TypedServerMessage<T>
) => void;

/**
 * Map of message handlers by type
 */
export type MessageHandlerMap = {
  [K in keyof ServerMessagePayloads]?: Set<MessageHandler<K>>;
};
