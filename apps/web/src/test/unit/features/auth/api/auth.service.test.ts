/**
 * Auth Service Tests
 *
 * Tests for login, logout, token refresh, and SSO flows.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { authService } from '@/features/auth/api/auth.service';
import { apiClient } from '@/shared/services/api-client';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('@/shared/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode: number, code: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  },
}));

// =============================================================================
// Test Data
// =============================================================================

const mockLoginResponse = {
  user: {
    id: 'user-001',
    email: 'test@example.com',
    displayName: 'Test User',
    tenantId: 'tenant-001',
    role: 'MEMBER' as const,
  },
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
};

const mockRefreshResponse = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
};

const mockCurrentUserResponse = {
  id: 'user-001',
  email: 'test@example.com',
  displayName: 'Test User',
  tenantId: 'tenant-001',
  role: 'MEMBER',
};

// =============================================================================
// Tests
// =============================================================================

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // login
  // ===========================================================================

  describe('login', () => {
    it('should call API with correct credentials', async () => {
      (apiClient.post as Mock).mockResolvedValue(mockLoginResponse);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        tenantId: 'tenant-001',
      };

      await authService.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/auth/login',
        credentials,
        { skipAuth: true }
      );
    });

    it('should return login response with user and tokens', async () => {
      (apiClient.post as Mock).mockResolvedValue(mockLoginResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
        tenantId: 'tenant-001',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-456');
    });

    it('should propagate API errors', async () => {
      const error = new Error('Invalid credentials');
      (apiClient.post as Mock).mockRejectedValue(error);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong',
          tenantId: 'tenant-001',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  // ===========================================================================
  // logout
  // ===========================================================================

  describe('logout', () => {
    it('should call API with refresh token', async () => {
      (apiClient.post as Mock).mockResolvedValue(undefined);

      await authService.logout('refresh-token');

      expect(apiClient.post).toHaveBeenCalledWith('/v1/auth/logout', {
        refreshToken: 'refresh-token',
      });
    });

    it('should not call API when refresh token is undefined', async () => {
      await authService.logout(undefined);

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should not call API when refresh token is not provided', async () => {
      await authService.logout();

      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // refresh
  // ===========================================================================

  describe('refresh', () => {
    it('should call API with refresh token', async () => {
      (apiClient.post as Mock).mockResolvedValue(mockRefreshResponse);

      await authService.refresh('old-refresh-token');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/auth/refresh',
        { refreshToken: 'old-refresh-token' },
        { skipAuth: true }
      );
    });

    it('should return new tokens', async () => {
      (apiClient.post as Mock).mockResolvedValue(mockRefreshResponse);

      const result = await authService.refresh('old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.expiresAt).toBeDefined();
    });
  });

  // ===========================================================================
  // getCurrentUser
  // ===========================================================================

  describe('getCurrentUser', () => {
    it('should call API and return user info', async () => {
      (apiClient.get as Mock).mockResolvedValue(mockCurrentUserResponse);

      const result = await authService.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/v1/auth/me');
      expect(result.id).toBe('user-001');
      expect(result.tenantId).toBe('tenant-001');
      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBe('Test User');
    });
  });

  // ===========================================================================
  // forgotPassword
  // ===========================================================================

  describe('forgotPassword', () => {
    it('should call API with email and tenant', async () => {
      (apiClient.post as Mock).mockResolvedValue({ message: 'Email sent' });

      await authService.forgotPassword('test@example.com', 'tenant-001');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/auth/forgot-password',
        { email: 'test@example.com', tenantId: 'tenant-001' },
        { skipAuth: true }
      );
    });

    it('should return message', async () => {
      (apiClient.post as Mock).mockResolvedValue({ message: 'Email sent' });

      const result = await authService.forgotPassword('test@example.com', 'tenant-001');

      expect(result.message).toBe('Email sent');
    });
  });

  // ===========================================================================
  // resetPassword
  // ===========================================================================

  describe('resetPassword', () => {
    it('should call API with token and new password', async () => {
      (apiClient.post as Mock).mockResolvedValue({ message: 'Password reset' });

      await authService.resetPassword('reset-token', 'newPassword123');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/auth/reset-password',
        { token: 'reset-token', newPassword: 'newPassword123' },
        { skipAuth: true }
      );
    });
  });

  // ===========================================================================
  // requestRealtimeToken
  // ===========================================================================

  describe('requestRealtimeToken', () => {
    it('should call sessions/join endpoint (backend identifies session via accessToken)', async () => {
      const mockJoinResponse = {
        join: {
          sessionId: 'session-001',
          participantId: 'participant-001',
          realtimeToken: 'rt-token',
          expiresAt: '2024-01-15T12:00:00Z',
          wsEndpoint: 'wss://realtime.example.com',
        },
      };
      (apiClient.post as Mock).mockResolvedValue(mockJoinResponse);

      await authService.requestRealtimeToken(
        'session-001', // sessionId (kept for caller convenience, not sent in path)
        'session-access-token',
        'candidate',
        'John Doe',
        'user-001'
      );

      // Backend identifies session via accessToken in body, not path param
      expect(apiClient.post).toHaveBeenCalledWith('/v1/sessions/join', {
        accessToken: 'session-access-token',
        roleId: 'candidate',
        displayName: 'John Doe',
        userId: 'user-001',
      });
    });
  });

  // ===========================================================================
  // Token Utilities
  // ===========================================================================

  describe('isTokenExpired', () => {
    it('should return true for past date', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      expect(authService.isTokenExpired(pastDate)).toBe(true);
    });

    it('should return false for future date beyond buffer', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      expect(authService.isTokenExpired(futureDate)).toBe(false);
    });

    it('should return true when within buffer time', () => {
      const nearFuture = new Date(Date.now() + 30000).toISOString(); // 30 seconds
      expect(authService.isTokenExpired(nearFuture, 60)).toBe(true); // 60 second buffer
    });

    it('should use custom buffer seconds', () => {
      const nearFuture = new Date(Date.now() + 30000).toISOString();
      expect(authService.isTokenExpired(nearFuture, 10)).toBe(false); // 10 second buffer
    });
  });

  // ===========================================================================
  // Credential Validation
  // ===========================================================================

  describe('validateCredentials', () => {
    it('should return null for valid credentials', () => {
      const result = authService.validateCredentials({
        email: 'test@example.com',
        password: 'password123',
        tenantId: 'tenant-001',
      });

      expect(result).toBeNull();
    });

    it('should return error for missing email', () => {
      const result = authService.validateCredentials({
        password: 'password123',
        tenantId: 'tenant-001',
      });

      expect(result?.email).toBe('Email is required');
    });

    it('should return error for invalid email format', () => {
      const result = authService.validateCredentials({
        email: 'invalid-email',
        password: 'password123',
        tenantId: 'tenant-001',
      });

      expect(result?.email).toBe('Invalid email format');
    });

    it('should return error for missing password', () => {
      const result = authService.validateCredentials({
        email: 'test@example.com',
        tenantId: 'tenant-001',
      });

      expect(result?.password).toBe('Password is required');
    });

    it('should return error for missing tenant', () => {
      const result = authService.validateCredentials({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result?.tenantId).toBe('Tenant is required');
    });

    it('should return multiple errors', () => {
      const result = authService.validateCredentials({});

      expect(result?.email).toBe('Email is required');
      expect(result?.password).toBe('Password is required');
      expect(result?.tenantId).toBe('Tenant is required');
    });
  });

  // ===========================================================================
  // getTenantFromSubdomain
  // ===========================================================================

  describe('getTenantFromSubdomain', () => {
    const originalHostname = window.location.hostname;

    afterEach(() => {
      // Restore hostname
      Object.defineProperty(window, 'location', {
        value: { hostname: originalHostname },
        writable: true,
      });
    });

    it('should return subdomain for multi-part hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'acme.app.example.com' },
        writable: true,
      });

      expect(authService.getTenantFromSubdomain()).toBe('acme');
    });

    it('should exclude www subdomain', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.app.example.com' },
        writable: true,
      });

      // Should fall back to env variable
      const result = authService.getTenantFromSubdomain();
      expect(result).not.toBe('www');
    });

    it('should exclude app subdomain', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'app.example.com' },
        writable: true,
      });

      // Should fall back to env variable
      const result = authService.getTenantFromSubdomain();
      expect(result).not.toBe('app');
    });

    it('should return fallback for localhost', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      // Result depends on VITE_DEFAULT_TENANT env
      const result = authService.getTenantFromSubdomain();
      // Should not return 'localhost'
      expect(result).not.toBe('localhost');
    });
  });
});
