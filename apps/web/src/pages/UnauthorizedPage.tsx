/**
 * UnauthorizedPage Component
 * 403 Forbidden error page for users without required permissions.
 */

import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useCurrentUser } from '@/shared/hooks';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleGoHome = () => {
    navigate({ to: '/' });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        {/* Error Code */}
        <h1 className="text-8xl font-bold text-muted-foreground/20">403</h1>

        {/* Title */}
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Access Denied
        </h2>

        {/* Description */}
        <p className="mt-2 max-w-md text-muted-foreground">
          {isAuthenticated
            ? `You don't have permission to access this page. Your current role (${user?.role || 'unknown'}) doesn't have the required permissions.`
            : 'You need to be signed in to access this page.'}
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={handleGoBack} variant="outline">
            Go Back
          </Button>
          <Button onClick={handleGoHome}>Go to Home</Button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-muted-foreground">
          If you believe this is a mistake, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
