/**
 * Audit Logs Types
 * Type definitions for audit log management.
 */

/**
 * Audit actions that can be tracked.
 */
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'session.create'
  | 'session.start'
  | 'session.end'
  | 'session.cancel'
  | 'recording.start'
  | 'recording.stop'
  | 'settings.change'
  | 'user.invite'
  | 'user.remove'
  | 'webhook.trigger'
  | 'api_key.create'
  | 'api_key.revoke'
  | 'integration.sync';

/**
 * Resource types that can be audited.
 */
export type AuditResource =
  | 'tenant'
  | 'user'
  | 'workspace'
  | 'domain_config'
  | 'session'
  | 'participant'
  | 'recording'
  | 'transcript'
  | 'webhook'
  | 'api_key'
  | 'integration'
  | 'outcome';

/**
 * Actor types for audit logs.
 */
export type AuditActorType = 'user' | 'api_key' | 'system';

/**
 * Actor information in audit log.
 */
export interface AuditActor {
  type: AuditActorType;
  id: string;
  email?: string;
  name?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Changes tracked in audit log.
 */
export interface AuditChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/**
 * Audit log entry.
 */
export interface AuditLog {
  id: string;
  tenantId: string;
  actor: AuditActor;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  resourceName?: string;
  workspaceId?: string;
  sessionId?: string;
  changes?: AuditChanges;
  metadata?: Record<string, unknown>;
  requestId: string;
  createdAt: string;
}

/**
 * Filter parameters for listing audit logs.
 */
export interface AuditLogListParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  actorType?: AuditActorType;
  actorId?: string;
  actions?: AuditAction[];
  resources?: AuditResource[];
  workspaceId?: string;
  sessionId?: string;
  search?: string;
  orderBy?: 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated audit logs response.
 */
export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Audit log count response.
 */
export interface AuditLogCountResponse {
  count: number;
  filters: AuditLogListParams;
}

/**
 * Export format options.
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Export audit logs input.
 */
export interface ExportAuditLogsInput {
  format: ExportFormat;
  filters?: AuditLogListParams;
}

/**
 * Human-readable labels for audit actions.
 */
export const auditActionLabels: Record<AuditAction, string> = {
  create: 'Created',
  read: 'Viewed',
  update: 'Updated',
  delete: 'Deleted',
  login: 'Logged in',
  logout: 'Logged out',
  'session.create': 'Session created',
  'session.start': 'Session started',
  'session.end': 'Session ended',
  'session.cancel': 'Session cancelled',
  'recording.start': 'Recording started',
  'recording.stop': 'Recording stopped',
  'settings.change': 'Settings changed',
  'user.invite': 'User invited',
  'user.remove': 'User removed',
  'webhook.trigger': 'Webhook triggered',
  'api_key.create': 'API key created',
  'api_key.revoke': 'API key revoked',
  'integration.sync': 'Integration synced',
};

/**
 * Human-readable labels for audit resources.
 */
export const auditResourceLabels: Record<AuditResource, string> = {
  tenant: 'Tenant',
  user: 'User',
  workspace: 'Workspace',
  domain_config: 'Domain Config',
  session: 'Session',
  participant: 'Participant',
  recording: 'Recording',
  transcript: 'Transcript',
  webhook: 'Webhook',
  api_key: 'API Key',
  integration: 'Integration',
  outcome: 'Outcome',
};

/**
 * Human-readable labels for actor types.
 */
export const auditActorTypeLabels: Record<AuditActorType, string> = {
  user: 'User',
  api_key: 'API Key',
  system: 'System',
};
