/**
 * Auth Provider
 * Provides authentication state and actions to the application.
 * User data is fetched via TanStack Query (useCurrentUser), not stored in Zustand.
 */

import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext, type AuthContextValue } from '@/features/auth/model/auth.context';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useCurrentUser } from '@/shared/hooks';
import { authService } from '@/features/auth/api/auth.service';
import { configureAuthAdapter } from '@/shared/services/auth-adapter';
import { queryKeys } from '@/shared/services/query-keys';
import type { UserRole } from '@/features/auth/schemas/auth.schema';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  // Get user from TanStack Query (the new source of truth for user data)
  const { user, isLoading: isUserLoading } = useCurrentUser();

  // Get token state from Zustand (tokens only)
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isStoreLoading = useAuthStore((state) => state.isLoading);
  const setTokens = useAuthStore((state) => state.setTokens);
  const storeLogout = useAuthStore((state) => state.logout);

  // Combined loading state: store hydrating OR (authenticated but user still loading)
  const isLoading = isStoreLoading || (isAuthenticated && isUserLoading && !user);

  // Configure auth adapter on mount (before any API calls)
  // Note: Proactive token refresh is handled by api-client (single source of truth)
  // to avoid race conditions between multiple refresh mechanisms
  const adapterConfigured = useRef(false);
  if (!adapterConfigured.current) {
    configureAuthAdapter({
      getAccessToken: () => useAuthStore.getState().token,
      getRefreshToken: () => useAuthStore.getState().refreshToken,
      setTokens: (tokens) => useAuthStore.getState().setTokens(tokens),
      logout: () => useAuthStore.getState().logout(),
      isTokenExpired: (bufferSeconds = 60) =>
        useAuthStore.getState().isTokenExpired(bufferSeconds),
    });
    adapterConfigured.current = true;
  }

  // Login action - stores tokens only, user auto-fetched by TanStack Query
  const login = useCallback(
    async (
      email: string,
      password: string,
      tenantId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await authService.login({
          email,
          password,
          tenantId,
        });

        // Store tokens only - user will be fetched automatically by useCurrentUser
        // when isAuthenticated becomes true
        setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt,
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Login failed';
        return { success: false, error: message };
      }
    },
    [setTokens]
  );

  // Logout action - clears tokens and invalidates user cache
  const logout = useCallback(async () => {
    try {
      await authService.logout(refreshToken ?? undefined);
    } catch {
      // Ignore logout errors - clear local state anyway
    } finally {
      // Clear user cache first
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });
      // Then clear tokens from store
      storeLogout();
    }
  }, [refreshToken, storeLogout, queryClient]);

  // Refresh session action
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await authService.refresh(refreshToken);
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      });
      return true;
    } catch {
      storeLogout();
      return false;
    }
  }, [refreshToken, setTokens, storeLogout]);

  // Check if user has required role(s)
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;

      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  // Get current tenant ID
  const getTenantId = useCallback((): string | null => {
    return user?.tenantId || authService.getTenantFromSubdomain();
  }, [user]);

  const value: AuthContextValue = useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshSession,
      hasRole,
      getTenantId,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshSession,
      hasRole,
      getTenantId,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
