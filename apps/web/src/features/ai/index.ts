/**
 * AI Feature
 *
 * Public API for AI interaction capabilities including audio capture, playback, and session management.
 */

// Types - Audio Capture
export type {
  AudioCaptureConfig,
  AudioChunk,
  AudioCaptureError,
  AudioCaptureErrorType,
  AudioCaptureState,
  AudioCaptureCallbacks,
  WorkletInboundMessage,
  WorkletOutboundMessage,
} from './types/audio.types';

export { DEFAULT_AI_AUDIO_CONFIG } from './types/audio.types';

// Types - Audio Playback
export type {
  AudioPlaybackConfig,
  AudioPlaybackError,
  AudioPlaybackErrorType,
  AudioPlaybackState,
  AudioPlaybackCallbacks,
} from './types/audio.types';

export { DEFAULT_AI_PLAYBACK_CONFIG } from './types/audio.types';

// Types - AI Session
export type {
  AISessionState,
  AITurn,
  AIProviderName,
  AICapabilities,
  AudioFormat,
  AISessionInfo,
  AISessionStats,
  AIErrorCode,
  AIError,
  AISessionCallbacks,
  AIInputMode,
} from './types/session.types';

// Types - AI Actor
export type {
  AIActor,
  AIActorRole,
  AIActorPersona,
  AIActorVoice,
  AIActorAvatar,
  SelectedActor,
} from './types/actor.types';

// Services
export { audioCaptureService } from './services/audio-capture.service';
export { audioPlaybackService } from './services/audio-playback.service';

// Hooks
export { useAudioCapture } from './hooks/useAudioCapture';
export { useAudioPlayback } from './hooks/useAudioPlayback';
export { useAISession } from './hooks/useAISession';

// Schemas
export {
  aiActorSchema,
  personaSchema,
  voiceSchema,
  avatarSchema,
  aiActorRoles,
  personaStyles,
  personaTraits,
  avatarTypes,
  voiceGenders,
  roleLabels,
  styleLabels,
  traitLabels,
  avatarTypeLabels,
  defaultAIActor,
  defaultPersona,
  defaultVoice,
  defaultAvatar,
  type AIActorFormData,
} from './schemas/actor.schema';

// Components
export { AIControls, CompactAIControls } from './components/AIControls';
export { AIPanel } from './components/AIPanel';
export { AIStatusIndicator, InlineAIStatus } from './components/AIStatusIndicator';
export {
  AIProviderNotification,
  useProviderSwitchNotification,
  type ProviderSwitchReason,
} from './components/AIProviderNotification';
export { AITranscript, CompactTranscript, type TranscriptEntry } from './components/AITranscript';
export { AIActorProfile, AIActorSelector, CompactActorDisplay } from './components/AIActorProfile';
export { AIActorForm } from './components/AIActorForm';
