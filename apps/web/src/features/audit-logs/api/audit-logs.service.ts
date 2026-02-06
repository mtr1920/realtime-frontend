/**
 * Audit Logs Service
 * API service for audit log operations.
 */

import { apiClient } from '@/shared/services/api-client';
import type {
  AuditLog,
  AuditLogListParams,
  PaginatedAuditLogsResponse,
  AuditLogCountResponse,
  ExportAuditLogsInput,
} from '../types/audit-logs.types';

class AuditLogsService {
  private readonly basePath = '/v1/audit-logs';

  /**
   * List audit logs with optional filters.
   */
  async list(params?: AuditLogListParams): Promise<PaginatedAuditLogsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.actorType) searchParams.set('actorType', params.actorType);
    if (params?.actorId) searchParams.set('actorId', params.actorId);
    if (params?.actions?.length) searchParams.set('actions', params.actions.join(','));
    if (params?.resources?.length) searchParams.set('resources', params.resources.join(','));
    if (params?.workspaceId) searchParams.set('workspaceId', params.workspaceId);
    if (params?.sessionId) searchParams.set('sessionId', params.sessionId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.orderBy) searchParams.set('orderBy', params.orderBy);
    if (params?.orderDirection) searchParams.set('orderDirection', params.orderDirection);

    const queryString = searchParams.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

    return apiClient.get<PaginatedAuditLogsResponse>(url);
  }

  /**
   * Get a single audit log by ID.
   */
  async getById(id: string): Promise<AuditLog> {
    return apiClient.get<AuditLog>(`${this.basePath}/${id}`);
  }

  /**
   * Get count of audit logs matching filters.
   */
  async getCount(params?: AuditLogListParams): Promise<AuditLogCountResponse> {
    const searchParams = new URLSearchParams();

    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.actorType) searchParams.set('actorType', params.actorType);
    if (params?.actorId) searchParams.set('actorId', params.actorId);
    if (params?.actions?.length) searchParams.set('actions', params.actions.join(','));
    if (params?.resources?.length) searchParams.set('resources', params.resources.join(','));
    if (params?.workspaceId) searchParams.set('workspaceId', params.workspaceId);
    if (params?.sessionId) searchParams.set('sessionId', params.sessionId);
    if (params?.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${this.basePath}/stats/count?${queryString}`
      : `${this.basePath}/stats/count`;

    return apiClient.get<AuditLogCountResponse>(url);
  }

  /**
   * Export audit logs.
   * Uses apiClient.postBlob for authenticated blob response.
   */
  async export(input: ExportAuditLogsInput): Promise<Blob> {
    return apiClient.postBlob(`${this.basePath}/export`, input);
  }
}

export const auditLogsService = new AuditLogsService();
