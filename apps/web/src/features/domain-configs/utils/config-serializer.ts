/**
 * Config Serializer Utilities
 *
 * Parse configJson into typed sections for panels and serialize back on submit.
 * Preserves unknown properties to allow flexible config extension.
 */

import type { AIActorFormData } from '@/features/ai';
import {
  defaultRecordingConfig,
  type RecordingConfig,
} from '../components/RecordingConfigPanel';
import {
  defaultObserverConfig,
  type ObserverConfig,
} from '../components/ObserverConfigPanel';

// =============================================================================
// Types
// =============================================================================

export interface AIConfig {
  /** Whether AI is enabled */
  enabled: boolean;
  /** AI provider (e.g., 'openai') */
  provider?: string;
  /** List of AI actors */
  actors: AIActorFormData[];
}

export interface ParsedDomainConfig {
  /** Recording configuration */
  recording: RecordingConfig;
  /** Observer configuration */
  observers: ObserverConfig;
  /** AI configuration */
  ai: AIConfig;
  /** All other properties (preserved for flexible config extension) */
  other: Record<string, unknown>;
}

// =============================================================================
// Default AI Config
// =============================================================================

export const defaultAIConfig: AIConfig = {
  enabled: false,
  provider: 'openai',
  actors: [],
};

// =============================================================================
// Parse Config JSON
// =============================================================================

/**
 * Parse a configJson object into typed sections for panel editing.
 */
export function parseConfigJson(configJson: Record<string, unknown>): ParsedDomainConfig {
  const { recording, observers, ai, ...other } = configJson;

  return {
    recording: parseRecordingConfig(recording),
    observers: parseObserverConfig(observers),
    ai: parseAIConfig(ai),
    other,
  };
}

function parseRecordingConfig(data: unknown): RecordingConfig {
  if (!data || typeof data !== 'object') {
    return { ...defaultRecordingConfig };
  }

  const config = data as Record<string, unknown>;

  return {
    enabled: typeof config.enabled === 'boolean' ? config.enabled : defaultRecordingConfig.enabled,
    consentType: isConsentType(config.consentType)
      ? config.consentType
      : defaultRecordingConfig.consentType,
    retentionDays:
      typeof config.retentionDays === 'number'
        ? config.retentionDays
        : defaultRecordingConfig.retentionDays,
    autoStart:
      typeof config.autoStart === 'boolean'
        ? config.autoStart
        : defaultRecordingConfig.autoStart,
    audioMix: parseAudioMix(config.audioMix),
    video: parseVideoConfig(config.video),
  };
}

function parseAudioMix(data: unknown): RecordingConfig['audioMix'] {
  if (!data || typeof data !== 'object') {
    return { ...defaultRecordingConfig.audioMix };
  }

  const mix = data as Record<string, unknown>;
  return {
    includeParticipants:
      typeof mix.includeParticipants === 'boolean'
        ? mix.includeParticipants
        : defaultRecordingConfig.audioMix.includeParticipants,
    includeAIAudio:
      typeof mix.includeAIAudio === 'boolean'
        ? mix.includeAIAudio
        : defaultRecordingConfig.audioMix.includeAIAudio,
    includeSystemSounds:
      typeof mix.includeSystemSounds === 'boolean'
        ? mix.includeSystemSounds
        : defaultRecordingConfig.audioMix.includeSystemSounds,
  };
}

function parseVideoConfig(data: unknown): RecordingConfig['video'] {
  if (!data || typeof data !== 'object') {
    return { ...defaultRecordingConfig.video };
  }

  const video = data as Record<string, unknown>;
  return {
    recordVideo:
      typeof video.recordVideo === 'boolean'
        ? video.recordVideo
        : defaultRecordingConfig.video.recordVideo,
    recordScreenShare:
      typeof video.recordScreenShare === 'boolean'
        ? video.recordScreenShare
        : defaultRecordingConfig.video.recordScreenShare,
    quality: isVideoQuality(video.quality)
      ? video.quality
      : defaultRecordingConfig.video.quality,
  };
}

function parseObserverConfig(data: unknown): ObserverConfig {
  if (!data || typeof data !== 'object') {
    return { ...defaultObserverConfig };
  }

  const config = data as Record<string, unknown>;

  return {
    enabled:
      typeof config.enabled === 'boolean' ? config.enabled : defaultObserverConfig.enabled,
    maxObservers:
      typeof config.maxObservers === 'number'
        ? config.maxObservers
        : defaultObserverConfig.maxObservers,
    permissions: parseObserverPermissions(config.permissions),
  };
}

function parseObserverPermissions(
  data: unknown
): ObserverConfig['permissions'] {
  if (!data || typeof data !== 'object') {
    return { ...defaultObserverConfig.permissions };
  }

  const perms = data as Record<string, unknown>;
  return {
    canViewTranscript:
      typeof perms.canViewTranscript === 'boolean'
        ? perms.canViewTranscript
        : defaultObserverConfig.permissions.canViewTranscript,
    canViewRecording:
      typeof perms.canViewRecording === 'boolean'
        ? perms.canViewRecording
        : defaultObserverConfig.permissions.canViewRecording,
    canViewAIInteractions:
      typeof perms.canViewAIInteractions === 'boolean'
        ? perms.canViewAIInteractions
        : defaultObserverConfig.permissions.canViewAIInteractions,
    canViewCompliance:
      typeof perms.canViewCompliance === 'boolean'
        ? perms.canViewCompliance
        : defaultObserverConfig.permissions.canViewCompliance,
  };
}

function parseAIConfig(data: unknown): AIConfig {
  if (!data || typeof data !== 'object') {
    return { ...defaultAIConfig };
  }

  const config = data as Record<string, unknown>;

  return {
    enabled: typeof config.enabled === 'boolean' ? config.enabled : false,
    provider: typeof config.provider === 'string' ? config.provider : 'openai',
    actors: parseAIActors(config.actors),
  };
}

function parseAIActors(data: unknown): AIActorFormData[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isValidActor).map((actor) => ({
    id: actor.id,
    name: actor.name,
    role: actor.role,
    persona: actor.persona,
    voice: actor.voice,
    avatar: actor.avatar,
    isActive: actor.isActive,
  }));
}

// =============================================================================
// Serialize to Config JSON
// =============================================================================

/**
 * Serialize parsed domain config back to a configJson object.
 */
export function serializeToConfigJson(
  parsed: ParsedDomainConfig
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...parsed.other,
  };

  // Only include recording if enabled or has non-default values
  if (parsed.recording.enabled || hasRecordingChanges(parsed.recording)) {
    result.recording = serializeRecordingConfig(parsed.recording);
  }

  // Only include observers if enabled or has non-default values
  if (parsed.observers.enabled || hasObserverChanges(parsed.observers)) {
    result.observers = serializeObserverConfig(parsed.observers);
  }

  // Only include AI if enabled or has actors
  if (parsed.ai.enabled || parsed.ai.actors.length > 0) {
    result.ai = serializeAIConfig(parsed.ai);
  }

  return result;
}

function serializeRecordingConfig(config: RecordingConfig): Record<string, unknown> {
  return {
    enabled: config.enabled,
    consentType: config.consentType,
    retentionDays: config.retentionDays,
    autoStart: config.autoStart,
    audioMix: {
      includeParticipants: config.audioMix.includeParticipants,
      includeAIAudio: config.audioMix.includeAIAudio,
      includeSystemSounds: config.audioMix.includeSystemSounds,
    },
    video: {
      recordVideo: config.video.recordVideo,
      recordScreenShare: config.video.recordScreenShare,
      quality: config.video.quality,
    },
  };
}

function serializeObserverConfig(config: ObserverConfig): Record<string, unknown> {
  return {
    enabled: config.enabled,
    maxObservers: config.maxObservers,
    permissions: {
      canViewTranscript: config.permissions.canViewTranscript,
      canViewRecording: config.permissions.canViewRecording,
      canViewAIInteractions: config.permissions.canViewAIInteractions,
      canViewCompliance: config.permissions.canViewCompliance,
    },
  };
}

function serializeAIConfig(config: AIConfig): Record<string, unknown> {
  return {
    enabled: config.enabled,
    provider: config.provider,
    actors: config.actors.map((actor) => ({
      id: actor.id,
      name: actor.name,
      role: actor.role,
      persona: actor.persona,
      voice: actor.voice,
      avatar: actor.avatar,
      isActive: actor.isActive,
    })),
  };
}

// =============================================================================
// Type Guards
// =============================================================================

function isConsentType(value: unknown): value is RecordingConfig['consentType'] {
  return value === 'none' || value === 'implicit' || value === 'explicit';
}

function isVideoQuality(value: unknown): value is RecordingConfig['video']['quality'] {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isValidActor(value: unknown): value is AIActorFormData {
  if (!value || typeof value !== 'object') return false;
  const actor = value as Record<string, unknown>;
  return (
    typeof actor.name === 'string' &&
    typeof actor.role === 'string' &&
    typeof actor.persona === 'object' &&
    typeof actor.voice === 'object' &&
    typeof actor.avatar === 'object'
  );
}

// =============================================================================
// Change Detection Helpers
// =============================================================================

function hasRecordingChanges(config: RecordingConfig): boolean {
  return (
    config.consentType !== defaultRecordingConfig.consentType ||
    config.retentionDays !== defaultRecordingConfig.retentionDays ||
    config.autoStart !== defaultRecordingConfig.autoStart
  );
}

function hasObserverChanges(config: ObserverConfig): boolean {
  return config.maxObservers !== defaultObserverConfig.maxObservers;
}
