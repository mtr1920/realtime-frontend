/**
 * Integrations Service
 * API service for integration connector operations.
 */

import { apiClient } from '@/shared/services/api-client';
import type {
  Connector,
  SyncRecord,
  ConnectorListParams,
  PaginatedConnectorsResponse,
  SyncListParams,
  PaginatedSyncsResponse,
  CreateConnectorInput,
  UpdateConnectorInput,
} from '../types/integrations.types';

class IntegrationsService {
  private readonly basePath = '/v1/integrations';

  /**
   * List connectors with optional filters.
   */
  async list(params?: ConnectorListParams): Promise<PaginatedConnectorsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.type) searchParams.set('type', params.type);
    if (params?.enabled !== undefined) searchParams.set('enabled', String(params.enabled));
    if (params?.orderBy) searchParams.set('orderBy', params.orderBy);
    if (params?.orderDirection) searchParams.set('orderDirection', params.orderDirection);

    const queryString = searchParams.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

    return apiClient.get<PaginatedConnectorsResponse>(url);
  }

  /**
   * Get a connector by ID.
   */
  async getById(id: string): Promise<Connector> {
    return apiClient.get<Connector>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new connector.
   */
  async create(data: CreateConnectorInput): Promise<Connector> {
    return apiClient.post<Connector>(this.basePath, data);
  }

  /**
   * Update a connector.
   */
  async update(id: string, data: UpdateConnectorInput): Promise<Connector> {
    return apiClient.patch<Connector>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a connector.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Trigger a sync.
   */
  async triggerSync(connectorId: string): Promise<SyncRecord> {
    return apiClient.post<SyncRecord>(`${this.basePath}/${connectorId}/sync`, {});
  }

  /**
   * List sync history for a connector.
   */
  async listSyncs(
    connectorId: string,
    params?: SyncListParams
  ): Promise<PaginatedSyncsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.trigger) searchParams.set('trigger', params.trigger);
    if (params?.orderBy) searchParams.set('orderBy', params.orderBy);
    if (params?.orderDirection) searchParams.set('orderDirection', params.orderDirection);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${this.basePath}/${connectorId}/syncs?${queryString}`
      : `${this.basePath}/${connectorId}/syncs`;

    return apiClient.get<PaginatedSyncsResponse>(url);
  }

  /**
   * Get a sync record by ID.
   */
  async getSync(connectorId: string, syncId: string): Promise<SyncRecord> {
    return apiClient.get<SyncRecord>(
      `${this.basePath}/${connectorId}/syncs/${syncId}`
    );
  }

  /**
   * Cancel a sync.
   */
  async cancelSync(connectorId: string, syncId: string): Promise<SyncRecord> {
    return apiClient.post<SyncRecord>(
      `${this.basePath}/${connectorId}/syncs/${syncId}/cancel`,
      {}
    );
  }
}

export const integrationsService = new IntegrationsService();
