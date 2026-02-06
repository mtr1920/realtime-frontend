/**
 * Webhook Types
 * Type definitions for webhook management feature.
 */

// =============================================================================
// Webhook Event Types
// =============================================================================

/**
 * Available webhook event types.
 */
export type WebhookEvent =
  // Session events
  | 'session.created'
  | 'session.started'
  | 'session.completed'
  | 'session.failed'
  | 'session.expired'
  // Participant events
  | 'participant.joined'
  | 'participant.left'
  | 'participant.disconnected'
  // Recording events
  | 'recording.started'
  | 'recording.stopped'
  | 'recording.ready'
  | 'recording.failed'
  // Outcome events
  | 'outcome.ready'
  | 'outcome.failed';

/**
 * Webhook event labels for display.
 */
export const webhookEventLabels: Record<WebhookEvent, string> = {
  'session.created': 'Session Created',
  'session.started': 'Session Started',
  'session.completed': 'Session Completed',
  'session.failed': 'Session Failed',
  'session.expired': 'Session Expired',
  'participant.joined': 'Participant Joined',
  'participant.left': 'Participant Left',
  'participant.disconnected': 'Participant Disconnected',
  'recording.started': 'Recording Started',
  'recording.stopped': 'Recording Stopped',
  'recording.ready': 'Recording Ready',
  'recording.failed': 'Recording Failed',
  'outcome.ready': 'Outcome Ready',
  'outcome.failed': 'Outcome Failed',
};

/**
 * Group webhook events by category.
 */
export const webhookEventGroups = {
  session: [
    'session.created',
    'session.started',
    'session.completed',
    'session.failed',
    'session.expired',
  ] as WebhookEvent[],
  participant: [
    'participant.joined',
    'participant.left',
    'participant.disconnected',
  ] as WebhookEvent[],
  recording: [
    'recording.started',
    'recording.stopped',
    'recording.ready',
    'recording.failed',
  ] as WebhookEvent[],
  outcome: ['outcome.ready', 'outcome.failed'] as WebhookEvent[],
};

// =============================================================================
// Webhook Delivery Types
// =============================================================================

/**
 * Delivery status for webhook attempts.
 */
export type DeliveryStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'FAILED'
  | 'EXHAUSTED';

/**
 * Delivery status labels for display.
 */
export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  EXHAUSTED: 'Exhausted',
};

// =============================================================================
// Webhook Entity
// =============================================================================

/**
 * Retry policy configuration for webhooks.
 */
export interface WebhookRetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

/**
 * Optional filters for webhook events.
 */
export interface WebhookFilters {
  workspaceIds?: string[];
  domainTypes?: string[];
}

/**
 * Webhook entity.
 */
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  filters?: WebhookFilters;
  retryPolicy: WebhookRetryPolicy;
  enabled: boolean;
  failureCount: number;
  lastDeliveredAt: string | null;
  lastFailedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Webhook delivery record.
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  status: DeliveryStatus;
  attempt: number;
  maxAttempts: number;
  httpStatusCode?: number;
  requestBody: string;
  responseBody?: string;
  errorMessage?: string;
  deliveredAt?: string;
  nextRetryAt?: string;
  createdAt: string;
}

// =============================================================================
// API Types
// =============================================================================

/**
 * Parameters for listing webhooks.
 */
export interface WebhookListParams {
  enabled?: boolean;
  search?: string;
  orderBy?: 'name' | 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

/**
 * Paginated webhooks response.
 */
export interface PaginatedWebhooksResponse {
  webhooks: Webhook[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
}

/**
 * Input for creating a webhook.
 */
export interface CreateWebhookInput {
  name: string;
  url: string;
  events: WebhookEvent[];
  filters?: WebhookFilters;
  retryPolicy?: Partial<WebhookRetryPolicy>;
  enabled?: boolean;
}

/**
 * Input for updating a webhook.
 */
export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  filters?: WebhookFilters;
  retryPolicy?: Partial<WebhookRetryPolicy>;
  enabled?: boolean;
}

/**
 * Parameters for listing webhook deliveries.
 */
export interface WebhookDeliveryListParams {
  status?: DeliveryStatus;
  event?: WebhookEvent;
  orderBy?: 'createdAt' | 'deliveredAt';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

/**
 * Paginated webhook deliveries response.
 */
export interface PaginatedWebhookDeliveriesResponse {
  deliveries: WebhookDelivery[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
}

/**
 * Input for testing a webhook.
 */
export interface TestWebhookInput {
  url: string;
  event?: WebhookEvent;
}

/**
 * Response from testing a webhook.
 */
export interface TestWebhookResponse {
  success: boolean;
  httpStatusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  durationMs?: number;
}

/**
 * Response from rotating a webhook secret.
 */
export interface RotateSecretResponse {
  secret: string;
}
