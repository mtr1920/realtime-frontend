/**
 * ApiError Class
 * Enhanced error class with duck-typing support for reliable error identification.
 */

import type { ApiErrorCode, ApiErrorShape, ErrorSeverity } from './types';

/**
 * API Error class with duck-typing marker.
 * Uses `_tag` property for reliable type identification without instanceof issues.
 */
export class ApiError extends Error implements ApiErrorShape {
  readonly _tag = 'ApiError' as const;

  constructor(
    message: string,
    public status: number,
    public code?: ApiErrorCode | string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    // Restore prototype chain for proper instanceof (though we prefer duck-typing)
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Determine error severity based on status code and error type.
   */
  get severity(): ErrorSeverity {
    // 4xx client errors are typically warnings (user can fix)
    if (this.status >= 400 && this.status < 500) {
      // Auth errors should be treated as errors since they require action
      // Note: SESSION_EXPIRED is a resource error, not auth - it stays as warning
      if (this.code === 'TOKEN_EXPIRED' || this.code === 'UNAUTHORIZED') {
        return 'error';
      }
      return 'warning';
    }
    // 5xx server errors are always errors
    return 'error';
  }

  /**
   * Check if this error can potentially be recovered from.
   */
  get isRecoverable(): boolean {
    // Network errors and timeouts can be retried
    if (this.code === 'NETWORK_ERROR' || this.status === 0 || this.status === 408) {
      return true;
    }
    // Rate limiting can be recovered after waiting
    if (this.code === 'RATE_LIMITED' || this.status === 429) {
      return true;
    }
    // 5xx errors might be temporary
    if (this.status >= 500) {
      return true;
    }
    return false;
  }

  /**
   * Check if this error requires re-authentication.
   * Note: SESSION_EXPIRED refers to a session resource expiring, not user auth session.
   * User authentication errors are TOKEN_EXPIRED, TOKEN_INVALID, and UNAUTHORIZED.
   */
  get requiresAuth(): boolean {
    return (
      this.status === 401 ||
      this.code === 'TOKEN_EXPIRED' ||
      this.code === 'TOKEN_INVALID' ||
      this.code === 'UNAUTHORIZED'
    );
  }
}

/**
 * Type guard to check if an error is an ApiError using duck-typing.
 * Works reliably across module boundaries and bundling.
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    (error as ApiErrorShape)._tag === 'ApiError'
  );
}

/**
 * Safely extract error details from an unknown error.
 * Useful for logging and error reporting.
 */
export function extractErrorDetails(error: unknown): {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
} {
  if (isApiError(error)) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: 'An unknown error occurred' };
}
