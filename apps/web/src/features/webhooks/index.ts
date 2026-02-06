/**
 * Webhooks Feature
 * Public exports for the webhooks management module.
 */

// API Service
export {
  webhooksService,
  type Webhook,
  type WebhookEvent,
  type WebhookFilters,
  type WebhookRetryPolicy,
  type WebhookListParams,
  type PaginatedWebhooksResponse,
  type CreateWebhookInput,
  type UpdateWebhookInput,
  type WebhookDelivery,
  type DeliveryStatus,
  type WebhookDeliveryListParams,
  type PaginatedWebhookDeliveriesResponse,
  type TestWebhookInput,
  type TestWebhookResponse,
  type RotateSecretResponse,
} from './api/webhooks.service';

// Types
export {
  webhookEventLabels,
  webhookEventGroups,
  deliveryStatusLabels,
} from './types/webhooks.types';

// Hooks
export { useWebhooks, useInfiniteWebhooks } from './hooks/useWebhooks';
export { useWebhook } from './hooks/useWebhook';
export { useCreateWebhook } from './hooks/useCreateWebhook';
export { useUpdateWebhook } from './hooks/useUpdateWebhook';
export { useDeleteWebhook } from './hooks/useDeleteWebhook';
export { useWebhookDeliveries, useInfiniteWebhookDeliveries } from './hooks/useWebhookDeliveries';
export { useRetryDelivery } from './hooks/useRetryDelivery';
export { useTestWebhook } from './hooks/useTestWebhook';
export { useRotateSecret } from './hooks/useRotateSecret';

// Components
export { WebhookTable } from './components/WebhookTable';
export { WebhookForm } from './components/WebhookForm';
export {
  CreateWebhookDialog,
  EditWebhookDialog,
  DeleteWebhookDialog,
} from './components/WebhookDialog';
export { WebhookEventsSelect } from './components/WebhookEventsSelect';
export { WebhookStatusBadge } from './components/WebhookStatusBadge';
export { DeliveryStatusBadge } from './components/DeliveryStatusBadge';
export { DeliveryLogTable } from './components/DeliveryLogTable';
export { DeliveryHistoryDialog, DeliveryDetailsDialog } from './components/DeliveryLogDialog';
export { SecretRevealDialog } from './components/SecretRevealDialog';

// Schemas
export {
  webhookEventSchema,
  deliveryStatusSchema,
  retryPolicySchema,
  webhookFiltersSchema,
  createWebhookSchema,
  updateWebhookSchema,
  testWebhookSchema,
  webhookListFiltersSchema,
  deliveryFiltersSchema,
  type WebhookEventEnum,
  type DeliveryStatusEnum,
  type RetryPolicyFormData,
  type WebhookFiltersFormData,
  type CreateWebhookFormData,
  type UpdateWebhookFormData,
  type TestWebhookFormData,
  type WebhookListFiltersFormData,
  type DeliveryFiltersFormData,
} from './schemas/webhooks.schema';
