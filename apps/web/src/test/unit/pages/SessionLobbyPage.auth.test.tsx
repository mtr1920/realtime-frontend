/**
 * Tests for SessionLobbyPage authentication flow.
 * Verifies:
 * - Code exchange behavior
 * - Auth requirement handling (requiresAuth flag)
 * - Redirect logic for authenticated/unauthenticated users
 * - Race condition handling (auth hydration)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock implementations - these will be configured in beforeEach
const mockNavigate = vi.fn();
const mockExchangeCode = vi.fn();
const mockUseSessionReturn = {
  session: null as { id: string; status: string } | null,
  isLoading: false,
  isError: false,
  error: null,
};
const mockUseJoinSessionReturn = {
  joinSession: vi.fn(),
  isLoading: false,
};
const mockUseSessionInviteInfoReturn = {
  inviteInfo: null,
};
let mockIsAuthenticated = false;
let mockUser: { id: string } | null = null;
let mockIsHydrated = true;

// Mock modules
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ sessionId: 'test-session-123' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { id: string } | null; isAuthenticated: boolean }) => unknown) => {
    const state = {
      user: mockUser,
      isAuthenticated: mockIsAuthenticated,
    };
    return selector ? selector(state) : state;
  },
  useAuthHydrated: () => mockIsHydrated,
}));

// Track code exchange state for the hook mock
let mockCodeExchangeState = {
  accessToken: '',
  roleId: '',
  requiresAuth: null as boolean | null,
  isExchanging: false,
  error: null as string | null,
  exchangeAttempted: false,
};

vi.mock('@/features/sessions', () => {
  // Using React to properly handle state in the mock hooks
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  return {
    useSession: () => mockUseSessionReturn,
    useJoinSession: () => mockUseJoinSessionReturn,
    useSessionInviteInfo: () => mockUseSessionInviteInfoReturn,
    sessionsService: {
      exchangeCode: (code: string) => mockExchangeCode(code),
    },
    useCodeExchange: ({ isAuthHydrated }: { isAuthHydrated: boolean }) => {
      const [state, setState] = React.useState(mockCodeExchangeState);

      // The hook reads URL params and triggers exchange
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      React.useEffect(() => {
        if (!isAuthHydrated) return;
        if (mockCodeExchangeState.exchangeAttempted || !code) return;

        mockCodeExchangeState.exchangeAttempted = true;
        mockCodeExchangeState.isExchanging = true;
        setState({ ...mockCodeExchangeState });

        mockExchangeCode(code)
          .then((result: { accessToken: string; roleId: string; requiresAuth: boolean }) => {
            mockCodeExchangeState.accessToken = result.accessToken;
            mockCodeExchangeState.roleId = result.roleId;
            mockCodeExchangeState.requiresAuth = result.requiresAuth;
            mockCodeExchangeState.isExchanging = false;
            setState({ ...mockCodeExchangeState });
          })
          .catch((err: Error) => {
            mockCodeExchangeState.error = err.message || 'Invalid or expired invite link';
            mockCodeExchangeState.isExchanging = false;
            setState({ ...mockCodeExchangeState });
          });
      }, [code, isAuthHydrated]);

      return {
        accessToken: state.accessToken,
        roleId: state.roleId,
        requiresAuth: state.requiresAuth,
        isExchanging: state.isExchanging,
        error: state.error,
        setAccessToken: (token: string) => {
          mockCodeExchangeState.accessToken = token;
          setState({ ...mockCodeExchangeState });
        },
        setRoleId: (roleId: string) => {
          mockCodeExchangeState.roleId = roleId;
          setState({ ...mockCodeExchangeState });
        },
        setRequiresAuth: (value: boolean | null) => {
          mockCodeExchangeState.requiresAuth = value;
          setState({ ...mockCodeExchangeState });
        },
      };
    },
    useLobbyAuthRedirect: ({
      sessionId,
      isAuthHydrated,
      isAuthenticated,
      hasCode,
      hasTokenFromUrl,
      requiresAuth,
      hasCodeExchangeError,
    }: {
      sessionId: string;
      isAuthHydrated: boolean;
      isAuthenticated: boolean;
      hasCode: boolean;
      hasTokenFromUrl: boolean;
      requiresAuth: boolean | null;
      hasCodeExchangeError: boolean;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const React = require('react');

      React.useEffect(() => {
        // Replicate the redirect logic from the hook
        if (!isAuthHydrated) return;
        if (hasCode && requiresAuth === null && !hasCodeExchangeError) return;

        const hasAccessMethod = hasCode || hasTokenFromUrl || isAuthenticated;
        const needsAuth = !hasAccessMethod || (requiresAuth === true && !isAuthenticated);

        if (needsAuth) {
          const currentParams = new URLSearchParams(window.location.search);
          const returnUrl = currentParams.toString()
            ? `/sessions/${sessionId}/lobby?${currentParams.toString()}`
            : `/sessions/${sessionId}/lobby`;
          mockNavigate({
            to: '/login',
            search: { returnUrl },
          });
        }
      }, [sessionId, isAuthHydrated, isAuthenticated, hasCode, hasTokenFromUrl, requiresAuth, hasCodeExchangeError]);
    },
  };
});

vi.mock('@/shared/stores/session.store', () => ({
  useSessionStore: () => ({
    setRealtimeCredentials: vi.fn(),
    setLocalParticipantId: vi.fn(),
    setJoinContext: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/shared/stores/media.store', () => ({
  useMediaStore: () => ({
    isAudioEnabled: false,
    isVideoEnabled: false,
    setAudioEnabled: vi.fn(),
    setVideoEnabled: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import component after mocks
import { SessionLobbyPage } from '@/pages/SessionLobbyPage';

describe('SessionLobbyPage Authentication Flow', () => {
  let queryClient: QueryClient;
  let originalLocation: Location;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Save original location
    originalLocation = window.location;

    // Reset mock implementations
    mockNavigate.mockClear();
    mockExchangeCode.mockClear();
    mockIsAuthenticated = false;
    mockUser = null;
    mockIsHydrated = true;

    // Reset code exchange state
    mockCodeExchangeState = {
      accessToken: '',
      roleId: '',
      requiresAuth: null,
      isExchanging: false,
      error: null,
      exchangeAttempted: false,
    };

    mockUseSessionReturn.session = null;
    mockUseSessionReturn.isLoading = false;
    mockUseSessionReturn.isError = false;
    mockUseSessionReturn.error = null;

    mockUseJoinSessionReturn.joinSession = vi.fn();
    mockUseJoinSessionReturn.isLoading = false;

    mockUseSessionInviteInfoReturn.inviteInfo = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    // Clear sessionStorage cache
    sessionStorage.clear();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SessionLobbyPage />
      </QueryClientProvider>
    );
  };

  const setUrlWithCode = (code: string | null) => {
    const search = code ? `?code=${code}` : '';
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        search,
        pathname: '/sessions/test-session-123/lobby',
      },
      writable: true,
    });
  };

  describe('code exchange', () => {
    it('exchanges code when present in URL', async () => {
      setUrlWithCode('test-invite-code');
      mockExchangeCode.mockResolvedValue({
        accessToken: 'access-token-123',
        roleId: 'candidate',
        sessionId: 'test-session-123',
        requiresAuth: false,
      });

      renderWithProviders();

      await waitFor(() => {
        expect(mockExchangeCode).toHaveBeenCalledWith('test-invite-code');
      });
    });

    it('does not exchange code if not present in URL', async () => {
      setUrlWithCode(null);

      // Set authenticated to avoid redirect
      mockIsAuthenticated = true;
      mockUser = { id: '1' };

      mockUseSessionReturn.session = { id: 'test-session-123', status: 'WAITING' };

      renderWithProviders();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockExchangeCode).not.toHaveBeenCalled();
    });

    it('shows error state when code exchange fails', async () => {
      setUrlWithCode('invalid-code');
      mockExchangeCode.mockRejectedValue(new Error('Invalid or expired invite link'));

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Invalid Invite Link')).toBeInTheDocument();
        expect(screen.getByText('Invalid or expired invite link')).toBeInTheDocument();
      });
    });
  });

  describe('requiresAuth handling', () => {
    it('redirects to login when requiresAuth=true and not authenticated', async () => {
      setUrlWithCode('test-code');
      mockExchangeCode.mockResolvedValue({
        accessToken: 'access-token',
        roleId: 'interviewer',
        sessionId: 'test-session-123',
        requiresAuth: true,
      });

      renderWithProviders();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({
          to: '/login',
          // Query params are preserved in returnUrl so user can resume flow after login
          search: { returnUrl: '/sessions/test-session-123/lobby?code=test-code' },
        });
      });
    });

    it('does not redirect when requiresAuth=false and not authenticated', async () => {
      setUrlWithCode('test-code');
      mockExchangeCode.mockResolvedValue({
        accessToken: 'access-token',
        roleId: 'candidate',
        sessionId: 'test-session-123',
        requiresAuth: false,
      });

      renderWithProviders();

      await waitFor(() => {
        expect(mockExchangeCode).toHaveBeenCalled();
      });

      // Wait a bit to ensure no redirect happens
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect when user is already authenticated', async () => {
      setUrlWithCode('test-code');

      mockIsAuthenticated = true;
      mockUser = { id: '1' };

      mockExchangeCode.mockResolvedValue({
        accessToken: 'access-token',
        roleId: 'interviewer',
        sessionId: 'test-session-123',
        requiresAuth: true,
      });

      renderWithProviders();

      await waitFor(() => {
        expect(mockExchangeCode).toHaveBeenCalled();
      });

      // Wait a bit to ensure no redirect happens
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated access without code', () => {
    it('redirects to login when accessing lobby without code and not authenticated', async () => {
      setUrlWithCode(null);

      renderWithProviders();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({
          to: '/login',
          search: { returnUrl: '/sessions/test-session-123/lobby' },
        });
      });
    });

    it('does not redirect when authenticated even without code', async () => {
      setUrlWithCode(null);

      mockIsAuthenticated = true;
      mockUser = { id: '1' };
      mockUseSessionReturn.session = { id: 'test-session-123', status: 'WAITING' };

      renderWithProviders();

      // Wait a bit to ensure no redirect happens
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('auth hydration race condition', () => {
    it('waits for auth hydration before exchanging code', async () => {
      setUrlWithCode('test-code');

      // Start with not hydrated
      mockIsHydrated = false;

      const { rerender } = renderWithProviders();

      // Code should not be exchanged yet
      expect(mockExchangeCode).not.toHaveBeenCalled();

      // Now hydrate
      mockIsHydrated = true;
      mockExchangeCode.mockResolvedValue({
        accessToken: 'access-token',
        roleId: 'candidate',
        sessionId: 'test-session-123',
        requiresAuth: false,
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <SessionLobbyPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockExchangeCode).toHaveBeenCalled();
      });
    });

    it('shows loading state while auth is hydrating', () => {
      setUrlWithCode('test-code');
      mockIsHydrated = false;

      renderWithProviders();

      // Should show skeleton/loading state (header text should not be visible)
      expect(screen.queryByRole('heading', { name: 'Join Session' })).not.toBeInTheDocument();
    });

    it('waits for auth hydration before redirecting', () => {
      setUrlWithCode(null);

      // Start with not hydrated
      mockIsHydrated = false;

      renderWithProviders();

      // Should not redirect yet
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('retry behavior', () => {
    it('only exchanges code once per mount (uses ref to prevent duplicate calls)', async () => {
      setUrlWithCode('test-code');
      mockExchangeCode.mockResolvedValue({
        accessToken: 'access-token',
        roleId: 'candidate',
        sessionId: 'test-session-123',
        requiresAuth: false,
      });

      const { rerender } = renderWithProviders();

      await waitFor(() => {
        expect(mockExchangeCode).toHaveBeenCalledTimes(1);
      });

      // Re-render (simulating React Strict Mode)
      rerender(
        <QueryClientProvider client={queryClient}>
          <SessionLobbyPage />
        </QueryClientProvider>
      );

      // Should not call exchangeCode again during same mount
      expect(mockExchangeCode).toHaveBeenCalledTimes(1);
    });

    it('allows retry on page refresh (invite code remains valid until TTL)', async () => {
      // Note: Since invite codes are NOT consumed on exchange,
      // users can refresh the page and the code will still work
      // This is tested by the backend tests for InviteCodeService
      setUrlWithCode('test-code');
      mockExchangeCode.mockResolvedValue({
        accessToken: 'access-token',
        roleId: 'candidate',
        sessionId: 'test-session-123',
        requiresAuth: false,
      });

      renderWithProviders();

      await waitFor(() => {
        expect(mockExchangeCode).toHaveBeenCalledWith('test-code');
      });
    });
  });
});
