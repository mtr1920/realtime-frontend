/**
 * LoginPage Component
 * Authentication page with login form and SSO.
 */

import { useSearch, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useSSOLogin } from '@/features/auth/hooks/useSSOLogin';
import { useAuthStore } from '@/shared/stores/auth.store';
import { XumaneLogo } from '@/shared/icons';
import { sanitizeReturnUrl } from '@/shared/lib/redirect-utils';
import type { SSOProvider } from '@/features/auth/components/SSOButtons';

// Search params type
interface LoginSearchParams {
  returnUrl?: string;
}

function BrandMark() {
  return (
    <div className="absolute left-6 top-6 flex items-center gap-2.5">
      <XumaneLogo size="sm" />
      <span className="text-foreground text-lg font-semibold">
        Xumane Recruit
      </span>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as LoginSearchParams;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { initiateSSO, loadingProvider, error: ssoError } = useSSOLogin();
  const safeReturnUrl = sanitizeReturnUrl(search.returnUrl, '/');

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate({ to: safeReturnUrl as '/' });
    }
  }, [isAuthenticated, isLoading, navigate, safeReturnUrl]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center px-4">
      <BrandMark />

      <div className="mb-8 text-center">
        <h1 className="text-foreground text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to continue to your workspace
        </p>
      </div>

      {ssoError && (
        <div
          role="alert"
          className="border-destructive/50 bg-destructive/10 text-destructive mb-4 w-full max-w-md rounded-md border p-3 text-sm"
        >
          {ssoError.message}
        </div>
      )}

      <LoginForm
        onSuccess={() => navigate({ to: safeReturnUrl as '/' })}
        showRememberMe
        showSSO
        onSSOClick={(provider: SSOProvider) =>
          initiateSSO(provider, safeReturnUrl)
        }
        loadingProvider={loadingProvider}
      />
    </div>
  );
}
