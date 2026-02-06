/**
 * API Keys Types
 * Type definitions for API key management feature.
 */

// =============================================================================
// API Key Entity
// =============================================================================

/**
 * API key scopes for permissions.
 */
export type ApiKeyScope =
  | 'sessions:read'
  | 'sessions:write'
  | 'sessions:delete'
  | 'users:read'
  | 'users:write'
  | 'workspaces:read'
  | 'workspaces:write'
  | 'outcomes:read'
  | 'recordings:read'
  | 'transcripts:read'
  | 'webhooks:read'
  | 'webhooks:write'
  | 'integrations:read'
  | 'integrations:write';

/**
 * API key scope labels for display.
 */
export const apiKeyScopeLabels: Record<ApiKeyScope, string> = {
  'sessions:read': 'Read Sessions',
  'sessions:write': 'Create/Update Sessions',
  'sessions:delete': 'Delete Sessions',
  'users:read': 'Read Users',
  'users:write': 'Create/Update Users',
  'workspaces:read': 'Read Workspaces',
  'workspaces:write': 'Create/Update Workspaces',
  'outcomes:read': 'Read Outcomes',
  'recordings:read': 'Read Recordings',
  'transcripts:read': 'Read Transcripts',
  'webhooks:read': 'Read Webhooks',
  'webhooks:write': 'Create/Update Webhooks',
  'integrations:read': 'Read Integrations',
  'integrations:write': 'Create/Update Integrations',
};

/**
 * Group API key scopes by category.
 */
export const apiKeyScopeGroups = {
  sessions: ['sessions:read', 'sessions:write', 'sessions:delete'] as ApiKeyScope[],
  users: ['users:read', 'users:write'] as ApiKeyScope[],
  workspaces: ['workspaces:read', 'workspaces:write'] as ApiKeyScope[],
  data: ['outcomes:read', 'recordings:read', 'transcripts:read'] as ApiKeyScope[],
  admin: ['webhooks:read', 'webhooks:write', 'integrations:read', 'integrations:write'] as ApiKeyScope[],
};

/**
 * API key entity.
 */
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// API Types
// =============================================================================

/**
 * Parameters for listing API keys.
 */
export interface ApiKeyListParams {
  includeRevoked?: boolean;
  search?: string;
  orderBy?: 'name' | 'createdAt' | 'lastUsedAt';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

/**
 * Paginated API keys response.
 */
export interface PaginatedApiKeysResponse {
  apiKeys: ApiKey[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
}

/**
 * Input for creating an API key.
 */
export interface CreateApiKeyInput {
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: string;
}

/**
 * Response from creating an API key (includes full secret).
 */
export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  secret: string;
}

/**
 * Input for updating an API key.
 */
export interface UpdateApiKeyInput {
  name?: string;
  scopes?: ApiKeyScope[];
}
