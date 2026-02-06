/**
 * useSSOLogin Hook
 * Handles SSO login flow initiation and redirect.
 *
 * Uses redirect-based OAuth flow:
 * 1. Browser redirects to backend SSO endpoint
 * 2. Backend redirects to OAuth provider
 * 3. OAuth provider redirects back to backend callback
 * 4. Backend redirects to frontend with tokens in URL params
 */

import { useState, useCallback } from 'react';
import { authService } from '../api/auth.service';
import type { SSOProvider } from '../components/SSOButtons';

interface UseSSOLoginOptions {
  /**
   * Callback when SSO initialization fails.
   */
  onError?: (error: Error) => void;
}

interface UseSSOLoginResult {
  /**
   * Initiate SSO login for a provider.
   * Redirects browser directly to backend SSO endpoint.
   */
  initiateSSO: (provider: SSOProvider, returnUrl?: string) => void;
  /**
   * Provider currently being processed.
   */
  loadingProvider: SSOProvider | null;
  /**
   * Error that occurred during SSO initialization.
   */
  error: Error | null;
  /**
   * Reset error state.
   */
  reset: () => void;
}

export function useSSOLogin(options: UseSSOLoginOptions = {}): UseSSOLoginResult {
  const { onError } = options;
  const [loadingProvider, setLoadingProvider] = useState<SSOProvider | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const initiateSSO = useCallback(
    (provider: SSOProvider, returnUrl?: string) => {
      setLoadingProvider(provider);
      setError(null);

      // Get tenant slug from subdomain
      const tenantSlug = authService.getTenantFromSubdomain();
      if (!tenantSlug) {
        const err = new Error('Tenant required for SSO');
        setError(err);
        setLoadingProvider(null);
        onError?.(err);
        return;
      }

      // Store return URL for callback page to use after successful auth
      if (returnUrl) {
        sessionStorage.setItem('sso_return_url', returnUrl);
      }

      // Use redirect-based OAuth flow:
      // Browser redirects to backend SSO endpoint which handles the OAuth flow
      // and returns to /sso/callback with tokens in URL params
      const callbackUrl = `${window.location.origin}/sso/callback`;
      authService.initiateSSO(provider, tenantSlug, callbackUrl);

      // Note: The page will redirect, so loadingProvider state will be lost
      // This is expected behavior - the loading indicator shows until redirect
    },
    [onError]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoadingProvider(null);
  }, []);

  return {
    initiateSSO,
    loadingProvider,
    error,
    reset,
  };
}
