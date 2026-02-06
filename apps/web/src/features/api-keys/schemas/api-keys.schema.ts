/**
 * API Keys Schemas
 * Zod validation schemas for API key forms.
 */

import { z } from 'zod';

// =============================================================================
// Scope Schema
// =============================================================================

export const apiKeyScopeSchema = z.enum([
  'sessions:read',
  'sessions:write',
  'sessions:delete',
  'users:read',
  'users:write',
  'workspaces:read',
  'workspaces:write',
  'outcomes:read',
  'recordings:read',
  'transcripts:read',
  'webhooks:read',
  'webhooks:write',
  'integrations:read',
  'integrations:write',
]);

export type ApiKeyScopeEnum = z.infer<typeof apiKeyScopeSchema>;

// =============================================================================
// Create API Key Schema
// =============================================================================

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  scopes: z
    .array(apiKeyScopeSchema)
    .min(1, 'At least one scope is required'),
  expiresAt: z
    .string()
    .datetime()
    .optional(),
});

export type CreateApiKeyFormData = z.infer<typeof createApiKeySchema>;

// =============================================================================
// Update API Key Schema
// =============================================================================

export const updateApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  scopes: z
    .array(apiKeyScopeSchema)
    .min(1, 'At least one scope is required')
    .optional(),
});

export type UpdateApiKeyFormData = z.infer<typeof updateApiKeySchema>;

// =============================================================================
// Filters Schema
// =============================================================================

export const apiKeyFiltersSchema = z.object({
  includeRevoked: z.boolean().optional(),
  search: z.string().optional(),
});

export type ApiKeyFiltersFormData = z.infer<typeof apiKeyFiltersSchema>;
