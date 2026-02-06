/**
 * Workspace Validation Schemas
 * Zod schemas for workspace form validation.
 */

import { z } from 'zod';

/**
 * Slug validation pattern (lowercase letters, numbers, hyphens).
 */
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Supported domain types (aligns with backend contracts).
 */
export const domainTypeValues = [
  'interview',
  'presales',
  'hr',
  'support',
  'training',
  'consultation',
  'custom',
] as const;

export const domainTypeSchema = z.enum(domainTypeValues);

export type DomainType = z.infer<typeof domainTypeSchema>;

/**
 * Create workspace form validation schema.
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  slug: z
    .string()
    .regex(slugPattern, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(50, 'Slug must be 50 characters or less')
    .optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  domainType: domainTypeSchema,
  configId: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;

/**
 * Update workspace form validation schema.
 */
export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  configId: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateWorkspaceFormData = z.infer<typeof updateWorkspaceSchema>;

/**
 * Workspace filter schema.
 */
export const workspaceFiltersSchema = z.object({
  search: z.string().optional(),
  domainType: domainTypeSchema.optional(),
});

export type WorkspaceFiltersFormData = z.infer<typeof workspaceFiltersSchema>;
