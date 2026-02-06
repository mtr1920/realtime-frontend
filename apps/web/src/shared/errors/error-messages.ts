/**
 * Error Messages
 * Maps API error codes to user-friendly messages.
 */

import type { ApiErrorCode, ErrorSeverity } from './types';
import { isApiError, extractErrorDetails } from './api-error';

/**
 * User-friendly messages for known error codes.
 */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  TOKEN_INVALID: 'Your session is invalid. Please sign in again.',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
  UNAUTHORIZED: 'Please sign in to continue.',

  // User errors
  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'A user with this email already exists.',
  EMAIL_ALREADY_EXISTS: 'This email address is already registered.',

  // Workspace errors
  WORKSPACE_NOT_FOUND: 'Workspace not found.',
  WORKSPACE_SLUG_EXISTS: 'A workspace with this name already exists.',
  WORKSPACE_LIMIT_REACHED: 'You have reached the maximum number of workspaces.',

  // Session errors
  SESSION_NOT_FOUND: 'Session not found.',
  SESSION_INVALID_STATUS: 'This session cannot be modified in its current state.',
  SESSION_FULL: 'This session is full and cannot accept more participants.',
  SESSION_ALREADY_STARTED: 'This session has already started.',
  SESSION_ALREADY_COMPLETED: 'This session has already been completed.',

  // Generic errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'A conflict occurred. Please refresh and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Fallback messages based on HTTP status codes.
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. Please refresh and try again.',
  422: 'Please check your input and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong. Please try again later.',
  502: 'Unable to reach the server. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Request timed out. Please try again.',
};

/**
 * Get a user-friendly error message from any error.
 */
export function getErrorMessage(error: unknown): string {
  const details = extractErrorDetails(error);

  // Try to get message from error code
  if (details.code && details.code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[details.code as ApiErrorCode];
  }

  // Try to get message from status code
  if (details.status && details.status in STATUS_MESSAGES) {
    // Non-null assertion is safe because we checked with `in` above
    return STATUS_MESSAGES[details.status]!;
  }

  // Use the error message if it looks user-friendly (not too technical)
  if (details.message && !looksLikeTechnicalError(details.message)) {
    return details.message;
  }

  // Default fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Get the appropriate severity for an error.
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (isApiError(error)) {
    return error.severity;
  }

  const details = extractErrorDetails(error);

  // Network errors are warnings (user can retry)
  if (
    details.code === 'NETWORK_ERROR' ||
    details.message?.toLowerCase().includes('network') ||
    details.message?.toLowerCase().includes('connection')
  ) {
    return 'warning';
  }

  // Default to error
  return 'error';
}

/**
 * Check if error requires re-authentication.
 * Note: SESSION_EXPIRED refers to a session resource expiring, not user auth session.
 */
export function isAuthError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.requiresAuth;
  }

  const details = extractErrorDetails(error);
  return (
    details.status === 401 ||
    details.code === 'TOKEN_EXPIRED' ||
    details.code === 'TOKEN_INVALID' ||
    details.code === 'UNAUTHORIZED'
  );
}

/**
 * Heuristic to detect technical error messages that shouldn't be shown to users.
 */
function looksLikeTechnicalError(message: string): boolean {
  const technicalPatterns = [
    /^[A-Z_]+$/, // ALL_CAPS_CONSTANTS
    /error code/i,
    /stack trace/i,
    /undefined/i,
    /null/i,
    /exception/i,
    /failed to fetch/i,
    /load failed/i,
    /TypeError/i,
    /SyntaxError/i,
    /ReferenceError/i,
  ];

  return technicalPatterns.some((pattern) => pattern.test(message));
}
