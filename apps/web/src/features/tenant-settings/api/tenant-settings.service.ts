/**
 * Tenant Settings Service
 * API service for tenant settings operations.
 */

import { apiClient } from '@/shared/services/api-client';
import type { Tenant, UpdateTenantInput } from '../types/tenant-settings.types';

class TenantSettingsService {
  private readonly basePath = '/v1/tenants';

  /**
   * Get the current tenant.
   */
  async get(tenantId: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`${this.basePath}/${tenantId}`);
  }

  /**
   * Update tenant settings.
   */
  async update(tenantId: string, data: UpdateTenantInput): Promise<Tenant> {
    return apiClient.patch<Tenant>(`${this.basePath}/${tenantId}`, data);
  }
}

export const tenantSettingsService = new TenantSettingsService();
