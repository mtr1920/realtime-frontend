/**
 * ProtectedRoute Component Tests
 * Tests for route protection and redirects.
 *
 * Note: ProtectedRoute now uses useCurrentUser which requires QueryClient.
 * We mock useCurrentUser to avoid needing full query infrastructure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import {
  resetAuthStore,
  setAuthenticated,
  setLoadingState,
  setAuthState,
  createMockUser,
  getMockCurrentUserState,
  setMockCurrentUser,
  resetMockCurrentUser,
} from '@/features/auth/test/auth-test-utils';

// Mock useCurrentUser using centralized helper
vi.mock('@/shared/hooks/useCurrentUser', () => ({
  useCurrentUser: () => getMockCurrentUserState(),
}));

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  Navigate: (props: { to: string; search?: { returnUrl?: string }; replace?: boolean }) => {
    mockNavigate(props);
    return null;
  },
  useLocation: vi.fn(() => ({ pathname: '/dashboard' })),
}));

// Mock useAuthHydrated - we'll control its return value per test
const mockUseAuthHydrated = vi.fn(() => true);
vi.mock('@/shared/stores/auth.store', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useAuthHydrated: () => mockUseAuthHydrated(),
  };
});

// Import after mocks
import { useLocation } from '@tanstack/react-router';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    resetAuthStore();
    resetMockCurrentUser();
    vi.clearAllMocks();
    mockUseAuthHydrated.mockReturnValue(true);
    vi.mocked(useLocation).mockReturnValue({ pathname: '/dashboard' } as ReturnType<typeof useLocation>);
  });

  describe('loading state', () => {
    it('shows LoadingScreen when isLoading is true', () => {
      setLoadingState();
      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('shows LoadingScreen when not hydrated', () => {
      mockUseAuthHydrated.mockReturnValue(false);
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('shows custom loadingFallback when provided', () => {
      setLoadingState();
      render(
        <ProtectedRoute loadingFallback={<div data-testid="custom-loading">Custom Loading...</div>}>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('shows LoadingScreen when authenticated but user is null and roles required', () => {
      // Edge case: isAuthenticated is true but user hasn't loaded yet from TanStack Query
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        token: 'test-token',
      });

      render(
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading until user is available
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated redirect', () => {
    it('redirects to /login when not authenticated', () => {
      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/login',
          replace: true,
        })
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('uses custom loginRedirect when provided', () => {
      render(
        <ProtectedRoute loginRedirect="/auth/signin">
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/auth/signin',
          replace: true,
        })
      );
    });
  });

  describe('return URL handling', () => {
    it('includes returnUrl with current pathname', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/settings/profile' } as ReturnType<typeof useLocation>);

      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: { returnUrl: '/settings/profile' },
        })
      );
    });

    it('omits returnUrl for /login path', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/login' } as ReturnType<typeof useLocation>);

      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: { returnUrl: undefined },
        })
      );
    });

    it('omits returnUrl for /logout path', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/logout' } as ReturnType<typeof useLocation>);

      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: { returnUrl: undefined },
        })
      );
    });

    it('omits returnUrl for /auth paths', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/auth/callback' } as ReturnType<typeof useLocation>);

      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: { returnUrl: undefined },
        })
      );
    });

    it('omits returnUrl for /sso paths', () => {
      vi.mocked(useLocation).mockReturnValue({ pathname: '/sso/google' } as ReturnType<typeof useLocation>);

      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: { returnUrl: undefined },
        })
      );
    });
  });

  describe('authenticated user', () => {
    it('renders children when user is authenticated', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('renders children for any authenticated user when no allowedRoles specified', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');

      render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });

  describe('role-based access', () => {
    it('renders children when user has allowed role', () => {
      setMockCurrentUser(createMockUser('ADMIN'));
      setAuthenticated('ADMIN');

      render(
        <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
          <div data-testid="protected">Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders children when user has one of multiple allowed roles', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(
        <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN', 'OWNER']}>
          <div data-testid="protected">Member Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('redirects to /unauthorized when role not allowed', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');

      render(
        <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
          <div data-testid="protected">Admin Only Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/unauthorized',
          replace: true,
        })
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('uses custom unauthorizedRedirect when provided', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(
        <ProtectedRoute allowedRoles={['OWNER']} unauthorizedRedirect="/403">
          <div data-testid="protected">Owner Only Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/403',
          replace: true,
        })
      );
    });

    it('renders for OWNER with allowedRoles including OWNER', () => {
      setMockCurrentUser(createMockUser('OWNER'));
      setAuthenticated('OWNER');

      render(
        <ProtectedRoute allowedRoles={['OWNER']}>
          <div data-testid="protected">Owner Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty allowedRoles array as any authenticated user', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');

      render(
        <ProtectedRoute allowedRoles={[]}>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      // Empty array means no role restriction, any auth user can access
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(
        <ProtectedRoute>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });

    it('handles complex nested children', () => {
      setMockCurrentUser(createMockUser('ADMIN'));
      setAuthenticated('ADMIN');

      render(
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <div data-testid="wrapper">
            <header>Header</header>
            <main data-testid="main">
              <p>Content</p>
            </main>
            <footer>Footer</footer>
          </div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('main')).toBeInTheDocument();
    });

    it('transitions from loading to authenticated state', () => {
      setLoadingState();

      const { rerender } = render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();

      // User logs in - wrap in act to avoid warnings
      act(() => {
        setMockCurrentUser(createMockUser('MEMBER'));
        setAuthenticated('MEMBER');
      });

      rerender(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('transitions from loading to unauthenticated state', () => {
      setLoadingState();

      const { rerender } = render(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Auth check completes, user is not authenticated - wrap in act to avoid warnings
      act(() => {
        resetMockCurrentUser();
        resetAuthStore();
      });

      rerender(
        <ProtectedRoute>
          <div data-testid="protected">Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/login',
        })
      );
    });
  });
});
