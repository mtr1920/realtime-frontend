/**
 * API Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from '@/shared/services/api-client';

// =============================================================================
// Mocks
// =============================================================================

// Mock auth adapter
const mockAuthAdapter = {
  getAccessToken: vi.fn().mockReturnValue('test-access-token'),
  getRefreshToken: vi.fn().mockReturnValue('test-refresh-token'),
  setTokens: vi.fn(),
  logout: vi.fn(),
  isTokenExpired: vi.fn().mockReturnValue(false),
};

vi.mock('@/shared/services/auth-adapter', () => ({
  getAuthAdapter: () => mockAuthAdapter,
}));

// Mock import.meta.env
vi.stubEnv('VITE_API_URL', 'https://api.example.com');

// =============================================================================
// Test Helpers
// =============================================================================

// Create a response helper
function createResponse(
  body: unknown,
  status = 200,
  statusText = 'OK'
): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createErrorResponse(
  body: unknown,
  status: number,
  statusText = 'Error'
): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('ApiError', () => {
  it('should create error with all properties', () => {
    const error = new ApiError('Test error', 400, 'BAD_REQUEST', { field: 'test' }, 'req-123');

    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.details).toEqual({ field: 'test' });
    expect(error.requestId).toBe('req-123');
    expect(error.name).toBe('ApiError');
    expect(error._tag).toBe('ApiError');
  });

  it('should create error with only required properties', () => {
    const error = new ApiError('Test error', 500);

    expect(error.message).toBe('Test error');
    expect(error.status).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
    expect(error.requestId).toBeUndefined();
  });

  it('should be instance of Error', () => {
    const error = new ApiError('Test', 500);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof ApiError).toBe(true);
  });
});

// Import for type reference
import type { apiClient as ApiClientModule } from '@/shared/services/api-client';

describe('apiClient', () => {
  let apiClient: typeof ApiClientModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());

    // Reset module state
    vi.resetModules();
    const module = await import('@/shared/services/api-client');
    apiClient = module.apiClient;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ===========================================================================
  // GET requests
  // ===========================================================================

  describe('get', () => {
    it('should make GET request with auth header', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: { id: 1, name: 'Test' } })
      );

      const result = await apiClient.get('/users/1');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should append query parameters', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: [] })
      );

      await apiClient.get('/users', {
        params: { page: 1, limit: 10, active: true },
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1&limit=10&active=true',
        expect.any(Object)
      );
    });

    it('should skip undefined query parameters', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: [] })
      );

      await apiClient.get('/users', {
        params: { page: 1, search: undefined },
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1',
        expect.any(Object)
      );
    });

    it('should skip auth header when skipAuth is true', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: { status: 'ok' } })
      );

      await apiClient.get('/health', { skipAuth: true });

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const headers = (fetchCall?.[1]?.headers ?? {}) as Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  // ===========================================================================
  // POST requests
  // ===========================================================================

  describe('post', () => {
    it('should make POST request with body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: { id: 1 } })
      );

      const result = await apiClient.post('/users', { name: 'Test', email: 'test@example.com' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual({ id: 1 });
    });

    it('should handle POST without body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: null })
      );

      await apiClient.post('/action');

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      expect(fetchCall?.[1]?.body).toBeUndefined();
    });
  });

  // ===========================================================================
  // PUT requests
  // ===========================================================================

  describe('put', () => {
    it('should make PUT request with body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: { id: 1, name: 'Updated' } })
      );

      const result = await apiClient.put('/users/1', { name: 'Updated' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
      expect(result).toEqual({ id: 1, name: 'Updated' });
    });
  });

  // ===========================================================================
  // PATCH requests
  // ===========================================================================

  describe('patch', () => {
    it('should make PATCH request with body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: { id: 1, status: 'active' } })
      );

      const result = await apiClient.patch('/users/1', { status: 'active' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'active' }),
        })
      );
      expect(result).toEqual({ id: 1, status: 'active' });
    });
  });

  // ===========================================================================
  // DELETE requests
  // ===========================================================================

  describe('delete', () => {
    it('should make DELETE request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

      const result = await apiClient.delete('/users/1');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual({});
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe('error handling', () => {
    it('should throw ApiError on error response with envelope', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createErrorResponse(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'User not found',
            },
            meta: { requestId: 'req-123' },
          },
          404
        )
      );

      await expect(apiClient.get('/users/999')).rejects.toMatchObject({
        message: 'User not found',
        status: 404,
        code: 'NOT_FOUND',
        requestId: 'req-123',
      });
    });

    it('should throw ApiError on error response without envelope', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createErrorResponse(
          { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
          500
        )
      );

      await expect(apiClient.get('/error')).rejects.toMatchObject({
        message: 'Something went wrong',
        status: 500,
        code: 'INTERNAL_ERROR',
      });
    });

    it('should throw ApiError with default message on empty error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createErrorResponse({}, 500)
      );

      await expect(apiClient.get('/error')).rejects.toMatchObject({
        message: 'Request failed with status 500',
        status: 500,
      });
    });

    it('should handle nested error object', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createErrorResponse(
          { error: { message: 'Validation failed', details: { field: 'email' } } },
          400
        )
      );

      await expect(apiClient.post('/users', {})).rejects.toMatchObject({
        message: 'Validation failed',
        status: 400,
        details: { field: 'email' },
      });
    });
  });

  // ===========================================================================
  // Token refresh
  // ===========================================================================

  describe('token refresh', () => {
    it('should refresh token on 401 response', async () => {
      // First request returns 401
      vi.mocked(fetch)
        .mockResolvedValueOnce(createErrorResponse({ message: 'Unauthorized' }, 401))
        // Refresh token request succeeds
        .mockResolvedValueOnce(
          createResponse({
            success: true,
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              expiresAt: '2024-01-15T13:00:00Z',
            },
          })
        )
        // Retry request succeeds
        .mockResolvedValueOnce(
          createResponse({ success: true, data: { id: 1 } })
        );

      const result = await apiClient.get('/users/1');

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(mockAuthAdapter.setTokens).toHaveBeenCalledWith({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: '2024-01-15T13:00:00Z',
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should call onUnauthorized when refresh fails', async () => {
      // First request returns 401
      vi.mocked(fetch)
        .mockResolvedValueOnce(createErrorResponse({ message: 'Unauthorized' }, 401))
        // Refresh token request fails
        .mockResolvedValueOnce(createErrorResponse({ message: 'Invalid token' }, 401));

      await expect(apiClient.get('/users/1')).rejects.toThrow();
      expect(mockAuthAdapter.logout).toHaveBeenCalled();
    });

    it('should proactively refresh expired token before request', async () => {
      mockAuthAdapter.isTokenExpired.mockReturnValueOnce(true);

      // Refresh token request
      vi.mocked(fetch)
        .mockResolvedValueOnce(
          createResponse({
            success: true,
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              expiresAt: '2024-01-15T13:00:00Z',
            },
          })
        )
        // Actual request
        .mockResolvedValueOnce(
          createResponse({ success: true, data: { id: 1 } })
        );

      const result = await apiClient.get('/users/1');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(mockAuthAdapter.setTokens).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });

    it('should throw when proactive refresh fails', async () => {
      mockAuthAdapter.isTokenExpired.mockReturnValueOnce(true);
      mockAuthAdapter.getRefreshToken.mockReturnValueOnce(null);

      await expect(apiClient.get('/users/1')).rejects.toMatchObject({
        message: 'Session expired',
        status: 401,
        code: 'SESSION_EXPIRED',
      });
      expect(mockAuthAdapter.logout).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Response parsing
  // ===========================================================================

  describe('response parsing', () => {
    it('should extract data from API envelope', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({
          success: true,
          data: { users: [{ id: 1 }, { id: 2 }] },
          meta: { requestId: 'req-123' },
        })
      );

      const result = await apiClient.get('/users');

      expect(result).toEqual({ users: [{ id: 1 }, { id: 2 }] });
    });

    it('should handle response without envelope', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ id: 1, name: 'Test' })
      );

      const result = await apiClient.get('/legacy/users/1');

      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should handle 204 No Content response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 204 })
      );

      const result = await apiClient.delete('/users/1');

      expect(result).toEqual({});
    });

    it('should handle envelope with success: false', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({
          success: false,
          error: { message: 'Validation error', code: 'VALIDATION_FAILED' },
        })
      );

      await expect(apiClient.get('/users')).rejects.toMatchObject({
        message: 'Validation error',
        code: 'VALIDATION_FAILED',
      });
    });
  });

  // ===========================================================================
  // URL building
  // ===========================================================================

  describe('URL building', () => {
    it('should handle paths with leading slash', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: {} })
      );

      await apiClient.get('/users');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('should handle paths without leading slash', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: {} })
      );

      await apiClient.get('users');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('should handle nested paths', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createResponse({ success: true, data: {} })
      );

      await apiClient.get('/users/1/sessions');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1/sessions',
        expect.any(Object)
      );
    });
  });
});
