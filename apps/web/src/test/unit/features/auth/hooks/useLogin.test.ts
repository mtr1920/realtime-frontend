/**
 * useLogin Hook Tests
 * Tests for the login hook with navigation and callbacks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { AuthContext, type AuthContextValue } from '@/features/auth/model/auth.context';

// =============================================================================
// Mocks
// =============================================================================

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createMockAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(true),
    hasRole: vi.fn().mockReturnValue(false),
    getTenantId: vi.fn().mockReturnValue('test-tenant'),
    ...overrides,
  };
}

function createWrapper(authContext: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AuthContext.Provider, { value: authContext }, children)
    );
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const authContext = createMockAuthContext();
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(authContext),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  // ===========================================================================
  // Successful Login
  // ===========================================================================

  describe('successful login', () => {
    it('should call auth.login with credentials', async () => {
      const mockLogin = vi.fn().mockResolvedValue({ success: true });
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
          tenantId: 'tenant-1',
        });
      });

      expect(mockLogin).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'tenant-1'
      );
    });

    it('should set isLoading to true during login', async () => {
      let resolveLogin: (value: { success: boolean }) => void;
      const mockLogin = vi.fn().mockImplementation(
        () => new Promise((resolve) => { resolveLogin = resolve; })
      );
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(authContext),
      });

      // Start login
      let loginPromise: Promise<void>;
      act(() => {
        loginPromise = result.current.login({
          email: 'test@example.com',
          password: 'password',
          tenantId: 'tenant-1',
        });
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve login
      await act(async () => {
        resolveLogin!({ success: true });
        await loginPromise;
      });

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should call onSuccess callback after successful login', async () => {
      const onSuccess = vi.fn();
      const authContext = createMockAuthContext();
      const { result } = renderHook(() => useLogin({ onSuccess }), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password',
          tenantId: 'tenant-1',
        });
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should navigate to redirectTo after successful login', async () => {
      const authContext = createMockAuthContext();
      const { result } = renderHook(() => useLogin({ redirectTo: '/dashboard' }), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password',
          tenantId: 'tenant-1',
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' });
    });

    it('should not navigate if no redirectTo specified', async () => {
      const authContext = createMockAuthContext();
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password',
          tenantId: 'tenant-1',
        });
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Failed Login
  // ===========================================================================

  describe('failed login', () => {
    it('should set error when login returns success: false', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
            tenantId: 'tenant-1',
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Invalid credentials');
      });
    });

    it('should use default error message when no error provided', async () => {
      const mockLogin = vi.fn().mockResolvedValue({ success: false });
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
            tenantId: 'tenant-1',
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Login failed');
      });
    });

    it('should call onError callback on failure', async () => {
      const onError = vi.fn();
      const mockLogin = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin({ onError }), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
            tenantId: 'tenant-1',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not call onSuccess on failure', async () => {
      const onSuccess = vi.fn();
      const mockLogin = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin({ onSuccess }), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
            tenantId: 'tenant-1',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should not navigate on failure', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin({ redirectTo: '/dashboard' }), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
            tenantId: 'tenant-1',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle auth.login throwing an error', async () => {
      const mockLogin = vi.fn().mockRejectedValue(new Error('Network error'));
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(authContext),
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'password',
            tenantId: 'tenant-1',
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Network error');
      });
    });
  });

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe('reset', () => {
    it('should clear error state when reset is called', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(authContext),
      });

      // Trigger an error
      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
            tenantId: 'tenant-1',
          });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle multiple login attempts', async () => {
      const mockLogin = vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'Wrong password' })
        .mockResolvedValueOnce({ success: true });
      const authContext = createMockAuthContext({ login: mockLogin });
      const { result } = renderHook(() => useLogin({ redirectTo: '/home' }), {
        wrapper: createWrapper(authContext),
      });

      // First attempt fails
      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
            tenantId: 'tenant-1',
          });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Wrong password');
      });
      expect(mockNavigate).not.toHaveBeenCalled();

      // Reset and try again
      act(() => {
        result.current.reset();
      });

      // Second attempt succeeds
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'correct',
          tenantId: 'tenant-1',
        });
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' });
    });

    it('should handle empty options', () => {
      const authContext = createMockAuthContext();
      const { result } = renderHook(() => useLogin({}), {
        wrapper: createWrapper(authContext),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
