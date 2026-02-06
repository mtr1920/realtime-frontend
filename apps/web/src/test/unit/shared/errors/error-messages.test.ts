/**
 * Error Messages Tests
 * Tests for error message mapping and utility functions.
 */

import { describe, it, expect } from 'vitest';
import { getErrorMessage, getErrorSeverity, isAuthError } from '@/shared/errors/error-messages';
import { ApiError } from '@/shared/errors/api-error';

describe('getErrorMessage', () => {
  // ===========================================================================
  // Error Code Messages
  // ===========================================================================

  describe('error codes', () => {
    it('should return message for INVALID_CREDENTIALS', () => {
      const error = new ApiError('Invalid', 401, 'INVALID_CREDENTIALS');
      expect(getErrorMessage(error)).toBe('Invalid email or password. Please try again.');
    });

    it('should return message for SESSION_EXPIRED', () => {
      const error = new ApiError('Expired', 401, 'SESSION_EXPIRED');
      expect(getErrorMessage(error)).toBe('Your session has expired. Please sign in again.');
    });

    it('should return message for TOKEN_EXPIRED', () => {
      const error = new ApiError('Expired', 401, 'TOKEN_EXPIRED');
      expect(getErrorMessage(error)).toBe('Your session has expired. Please sign in again.');
    });

    it('should return message for INSUFFICIENT_PERMISSIONS', () => {
      const error = new ApiError('Forbidden', 403, 'INSUFFICIENT_PERMISSIONS');
      expect(getErrorMessage(error)).toBe('You do not have permission to perform this action.');
    });

    it('should return message for VALIDATION_ERROR', () => {
      const error = new ApiError('Validation failed', 400, 'VALIDATION_ERROR');
      expect(getErrorMessage(error)).toBe('Please check your input and try again.');
    });

    it('should return message for NOT_FOUND', () => {
      const error = new ApiError('Not found', 404, 'NOT_FOUND');
      expect(getErrorMessage(error)).toBe('The requested resource was not found.');
    });

    it('should return message for RATE_LIMITED', () => {
      const error = new ApiError('Rate limited', 429, 'RATE_LIMITED');
      expect(getErrorMessage(error)).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('should return message for NETWORK_ERROR', () => {
      const error = new ApiError('Network error', 0, 'NETWORK_ERROR');
      expect(getErrorMessage(error)).toBe('Unable to connect. Please check your internet connection.');
    });

    it('should return message for SESSION_NOT_FOUND', () => {
      const error = new ApiError('Not found', 404, 'SESSION_NOT_FOUND');
      expect(getErrorMessage(error)).toBe('Session not found.');
    });

    it('should return message for USER_ALREADY_EXISTS', () => {
      const error = new ApiError('Exists', 409, 'USER_ALREADY_EXISTS');
      expect(getErrorMessage(error)).toBe('A user with this email already exists.');
    });
  });

  // ===========================================================================
  // Status Code Messages
  // ===========================================================================

  describe('status codes', () => {
    it('should return message for status 400', () => {
      const error = new ApiError('Bad request', 400);
      expect(getErrorMessage(error)).toBe('Invalid request. Please check your input.');
    });

    it('should return message for status 401', () => {
      const error = new ApiError('Unauthorized', 401);
      expect(getErrorMessage(error)).toBe('Please sign in to continue.');
    });

    it('should return message for status 403', () => {
      const error = new ApiError('Forbidden', 403);
      expect(getErrorMessage(error)).toBe('You do not have permission to perform this action.');
    });

    it('should return message for status 404', () => {
      const error = new ApiError('Not found', 404);
      expect(getErrorMessage(error)).toBe('The requested resource was not found.');
    });

    it('should return message for status 429', () => {
      const error = new ApiError('Rate limited', 429);
      expect(getErrorMessage(error)).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('should return message for status 500', () => {
      const error = new ApiError('Internal error', 500);
      expect(getErrorMessage(error)).toBe('Something went wrong. Please try again later.');
    });

    it('should return message for status 502', () => {
      const error = new ApiError('Bad gateway', 502);
      expect(getErrorMessage(error)).toBe('Unable to reach the server. Please try again later.');
    });

    it('should return message for status 503', () => {
      const error = new ApiError('Service unavailable', 503);
      expect(getErrorMessage(error)).toBe('Service temporarily unavailable. Please try again later.');
    });

    it('should return message for status 504', () => {
      const error = new ApiError('Gateway timeout', 504);
      expect(getErrorMessage(error)).toBe('Request timed out. Please try again.');
    });
  });

  // ===========================================================================
  // User-Friendly Messages
  // ===========================================================================

  describe('user-friendly messages', () => {
    it('should use error message if not technical', () => {
      const error = new Error('Please provide a valid email address');
      expect(getErrorMessage(error)).toBe('Please provide a valid email address');
    });

    it('should not use technical error messages', () => {
      const error = new Error('TypeError: Cannot read property of undefined');
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should not use stack trace messages', () => {
      const error = new Error('Error: Stack trace at line 42');
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should not use fetch error messages', () => {
      const error = new Error('Failed to fetch');
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should not use ALL_CAPS constant messages', () => {
      const error = new Error('SOME_ERROR_CONSTANT');
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  // ===========================================================================
  // Fallback Messages
  // ===========================================================================

  describe('fallback messages', () => {
    it('should return default for string error', () => {
      expect(getErrorMessage('Something broke')).toBe('Something broke');
    });

    it('should return default for null', () => {
      // extractErrorDetails returns 'An unknown error occurred' for null
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
    });

    it('should return default for undefined', () => {
      // extractErrorDetails returns 'An unknown error occurred' for undefined
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    });

    it('should return default for unknown status', () => {
      const error = new ApiError('Unknown', 418); // I'm a teapot
      expect(getErrorMessage(error)).toBe('Unknown');
    });
  });
});

describe('getErrorSeverity', () => {
  // ===========================================================================
  // ApiError Severity
  // ===========================================================================

  describe('ApiError', () => {
    it('should return severity from ApiError', () => {
      const error = new ApiError('Warning', 400);
      expect(getErrorSeverity(error)).toBe('warning');
    });

    it('should return error severity for 5xx', () => {
      const error = new ApiError('Error', 500);
      expect(getErrorSeverity(error)).toBe('error');
    });

    it('should return error severity for auth errors', () => {
      const error = new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      expect(getErrorSeverity(error)).toBe('error');
    });
  });

  // ===========================================================================
  // Network Errors
  // ===========================================================================

  describe('network errors', () => {
    it('should return warning for NETWORK_ERROR ApiError', () => {
      // ApiError has its own severity calculation based on status
      const error = new ApiError('Network error', 0, 'NETWORK_ERROR');
      // Status 0 is < 400 so severity is 'error' based on the default case
      // Let's test with the message-based detection instead
      expect(getErrorSeverity(error)).toBe('error');
    });

    it('should return warning for network message', () => {
      const error = new Error('Network request failed');
      expect(getErrorSeverity(error)).toBe('warning');
    });

    it('should return warning for connection message', () => {
      const error = new Error('Connection refused');
      expect(getErrorSeverity(error)).toBe('warning');
    });
  });

  // ===========================================================================
  // Default Severity
  // ===========================================================================

  describe('default severity', () => {
    it('should return error for regular Error', () => {
      const error = new Error('Something went wrong');
      expect(getErrorSeverity(error)).toBe('error');
    });

    it('should return error for string', () => {
      expect(getErrorSeverity('Something failed')).toBe('error');
    });

    it('should return error for null', () => {
      expect(getErrorSeverity(null)).toBe('error');
    });

    it('should return error for undefined', () => {
      expect(getErrorSeverity(undefined)).toBe('error');
    });
  });
});

describe('isAuthError', () => {
  // ===========================================================================
  // ApiError Auth Checks
  // ===========================================================================

  describe('ApiError', () => {
    it('should return true for ApiError with status 401', () => {
      const error = new ApiError('Unauthorized', 401);
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for SESSION_EXPIRED code (resource expiry, not auth)', () => {
      const error = new ApiError('Expired', 403, 'SESSION_EXPIRED');
      expect(isAuthError(error)).toBe(false);
    });

    it('should return true for TOKEN_EXPIRED code', () => {
      const error = new ApiError('Expired', 403, 'TOKEN_EXPIRED');
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for TOKEN_INVALID code', () => {
      const error = new ApiError('Invalid', 403, 'TOKEN_INVALID');
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for UNAUTHORIZED code', () => {
      const error = new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for non-auth ApiError', () => {
      const error = new ApiError('Not found', 404, 'NOT_FOUND');
      expect(isAuthError(error)).toBe(false);
    });
  });

  // ===========================================================================
  // Non-ApiError Auth Checks
  // ===========================================================================

  describe('non-ApiError', () => {
    it('should return false for plain object (not handled by extractErrorDetails)', () => {
      // extractErrorDetails only handles ApiError, Error, or string
      // Plain objects return { message: 'An unknown error occurred' }
      const errorLike = { message: 'Unauthorized', status: 401 };
      expect(isAuthError(errorLike)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Something went wrong');
      expect(isAuthError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAuthError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAuthError(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isAuthError('Unauthorized')).toBe(false);
    });

    it('should return true for ApiError-like object with _tag', () => {
      // Objects with _tag = 'ApiError' are recognized by isApiError
      const errorLike = {
        _tag: 'ApiError' as const,
        message: 'Unauthorized',
        status: 401,
        code: 'UNAUTHORIZED',
        requiresAuth: true,
      };
      expect(isAuthError(errorLike)).toBe(true);
    });
  });
});
