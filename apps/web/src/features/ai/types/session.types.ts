/**
 * AI Session Types
 *
 * Types for AI session management and state machine.
 */

// =============================================================================
// AI Session State Machine
// =============================================================================

/**
 * AI session state machine states.
 */
export type AISessionState =
  | 'idle'           // No AI session active
  | 'starting'       // Session being initialized
  | 'ready'          // Session ready, waiting for user input
  | 'listening'      // User is speaking (VAD detected or push-to-talk active)
  | 'processing'     // AI is processing user input
  | 'speaking'       // AI is generating/playing audio response
  | 'error'          // Error occurred
  | 'ending';        // Session being terminated

/**
 * AI turn management.
 */
export interface AITurn {
  /** Unique turn identifier */
  id: string;
  /** Who initiated this turn */
  initiator: 'user' | 'ai';
  /** Turn start timestamp */
  startedAt: number;
  /** Turn end timestamp (if complete) */
  endedAt?: number;
  /** User transcript for this turn */
  userText?: string;
  /** AI response text for this turn */
  aiText?: string;
  /** Whether the turn is complete */
  isComplete: boolean;
}

// =============================================================================
// AI Provider Types
// =============================================================================

/**
 * Available AI providers.
 */
export type AIProviderName = 'gemini-live' | 'openai-realtime';

/**
 * AI provider capabilities.
 */
export interface AICapabilities {
  /** Whether provider supports Voice Activity Detection */
  supportsVad: boolean;
  /** Whether provider supports tool/function calling */
  supportsTools: boolean;
  /** Whether provider supports session resumption */
  supportsResumption: boolean;
  /** Whether provider supports transcription */
  supportsTranscription: boolean;
  /** Input audio format requirements */
  inputAudioFormat: AudioFormat;
  /** Output audio format */
  outputAudioFormat: AudioFormat;
}

/**
 * Audio format specification.
 */
export interface AudioFormat {
  encoding: 'pcm' | 'opus';
  sampleRate: number;
  channels: number;
  bitDepth?: number;
}

// =============================================================================
// AI Session Info
// =============================================================================

/**
 * Active AI session information.
 */
export interface AISessionInfo {
  /** AI session identifier */
  aiSessionId: string;
  /** Active provider */
  provider: AIProviderName;
  /** Provider capabilities */
  capabilities: AICapabilities;
  /** Session start time */
  startedAt: number;
  /** Current turn (if any) */
  currentTurn?: AITurn;
  /** Turn history */
  turnHistory: AITurn[];
}

/**
 * AI session statistics.
 */
export interface AISessionStats {
  /** Total number of turns */
  turnCount: number;
  /** Total input audio duration in seconds */
  inputAudioSeconds: number;
  /** Total output audio duration in seconds */
  outputAudioSeconds: number;
  /** Input tokens used (if available) */
  inputTokens?: number;
  /** Output tokens used (if available) */
  outputTokens?: number;
}

// =============================================================================
// AI Error Types
// =============================================================================

/**
 * AI error codes from the backend and frontend.
 */
export type AIErrorCode =
  | 'PROVIDER_UNAVAILABLE'
  | 'SESSION_CREATION_FAILED'
  | 'SESSION_EXPIRED'
  | 'TURN_TIMEOUT'
  | 'AUDIO_PROCESSING_ERROR'
  | 'TOOL_EXECUTION_ERROR'
  | 'RATE_LIMITED'
  | 'CONTEXT_OVERFLOW'
  | 'INTERNAL_ERROR'
  // Frontend-specific error codes
  | 'TIMEOUT'      // Operation timed out (session start, turn response)
  | 'DISCONNECTED' // WebSocket disconnected during active session
  | 'DEVICE_ERROR'; // Audio device error (disconnected, in use)

/**
 * AI error structure.
 */
export interface AIError {
  /** Error code */
  code: AIErrorCode;
  /** Human-readable message */
  message: string;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Associated turn ID */
  turnId?: string;
}

// =============================================================================
// AI Session Callbacks
// =============================================================================

/**
 * Callbacks for AI session events.
 */
export interface AISessionCallbacks {
  /** Called when session state changes */
  onStateChange?: (state: AISessionState) => void;
  /** Called when AI starts speaking */
  onAISpeaking?: () => void;
  /** Called when AI stops speaking */
  onAIStoppedSpeaking?: () => void;
  /** Called with AI text output (streaming) */
  onTextDelta?: (text: string, isFinal: boolean) => void;
  /** Called with complete AI text response */
  onTextComplete?: (text: string) => void;
  /** Called when provider is switched */
  onProviderSwitch?: (from: AIProviderName, to: AIProviderName, reason: string) => void;
  /** Called when an error occurs */
  onError?: (error: AIError) => void;
  /** Called when session ends */
  onSessionEnd?: (stats?: AISessionStats) => void;
}

// =============================================================================
// AI Input Mode
// =============================================================================

/**
 * User input modes for AI interaction.
 */
export type AIInputMode =
  | 'push_to_talk'      // User holds button to speak
  | 'voice_activated';  // VAD detects when user speaks

// =============================================================================
// Message Payloads
// =============================================================================

/**
 * Payload for starting an AI session.
 */
export interface AISessionStartPayload {
  participantId: string;
  language?: string;
  voiceId?: string;
}

/**
 * Payload for AI session started response.
 */
export interface AISessionStartedPayload {
  aiSessionId: string;
  provider: AIProviderName;
  capabilities: AICapabilities;
}

/**
 * Payload for ending an AI session.
 */
export interface AISessionEndPayload {
  reason?: 'completed' | 'user_action' | 'error';
}

/**
 * Payload for AI session ended response.
 */
export interface AISessionEndedPayload {
  aiSessionId: string;
  reason: 'completed' | 'error' | 'timeout' | 'user_action';
  stats?: AISessionStats;
}

/**
 * Payload for appending audio input.
 */
export interface AIInputAudioAppendPayload {
  /** Base64 encoded PCM audio (16kHz, 16-bit, mono) */
  audio: string;
  turnId?: string;
}

/**
 * Payload for committing audio input (end of user speech).
 */
export interface AIInputAudioCommitPayload {
  turnId?: string;
}

/**
 * Payload for AI audio output chunk.
 */
export interface AIOutputAudioChunkPayload {
  /** Base64 encoded PCM audio */
  audio: string;
  turnId?: string;
  chunkIndex: number;
}

/**
 * Payload for AI audio output complete.
 */
export interface AIOutputAudioCompletePayload {
  turnId?: string;
  totalChunks: number;
  durationMs: number;
}

/**
 * Payload for AI text delta (streaming).
 */
export interface AIOutputTextDeltaPayload {
  text: string;
  turnId?: string;
  isFinal: boolean;
}

/**
 * Payload for AI text complete.
 */
export interface AIOutputTextCompletePayload {
  text: string;
  turnId?: string;
}

/**
 * Payload for AI error.
 */
export interface AIErrorPayload {
  code: AIErrorCode;
  message: string;
  recoverable: boolean;
  turnId?: string;
}

/**
 * Payload for provider switch notification.
 */
export interface AIProviderSwitchedPayload {
  from: AIProviderName;
  to: AIProviderName;
  reason: 'fallback' | 'manual' | 'health';
}

/**
 * Payload for VAD speech start.
 */
export interface AIVadSpeechStartPayload {
  turnId: string;
}

/**
 * Payload for VAD speech end.
 */
export interface AIVadSpeechEndPayload {
  turnId: string;
  durationMs: number;
}
