import { z } from 'zod';

// =============================================================================
// Role Classification & Core Types
// =============================================================================

/**
 * Role classification for role-centric configs.
 */
export const RoleClassificationSchema = z.object({
  isPrimary: z.boolean().default(false),
  isFacilitator: z.boolean().default(false),
  isSpectator: z.boolean().default(false),
  isAiAgent: z.boolean().default(false),
});

export type RoleClassification = z.infer<typeof RoleClassificationSchema>;

/**
 * Role permissions for role-centric configs.
 */
export const RolePermissionsSchema = z.object({
  // Media permissions
  canPublishAudio: z.boolean().default(true),
  canPublishVideo: z.boolean().default(true),
  canShareScreen: z.boolean().default(false),
  canViewOthersVideo: z.boolean().default(true),
  canViewOthersScreen: z.boolean().default(true),

  // Session control permissions
  canStartSession: z.boolean().default(false),
  canEndSession: z.boolean().default(false),
  canPauseSession: z.boolean().default(false),
  canRemoveParticipants: z.boolean().default(false),
  canMuteOthers: z.boolean().default(false),

  // Communication permissions
  canSendMessages: z.boolean().default(true),
  canSendPrivateMessages: z.boolean().default(false),

  // Transcript and recording permissions
  canViewTranscripts: z.boolean().default(false),
  canViewRecordings: z.boolean().default(false),
  canDownloadRecordings: z.boolean().default(false),
  canExportData: z.boolean().default(false),

  // AI interaction permissions
  canInteractWithAI: z.boolean().default(true),
  canConfigureAI: z.boolean().default(false),
  canViewAIAnalytics: z.boolean().default(false),

  // Compliance permissions
  canViewComplianceData: z.boolean().default(false),
  canTriggerComplianceActions: z.boolean().default(false),

  // Outcome permissions
  canViewOutcome: z.boolean().default(false),
  canEditOutcome: z.boolean().default(false),
  canApproveOutcome: z.boolean().default(false),

  // Phase control permissions
  canAdvancePhase: z.boolean().default(false),
  canRevertPhase: z.boolean().default(false),
});

export type RolePermissions = z.infer<typeof RolePermissionsSchema>;

/**
 * Role constraints for role-centric configs.
 */
export const RoleConstraintsSchema = z.object({
  maxPerSession: z.number().int().positive().default(1),
  requiresAuth: z.boolean().default(true),
  allowedDevices: z.array(z.enum(['desktop', 'mobile', 'tablet'])).default(['desktop']),
});

export type RoleConstraints = z.infer<typeof RoleConstraintsSchema>;

// =============================================================================
// AI Profile
// =============================================================================

/**
 * Public AI profile - excludes server-only fields.
 */
export const PublicAIProfileSchema = z.object({
  enabled: z.boolean(),
  provider: z.object({
    primary: z.enum(['gemini-live', 'openai-realtime']),
    fallback: z.enum(['gemini-live', 'openai-realtime']).optional(),
  }),
  vad: z.object({
    enabled: z.boolean().default(true),
    mode: z.enum(['server', 'client', 'off']).default('server'),
  }),
  limits: z.object({
    maxTurnsPerSession: z.number().int().positive().default(100),
    maxAudioMinutesPerSession: z.number().int().positive().default(60),
    turnTimeoutSeconds: z.number().int().positive().default(30),
  }),
  toolCallingEnabled: z.boolean().default(false),
});

export type PublicAIProfile = z.infer<typeof PublicAIProfileSchema>;

// =============================================================================
// Modules
// =============================================================================

export const ComplianceModuleSchema = z.object({
  enabled: z.boolean(),
  browserLockdownMode: z.enum(['off', 'soft', 'strict']).default('off'),
  identityVerification: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(['none', 'challenge_question', 'biometric', 'custom']).default('none'),
  }),
});

export type ComplianceModule = z.infer<typeof ComplianceModuleSchema>;

export const RecordingModuleSchema = z.object({
  enabled: z.boolean(),
  autoStart: z.boolean().default(false),
  consent: z.object({
    required: z.boolean().default(true),
    type: z.enum(['implicit', 'explicit', 'opt-out']).default('implicit'),
  }),
  types: z.object({
    audio: z.boolean().default(true),
    video: z.boolean().default(false),
    screen: z.boolean().default(false),
    mixed: z.boolean().default(false),
  }),
});

export type RecordingModule = z.infer<typeof RecordingModuleSchema>;

export const TranscriptionModuleSchema = z.object({
  enabled: z.boolean(),
  realtime: z.boolean().default(true),
  language: z.string().optional(),
});

export type TranscriptionModule = z.infer<typeof TranscriptionModuleSchema>;

export const ScreenShareModuleSchema = z.object({
  enabled: z.boolean().default(false),
  required: z.boolean().default(false),
  requireEntireScreen: z.boolean().default(false),
  allowedDisplaySurfaces: z.array(z.enum(['monitor', 'window', 'browser'])).default([]),
  reshareOnEnd: z.boolean().default(false),
  reshareGracePeriodMs: z.number().min(0).max(300_000).default(30_000),
  maxReshareAttempts: z.number().min(0).max(10).default(3),
});

export type ScreenShareModule = z.infer<typeof ScreenShareModuleSchema>;

/**
 * Audio module config for roles.
 */
export const AudioModuleSchema = z.object({
  enabled: z.boolean(),
});

export type AudioModule = z.infer<typeof AudioModuleSchema>;

/**
 * Video module config for roles.
 */
export const VideoModuleSchema = z.object({
  enabled: z.boolean(),
});

export type VideoModule = z.infer<typeof VideoModuleSchema>;

export const RoleModulesSchema = z.object({
  compliance: ComplianceModuleSchema.nullable(),
  recording: RecordingModuleSchema.nullable(),
  transcription: TranscriptionModuleSchema.nullable(),
  screenShare: ScreenShareModuleSchema.nullable(),
  /** Audio module configuration (required) */
  audio: AudioModuleSchema,
  /** Video module configuration (required) */
  video: VideoModuleSchema,
});

export type RoleModules = z.infer<typeof RoleModulesSchema>;

// =============================================================================
// Session Defaults
// =============================================================================

export const SessionDefaultsSchema = z.object({
  maxDurationMinutes: z.number().int().positive().default(60),
  maxParticipants: z.number().int().positive().default(10),
  phases: z.array(z.object({
    id: z.string(),
    name: z.string(),
    order: z.number().int(),
    durationMinutes: z.number().int().positive().optional(),
  })).optional(),
  autoStart: z.boolean().default(false),
  autoEnd: z.boolean().default(false),
});

export type SessionDefaults = z.infer<typeof SessionDefaultsSchema>;

// =============================================================================
// Conversation Flow
// =============================================================================

export const TonePresetSchema = z.enum([
  'friendly',
  'professional',
  'neutral',
  'formal',
  'casual',
  'empathetic',
  'encouraging',
  'direct',
]);

export type TonePreset = z.infer<typeof TonePresetSchema>;

export const TurnRangeSchema = z.object({
  min: z.number().int().min(1),
  max: z.number().int().min(1),
  ideal: z.number().int().min(1).optional(),
});

export type TurnRange = z.infer<typeof TurnRangeSchema>;

export const InteractionRulesSchema = z.object({
  expectedTurns: TurnRangeSchema,
  followupDepth: z.number().int().min(0).max(5).default(2),
  maxDurationSeconds: z.number().int().positive().optional(),
});

export type InteractionRules = z.infer<typeof InteractionRulesSchema>;

export const StagePromptsSchema = z.object({
  introductionHint: z.string().max(500).optional(),
  objectiveHint: z.string().max(500).optional(),
});

export type StagePrompts = z.infer<typeof StagePromptsSchema>;

export const FlowStageSchema = z.object({
  label: z.string().min(1).max(100),
  purpose: z.string().min(1).max(500),
  interaction: InteractionRulesSchema,
  skippable: z.boolean().optional(),
  activeCapabilities: z.array(z.string()).optional(),
  prompts: StagePromptsSchema.optional(),
});

export type FlowStage = z.infer<typeof FlowStageSchema>;

export const ConversationFlowSchema = z.object({
  stages: z.record(z.string(), FlowStageSchema),
  stageOrder: z.array(z.string()).optional(),
});

export type ConversationFlow = z.infer<typeof ConversationFlowSchema>;

// =============================================================================
// Capabilities (Frontend-safe subset)
// =============================================================================

export const PublicSecurityCapabilitySchema = z.object({
  enabled: z.boolean(),
  proctoringEnabled: z.boolean().default(false),
  browserLockdownEnabled: z.boolean().default(false),
  securityMessage: z.string().max(500).optional(),
});

export type PublicSecurityCapability = z.infer<typeof PublicSecurityCapabilitySchema>;

export const PublicAssessmentCapabilitySchema = z.object({
  enabled: z.boolean(),
  feedbackMode: z.enum(['realtime', 'post', 'delayed', 'none']).default('post'),
  scoresVisibleToParticipant: z.boolean().default(false),
});

export type PublicAssessmentCapability = z.infer<typeof PublicAssessmentCapabilitySchema>;

export const PublicCodeExecutionCapabilitySchema = z.object({
  enabled: z.boolean(),
  supportedLanguages: z.array(z.string()).optional(),
  sandboxAvailable: z.boolean().default(false),
});

export type PublicCodeExecutionCapability = z.infer<typeof PublicCodeExecutionCapabilitySchema>;

export const PublicCapabilitiesSchema = z.object({
  security: PublicSecurityCapabilitySchema.optional(),
  assessment: PublicAssessmentCapabilitySchema.optional(),
  codeExecution: PublicCodeExecutionCapabilitySchema.optional(),
  enabledList: z.array(z.string()).default([]),
});

export type PublicCapabilities = z.infer<typeof PublicCapabilitiesSchema>;

// =============================================================================
// Meta Layer (Frontend-safe)
// =============================================================================

export const AssistantPersonaSchema = z.object({
  name: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  tone: TonePresetSchema,
  avatarId: z.string().optional(),
});

export type AssistantPersona = z.infer<typeof AssistantPersonaSchema>;

export const OrganizationContextSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().max(100).optional(),
});

export type OrganizationContext = z.infer<typeof OrganizationContextSchema>;

export const LocaleSettingsSchema = z.object({
  conversationLanguage: z.string().min(1),
  timezone: z.string().optional(),
  dateFormat: z.enum(['US', 'EU', 'ISO']).optional(),
});

export type LocaleSettings = z.infer<typeof LocaleSettingsSchema>;

export const PublicMetaSchema = z.object({
  persona: AssistantPersonaSchema.optional(),
  organization: OrganizationContextSchema.optional(),
  locale: LocaleSettingsSchema.optional(),
  tags: z.array(z.string()).optional(),
  /** Role display color (CSS class or hex value) */
  color: z.string().max(100).optional(),
  /** Role display icon (icon name or URL) */
  icon: z.string().max(200).optional(),
});

export type PublicMeta = z.infer<typeof PublicMetaSchema>;

// =============================================================================
// Public Role Config
// =============================================================================

/**
 * Public Role Config - the frontend-safe role config type.
 *
 * This is sent to clients as part of session snapshot.
 * Excludes server-only fields like systemPromptId, voiceId, hooks, etc.
 */
export const PublicRoleConfigSchema = z.object({
  // Core Fields
  version: z.number().int().positive().default(1),
  roleId: z.string().min(1).max(50),
  roleName: z.string().min(1).max(100),
  roleDescription: z.string().max(500).optional(),
  configHash: z.string().min(1),
  classification: RoleClassificationSchema,
  permissions: RolePermissionsSchema,
  constraints: RoleConstraintsSchema,
  aiProfile: PublicAIProfileSchema.nullable(),
  modules: RoleModulesSchema,
  sessionDefaults: SessionDefaultsSchema,

  // Extended Fields
  flow: ConversationFlowSchema.optional(),
  capabilities: PublicCapabilitiesSchema.optional(),
  meta: PublicMetaSchema.optional(),
  activeProfileId: z.string().optional(),
});

export type PublicRoleConfig = z.infer<typeof PublicRoleConfigSchema>;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get first stage ID from flow.
 */
export function getFirstStageId(flow: ConversationFlow): string | undefined {
  if (flow.stageOrder && flow.stageOrder.length > 0) {
    return flow.stageOrder[0];
  }
  const stageIds = Object.keys(flow.stages);
  return stageIds[0];
}

/**
 * Get ordered stage IDs from flow.
 */
export function getOrderedStageIds(flow: ConversationFlow): string[] {
  if (flow.stageOrder && flow.stageOrder.length > 0) {
    return flow.stageOrder;
  }
  return Object.keys(flow.stages);
}

/**
 * Get enabled capabilities from config.
 */
export function getEnabledCapabilities(config: PublicRoleConfig): string[] {
  const capabilities = config.capabilities;
  if (!capabilities) return [];

  const enabled: string[] = [];
  if (capabilities.security?.enabled) enabled.push('security');
  if (capabilities.assessment?.enabled) enabled.push('assessment');
  if (capabilities.codeExecution?.enabled) enabled.push('codeExecution');

  return enabled;
}

/**
 * Get all enabled modules from config (modules + capabilities).
 */
export function getEnabledModules(config: PublicRoleConfig): string[] {
  const enabled: string[] = [];

  // Core modules
  if (config.aiProfile?.enabled) enabled.push('ai');
  if (config.modules.compliance?.enabled) enabled.push('compliance');
  if (config.modules.recording?.enabled) enabled.push('recording');
  if (config.modules.transcription?.enabled) enabled.push('transcription');
  if (config.modules.screenShare?.enabled) enabled.push('screenShare');
  if (config.modules.audio?.enabled) enabled.push('audio');
  if (config.modules.video?.enabled) enabled.push('video');

  // Capabilities
  enabled.push(...getEnabledCapabilities(config));

  return enabled;
}

/**
 * Check if a capability is enabled.
 */
export function isCapabilityEnabled(
  config: PublicRoleConfig,
  capability: 'security' | 'assessment' | 'codeExecution'
): boolean {
  const cap = config.capabilities?.[capability];
  return cap !== undefined && 'enabled' in cap && cap.enabled === true;
}

/**
 * Check if a module is enabled.
 */
export function isModuleEnabled(
  config: PublicRoleConfig,
  module: keyof PublicRoleConfig['modules']
): boolean {
  return config.modules[module]?.enabled ?? false;
}
