/**
 * useSession Hook Tests
 * Tests for fetching a single session by ID with TanStack Query.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useSession } from '@/features/sessions/hooks/useSession';
import { sessionsService, type Session } from '@/features/sessions/api/sessions.service';
import { queryKeys } from '@/shared/services/query-keys';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('@/features/sessions/api/sessions.service', () => ({
  sessionsService: {
    get: vi.fn(),
  },
}));

// =============================================================================
// Test Helpers
// =============================================================================

const mockSession: Session = {
  id: 'session-123',
  workspaceId: 'workspace-1',
  domainType: 'interview',
  externalId: 'ext-123',
  status: 'CREATED',
  phase: null,
  scheduledAt: null,
  startedAt: null,
  endedAt: null,
  expiresAt: '2026-02-01T00:00:00Z',
  participantCount: 0,
  createdAt: '2026-01-31T10:00:00Z',
  updatedAt: '2026-01-31T10:00:00Z',
};

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('useSession', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have correct initial state when session is loading', () => {
      vi.mocked(sessionsService.get).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.session).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have refetch and invalidate functions', () => {
      vi.mocked(sessionsService.get).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.invalidate).toBe('function');
    });
  });

  // ===========================================================================
  // Query Execution
  // ===========================================================================

  describe('query execution', () => {
    it('should call sessionsService.get with correct sessionId', async () => {
      vi.mocked(sessionsService.get).mockResolvedValue(mockSession);

      renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(sessionsService.get).toHaveBeenCalledWith(
          'session-123',
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
      });
    });

    it('should return session data on success', async () => {
      vi.mocked(sessionsService.get).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should use correct query key', async () => {
      vi.mocked(sessionsService.get).mockResolvedValue(mockSession);

      renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(
          queryKeys.sessions.detail('session-123')
        );
        expect(queryState?.data).toEqual(mockSession);
      });
    });
  });

  // ===========================================================================
  // Loading State
  // ===========================================================================

  describe('loading state', () => {
    it('should transition from loading to success', async () => {
      let resolveGet: (session: Session) => void;
      vi.mocked(sessionsService.get).mockImplementation(
        () => new Promise((resolve) => { resolveGet = resolve; })
      );

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.session).toBeUndefined();

      // Resolve the promise
      await act(async () => {
        resolveGet!(mockSession);
      });

      // Should now have data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.session).toEqual(mockSession);
      });
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe('error handling', () => {
    it('should set isError and error on failure', async () => {
      // Create a 404 error to bypass retry logic in the hook
      const error404 = Object.assign(new Error('Session not found'), { status: 404 });
      vi.mocked(sessionsService.get).mockRejectedValue(error404);

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error404);
      expect(result.current.session).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should not retry on 404 errors', async () => {
      const error404 = Object.assign(new Error('Not found'), { status: 404 });
      vi.mocked(sessionsService.get).mockRejectedValue(error404);

      // Use a query client that allows retries to test retry logic
      const queryClientWithRetry = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3, // Allow retries
            gcTime: Infinity,
          },
        },
      });

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClientWithRetry),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should only be called once (no retries for 404)
      expect(sessionsService.get).toHaveBeenCalledTimes(1);
    });

    it('should retry on other errors (up to 3 times)', async () => {
      const networkError = new Error('Network error');
      vi.mocked(sessionsService.get).mockRejectedValue(networkError);

      // Use a query client that allows retries
      const queryClientWithRetry = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 0, // No delay for faster tests
            gcTime: Infinity,
          },
        },
      });

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClientWithRetry),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should retry 3 times + 1 initial = 4 calls
      expect(sessionsService.get).toHaveBeenCalledTimes(4);
    });
  });

  // ===========================================================================
  // Enabled Option
  // ===========================================================================

  describe('enabled option', () => {
    it('should not fetch when enabled is false', async () => {
      const { result } = renderHook(
        () => useSession('session-123', { enabled: false }),
        { wrapper: createWrapper(queryClient) }
      );

      // Wait a tick to ensure no query is executed
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(sessionsService.get).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.session).toBeUndefined();
    });

    it('should not fetch when sessionId is empty', async () => {
      renderHook(() => useSession(''), {
        wrapper: createWrapper(queryClient),
      });

      // Wait a tick to ensure no query is executed
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(sessionsService.get).not.toHaveBeenCalled();
    });

    it('should fetch when enabled changes to true', async () => {
      vi.mocked(sessionsService.get).mockResolvedValue(mockSession);

      const { result, rerender } = renderHook(
        ({ enabled }) => useSession('session-123', { enabled }),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { enabled: false },
        }
      );

      // Should not fetch initially
      expect(sessionsService.get).not.toHaveBeenCalled();

      // Enable the query
      rerender({ enabled: true });

      await waitFor(() => {
        expect(sessionsService.get).toHaveBeenCalled();
        expect(result.current.session).toEqual(mockSession);
      });
    });
  });

  // ===========================================================================
  // Refetch and Invalidate
  // ===========================================================================

  describe('refetch and invalidate', () => {
    it('should refetch data when refetch is called', async () => {
      vi.mocked(sessionsService.get).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
      });

      expect(sessionsService.get).toHaveBeenCalledTimes(1);

      // Update mock to return different data
      const updatedSession = { ...mockSession, status: 'ACTIVE' as const };
      vi.mocked(sessionsService.get).mockResolvedValue(updatedSession);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(sessionsService.get).toHaveBeenCalledTimes(2);
      await waitFor(() => {
        expect(result.current.session?.status).toBe('ACTIVE');
      });
    });

    it('should invalidate query when invalidate is called', async () => {
      vi.mocked(sessionsService.get).mockResolvedValue(mockSession);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSession('session-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
      });

      // Invalidate the query
      await act(async () => {
        await result.current.invalidate();
      });

      // Should have called invalidateQueries with correct key
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.sessions.detail('session-123'),
      });
    });
  });

  // ===========================================================================
  // Session ID Changes
  // ===========================================================================

  describe('sessionId changes', () => {
    it('should fetch new session when sessionId changes', async () => {
      const session1 = { ...mockSession, id: 'session-1' };
      const session2 = { ...mockSession, id: 'session-2' };

      vi.mocked(sessionsService.get)
        .mockResolvedValueOnce(session1)
        .mockResolvedValueOnce(session2);

      const { result, rerender } = renderHook(
        ({ sessionId }) => useSession(sessionId),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { sessionId: 'session-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.session?.id).toBe('session-1');
      });

      // Change sessionId
      rerender({ sessionId: 'session-2' });

      await waitFor(() => {
        expect(result.current.session?.id).toBe('session-2');
      });

      expect(sessionsService.get).toHaveBeenCalledTimes(2);
    });
  });
});
