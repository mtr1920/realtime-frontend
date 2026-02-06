/**
 * Webhook Schemas
 * Zod validation schemas for webhook forms.
 */

import { z } from 'zod';

// =============================================================================
// Event Schema
// =============================================================================

export const webhookEventSchema = z.enum([
  'session.created',
  'session.started',
  'session.completed',
  'session.failed',
  'session.expired',
  'participant.joined',
  'participant.left',
  'participant.disconnected',
  'recording.started',
  'recording.stopped',
  'recording.ready',
  'recording.failed',
  'outcome.ready',
  'outcome.failed',
]);

export type WebhookEventEnum = z.infer<typeof webhookEventSchema>;

// =============================================================================
// Delivery Status Schema
// =============================================================================

export const deliveryStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'DELIVERED',
  'FAILED',
  'EXHAUSTED',
]);

export type DeliveryStatusEnum = z.infer<typeof deliveryStatusSchema>;

// =============================================================================
// Retry Policy Schema
// =============================================================================

export const retryPolicySchema = z.object({
  maxAttempts: z.number().int().min(1).max(10),
  backoffMultiplier: z.number().min(1).max(5),
  initialDelayMs: z.number().int().min(1000).max(60000),
  maxDelayMs: z.number().int().min(60000).max(3600000),
});

export type RetryPolicyFormData = z.infer<typeof retryPolicySchema>;

// =============================================================================
// Filters Schema
// =============================================================================

export const webhookFiltersSchema = z.object({
  workspaceIds: z.array(z.string().uuid()).optional(),
  domainTypes: z.array(z.string()).optional(),
});

export type WebhookFiltersFormData = z.infer<typeof webhookFiltersSchema>;

// =============================================================================
// Create Webhook Schema
// =============================================================================

export const createWebhookSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  url: z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'URL must use HTTPS'),
  events: z
    .array(webhookEventSchema)
    .min(1, 'At least one event is required'),
  filters: webhookFiltersSchema.optional(),
  retryPolicy: retryPolicySchema.optional(),
  enabled: z.boolean(),
});

export type CreateWebhookFormData = z.infer<typeof createWebhookSchema>;

// =============================================================================
// Update Webhook Schema
// =============================================================================

export const updateWebhookSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  url: z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'URL must use HTTPS')
    .optional(),
  events: z
    .array(webhookEventSchema)
    .min(1, 'At least one event is required')
    .optional(),
  filters: webhookFiltersSchema.optional(),
  retryPolicy: retryPolicySchema.optional(),
  enabled: z.boolean().optional(),
});

export type UpdateWebhookFormData = z.infer<typeof updateWebhookSchema>;

// =============================================================================
// Test Webhook Schema
// =============================================================================

export const testWebhookSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'URL must use HTTPS'),
  event: webhookEventSchema.optional().default('session.created'),
});

export type TestWebhookFormData = z.infer<typeof testWebhookSchema>;

// =============================================================================
// Filters Schema (for list filtering)
// =============================================================================

export const webhookListFiltersSchema = z.object({
  enabled: z.boolean().optional(),
  search: z.string().optional(),
});

export type WebhookListFiltersFormData = z.infer<typeof webhookListFiltersSchema>;

// =============================================================================
// Delivery Filters Schema
// =============================================================================

export const deliveryFiltersSchema = z.object({
  status: deliveryStatusSchema.optional(),
  event: webhookEventSchema.optional(),
});

export type DeliveryFiltersFormData = z.infer<typeof deliveryFiltersSchema>;
