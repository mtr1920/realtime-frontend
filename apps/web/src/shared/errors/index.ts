/**
 * Errors Module
 * Centralized error handling for the application.
 */

// Types
export type {
  ApiErrorCode,
  ApiErrorShape,
  ErrorSeverity,
  HandleErrorOptions,
  MutationMeta,
} from './types';

// ApiError class and utilities
export { ApiError, isApiError, extractErrorDetails } from './api-error';

// Error messages
export { getErrorMessage, getErrorSeverity, isAuthError } from './error-messages';

// Error handler
export { handleError, showSuccess, showInfo, showWarning } from './error-handler';

// Error reporter
export { reportError, setErrorReportingUser } from './error-reporter';
