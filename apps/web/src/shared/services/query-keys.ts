/**
 * Query key factory for TanStack Query
 * Provides type-safe, hierarchical query keys
 */

export const queryKeys = {
  // Auth queries
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Session queries
  sessions: {
    root: ['sessions'] as const,
    all: (filters?: { status?: string; workspaceId?: string }) =>
      filters
        ? (['sessions', 'list', filters] as const)
        : (['sessions', 'list'] as const),
    detail: (sessionId: string) => ['sessions', 'detail', sessionId] as const,
    inviteInfo: (sessionId: string) =>
      ['sessions', sessionId, 'invite-info'] as const,
    participants: (sessionId: string) =>
      ['sessions', sessionId, 'participants'] as const,
    transcript: (sessionId: string) =>
      ['sessions', sessionId, 'transcript'] as const,
    recording: (sessionId: string) =>
      ['sessions', sessionId, 'recording'] as const,
    shareLinks: (sessionId: string) =>
      ['sessions', sessionId, 'share-links'] as const,
  },

  // Workspace queries
  workspaces: {
    root: ['workspaces'] as const,
    all: (filters?: { search?: string; domainType?: string }) =>
      filters
        ? (['workspaces', 'list', filters] as const)
        : (['workspaces', 'list'] as const),
    detail: (workspaceId: string) =>
      ['workspaces', 'detail', workspaceId] as const,
    members: (workspaceId: string) =>
      ['workspaces', workspaceId, 'members'] as const,
  },

  // Tenant queries
  tenants: {
    all: () => ['tenants', 'list'] as const,
    detail: (tenantId: string) => ['tenants', 'detail', tenantId] as const,
    config: (tenantId: string) => ['tenants', tenantId, 'config'] as const,
    domains: (tenantId: string) => ['tenants', tenantId, 'domains'] as const,
  },

  // User queries
  users: {
    all: (filters?: { workspaceId?: string; role?: string }) =>
      filters
        ? (['users', 'list', filters] as const)
        : (['users', 'list'] as const),
    detail: (userId: string) => ['users', 'detail', userId] as const,
    profile: (userId: string) => ['users', userId, 'profile'] as const,
  },

  // Media device queries
  media: {
    devices: () => ['media', 'devices'] as const,
    permissions: () => ['media', 'permissions'] as const,
  },

  // Admin queries
  admin: {
    auditLogs: (filters?: { startDate?: string; endDate?: string }) =>
      filters
        ? (['admin', 'audit-logs', filters] as const)
        : (['admin', 'audit-logs'] as const),
    apiKeys: () => ['admin', 'api-keys'] as const,
    analytics: (period?: string) =>
      period
        ? (['admin', 'analytics', period] as const)
        : (['admin', 'analytics'] as const),
  },

  // Webhooks queries
  webhooks: {
    root: ['webhooks'] as const,
    all: (filters?: Record<string, unknown>) =>
      filters
        ? (['webhooks', 'list', filters] as const)
        : (['webhooks', 'list'] as const),
    detail: (webhookId: string) => ['webhooks', 'detail', webhookId] as const,
    deliveries: (webhookId: string, filters?: Record<string, unknown>) =>
      filters
        ? (['webhooks', webhookId, 'deliveries', filters] as const)
        : (['webhooks', webhookId, 'deliveries'] as const),
  },

  // API Keys queries
  apiKeys: {
    root: ['api-keys'] as const,
    all: (filters?: Record<string, unknown>) =>
      filters
        ? (['api-keys', 'list', filters] as const)
        : (['api-keys', 'list'] as const),
    detail: (keyId: string) => ['api-keys', 'detail', keyId] as const,
  },

  // Audit Logs queries
  auditLogs: {
    root: ['audit-logs'] as const,
    all: (filters?: Record<string, unknown>) =>
      filters
        ? (['audit-logs', 'list', filters] as const)
        : (['audit-logs', 'list'] as const),
    detail: (logId: string) => ['audit-logs', 'detail', logId] as const,
    count: (filters?: Record<string, unknown>) =>
      filters
        ? (['audit-logs', 'count', filters] as const)
        : (['audit-logs', 'count'] as const),
  },

  // Tenant Settings queries
  tenantSettings: {
    detail: (tenantId: string) => ['tenant-settings', tenantId] as const,
  },

  // Outcomes queries
  outcomes: {
    root: ['outcomes'] as const,
    all: (filters?: Record<string, unknown>) =>
      filters
        ? (['outcomes', 'list', filters] as const)
        : (['outcomes', 'list'] as const),
    detail: (outcomeId: string) => ['outcomes', 'detail', outcomeId] as const,
    bySession: (sessionId: string) => ['outcomes', 'session', sessionId] as const,
    artifacts: (outcomeId: string) => ['outcomes', outcomeId, 'artifacts'] as const,
  },

  // Integrations queries
  integrations: {
    root: ['integrations'] as const,
    all: (filters?: Record<string, unknown>) =>
      filters
        ? (['integrations', 'list', filters] as const)
        : (['integrations', 'list'] as const),
    detail: (connectorId: string) => ['integrations', 'detail', connectorId] as const,
    syncs: (connectorId: string, filters?: Record<string, unknown>) =>
      filters
        ? (['integrations', connectorId, 'syncs', filters] as const)
        : (['integrations', connectorId, 'syncs'] as const),
  },

  // Domain config queries
  domainConfigs: {
    root: ['domain-configs'] as const,
    all: (filters?: { domainType?: string; isActive?: boolean }) =>
      filters
        ? (['domain-configs', 'list', filters] as const)
        : (['domain-configs', 'list'] as const),
    detail: (configId: string) =>
      ['domain-configs', 'detail', configId] as const,
  },
} as const;

// Type helper for extracting query key types
export type QueryKeys = typeof queryKeys;
