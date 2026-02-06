/**
 * Tenant Settings Schemas
 * Zod validation schemas for tenant settings operations.
 */

import { z } from 'zod';

/**
 * Branding config schema.
 */
export const brandingConfigSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  companyName: z.string().max(100).optional(),
});

/**
 * Tenant settings schema.
 */
export const tenantSettingsSchema = z.object({
  defaultDomainType: z.string().optional(),
  defaultTimezone: z.string().optional(),
  defaultLanguage: z.string().optional(),
  brandingConfig: brandingConfigSchema.optional(),
});

/**
 * Update tenant schema.
 */
export const updateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: tenantSettingsSchema.optional(),
});

// Type exports
export type BrandingConfigFormData = z.infer<typeof brandingConfigSchema>;
export type TenantSettingsFormData = z.infer<typeof tenantSettingsSchema>;
export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;
