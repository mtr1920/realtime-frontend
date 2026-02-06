/**
 * useCurrentUser Hook Tests
 * Tests for current user fetching, caching, and error handling.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { apiClient } from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import type { CurrentUserResponse } from '@/types/api';

// Mock apiClient
vi.mock('@/shared/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock auth store state
let mockAuthState = {
  isAuthenticated: false,
  token: null as string | null,
};

vi.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

const mockApiClient = vi.mocked(apiClient);

function setMockAuthState(state: { isAuthenticated: boolean; token: string | null }) {
  mockAuthState = state;
}

// Sample API response
const mockUserResponse: CurrentUserResponse = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  avatarUrl: 'https://example.com/avatar.png',
  tenantId: 'tenant-456',
  role: 'MEMBER',
};

// Create fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

// Wrapper component for hooks
function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCurrentUser', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('query enabled conditions', () => {
    it('fetches user when authenticated with token', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });
      mockApiClient.get.mockResolvedValueOnce(mockUserResponse);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/auth/me');
      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        tenantId: 'tenant-456',
        role: 'MEMBER',
      });
    });

    it('does not fetch when unauthenticated', async () => {
      setMockAuthState({ isAuthenticated: false, token: null });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      // Wait a bit to ensure no fetch is triggered
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(result.current.user).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('does not fetch when authenticated but token is null', async () => {
      // Edge case: authenticated state but no token yet
      setMockAuthState({ isAuthenticated: true, token: null });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(result.current.user).toBeUndefined();
    });

    it('does not fetch when token exists but not authenticated', async () => {
      // Token exists but user logged out
      setMockAuthState({ isAuthenticated: false, token: 'stale-token' });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(result.current.user).toBeUndefined();
    });
  });

  describe('API response mapping', () => {
    it('maps CurrentUserResponse to User domain type', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      const responseWithAllFields: CurrentUserResponse = {
        id: 'user-abc',
        email: 'full@example.com',
        displayName: 'Full User',
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        tenantId: 'tenant-xyz',
        role: 'ADMIN',
      };

      mockApiClient.get.mockResolvedValueOnce(responseWithAllFields);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      expect(result.current.user).toEqual({
        id: 'user-abc',
        email: 'full@example.com',
        displayName: 'Full User',
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        tenantId: 'tenant-xyz',
        role: 'ADMIN',
      });
    });

    it('handles response without optional avatarUrl', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      const responseWithoutAvatar: CurrentUserResponse = {
        id: 'user-no-avatar',
        email: 'no-avatar@example.com',
        displayName: 'No Avatar User',
        tenantId: 'tenant-123',
        role: 'VIEWER',
      };

      mockApiClient.get.mockResolvedValueOnce(responseWithoutAvatar);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      expect(result.current.user?.avatarUrl).toBeUndefined();
    });
  });

  describe('retry behavior', () => {
    it('does not retry on 401 error', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      const error401 = Object.assign(new Error('Unauthorized'), { status: 401 });
      mockApiClient.get.mockRejectedValue(error401);

      // Use a client with retry enabled to test retry logic
      const retryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 0,
            gcTime: 0,
          },
        },
      });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(retryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should only be called once (no retries)
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      retryClient.clear();
    });

    it('does not retry on 403 error', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      const error403 = Object.assign(new Error('Forbidden'), { status: 403 });
      mockApiClient.get.mockRejectedValue(error403);

      const retryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 0,
            gcTime: 0,
          },
        },
      });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(retryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      retryClient.clear();
    });

    it('retries on 500 error up to 3 times', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      const error500 = Object.assign(new Error('Server Error'), { status: 500 });
      mockApiClient.get.mockRejectedValue(error500);

      const retryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 0,
            gcTime: 0,
          },
        },
      });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(retryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should be called 4 times (1 initial + 3 retries)
      expect(mockApiClient.get).toHaveBeenCalledTimes(4);

      retryClient.clear();
    });

    it('retries on network error up to 3 times', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      const networkError = new Error('Network request failed');
      mockApiClient.get.mockRejectedValue(networkError);

      const retryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 0,
            gcTime: 0,
          },
        },
      });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(retryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should be called 4 times (1 initial + 3 retries)
      expect(mockApiClient.get).toHaveBeenCalledTimes(4);

      retryClient.clear();
    });
  });

  describe('error state', () => {
    it('returns error when API fails with 401', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      // Use 401 error which doesn't retry
      const apiError = Object.assign(new Error('Unauthorized'), { status: 401 });
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(apiError);
      expect(result.current.user).toBeUndefined();
    });
  });

  describe('refetch function', () => {
    it('triggers a new fetch when called', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      mockApiClient.get.mockResolvedValue(mockUserResponse);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      // Call refetch
      await result.current.refetch();

      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidate function', () => {
    it('invalidates the query cache', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      mockApiClient.get.mockResolvedValue(mockUserResponse);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      // Spy on invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await result.current.invalidate();

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.auth.user(),
      });
    });
  });

  describe('loading state', () => {
    it('returns isLoading true while fetching', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      // Delay the response
      mockApiClient.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUserResponse), 100))
      );

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeDefined();
    });
  });

  describe('query key', () => {
    it('uses correct query key from queryKeys', async () => {
      setMockAuthState({ isAuthenticated: true, token: 'test-token' });

      mockApiClient.get.mockResolvedValue(mockUserResponse);

      renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        const cachedData = queryClient.getQueryData(queryKeys.auth.user());
        expect(cachedData).toBeDefined();
      });
    });
  });
});
