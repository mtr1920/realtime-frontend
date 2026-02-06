/**
 * ApiError Tests
 * Tests for the API error class and helper functions.
 */

import { describe, it, expect } from 'vitest';
import { ApiError, isApiError, extractErrorDetails } from '@/shared/errors/api-error';

describe('ApiError', () => {
  // ===========================================================================
  // Constructor
  // ===========================================================================

  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new ApiError('Test error', 400, 'BAD_REQUEST', { field: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('ApiError');
      expect(error._tag).toBe('ApiError');
    });

    it('should create error with only message and status', () => {
      const error = new ApiError('Test error', 500);

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it('should be instance of Error', () => {
      const error = new ApiError('Test', 500);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
    });
  });

  // ===========================================================================
  // Severity
  // ===========================================================================

  describe('severity', () => {
    it('should return warning for 4xx client errors', () => {
      const error = new ApiError('Bad request', 400, 'VALIDATION_ERROR');
      expect(error.severity).toBe('warning');
    });

    it('should return warning for 404 Not Found', () => {
      const error = new ApiError('Not found', 404, 'NOT_FOUND');
      expect(error.severity).toBe('warning');
    });

    it('should return warning for 403 Forbidden', () => {
      const error = new ApiError('Forbidden', 403, 'FORBIDDEN');
      expect(error.severity).toBe('warning');
    });

    it('should return warning for SESSION_EXPIRED code (resource expiry, not auth)', () => {
      const error = new ApiError('Session expired', 403, 'SESSION_EXPIRED');
      expect(error.severity).toBe('warning');
    });

    it('should return error for TOKEN_EXPIRED code', () => {
      const error = new ApiError('Token expired', 401, 'TOKEN_EXPIRED');
      expect(error.severity).toBe('error');
    });

    it('should return error for UNAUTHORIZED code', () => {
      const error = new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      expect(error.severity).toBe('error');
    });

    it('should return error for 5xx server errors', () => {
      const error = new ApiError('Internal error', 500);
      expect(error.severity).toBe('error');
    });

    it('should return error for 502 Bad Gateway', () => {
      const error = new ApiError('Bad gateway', 502);
      expect(error.severity).toBe('error');
    });

    it('should return error for 503 Service Unavailable', () => {
      const error = new ApiError('Service unavailable', 503);
      expect(error.severity).toBe('error');
    });
  });

  // ===========================================================================
  // isRecoverable
  // ===========================================================================

  describe('isRecoverable', () => {
    it('should return true for NETWORK_ERROR', () => {
      const error = new ApiError('Network error', 0, 'NETWORK_ERROR');
      expect(error.isRecoverable).toBe(true);
    });

    it('should return true for status 0 (offline)', () => {
      const error = new ApiError('No connection', 0);
      expect(error.isRecoverable).toBe(true);
    });

    it('should return true for status 408 (timeout)', () => {
      const error = new ApiError('Request timeout', 408);
      expect(error.isRecoverable).toBe(true);
    });

    it('should return true for RATE_LIMITED code', () => {
      const error = new ApiError('Rate limited', 429, 'RATE_LIMITED');
      expect(error.isRecoverable).toBe(true);
    });

    it('should return true for status 429 (too many requests)', () => {
      const error = new ApiError('Too many requests', 429);
      expect(error.isRecoverable).toBe(true);
    });

    it('should return true for 5xx errors', () => {
      expect(new ApiError('Internal error', 500).isRecoverable).toBe(true);
      expect(new ApiError('Bad gateway', 502).isRecoverable).toBe(true);
      expect(new ApiError('Service unavailable', 503).isRecoverable).toBe(true);
    });

    it('should return false for 4xx errors (except rate limiting)', () => {
      expect(new ApiError('Bad request', 400).isRecoverable).toBe(false);
      expect(new ApiError('Unauthorized', 401).isRecoverable).toBe(false);
      expect(new ApiError('Forbidden', 403).isRecoverable).toBe(false);
      expect(new ApiError('Not found', 404).isRecoverable).toBe(false);
    });
  });

  // ===========================================================================
  // requiresAuth
  // ===========================================================================

  describe('requiresAuth', () => {
    it('should return true for status 401', () => {
      const error = new ApiError('Unauthorized', 401);
      expect(error.requiresAuth).toBe(true);
    });

    it('should return false for SESSION_EXPIRED code (resource expiry, not auth)', () => {
      const error = new ApiError('Session expired', 403, 'SESSION_EXPIRED');
      expect(error.requiresAuth).toBe(false);
    });

    it('should return true for TOKEN_EXPIRED code', () => {
      const error = new ApiError('Token expired', 403, 'TOKEN_EXPIRED');
      expect(error.requiresAuth).toBe(true);
    });

    it('should return true for TOKEN_INVALID code', () => {
      const error = new ApiError('Token invalid', 403, 'TOKEN_INVALID');
      expect(error.requiresAuth).toBe(true);
    });

    it('should return true for UNAUTHORIZED code', () => {
      const error = new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      expect(error.requiresAuth).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(new ApiError('Bad request', 400).requiresAuth).toBe(false);
      expect(new ApiError('Forbidden', 403, 'FORBIDDEN').requiresAuth).toBe(false);
      expect(new ApiError('Not found', 404).requiresAuth).toBe(false);
      expect(new ApiError('Internal error', 500).requiresAuth).toBe(false);
    });
  });
});

describe('isApiError', () => {
  it('should return true for ApiError instances', () => {
    const error = new ApiError('Test', 500);
    expect(isApiError(error)).toBe(true);
  });

  it('should return true for objects with _tag = ApiError', () => {
    const errorLike = {
      _tag: 'ApiError',
      message: 'Test',
      status: 500,
    };
    expect(isApiError(errorLike)).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Test');
    expect(isApiError(error)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isApiError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isApiError(undefined)).toBe(false);
  });

  it('should return false for strings', () => {
    expect(isApiError('error message')).toBe(false);
  });

  it('should return false for numbers', () => {
    expect(isApiError(500)).toBe(false);
  });

  it('should return false for objects without _tag', () => {
    expect(isApiError({ message: 'Test' })).toBe(false);
  });

  it('should return false for objects with wrong _tag', () => {
    expect(isApiError({ _tag: 'OtherError' })).toBe(false);
  });
});

describe('extractErrorDetails', () => {
  it('should extract details from ApiError', () => {
    const error = new ApiError('Test error', 400, 'BAD_REQUEST', { field: 'email' });
    const details = extractErrorDetails(error);

    expect(details).toEqual({
      message: 'Test error',
      status: 400,
      code: 'BAD_REQUEST',
      details: { field: 'email' },
    });
  });

  it('should extract details from ApiError without optional properties', () => {
    const error = new ApiError('Test error', 500);
    const details = extractErrorDetails(error);

    expect(details).toEqual({
      message: 'Test error',
      status: 500,
      code: undefined,
      details: undefined,
    });
  });

  it('should extract message from regular Error', () => {
    const error = new Error('Something went wrong');
    const details = extractErrorDetails(error);

    expect(details).toEqual({
      message: 'Something went wrong',
    });
  });

  it('should use string directly as message', () => {
    const details = extractErrorDetails('Error string');

    expect(details).toEqual({
      message: 'Error string',
    });
  });

  it('should return default message for null', () => {
    const details = extractErrorDetails(null);

    expect(details).toEqual({
      message: 'An unknown error occurred',
    });
  });

  it('should return default message for undefined', () => {
    const details = extractErrorDetails(undefined);

    expect(details).toEqual({
      message: 'An unknown error occurred',
    });
  });

  it('should return default message for numbers', () => {
    const details = extractErrorDetails(404);

    expect(details).toEqual({
      message: 'An unknown error occurred',
    });
  });

  it('should return default message for objects without message', () => {
    const details = extractErrorDetails({ foo: 'bar' });

    expect(details).toEqual({
      message: 'An unknown error occurred',
    });
  });

  it('should extract from ApiError-like objects', () => {
    const errorLike = {
      _tag: 'ApiError' as const,
      message: 'API error',
      status: 422,
      code: 'VALIDATION_FAILED',
      details: { errors: ['field1', 'field2'] },
    };
    const details = extractErrorDetails(errorLike);

    expect(details).toEqual({
      message: 'API error',
      status: 422,
      code: 'VALIDATION_FAILED',
      details: { errors: ['field1', 'field2'] },
    });
  });
});
