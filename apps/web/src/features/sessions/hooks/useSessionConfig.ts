/**
 * useSessionConfig Hook
 *
 * Configuration-driven UI hook for session rendering.
 * Use this hook to check enabled modules and features - NEVER hardcode domain logic.
 *
 * Standard format uses PublicRoleConfig (role-centric).
 * SessionConfig is optional and used when roleConfig is not available.
 */

import { useMemo } from 'react';
import { useSessionStore } from '@/shared/stores/session.store';
import type {
  PublicRoleConfig,
  ConversationFlow,
  PublicCapabilities,
  PublicMeta,
  FlowStage,
} from '@protocol/index';

export interface SessionConfigResult {
  /** Check if a module is enabled */
  isModuleEnabled: (module: string) => boolean;

  /** Check if recording is enabled */
  isRecordingEnabled: boolean;

  /** Check if recording auto-starts */
  isRecordingAutoStart: boolean;

  /** Check if AI is enabled */
  isAIEnabled: boolean;

  /** Get AI provider name if configured */
  aiProvider: string | undefined;

  /** Check if compliance features are enabled */
  isComplianceEnabled: boolean;

  /** Check if browser lock is required */
  isBrowserLockRequired: boolean;

  /** Check if identity verification is required */
  isIdentityVerificationRequired: boolean;

  /** Check if screen share is required to participate */
  isScreenShareRequired: boolean;

  /** Check if only entire screen (not tab/window) is allowed */
  requireEntireScreen: boolean;

  /** Check if re-share prompt should appear when user stops sharing */
  forceReshareOnStop: boolean;

  /** Get the domain type */
  domainType: string | undefined;

  /** Get list of enabled modules */
  enabledModules: string[];

  /** Check if the local participant is an observer (read-only) */
  isObserver: boolean;

  /** Check if local participant can publish media */
  canPublishMedia: boolean;

  /** Raw config object (use sparingly) */
  config: ReturnType<typeof useSessionStore.getState>['config'];

  // ==========================================================================
  // Extended Features (RoleConfig)
  // ==========================================================================

  /** Role config - null if not provided */
  roleConfig: PublicRoleConfig | null;

  /** Get conversation flow if available */
  flow: ConversationFlow | undefined;

  /** Get ordered stage IDs from flow */
  stageOrder: string[];

  /** Get a specific stage by ID */
  getStage: (stageId: string) => FlowStage | undefined;

  /** Get current stage (first in order if none selected) */
  getFirstStage: () => FlowStage | undefined;

  /** Get capabilities if available */
  capabilities: PublicCapabilities | undefined;

  /** Check if a capability is enabled */
  isCapabilityEnabled: (capability: string) => boolean;

  /** Get meta layer if available (persona, organization, locale) */
  meta: PublicMeta | undefined;

  /** Get AI persona name */
  personaName: string | undefined;

  /** Get AI persona title */
  personaTitle: string | undefined;

  /** Get organization name */
  organizationName: string | undefined;

  /** Get conversation language */
  conversationLanguage: string | undefined;

  /** Check if proctoring is enabled */
  isProctoringEnabled: boolean;

  /** Check if assessment is enabled */
  isAssessmentEnabled: boolean;

  /** Check if code execution is enabled */
  isCodeExecutionEnabled: boolean;

  /** Get supported code languages (for code execution) */
  supportedCodeLanguages: string[];

  /** Check if using role config format */
  isRoleConfigFormat: boolean;
}

/**
 * Hook for accessing session configuration
 *
 * @example
 * ```tsx
 * const { isModuleEnabled, isAIEnabled, isObserver, flow, personaName } = useSessionConfig();
 *
 * return (
 *   <div>
 *     {isModuleEnabled('chat') && <ChatPanel />}
 *     {isAIEnabled && !isObserver && <AIControls />}
 *     {flow && <StageIndicator stages={flow.stages} />}
 *     {personaName && <AIAvatar name={personaName} />}
 *   </div>
 * );
 * ```
 */
export function useSessionConfig(): SessionConfigResult {
  const config = useSessionStore((state) => state.config);
  const roleConfig = useSessionStore((state) => state.roleConfig);
  const localParticipant = useSessionStore((state) => state.getLocalParticipant());

  return useMemo(() => {
    // Determine which config format we're using
    const isRoleConfigFormat = roleConfig !== null;

    // Get enabled modules from appropriate source
    // When not using roleConfig, include media modules by default for backward compatibility
    const enabledModules = isRoleConfigFormat
      ? getEnabledModulesFromRoleConfig(roleConfig)
      : [...new Set([...(config?.enabledModules ?? []), 'audio', 'video', 'screenShare'])];

    const isModuleEnabled = (module: string): boolean => {
      return enabledModules.includes(module);
    };

    // Check if local participant is an observer (read-only role)
    // classification.isSpectator is authoritative when present (from role bundle config)
    // Fallback to permission-based check for backward compatibility
    // Default to false (not observer) when data hasn't loaded yet
    const isObserver = (() => {
      // If roleConfig has classification.isSpectator, use it as authoritative source
      if (roleConfig?.classification?.isSpectator === true) return true;

      // Fallback: check participant permissions
      if (localParticipant) {
        return !(
          localParticipant.role?.permissions?.canPublishAudio ||
          localParticipant.role?.permissions?.canPublishVideo
        );
      }

      return false;
    })();

    // Check if local participant can publish media
    // Spectators (isObserver) cannot publish, regardless of permissions
    const canPublishMedia = isObserver
      ? false
      : (localParticipant?.role?.permissions?.canPublishAudio ||
          localParticipant?.role?.permissions?.canPublishVideo) ??
        false;

    // Flow helpers
    const flow = roleConfig?.flow;
    const stageOrder = flow?.stageOrder ?? (flow ? Object.keys(flow.stages) : []);

    const getStage = (stageId: string): FlowStage | undefined => {
      return flow?.stages[stageId];
    };

    const getFirstStage = (): FlowStage | undefined => {
      const firstId = stageOrder[0];
      return firstId ? flow?.stages[firstId] : undefined;
    };

    // Capabilities
    const capabilities = roleConfig?.capabilities;

    const isCapabilityEnabled = (capability: string): boolean => {
      if (!capabilities) return false;
      const cap = capabilities[capability as keyof PublicCapabilities];
      return cap !== undefined && typeof cap === 'object' && 'enabled' in cap && cap.enabled === true;
    };

    // Meta layer
    const meta = roleConfig?.meta;

    // Recording values - prefer roleConfig if available
    const isRecordingEnabled = isRoleConfigFormat
      ? roleConfig?.modules.recording?.enabled ?? false
      : config?.recording?.enabled ?? false;

    const isRecordingAutoStart = isRoleConfigFormat
      ? roleConfig?.modules.recording?.autoStart ?? false
      : config?.recording?.autoStart ?? false;

    // AI values
    const isAIEnabled = isRoleConfigFormat
      ? roleConfig?.aiProfile?.enabled ?? false
      : config?.ai?.enabled ?? false;

    const aiProvider = isRoleConfigFormat
      ? roleConfig?.aiProfile?.provider.primary
      : config?.ai?.provider;

    // Compliance values
    const complianceModule = roleConfig?.modules.compliance;

    const isComplianceEnabled = isRoleConfigFormat
      ? complianceModule?.enabled ?? false
      : config?.compliance?.enabled ?? false;

    const browserLockMode = complianceModule?.browserLockdownMode ?? 'off';
    const isBrowserLockRequired = isRoleConfigFormat
      ? complianceModule?.enabled === true && browserLockMode !== 'off'
      : config?.compliance?.browserLock ?? false;

    const isIdentityVerificationRequired = isRoleConfigFormat
      ? complianceModule?.enabled === true && complianceModule.identityVerification?.enabled === true
      : config?.compliance?.identityVerification ?? false;

    // Screen share values
    const isScreenShareRequired = isRoleConfigFormat
      ? roleConfig?.modules.screenShare?.required ?? false
      : config?.compliance?.screenShare?.required ?? false;

    const requireEntireScreen = isRoleConfigFormat
      ? roleConfig?.modules.screenShare?.requireEntireScreen ?? false
      : config?.compliance?.screenShare?.requireEntireScreen ?? false;

    const forceReshareOnStop = isRoleConfigFormat
      ? roleConfig?.modules.screenShare?.reshareOnEnd ?? false
      : config?.compliance?.screenShare?.forceReshareOnStop ?? false;

    // Security capabilities
    const isProctoringEnabled = capabilities?.security?.proctoringEnabled ?? false;

    // Assessment capabilities
    const isAssessmentEnabled = capabilities?.assessment?.enabled ?? false;

    // Code execution capabilities
    const isCodeExecutionEnabled = capabilities?.codeExecution?.enabled ?? false;
    const supportedCodeLanguages = capabilities?.codeExecution?.supportedLanguages ?? [];

    return {
      isModuleEnabled,
      isRecordingEnabled,
      isRecordingAutoStart,
      isAIEnabled,
      aiProvider,
      isComplianceEnabled,
      isBrowserLockRequired,
      isIdentityVerificationRequired,
      isScreenShareRequired,
      requireEntireScreen,
      forceReshareOnStop,
      domainType: config?.domainType,
      enabledModules,
      isObserver,
      canPublishMedia,
      config,
      // Extended features (roleConfig)
      roleConfig,
      flow,
      stageOrder,
      getStage,
      getFirstStage,
      capabilities,
      isCapabilityEnabled,
      meta,
      personaName: meta?.persona?.name,
      personaTitle: meta?.persona?.title,
      organizationName: meta?.organization?.name,
      conversationLanguage: meta?.locale?.conversationLanguage,
      isProctoringEnabled,
      isAssessmentEnabled,
      isCodeExecutionEnabled,
      supportedCodeLanguages,
      isRoleConfigFormat,
    };
  }, [config, roleConfig, localParticipant]);
}

/**
 * Extract enabled modules from PublicRoleConfig.
 */
function getEnabledModulesFromRoleConfig(config: PublicRoleConfig | null): string[] {
  if (!config) return [];

  const enabled: string[] = [];

  // Core modules
  if (config.aiProfile?.enabled) enabled.push('ai');
  if (config.modules.compliance?.enabled) enabled.push('compliance');
  if (config.modules.recording?.enabled) enabled.push('recording');
  if (config.modules.transcription?.enabled) enabled.push('transcript');
  if (config.modules.screenShare?.enabled) enabled.push('screenShare');

  // Media modules (from modules, not permissions - module controls availability)
  if (config.modules.audio?.enabled) enabled.push('audio');
  if (config.modules.video?.enabled) enabled.push('video');

  // Chat from permissions
  if (config.permissions?.canSendMessages) enabled.push('chat');

  // Capabilities
  if (config.capabilities?.security?.enabled) enabled.push('security');
  if (config.capabilities?.assessment?.enabled) enabled.push('assessment');
  if (config.capabilities?.codeExecution?.enabled) enabled.push('codeExecution');

  return enabled;
}
