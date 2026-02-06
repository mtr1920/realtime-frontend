/**
 * Outcomes Service
 * API service for outcome operations.
 */

import { apiClient } from '@/shared/services/api-client';
import type {
  Outcome,
  OutcomeArtifact,
  OutcomeListParams,
  PaginatedOutcomesResponse,
  RejectOutcomeInput,
} from '../types/outcomes.types';

class OutcomesService {
  private readonly basePath = '/v1/outcomes';

  /**
   * List outcomes with optional filters.
   */
  async list(params?: OutcomeListParams): Promise<PaginatedOutcomesResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.workspaceId) searchParams.set('workspaceId', params.workspaceId);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.orderBy) searchParams.set('orderBy', params.orderBy);
    if (params?.orderDirection) searchParams.set('orderDirection', params.orderDirection);

    const queryString = searchParams.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

    return apiClient.get<PaginatedOutcomesResponse>(url);
  }

  /**
   * Get an outcome by ID.
   */
  async getById(id: string): Promise<Outcome> {
    return apiClient.get<Outcome>(`${this.basePath}/${id}`);
  }

  /**
   * Get outcome by session ID.
   */
  async getBySessionId(sessionId: string): Promise<Outcome> {
    return apiClient.get<Outcome>(`/v1/sessions/${sessionId}/outcome`);
  }

  /**
   * Approve an outcome.
   */
  async approve(sessionId: string): Promise<Outcome> {
    return apiClient.post<Outcome>(`/v1/sessions/${sessionId}/outcome/approve`, {});
  }

  /**
   * Reject an outcome.
   */
  async reject(sessionId: string, input: RejectOutcomeInput): Promise<Outcome> {
    return apiClient.post<Outcome>(`/v1/sessions/${sessionId}/outcome/reject`, input);
  }

  /**
   * Regenerate an outcome.
   */
  async regenerate(sessionId: string): Promise<Outcome> {
    return apiClient.post<Outcome>(`/v1/sessions/${sessionId}/outcome/regenerate`, {});
  }

  /**
   * List artifacts for an outcome.
   */
  async listArtifacts(outcomeId: string): Promise<OutcomeArtifact[]> {
    const response = await apiClient.get<{ data: OutcomeArtifact[] }>(
      `${this.basePath}/${outcomeId}/artifacts`
    );
    return response.data;
  }

  /**
   * Download an artifact.
   * Uses apiClient.getBlob for authenticated blob response.
   */
  async downloadArtifact(outcomeId: string, artifactId: string): Promise<Blob> {
    return apiClient.getBlob(
      `${this.basePath}/${outcomeId}/artifacts/${artifactId}/download`
    );
  }
}

export const outcomesService = new OutcomesService();
