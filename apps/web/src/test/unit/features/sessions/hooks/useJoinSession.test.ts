/**
 * useJoinSession Hook Tests
 * Tests for joining an existing session with TanStack Query mutation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useJoinSession } from '@/features/sessions/hooks/useJoinSession';
import {
  sessionsService,
  type JoinSessionInput,
} from '@/features/sessions/api/sessions.service';
import type { SessionJoinResponse } from '@/types';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('@/features/sessions/api/sessions.service', () => ({
  sessionsService: {
    join: vi.fn(),
  },
}));

vi.mock('@/shared/errors', () => ({
  handleError: vi.fn(),
  showSuccess: vi.fn(),
  isApiError: vi.fn(() => false),
}));

// =============================================================================
// Test Helpers
// =============================================================================

const mockJoinResponse: SessionJoinResponse = {
  participantId: 'participant-123',
  sessionId: 'session-123',
  realtimeToken: 'realtime-token-xyz',
  expiresAt: '2026-02-01T00:00:00Z',
  wsEndpoint: 'wss://example.com/ws',
};

const mockJoinInput: JoinSessionInput = {
  accessToken: 'access-token-xyz',
  roleId: 'candidate',
  displayName: 'Test User',
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

describe('useJoinSession', () => {
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
      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.joinSession).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  // ===========================================================================
  // Mutation Execution
  // ===========================================================================

  describe('mutation execution', () => {
    it('should call sessionsService.join with sessionId and data', async () => {
      vi.mocked(sessionsService.join).mockResolvedValue(mockJoinResponse);

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.joinSession('session-123', mockJoinInput);
      });

      expect(sessionsService.join).toHaveBeenCalledWith(
        'session-123',
        mockJoinInput
      );
      expect(sessionsService.join).toHaveBeenCalledTimes(1);
    });

    it('should correctly combine sessionId and data in mutation', async () => {
      vi.mocked(sessionsService.join).mockResolvedValue(mockJoinResponse);

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      // Join with different sessionId
      await act(async () => {
        await result.current.joinSession('different-session', {
          accessToken: 'different-token',
          roleId: 'interviewer',
          displayName: 'Different User',
        });
      });

      expect(sessionsService.join).toHaveBeenCalledWith('different-session', {
        accessToken: 'different-token',
        roleId: 'interviewer',
        displayName: 'Different User',
      });
    });

    it('should return join response from joinSession', async () => {
      vi.mocked(sessionsService.join).mockResolvedValue(mockJoinResponse);

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      let response: SessionJoinResponse | undefined;
      await act(async () => {
        response = await result.current.joinSession('session-123', mockJoinInput);
      });

      expect(response).toEqual(mockJoinResponse);
      expect(response?.participantId).toBe('participant-123');
      expect(response?.realtimeToken).toBe('realtime-token-xyz');
    });
  });

  // ===========================================================================
  // Loading State
  // ===========================================================================

  describe('loading state', () => {
    it('should set isLoading to true during mutation', async () => {
      let resolveJoin: (response: SessionJoinResponse) => void;
      vi.mocked(sessionsService.join).mockImplementation(
        () => new Promise((resolve) => { resolveJoin = resolve; })
      );

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      // Start mutation
      let joinPromise: Promise<SessionJoinResponse>;
      act(() => {
        joinPromise = result.current.joinSession('session-123', mockJoinInput);
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolveJoin!(mockJoinResponse);
        await joinPromise;
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
      const error = new Error('Failed to join session');
      vi.mocked(sessionsService.join).mockRejectedValue(error);

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.joinSession('session-123', mockJoinInput);
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
    });

    it('should not be loading after error', async () => {
      vi.mocked(sessionsService.join).mockRejectedValue(
        new Error('Session not found')
      );

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.joinSession('session-123', mockJoinInput);
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle invalid access token error', async () => {
      const error = new Error('Invalid access token');
      vi.mocked(sessionsService.join).mockRejectedValue(error);

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.joinSession('session-123', {
            ...mockJoinInput,
            accessToken: 'invalid-token',
          });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Invalid access token');
      });
    });
  });

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe('reset', () => {
    it('should clear error state when reset is called', async () => {
      vi.mocked(sessionsService.join).mockRejectedValue(
        new Error('Failed to join')
      );

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      // Trigger an error
      await act(async () => {
        try {
          await result.current.joinSession('session-123', mockJoinInput);
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
    it('should call onSuccess callback with join response', async () => {
      vi.mocked(sessionsService.join).mockResolvedValue(mockJoinResponse);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useJoinSession({ onSuccess }), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.joinSession('session-123', mockJoinInput);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      // The hook wrapper passes (data, variables, context) - check first arg is response
      expect(onSuccess.mock.calls[0]![0]).toEqual(mockJoinResponse);
    });

    it('should call onError callback on failure', async () => {
      const error = new Error('Join failed');
      vi.mocked(sessionsService.join).mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() => useJoinSession({ onError }), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.joinSession('session-123', mockJoinInput);
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledTimes(1);
      // The hook wrapper passes (error, variables, context) - check first arg is error
      expect(onError.mock.calls[0]![0]).toEqual(error);
    });

    it('should not call onSuccess on failure', async () => {
      vi.mocked(sessionsService.join).mockRejectedValue(new Error('Failed'));
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useJoinSession({ onSuccess }), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.joinSession('session-123', mockJoinInput);
        } catch {
          // Expected
        }
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should not call onError on success', async () => {
      vi.mocked(sessionsService.join).mockResolvedValue(mockJoinResponse);
      const onError = vi.fn();

      const { result } = renderHook(() => useJoinSession({ onError }), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.joinSession('session-123', mockJoinInput);
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Join with userId
  // ===========================================================================

  describe('join with userId', () => {
    it('should pass userId when provided in join data', async () => {
      vi.mocked(sessionsService.join).mockResolvedValue(mockJoinResponse);

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.joinSession('session-123', {
          ...mockJoinInput,
          userId: 'user-456',
        });
      });

      expect(sessionsService.join).toHaveBeenCalledWith('session-123', {
        ...mockJoinInput,
        userId: 'user-456',
      });
    });
  });

  // ===========================================================================
  // Multiple Joins
  // ===========================================================================

  describe('multiple joins', () => {
    it('should handle joining different sessions', async () => {
      const response1 = { ...mockJoinResponse, sessionId: 'session-1' };
      const response2 = { ...mockJoinResponse, sessionId: 'session-2' };

      vi.mocked(sessionsService.join)
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      const { result } = renderHook(() => useJoinSession(), {
        wrapper: createWrapper(queryClient),
      });

      // Join first session
      let join1: SessionJoinResponse | undefined;
      await act(async () => {
        join1 = await result.current.joinSession('session-1', mockJoinInput);
      });
      expect(join1?.sessionId).toBe('session-1');

      // Join second session
      let join2: SessionJoinResponse | undefined;
      await act(async () => {
        join2 = await result.current.joinSession('session-2', {
          ...mockJoinInput,
          accessToken: 'token-2',
        });
      });
      expect(join2?.sessionId).toBe('session-2');

      expect(sessionsService.join).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // Empty Options
  // ===========================================================================

  describe('empty options', () => {
    it('should work with empty options', () => {
      const { result } = renderHook(() => useJoinSession({}), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
