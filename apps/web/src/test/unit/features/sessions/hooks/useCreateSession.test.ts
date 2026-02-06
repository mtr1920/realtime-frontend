/**
 * useCreateSession Hook Tests
 * Tests for creating a new session with TanStack Query mutation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCreateSession } from '@/features/sessions/hooks/useCreateSession';
import {
  sessionsService,
  type Session,
  type CreateSessionInput,
} from '@/features/sessions/api/sessions.service';
import { queryKeys } from '@/shared/services/query-keys';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('@/features/sessions/api/sessions.service', () => ({
  sessionsService: {
    create: vi.fn(),
  },
}));

vi.mock('@/shared/errors', () => ({
  handleError: vi.fn(),
  showSuccess: vi.fn(),
}));

// =============================================================================
// Test Helpers
// =============================================================================

const mockSession: Session = {
  id: 'new-session-123',
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
  accessToken: 'access-token-xyz',
  createdAt: '2026-01-31T10:00:00Z',
  updatedAt: '2026-01-31T10:00:00Z',
};

const mockCreateInput: CreateSessionInput = {
  workspaceId: 'workspace-1',
  roleId: 'role-1',
  externalId: 'ext-123',
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

describe('useCreateSession', () => {
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
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.createSession).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  // ===========================================================================
  // Mutation Execution
  // ===========================================================================

  describe('mutation execution', () => {
    it('should call sessionsService.create with correct payload', async () => {
      vi.mocked(sessionsService.create).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.createSession(mockCreateInput);
      });

      expect(sessionsService.create).toHaveBeenCalledWith(mockCreateInput);
      expect(sessionsService.create).toHaveBeenCalledTimes(1);
    });

    it('should return created session from createSession', async () => {
      vi.mocked(sessionsService.create).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      let createdSession: Session | undefined;
      await act(async () => {
        createdSession = await result.current.createSession(mockCreateInput);
      });

      expect(createdSession).toEqual(mockSession);
    });
  });

  // ===========================================================================
  // Loading State
  // ===========================================================================

  describe('loading state', () => {
    it('should set isLoading to true during mutation', async () => {
      let resolveCreate: (session: Session) => void;
      vi.mocked(sessionsService.create).mockImplementation(
        () => new Promise((resolve) => { resolveCreate = resolve; })
      );

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      // Start mutation
      let createPromise: Promise<Session>;
      act(() => {
        createPromise = result.current.createSession(mockCreateInput);
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolveCreate!(mockSession);
        await createPromise;
      });

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe('error handling', () => {
    it('should set error on failure', async () => {
      const error = new Error('Failed to create session');
      vi.mocked(sessionsService.create).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.createSession(mockCreateInput);
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
    });

    it('should not be loading after error', async () => {
      vi.mocked(sessionsService.create).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.createSession(mockCreateInput);
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe('reset', () => {
    it('should clear error state when reset is called', async () => {
      vi.mocked(sessionsService.create).mockRejectedValue(
        new Error('Failed to create')
      );

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      // Trigger an error
      await act(async () => {
        try {
          await result.current.createSession(mockCreateInput);
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
  // Callbacks
  // ===========================================================================

  describe('callbacks', () => {
    it('should call onSuccess callback with created session', async () => {
      vi.mocked(sessionsService.create).mockResolvedValue(mockSession);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useCreateSession({ onSuccess }), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.createSession(mockCreateInput);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      // The hook wrapper passes (data, variables, context) - check first arg is session
      expect(onSuccess.mock.calls[0]![0]).toEqual(mockSession);
    });

    it('should call onError callback on failure', async () => {
      const error = new Error('Creation failed');
      vi.mocked(sessionsService.create).mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() => useCreateSession({ onError }), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.createSession(mockCreateInput);
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledTimes(1);
      // The hook wrapper passes (error, variables, context) - check first arg is error
      expect(onError.mock.calls[0]![0]).toEqual(error);
    });

    it('should not call onSuccess on failure', async () => {
      vi.mocked(sessionsService.create).mockRejectedValue(new Error('Failed'));
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useCreateSession({ onSuccess }), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.createSession(mockCreateInput);
        } catch {
          // Expected
        }
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should not call onError on success', async () => {
      vi.mocked(sessionsService.create).mockResolvedValue(mockSession);
      const onError = vi.fn();

      const { result } = renderHook(() => useCreateSession({ onError }), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.createSession(mockCreateInput);
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Cache Invalidation
  // ===========================================================================

  describe('cache invalidation', () => {
    it('should invalidate sessions root query on success', async () => {
      vi.mocked(sessionsService.create).mockResolvedValue(mockSession);

      // Pre-populate the cache
      queryClient.setQueryData(queryKeys.sessions.root, {
        sessions: [],
        pagination: { total: 0, nextCursor: null, hasMore: false },
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.createSession(mockCreateInput);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.sessions.root,
      });
    });
  });

  // ===========================================================================
  // Multiple Creations
  // ===========================================================================

  describe('multiple creations', () => {
    it('should handle sequential session creations', async () => {
      const session1 = { ...mockSession, id: 'session-1' };
      const session2 = { ...mockSession, id: 'session-2' };

      vi.mocked(sessionsService.create)
        .mockResolvedValueOnce(session1)
        .mockResolvedValueOnce(session2);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(queryClient),
      });

      // First creation
      let created1: Session | undefined;
      await act(async () => {
        created1 = await result.current.createSession(mockCreateInput);
      });
      expect(created1?.id).toBe('session-1');

      // Second creation
      let created2: Session | undefined;
      await act(async () => {
        created2 = await result.current.createSession({
          ...mockCreateInput,
          externalId: 'ext-456',
        });
      });
      expect(created2?.id).toBe('session-2');

      expect(sessionsService.create).toHaveBeenCalledTimes(2);
    });
  });
});
