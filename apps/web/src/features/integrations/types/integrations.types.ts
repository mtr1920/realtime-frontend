/**
 * Integrations Types
 * Type definitions for integration connector management.
 */

/**
 * Connector type.
 */
export type ConnectorType =
  | 'hrms'
  | 'crm'
  | 'lms'
  | 'ats'
  | 'webhook'
  | 'rest'
  | 'custom';

/**
 * Sync status.
 */
export type SyncStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Sync trigger.
 */
export type SyncTrigger =
  | 'session.completed'
  | 'outcome.ready'
  | 'outcome.approved'
  | 'user.created'
  | 'manual'
  | 'scheduled';

/**
 * Sync direction.
 */
export type SyncDirection = 'push' | 'pull' | 'bidirectional';

/**
 * Auth type.
 */
export type AuthType = 'api_key' | 'bearer' | 'basic' | 'oauth2' | 'none';

/**
 * Auth configuration.
 */
export interface AuthConfig {
  type: AuthType;
  apiKey?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
  oauth2Config?: {
    clientId?: string;
    clientSecret?: string;
    tokenUrl?: string;
    scopes?: string[];
  };
}

/**
 * Connector configuration.
 */
export interface ConnectorConfig {
  baseUrl: string;
  auth: AuthConfig;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Field mapping.
 */
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: string;
  required?: boolean;
}

/**
 * Trigger configuration.
 */
export interface TriggerConfig {
  event: SyncTrigger;
  enabled: boolean;
  filters?: Record<string, unknown>;
}

/**
 * Connector entity.
 */
export interface Connector {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ConnectorType;
  direction: SyncDirection;
  config: ConnectorConfig;
  mapping: FieldMapping[];
  triggers: TriggerConfig[];
  enabled: boolean;
  lastSyncAt?: string;
  lastError?: string;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sync record.
 */
export interface SyncRecord {
  id: string;
  connectorId: string;
  direction: 'push' | 'pull';
  trigger: SyncTrigger;
  resourceType: 'session' | 'outcome' | 'user' | 'transcript' | 'recording';
  resourceId: string;
  status: SyncStatus;
  attempt: number;
  maxAttempts: number;
  errorMessage?: string;
  responseData?: Record<string, unknown>;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Filter parameters for listing connectors.
 */
export interface ConnectorListParams {
  page?: number;
  limit?: number;
  type?: ConnectorType;
  enabled?: boolean;
  orderBy?: 'name' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated connectors response.
 */
export interface PaginatedConnectorsResponse {
  data: Connector[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Filter parameters for listing syncs.
 */
export interface SyncListParams {
  page?: number;
  limit?: number;
  status?: SyncStatus;
  trigger?: SyncTrigger;
  orderBy?: 'scheduledAt' | 'startedAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated syncs response.
 */
export interface PaginatedSyncsResponse {
  data: SyncRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create connector input.
 */
export interface CreateConnectorInput {
  name: string;
  description?: string;
  type: ConnectorType;
  direction: SyncDirection;
  config: ConnectorConfig;
  mapping?: FieldMapping[];
  triggers?: TriggerConfig[];
  enabled?: boolean;
}

/**
 * Update connector input.
 */
export interface UpdateConnectorInput {
  name?: string;
  description?: string;
  config?: Partial<ConnectorConfig>;
  mapping?: FieldMapping[];
  triggers?: TriggerConfig[];
  enabled?: boolean;
}

/**
 * Human-readable labels for connector types.
 */
export const connectorTypeLabels: Record<ConnectorType, string> = {
  hrms: 'HRMS',
  crm: 'CRM',
  lms: 'LMS',
  ats: 'ATS',
  webhook: 'Webhook',
  rest: 'REST API',
  custom: 'Custom',
};

/**
 * Human-readable labels for sync status.
 */
export const syncStatusLabels: Record<SyncStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/**
 * Human-readable labels for sync triggers.
 */
export const syncTriggerLabels: Record<SyncTrigger, string> = {
  'session.completed': 'Session Completed',
  'outcome.ready': 'Outcome Ready',
  'outcome.approved': 'Outcome Approved',
  'user.created': 'User Created',
  manual: 'Manual',
  scheduled: 'Scheduled',
};

/**
 * Human-readable labels for auth types.
 */
export const authTypeLabels: Record<AuthType, string> = {
  api_key: 'API Key',
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
  oauth2: 'OAuth 2.0',
  none: 'None',
};
