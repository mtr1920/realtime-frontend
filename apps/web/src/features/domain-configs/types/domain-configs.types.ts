/**
 * Domain Config Types
 * Type definitions for domain configuration management.
 */

// =============================================================================
// Domain Types
// =============================================================================

/**
 * Domain type values matching backend schema.
 */
export type DomainType =
  | 'interview'
  | 'presales'
  | 'hr'
  | 'support'
  | 'training'
  | 'consultation'
  | 'custom';

/**
 * Domain type display labels.
 */
export const domainTypeLabels: Record<DomainType, string> = {
  interview: 'Interview',
  presales: 'Pre-Sales',
  hr: 'People Management',
  support: 'Support',
  training: 'Training',
  consultation: 'Consultation',
  custom: 'Custom',
};

/**
 * All domain type values for form selects.
 */
export const domainTypeValues: DomainType[] = [
  'interview',
  'presales',
  'hr',
  'support',
  'training',
  'consultation',
  'custom',
];

// =============================================================================
// Domain Config Entity
// =============================================================================

/**
 * Full domain config entity from API.
 */
export interface DomainConfig {
  id: string;
  name: string;
  domainType: DomainType;
  version: number;
  configJson: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Parameters for listing domain configs.
 */
export interface DomainConfigListParams {
  domainType?: DomainType;
  isActive?: boolean;
  isDefault?: boolean;
  limit?: number;
  cursor?: string;
}

/**
 * Cursor-based pagination info.
 */
export interface CursorPagination {
  total?: number;
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Paginated domain configs response.
 */
export interface PaginatedDomainConfigsResponse {
  items: DomainConfig[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Input for creating a new domain config.
 */
export interface CreateDomainConfigInput {
  name: string;
  domainType: DomainType;
  configJson: Record<string, unknown>;
  isDefault?: boolean;
}

/**
 * Input for updating an existing domain config.
 */
export interface UpdateDomainConfigInput {
  name?: string;
  configJson?: Record<string, unknown>;
  isDefault?: boolean;
  isActive?: boolean;
}
