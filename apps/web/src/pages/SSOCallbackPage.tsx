/**
 * SSOCallbackPage Component
 * Handles OAuth callback after SSO authentication.
 *
 * Backend uses redirect-based OAuth flow:
 * 1. Backend completes OAuth flow with provider
 * 2. Backend redirects to this page with tokens in URL query params:
 *    - access_token, refresh_token, expires_at (required)
 *    - user_id, email, name, tenant_id, role (optional user info)
 *    - error (if authentication failed)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { authService } from '@/features/auth/api/auth.service';
import { useAuthStore } from '@/shared/stores/auth.store';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

interface SSOCallbackSearchParams {
  // Token params from backend redirect
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  // User info params
  user_id?: string;
  email?: string;
  name?: string;
  tenant_id?: string;
  role?: string;
  // Error handling
  error?: string;
  error_description?: string;
}

export function SSOCallbackPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as SSOCallbackSearchParams;
  const setTokens = useAuthStore((state) => state.setTokens);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleCallback() {
      // Check for error from OAuth flow
      if (search.error) {
        const errorMsg = search.error_description || search.error;
        setError(`Authentication failed: ${errorMsg}`);
        return;
      }

      // Parse tokens from URL params (redirect-based flow)
      const searchParams = new URLSearchParams(window.location.search);
      const response = authService.parseSSOCallbackParams(searchParams);

      if (!response) {
        setError('Invalid callback: missing authentication tokens');
        return;
      }

      // Store tokens only - user will be fetched automatically by useCurrentUser
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      });

      // Clear sensitive tokens from URL history (prevents them from being bookmarked/shared)
      // Replace current URL without tokens
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      // Redirect to home or stored return URL (sanitized)
      const storedUrl = sessionStorage.getItem('sso_return_url');
      sessionStorage.removeItem('sso_return_url');
      const blockedPaths = ['/login', '/logout', '/sso', '/auth'];
      const isValidPath = storedUrl &&
        storedUrl.startsWith('/') &&
        !blockedPaths.some((p) => storedUrl.startsWith(p));
      navigate({ to: (isValidPath ? storedUrl : '/') as '/' });
    }

    handleCallback();
  }, [search.error, search.error_description, search.access_token, setTokens, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Authentication Failed
          </h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate({ to: '/login', search: { returnUrl: undefined } })}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <LoadingScreen message="Completing sign in..." />;
}
