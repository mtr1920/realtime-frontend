/**
 * Webhooks Service
 * Handles all webhook management API calls.
 */

import { apiClient, ApiError } from '@/shared/services/api-client';
import type {
  Webhook,
  WebhookListParams,
  PaginatedWebhooksResponse,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
  WebhookDeliveryListParams,
  PaginatedWebhookDeliveriesResponse,
  TestWebhookInput,
  TestWebhookResponse,
  RotateSecretResponse,
} from '../types/webhooks.types';

// =============================================================================
// Webhooks Service Class
// =============================================================================

class WebhooksService {
  private readonly basePath = '/v1/webhooks';

  /**
   * List webhooks with optional filters.
   */
  async list(params: WebhookListParams = {}): Promise<PaginatedWebhooksResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params.enabled !== undefined) queryParams.enabled = params.enabled;
    if (params.search) queryParams.search = params.search;
    if (params.orderBy) queryParams.orderBy = params.orderBy;
    if (params.orderDirection) queryParams.orderDirection = params.orderDirection;
    if (params.limit) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;

    return apiClient.get<PaginatedWebhooksResponse>(this.basePath, {
      params: queryParams,
    });
  }

  /**
   * Get a single webhook by ID.
   */
  async get(id: string): Promise<Webhook> {
    const response = await apiClient.get<{ webhook: Webhook }>(`${this.basePath}/${id}`);
    return response.webhook;
  }

  /**
   * Create a new webhook.
   */
  async create(data: CreateWebhookInput): Promise<{ webhook: Webhook; secret: string }> {
    return apiClient.post<{ webhook: Webhook; secret: string }>(this.basePath, data);
  }

  /**
   * Update an existing webhook.
   */
  async update(id: string, data: UpdateWebhookInput): Promise<Webhook> {
    const response = await apiClient.patch<{ webhook: Webhook }>(`${this.basePath}/${id}`, data);
    return response.webhook;
  }

  /**
   * Delete a webhook.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Enable a webhook.
   */
  async enable(id: string): Promise<Webhook> {
    return this.update(id, { enabled: true });
  }

  /**
   * Disable a webhook.
   */
  async disable(id: string): Promise<Webhook> {
    return this.update(id, { enabled: false });
  }

  /**
   * Rotate the webhook secret.
   */
  async rotateSecret(id: string): Promise<RotateSecretResponse> {
    return apiClient.post<RotateSecretResponse>(`${this.basePath}/${id}/rotate`, {});
  }

  /**
   * List webhook deliveries.
   */
  async listDeliveries(
    webhookId: string,
    params: WebhookDeliveryListParams = {}
  ): Promise<PaginatedWebhookDeliveriesResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params.status) queryParams.status = params.status;
    if (params.event) queryParams.event = params.event;
    if (params.orderBy) queryParams.orderBy = params.orderBy;
    if (params.orderDirection) queryParams.orderDirection = params.orderDirection;
    if (params.limit) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;

    return apiClient.get<PaginatedWebhookDeliveriesResponse>(
      `${this.basePath}/${webhookId}/deliveries`,
      { params: queryParams }
    );
  }

  /**
   * Get a single delivery by ID.
   */
  async getDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery> {
    const response = await apiClient.get<{ delivery: WebhookDelivery }>(
      `${this.basePath}/${webhookId}/deliveries/${deliveryId}`
    );
    return response.delivery;
  }

  /**
   * Retry a failed delivery.
   */
  async retryDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery> {
    const response = await apiClient.post<{ delivery: WebhookDelivery }>(
      `${this.basePath}/${webhookId}/deliveries/${deliveryId}/retry`,
      {}
    );
    return response.delivery;
  }

  /**
   * Test a webhook URL.
   */
  async test(data: TestWebhookInput): Promise<TestWebhookResponse> {
    return apiClient.post<TestWebhookResponse>(`${this.basePath}/test`, data);
  }
}

// Export singleton instance
export const webhooksService = new WebhooksService();

// Re-export types and ApiError for convenience
export { ApiError };
export type {
  Webhook,
  WebhookEvent,
  WebhookFilters,
  WebhookRetryPolicy,
  WebhookListParams,
  PaginatedWebhooksResponse,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
  DeliveryStatus,
  WebhookDeliveryListParams,
  PaginatedWebhookDeliveriesResponse,
  TestWebhookInput,
  TestWebhookResponse,
  RotateSecretResponse,
} from '../types/webhooks.types';
