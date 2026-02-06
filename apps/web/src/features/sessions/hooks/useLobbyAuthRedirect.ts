/**
 * useLobbyAuthRedirect Hook
 *
 * Handles auth redirect logic for the session lobby.
 * Consolidates all redirect cases in one place to prevent multiple simultaneous redirects.
 */

import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface UseLobbyAuthRedirectOptions {
  /** Session ID */
  sessionId: string;
  /** Whether auth state has been hydrated */
  isAuthHydrated: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether there's an invite code in URL */
  hasCode: boolean;
  /** Whether there's a token from URL (share link) */
  hasTokenFromUrl: boolean;
  /** Whether auth is required (from code exchange or share link) */
  requiresAuth: boolean | null;
  /** Whether there was a code exchange error */
  hasCodeExchangeError: boolean;
}

/**
 * Hook to handle auth redirects in the session lobby.
 * Redirects to login when authentication is required but user is not authenticated.
 *
 * Redirect cases:
 * 1. No code, no token from URL, and not authenticated -> redirect
 * 2. Code exchanged, requiresAuth=true and not authenticated -> redirect
 * 3. Token from URL (share link), requiresAuth=true and not authenticated -> redirect
 *
 * @example
 * ```ts
 * useLobbyAuthRedirect({
 *   sessionId: '123',
 *   isAuthHydrated: true,
 *   isAuthenticated: false,
 *   hasCode: true,
 *   hasTokenFromUrl: false,
 *   requiresAuth: true,
 *   hasCodeExchangeError: false,
 * });
 * ```
 */
export function useLobbyAuthRedirect(options: UseLobbyAuthRedirectOptions): void {
  const {
    sessionId,
    isAuthHydrated,
    isAuthenticated,
    hasCode,
    hasTokenFromUrl,
    requiresAuth,
    hasCodeExchangeError,
  } = options;

  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth state to be hydrated
    if (!isAuthHydrated) return;

    // Wait for code exchange to complete if there's a code
    if (hasCode && requiresAuth === null && !hasCodeExchangeError) return;

    // Determine if redirect to login is needed:
    // 1. No code, no token from URL, and not authenticated -> redirect
    // 2. Code exchanged, requiresAuth=true and not authenticated -> redirect
    // 3. Token from URL (share link), requiresAuth=true and not authenticated -> redirect
    const hasAccessMethod = hasCode || hasTokenFromUrl || isAuthenticated;
    const needsAuth = !hasAccessMethod || (requiresAuth === true && !isAuthenticated);

    if (needsAuth) {
      // Preserve query params in returnUrl so code/token can be re-used after login
      // Invite codes remain valid until TTL, so re-exchange after auth will work
      const currentParams = new URLSearchParams(window.location.search);
      const returnUrl = currentParams.toString()
        ? `/sessions/${sessionId}/lobby?${currentParams.toString()}`
        : `/sessions/${sessionId}/lobby`;
      navigate({
        to: '/login',
        search: { returnUrl },
      });
    }
  }, [
    isAuthHydrated,
    hasCode,
    hasTokenFromUrl,
    requiresAuth,
    isAuthenticated,
    sessionId,
    navigate,
    hasCodeExchangeError,
  ]);
}
