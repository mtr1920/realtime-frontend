/**
 * LoginPage Component
 * Authentication page with login form and SSO.
 */

import { useSearch, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useSSOLogin } from '@/features/auth/hooks/useSSOLogin';
import { useAuthStore } from '@/shared/stores/auth.store';
import { sanitizeReturnUrl } from '@/shared/lib/redirect-utils';
import type { SSOProvider } from '@/features/auth/components/SSOButtons';

// Search params type
interface LoginSearchParams {
  returnUrl?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as LoginSearchParams;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // SSO login hook
  const { initiateSSO, loadingProvider, error: ssoError } = useSSOLogin();

  // Get sanitized return URL (defaults to '/' if invalid)
  const safeReturnUrl = sanitizeReturnUrl(search.returnUrl, '/');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate({ to: safeReturnUrl as '/' });
    }
  }, [isAuthenticated, isLoading, navigate, safeReturnUrl]);

  // Show nothing while checking auth state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleSuccess = () => {
    navigate({ to: safeReturnUrl as '/' });
  };

  const handleSSOClick = (provider: SSOProvider) => {
    initiateSSO(provider, safeReturnUrl);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to continue to your workspace
        </p>
      </div>

      {/* SSO Error */}
      {ssoError && (
        <div
          role="alert"
          className="mb-4 w-full max-w-md rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {ssoError.message}
        </div>
      )}

      <LoginForm
        onSuccess={handleSuccess}
        showRememberMe
        showSSO
        onSSOClick={handleSSOClick}
        loadingProvider={loadingProvider}
      />
    </div>
  );
}
