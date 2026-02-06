/**
 * Tenant Settings Feature
 * Public exports for the tenant settings module.
 */

// Types
export {
  tenantStatusLabels,
  timezoneOptions,
  languageOptions,
  type Tenant,
  type TenantStatus,
  type TenantSettings,
  type TenantLimits,
  type TenantFeatures,
  type BrandingConfig,
  type UpdateTenantInput,
} from './types/tenant-settings.types';

// Schemas
export {
  brandingConfigSchema,
  tenantSettingsSchema,
  updateTenantSchema,
  type BrandingConfigFormData,
  type TenantSettingsFormData,
  type UpdateTenantFormData,
} from './schemas/tenant-settings.schema';

// API Service
export { tenantSettingsService } from './api/tenant-settings.service';

// Hooks
export { useTenant } from './hooks/useTenant';
export { useUpdateTenant } from './hooks/useUpdateTenant';

// Components
export { GeneralSettingsForm } from './components/GeneralSettingsForm';
export { BrandingSettingsForm } from './components/BrandingSettingsForm';
export { LimitsDisplay } from './components/LimitsDisplay';
export { FeaturesDisplay } from './components/FeaturesDisplay';
