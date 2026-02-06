/**
 * Audit Logs Schemas
 * Zod validation schemas for audit log operations.
 */

import { z } from 'zod';

/**
 * Audit action enum.
 */
export const auditActionSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'session.create',
  'session.start',
  'session.end',
  'session.cancel',
  'recording.start',
  'recording.stop',
  'settings.change',
  'user.invite',
  'user.remove',
  'webhook.trigger',
  'api_key.create',
  'api_key.revoke',
  'integration.sync',
]);

/**
 * Audit resource enum.
 */
export const auditResourceSchema = z.enum([
  'tenant',
  'user',
  'workspace',
  'domain_config',
  'session',
  'participant',
  'recording',
  'transcript',
  'webhook',
  'api_key',
  'integration',
  'outcome',
]);

/**
 * Actor type enum.
 */
export const auditActorTypeSchema = z.enum(['user', 'api_key', 'system']);

/**
 * Export format enum.
 */
export const exportFormatSchema = z.enum(['json', 'csv']);

/**
 * Audit log filters schema.
 */
export const auditLogFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  actorType: auditActorTypeSchema.optional(),
  actorId: z.string().optional(),
  actions: z.array(auditActionSchema).optional(),
  resources: z.array(auditResourceSchema).optional(),
  workspaceId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  search: z.string().optional(),
});

/**
 * Export audit logs schema.
 */
export const exportAuditLogsSchema = z.object({
  format: exportFormatSchema,
  filters: auditLogFiltersSchema.optional(),
});

// Type exports
export type AuditActionEnum = z.infer<typeof auditActionSchema>;
export type AuditResourceEnum = z.infer<typeof auditResourceSchema>;
export type AuditActorTypeEnum = z.infer<typeof auditActorTypeSchema>;
export type ExportFormatEnum = z.infer<typeof exportFormatSchema>;
export type AuditLogFiltersFormData = z.infer<typeof auditLogFiltersSchema>;
export type ExportAuditLogsFormData = z.infer<typeof exportAuditLogsSchema>;
