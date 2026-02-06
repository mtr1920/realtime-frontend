/**
 * API Error Types
 * Centralized error type definitions for consistent error handling.
 */

/**
 * Known API error codes returned by the backend.
 * These map to specific user-friendly messages.
 */
export type ApiErrorCode =
  // Auth errors
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'UNAUTHORIZED'
  // User errors
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'EMAIL_ALREADY_EXISTS'
  // Workspace errors
  | 'WORKSPACE_NOT_FOUND'
  | 'WORKSPACE_SLUG_EXISTS'
  | 'WORKSPACE_LIMIT_REACHED'
  // Session errors
  | 'SESSION_NOT_FOUND'
  | 'SESSION_INVALID_STATUS'
  | 'SESSION_FULL'
  | 'SESSION_ALREADY_STARTED'
  | 'SESSION_ALREADY_COMPLETED'
  // Generic errors
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Error severity levels for UI display.
 */
export type ErrorSeverity = 'info' | 'warning' | 'error';

/**
 * Shape of an API error for duck-typing.
 * Uses _tag for reliable type identification without instanceof.
 */
export interface ApiErrorShape {
  readonly _tag: 'ApiError';
  message: string;
  status: number;
  code?: ApiErrorCode | string;
  details?: unknown;
}

/**
 * Options for the central error handler.
 */
export interface HandleErrorOptions {
  /** Override the error message shown to the user */
  message?: string;
  /** Override the error severity */
  severity?: ErrorSeverity;
  /** If true, don't show a toast notification */
  silent?: boolean;
  /** Context about where the error occurred (for logging) */
  context?: string;
}

/**
 * Metadata for TanStack Query mutations to control error handling.
 */
export interface MutationMeta {
  /** If true, skip the global error handler (mutation handles its own errors) */
  skipGlobalErrorHandler?: boolean;
}
