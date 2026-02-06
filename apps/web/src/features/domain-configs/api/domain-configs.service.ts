/**
 * Domain Configs Service
 * Handles all domain configuration API calls.
 */

import { apiClient, ApiError } from '@/shared/services/api-client';
import type {
  DomainConfig,
  DomainConfigListParams,
  PaginatedDomainConfigsResponse,
  CreateDomainConfigInput,
  UpdateDomainConfigInput,
} from '../types/domain-configs.types';

// =============================================================================
// Domain Configs Service Class
// =============================================================================

class DomainConfigsService {
  private readonly basePath = '/v1/domain-configs';

  /**
   * List domain configs with optional filters.
   */
  async list(params: DomainConfigListParams = {}): Promise<PaginatedDomainConfigsResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params.domainType) queryParams.domainType = params.domainType;
    if (params.isActive !== undefined) queryParams.isActive = params.isActive.toString();
    if (params.isDefault !== undefined) queryParams.isDefault = params.isDefault.toString();
    if (params.limit) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;

    return apiClient.get<PaginatedDomainConfigsResponse>(this.basePath, {
      params: queryParams,
    });
  }

  /**
   * Get a single domain config by ID.
   */
  async get(id: string): Promise<DomainConfig> {
    return apiClient.get<DomainConfig>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new domain config.
   */
  async create(data: CreateDomainConfigInput): Promise<DomainConfig> {
    return apiClient.post<DomainConfig>(this.basePath, data);
  }

  /**
   * Update an existing domain config.
   */
  async update(id: string, data: UpdateDomainConfigInput): Promise<DomainConfig> {
    return apiClient.patch<DomainConfig>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a domain config.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Duplicate a domain config.
   * Creates a new config with the same settings but a new name.
   */
  async duplicate(id: string, newName: string): Promise<DomainConfig> {
    const config = await this.get(id);
    return this.create({
      name: newName,
      domainType: config.domainType,
      configJson: config.configJson,
      isDefault: false, // Duplicates should not be default
    });
  }
}

// Export singleton instance
export const domainConfigsService = new DomainConfigsService();

// Re-export types and ApiError for convenience
export { ApiError };
export type {
  DomainConfig,
  DomainType,
  DomainConfigListParams,
  PaginatedDomainConfigsResponse,
  CreateDomainConfigInput,
  UpdateDomainConfigInput,
} from '../types/domain-configs.types';
