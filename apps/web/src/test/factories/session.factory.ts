/**
 * Session Test Factory
 *
 * Create mock session data for testing.
 */

import type { SessionStatus } from '@/types';

// =============================================================================
// Types (matching @protocol/index)
// =============================================================================

export interface Session {
  id: string;
  workspaceId: string;
  title: string;
  status: SessionStatus;
  config: SessionConfig;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  scheduledFor?: string;
  createdBy: string;
}

export interface SessionConfig {
  domainType: string;
  roleId: string;
  modules: {
    ai: boolean;
    recording: boolean;
    transcript: boolean;
    compliance: boolean;
    outcomes: boolean;
  };
  ai?: {
    provider: string;
    actorType: string;
    voiceId?: string;
    systemPrompt?: string;
  };
  recording?: {
    autoStart: boolean;
    format: string;
  };
  compliance?: {
    browserLockEnabled: boolean;
    inactivityTimeoutMs?: number;
    identityChallengeEnabled: boolean;
  };
  screenShare?: {
    isScreenShareRequired: boolean;
    requireEntireScreen: boolean;
    forceReshareOnStop: boolean;
  };
  timeouts?: {
    maxDurationMs: number;
    warningMs: number;
  };
}

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  domainType: 'interview',
  roleId: 'candidate',
  modules: {
    ai: true,
    recording: true,
    transcript: true,
    compliance: true,
    outcomes: true,
  },
  ai: {
    provider: 'openai',
    actorType: 'interviewer',
  },
  recording: {
    autoStart: true,
    format: 'webm',
  },
  compliance: {
    browserLockEnabled: true,
    inactivityTimeoutMs: 300000,
    identityChallengeEnabled: false,
  },
  screenShare: {
    isScreenShareRequired: false,
    requireEntireScreen: false,
    forceReshareOnStop: false,
  },
  timeouts: {
    maxDurationMs: 3600000,
    warningMs: 300000,
  },
};

const DEFAULT_SESSION: Session = {
  id: 'session-001',
  workspaceId: 'workspace-001',
  title: 'Test Session',
  status: 'CREATED',
  config: DEFAULT_SESSION_CONFIG,
  createdAt: new Date().toISOString(),
  createdBy: 'user-001',
};

// =============================================================================
// Factory Functions
// =============================================================================

let sessionIdCounter = 0;

/**
 * Create a mock session with optional overrides.
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
  sessionIdCounter++;
  return {
    ...DEFAULT_SESSION,
    id: `session-${String(sessionIdCounter).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    ...overrides,
    config: {
      ...DEFAULT_SESSION_CONFIG,
      ...overrides.config,
    },
  };
}

/**
 * Create a mock session config with optional overrides.
 */
export function createMockSessionConfig(
  overrides: Partial<SessionConfig> = {}
): SessionConfig {
  const config: SessionConfig = {
    domainType: overrides.domainType ?? DEFAULT_SESSION_CONFIG.domainType,
    roleId: overrides.roleId ?? DEFAULT_SESSION_CONFIG.roleId,
    modules: {
      ai: overrides.modules?.ai ?? DEFAULT_SESSION_CONFIG.modules.ai,
      recording: overrides.modules?.recording ?? DEFAULT_SESSION_CONFIG.modules.recording,
      transcript: overrides.modules?.transcript ?? DEFAULT_SESSION_CONFIG.modules.transcript,
      compliance: overrides.modules?.compliance ?? DEFAULT_SESSION_CONFIG.modules.compliance,
      outcomes: overrides.modules?.outcomes ?? DEFAULT_SESSION_CONFIG.modules.outcomes,
    },
    ai: {
      provider: overrides.ai?.provider ?? DEFAULT_SESSION_CONFIG.ai!.provider,
      actorType: overrides.ai?.actorType ?? DEFAULT_SESSION_CONFIG.ai!.actorType,
      voiceId: overrides.ai?.voiceId ?? DEFAULT_SESSION_CONFIG.ai!.voiceId,
      systemPrompt: overrides.ai?.systemPrompt ?? DEFAULT_SESSION_CONFIG.ai!.systemPrompt,
    },
    recording: {
      autoStart: overrides.recording?.autoStart ?? DEFAULT_SESSION_CONFIG.recording!.autoStart,
      format: overrides.recording?.format ?? DEFAULT_SESSION_CONFIG.recording!.format,
    },
    compliance: {
      browserLockEnabled: overrides.compliance?.browserLockEnabled ?? DEFAULT_SESSION_CONFIG.compliance!.browserLockEnabled,
      inactivityTimeoutMs: overrides.compliance?.inactivityTimeoutMs ?? DEFAULT_SESSION_CONFIG.compliance!.inactivityTimeoutMs,
      identityChallengeEnabled: overrides.compliance?.identityChallengeEnabled ?? DEFAULT_SESSION_CONFIG.compliance!.identityChallengeEnabled,
    },
    screenShare: {
      isScreenShareRequired: overrides.screenShare?.isScreenShareRequired ?? DEFAULT_SESSION_CONFIG.screenShare!.isScreenShareRequired,
      requireEntireScreen: overrides.screenShare?.requireEntireScreen ?? DEFAULT_SESSION_CONFIG.screenShare!.requireEntireScreen,
      forceReshareOnStop: overrides.screenShare?.forceReshareOnStop ?? DEFAULT_SESSION_CONFIG.screenShare!.forceReshareOnStop,
    },
    timeouts: {
      maxDurationMs: overrides.timeouts?.maxDurationMs ?? DEFAULT_SESSION_CONFIG.timeouts!.maxDurationMs,
      warningMs: overrides.timeouts?.warningMs ?? DEFAULT_SESSION_CONFIG.timeouts!.warningMs,
    },
  };
  return config;
}

/**
 * Create a session with specific status.
 */
export function createSessionWithStatus(status: SessionStatus): Session {
  const now = new Date();
  const session = createMockSession({ status });

  if (status === 'ACTIVE' || status === 'PAUSED' || status === 'COMPLETED') {
    session.startedAt = new Date(now.getTime() - 3600000).toISOString();
  }
  if (status === 'COMPLETED' || status === 'EXPIRED' || status === 'FAILED') {
    session.endedAt = now.toISOString();
  }

  return session;
}

/**
 * Create a session with specific modules enabled.
 */
export function createSessionWithModules(
  modules: Partial<SessionConfig['modules']>
): Session {
  return createMockSession({
    config: createMockSessionConfig({
      modules: {
        ...DEFAULT_SESSION_CONFIG.modules,
        ...modules,
      },
    }),
  });
}

/**
 * Create a session with screen share requirements.
 */
export function createSessionWithScreenShareRequired(
  requireEntireScreen = false,
  forceReshareOnStop = false
): Session {
  return createMockSession({
    config: createMockSessionConfig({
      screenShare: {
        isScreenShareRequired: true,
        requireEntireScreen,
        forceReshareOnStop,
      },
    }),
  });
}

/**
 * Reset the session ID counter (call in beforeEach for deterministic IDs).
 */
export function resetSessionIdCounter(): void {
  sessionIdCounter = 0;
}
