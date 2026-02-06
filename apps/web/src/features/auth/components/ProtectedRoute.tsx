/**
 * ProtectedRoute Component
 * Route guard that requires authentication and optionally specific roles.
 */

import { type ReactNode } from 'react';
import { Navigate, useLocation } from '@tanstack/react-router';
import { useAuthStore, useAuthHydrated } from '@/shared/stores/auth.store';
import { useCurrentUser } from '@/shared/hooks';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { isValidReturnUrl } from '@/shared/lib/redirect-utils';
import type { UserRole } from '@/features/auth/api/auth.service';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Roles allowed to access this route. If not specified, any authenticated user can access.
   */
  allowedRoles?: UserRole[];
  /**
   * Custom redirect for unauthorized users (default: /login).
   */
  loginRedirect?: string;
  /**
   * Custom redirect for authenticated but unauthorized users (default: /unauthorized).
   */
  unauthorizedRedirect?: string;
  /**
   * Custom loading component.
   */
  loadingFallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  loginRedirect = '/login',
  unauthorizedRedirect = '/unauthorized',
  loadingFallback,
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isStoreLoading = useAuthStore((state) => state.isLoading);
  const hasHydrated = useAuthHydrated();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const isLoading = isStoreLoading || (isAuthenticated && isUserLoading && !user);

  // Show loading while checking auth state or waiting for hydration
  if (isLoading || !hasHydrated) {
    return loadingFallback ?? <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Only include returnUrl if current path is valid (not login-related)
    const returnUrl = isValidReturnUrl(location.pathname)
      ? location.pathname
      : undefined;

    return (
      <Navigate
        to={loginRedirect as '/login'}
        search={{ returnUrl }}
        replace
      />
    );
  }

  // Check role authorization if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    // User should exist if authenticated - show loading if not yet available
    if (!user) {
      return loadingFallback ?? <LoadingScreen />;
    }
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={unauthorizedRedirect as '/unauthorized'} replace />;
    }
  }

  return <>{children}</>;
}
