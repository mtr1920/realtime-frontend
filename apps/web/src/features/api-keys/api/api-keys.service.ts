/**
 * API Keys Service
 * Handles all API key management API calls.
 */

import { apiClient, ApiError } from '@/shared/services/api-client';
import type {
  ApiKey,
  ApiKeyListParams,
  PaginatedApiKeysResponse,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  UpdateApiKeyInput,
} from '../types/api-keys.types';

// =============================================================================
// API Keys Service Class
// =============================================================================

class ApiKeysService {
  private readonly basePath = '/v1/api-keys';

  /**
   * List API keys with optional filters.
   */
  async list(params: ApiKeyListParams = {}): Promise<PaginatedApiKeysResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params.includeRevoked !== undefined) queryParams.includeRevoked = params.includeRevoked;
    if (params.search) queryParams.search = params.search;
    if (params.orderBy) queryParams.orderBy = params.orderBy;
    if (params.orderDirection) queryParams.orderDirection = params.orderDirection;
    if (params.limit) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;

    return apiClient.get<PaginatedApiKeysResponse>(this.basePath, {
      params: queryParams,
    });
  }

  /**
   * Get a single API key by ID.
   */
  async get(id: string): Promise<ApiKey> {
    const response = await apiClient.get<{ apiKey: ApiKey }>(`${this.basePath}/${id}`);
    return response.apiKey;
  }

  /**
   * Create a new API key.
   */
  async create(data: CreateApiKeyInput): Promise<CreateApiKeyResponse> {
    return apiClient.post<CreateApiKeyResponse>(this.basePath, data);
  }

  /**
   * Update an existing API key.
   */
  async update(id: string, data: UpdateApiKeyInput): Promise<ApiKey> {
    const response = await apiClient.patch<{ apiKey: ApiKey }>(`${this.basePath}/${id}`, data);
    return response.apiKey;
  }

  /**
   * Revoke an API key.
   */
  async revoke(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}/revoke`);
  }
}

// Export singleton instance
export const apiKeysService = new ApiKeysService();

// Re-export types and ApiError for convenience
export { ApiError };
export type {
  ApiKey,
  ApiKeyScope,
  ApiKeyListParams,
  PaginatedApiKeysResponse,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  UpdateApiKeyInput,
} from '../types/api-keys.types';
