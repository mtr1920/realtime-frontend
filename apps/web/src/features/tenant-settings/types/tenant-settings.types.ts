/**
 * Tenant Settings Types
 * Type definitions for tenant settings management.
 */

/**
 * Branding configuration.
 */
export interface BrandingConfig {
  logoUrl?: string;
  primaryColor?: string;
  companyName?: string;
}

/**
 * Tenant settings configuration.
 */
export interface TenantSettings {
  defaultDomainType?: string;
  defaultTimezone?: string;
  defaultLanguage?: string;
  brandingConfig?: BrandingConfig;
}

/**
 * Tenant limits.
 */
export interface TenantLimits {
  maxConcurrentSessions: number;
  maxParticipantsPerSession: number;
  maxRecordingMinutesPerMonth: number;
  maxAiMinutesPerMonth: number;
  maxStorageGb: number;
  retentionDays: number;
}

/**
 * Tenant features configuration.
 */
export interface TenantFeatures {
  aiEnabled: boolean;
  complianceEnabled: boolean;
  recordingEnabled: boolean;
  transcriptionEnabled: boolean;
  analyticsEnabled: boolean;
  ssoEnabled: boolean;
  webhooksEnabled: boolean;
  customDomainsEnabled: boolean;
}

/**
 * Tenant entity.
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings;
  limits: TenantLimits;
  features: TenantFeatures;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenant status.
 */
export type TenantStatus = 'active' | 'suspended' | 'pending';

/**
 * Update tenant input.
 */
export interface UpdateTenantInput {
  name?: string;
  settings?: Partial<TenantSettings>;
}

/**
 * Human-readable labels for tenant status.
 */
export const tenantStatusLabels: Record<TenantStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  pending: 'Pending',
};

/**
 * Available timezones.
 */
export const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

/**
 * Available languages.
 */
export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
];
