export { apiClient, ApiError } from './api-client';
export { queryKeys, type QueryKeys } from './query-keys';
export { queryClient } from './queryClient';
export {
  suggestRoute,
  ROUTE_REGISTRY,
  type RouteDefinition,
  type AISuggestion,
} from './ai-route-suggest.service';
export {
  configureAuthAdapter,
  getAuthAdapter,
  type AuthAdapter,
} from './auth-adapter';
// NOTE: Auth service and types should be imported directly from @/features/auth
// to follow FSD architecture rules (shared/ should not import from features/)
export {
  uploadService,
  type UploadResponse,
  type UploadOptions,
} from './upload.service';

// Re-export error utilities for convenience
export {
  isApiError,
  handleError,
  showSuccess,
  getErrorMessage,
} from '@/shared/errors';
