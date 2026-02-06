/**
 * Integrations Schemas
 * Zod validation schemas for integration operations.
 */

import { z } from 'zod';

/**
 * Connector type enum.
 */
export const connectorTypeSchema = z.enum([
  'hrms',
  'crm',
  'lms',
  'ats',
  'webhook',
  'rest',
  'custom',
]);

/**
 * Sync status enum.
 */
export const syncStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

/**
 * Sync trigger enum.
 */
export const syncTriggerSchema = z.enum([
  'session.completed',
  'outcome.ready',
  'outcome.approved',
  'user.created',
  'manual',
  'scheduled',
]);

/**
 * Sync direction enum.
 */
export const syncDirectionSchema = z.enum(['push', 'pull', 'bidirectional']);

/**
 * Auth type enum.
 */
export const authTypeSchema = z.enum([
  'api_key',
  'bearer',
  'basic',
  'oauth2',
  'none',
]);

/**
 * Auth config schema.
 */
export const authConfigSchema = z.object({
  type: authTypeSchema,
  apiKey: z.string().optional(),
  bearerToken: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

/**
 * Connector config schema.
 */
export const connectorConfigSchema = z.object({
  baseUrl: z.string().url('Please enter a valid URL'),
  auth: authConfigSchema,
  headers: z.record(z.string()).optional(),
  timeout: z.number().min(1000).max(60000).optional(),
});

/**
 * Field mapping schema.
 */
export const fieldMappingSchema = z.object({
  sourceField: z.string().min(1),
  targetField: z.string().min(1),
  transform: z.string().optional(),
  required: z.boolean().optional(),
});

/**
 * Trigger config schema.
 */
export const triggerConfigSchema = z.object({
  event: syncTriggerSchema,
  enabled: z.boolean(),
});

/**
 * Create connector schema.
 */
export const createConnectorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: connectorTypeSchema,
  direction: syncDirectionSchema,
  config: connectorConfigSchema,
  mapping: z.array(fieldMappingSchema).optional(),
  triggers: z.array(triggerConfigSchema).optional(),
  enabled: z.boolean().optional(),
});

/**
 * Update connector schema.
 */
export const updateConnectorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  config: connectorConfigSchema.partial().optional(),
  mapping: z.array(fieldMappingSchema).optional(),
  triggers: z.array(triggerConfigSchema).optional(),
  enabled: z.boolean().optional(),
});

/**
 * Connector filters schema.
 */
export const connectorFiltersSchema = z.object({
  type: connectorTypeSchema.optional(),
  enabled: z.boolean().optional(),
});

// Type exports
export type ConnectorTypeEnum = z.infer<typeof connectorTypeSchema>;
export type SyncStatusEnum = z.infer<typeof syncStatusSchema>;
export type SyncTriggerEnum = z.infer<typeof syncTriggerSchema>;
export type SyncDirectionEnum = z.infer<typeof syncDirectionSchema>;
export type AuthTypeEnum = z.infer<typeof authTypeSchema>;
export type CreateConnectorFormData = z.infer<typeof createConnectorSchema>;
export type UpdateConnectorFormData = z.infer<typeof updateConnectorSchema>;
export type ConnectorFiltersFormData = z.infer<typeof connectorFiltersSchema>;
