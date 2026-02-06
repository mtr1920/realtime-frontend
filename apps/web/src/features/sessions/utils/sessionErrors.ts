/**
 * Session Error Utilities
 * Utilities for detecting and handling session-specific errors.
 */

import { isApiError } from '@/shared/errors';

/**
 * Known session error codes from the backend.
 */
export const SESSION_ERROR_CODES = {
  EXPIRED: 'SESSION_EXPIRED',
  INVALID_STATUS: 'SESSION_INVALID_STATUS',
  NOT_FOUND: 'SESSION_NOT_FOUND',
  FULL: 'SESSION_FULL',
  ALREADY_STARTED: 'SESSION_ALREADY_STARTED',
  ALREADY_COMPLETED: 'SESSION_ALREADY_COMPLETED',
  ACCESS_DENIED: 'INSUFFICIENT_PERMISSIONS',
} as const;

export type SessionErrorCode = (typeof SESSION_ERROR_CODES)[keyof typeof SESSION_ERROR_CODES];

export type SessionErrorType =
  | 'expired'
  | 'invalid_status'
  | 'not_found'
  | 'full'
  | 'access_denied';

/**
 * Check if an error is a session expired error.
 */
export function isSessionExpiredError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.code === SESSION_ERROR_CODES.EXPIRED;
}

/**
 * Check if an error is a session invalid status error.
 */
export function isSessionInvalidStatusError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return (
    error.code === SESSION_ERROR_CODES.INVALID_STATUS ||
    error.code === SESSION_ERROR_CODES.ALREADY_STARTED ||
    error.code === SESSION_ERROR_CODES.ALREADY_COMPLETED
  );
}

/**
 * Check if an error is a session not found error.
 */
export function isSessionNotFoundError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.code === SESSION_ERROR_CODES.NOT_FOUND || error.status === 404;
}

/**
 * Check if an error is a session full error.
 */
export function isSessionFullError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.code === SESSION_ERROR_CODES.FULL;
}

/**
 * Check if an error is a session access denied error.
 */
export function isSessionAccessDeniedError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.code === SESSION_ERROR_CODES.ACCESS_DENIED || error.status === 403;
}

/**
 * Get the session error type from an error.
 */
export function getSessionErrorType(error: unknown): SessionErrorType | null {
  if (isSessionExpiredError(error)) return 'expired';
  if (isSessionInvalidStatusError(error)) return 'invalid_status';
  if (isSessionNotFoundError(error)) return 'not_found';
  if (isSessionFullError(error)) return 'full';
  if (isSessionAccessDeniedError(error)) return 'access_denied';
  return null;
}

/**
 * Get a user-friendly message for a session error.
 */
export function getSessionErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  switch (error.code) {
    case SESSION_ERROR_CODES.EXPIRED:
      return 'This session has expired and is no longer available.';
    case SESSION_ERROR_CODES.INVALID_STATUS:
      return 'This session is no longer accepting participants.';
    case SESSION_ERROR_CODES.ALREADY_STARTED:
      return 'This session has already started.';
    case SESSION_ERROR_CODES.ALREADY_COMPLETED:
      return 'This session has already been completed.';
    case SESSION_ERROR_CODES.NOT_FOUND:
      return 'Session not found. It may have been deleted.';
    case SESSION_ERROR_CODES.FULL:
      return 'This session is full and cannot accept more participants.';
    case SESSION_ERROR_CODES.ACCESS_DENIED:
      return 'You do not have permission to access this session.';
    default:
      return error.message || 'An error occurred while accessing the session.';
  }
}

/**
 * Check if a session error should be handled locally (not by global error handler).
 * Returns true for session-specific errors that components should handle.
 */
export function isSessionSpecificError(error: unknown): boolean {
  return getSessionErrorType(error) !== null;
}
