/**
 * Domain Config Schemas
 * Zod validation schemas for domain configuration forms.
 */

import { z } from 'zod';

// =============================================================================
// Domain Type Schema
// =============================================================================

export const domainTypeSchema = z.enum([
  'interview',
  'presales',
  'hr',
  'support',
  'training',
  'consultation',
  'custom',
]);

// =============================================================================
// Config JSON Schema
// =============================================================================

/**
 * Base config JSON schema - allows any record structure.
 * Specific validation should be done at the domain level.
 */
export const configJsonSchema = z.record(z.unknown());

// =============================================================================
// Create Domain Config Schema
// =============================================================================

export const createDomainConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  domainType: domainTypeSchema,
  configJson: configJsonSchema,
  isDefault: z.boolean().optional(),
});

export type CreateDomainConfigFormData = z.infer<typeof createDomainConfigSchema>;

// =============================================================================
// Update Domain Config Schema
// =============================================================================

export const updateDomainConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .optional(),
  configJson: configJsonSchema.optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDomainConfigFormData = z.infer<typeof updateDomainConfigSchema>;

// =============================================================================
// Domain Config Filters Schema
// =============================================================================

export const domainConfigFiltersSchema = z.object({
  domainType: domainTypeSchema.optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export type DomainConfigFiltersFormData = z.infer<typeof domainConfigFiltersSchema>;
