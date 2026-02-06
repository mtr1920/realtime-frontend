/**
 * useCodeExchange Hook
 *
 * Handles invite code exchange for session access tokens.
 * Invite codes remain valid until their TTL expires (configurable, default 24h).
 */

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { sessionsService } from '../api/sessions.service';

interface UseCodeExchangeOptions {
  /** Whether auth state has been hydrated */
  isAuthHydrated: boolean;
}

interface CodeExchangeResult {
  /** Access token received from code exchange */
  accessToken: string;
  /** Role ID for the participant */
  roleId: string;
  /** Whether authentication is required */
  requiresAuth: boolean | null;
  /** Whether code exchange is in progress */
  isExchanging: boolean;
  /** Error message if exchange failed */
  error: string | null;
  /** Update access token manually */
  setAccessToken: (token: string) => void;
  /** Update role ID manually */
  setRoleId: (roleId: string) => void;
  /** Update requiresAuth manually */
  setRequiresAuth: (value: boolean | null) => void;
}

/**
 * Hook to handle invite code exchange for session access.
 * Extracts URL parameters and exchanges invite codes for access tokens.
 *
 * @example
 * ```ts
 * const { accessToken, roleId, requiresAuth, isExchanging, error } = useCodeExchange({
 *   isAuthHydrated: true,
 * });
 * ```
 */
export function useCodeExchange(options: UseCodeExchangeOptions): CodeExchangeResult {
  const { isAuthHydrated } = options;

  // Get params from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code');
  const tokenFromUrl = searchParams.get('token');
  const roleIdFromUrl = searchParams.get('roleId');
  const requiresAuthFromUrl = searchParams.get('requiresAuth');

  // Parse requiresAuth from URL (share link flow provides it as string "true"/"false")
  const parsedRequiresAuth =
    requiresAuthFromUrl === 'true' ? true : requiresAuthFromUrl === 'false' ? false : null;

  // Exchange result state - initialize from URL params if present (share link flow)
  const [accessToken, setAccessToken] = useState(tokenFromUrl ?? '');
  const [roleId, setRoleId] = useState(roleIdFromUrl ?? '');
  const [requiresAuth, setRequiresAuth] = useState<boolean | null>(parsedRequiresAuth);
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exchangeAttempted = useRef(false);

  // Exchange invite code on mount (if present in URL)
  // Wait for auth hydration to avoid race condition
  useEffect(() => {
    // Wait for auth state to be hydrated before making any decisions
    if (!isAuthHydrated) return;

    // If already exchanged or no code, skip code exchange
    if (exchangeAttempted.current || !code) return;

    // Track if component is still mounted to prevent state updates after unmount
    let cancelled = false;

    // Exchange invite code for access token
    // Note: The code remains valid until TTL expires, so retries work
    exchangeAttempted.current = true;
    setIsExchanging(true);

    sessionsService
      .exchangeCode(code)
      .then((result) => {
        if (cancelled) return;
        setAccessToken(result.accessToken);
        setRoleId(result.roleId);
        setRequiresAuth(result.requiresAuth);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Invalid or expired invite link';
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (cancelled) return;
        setIsExchanging(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, isAuthHydrated]);

  return {
    accessToken,
    roleId,
    requiresAuth,
    isExchanging,
    error,
    setAccessToken,
    setRoleId,
    setRequiresAuth,
  };
}
