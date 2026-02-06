import { useTheme } from '@/shared/theme/useTheme';
import { CheckIcon } from '@/shared/icons/CheckIcon';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useCurrentUser, useLogout } from '@/shared/hooks';

/**
 * Home page displaying the application overview and theme controls.
 * Protected - requires authentication.
 */
export function HomePage() {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
  const { user } = useCurrentUser();
  const { logout, isLoading: isLoggingOut } = useLogout();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Xumane Recruit
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-powered recruitment platform
          </p>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col">
              <span className="font-medium text-card-foreground">
                {user.displayName}
              </span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <span className="text-xs text-muted-foreground">
                {user.role} @ {user.tenantId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="rounded-md border border-destructive bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">
            Phase 1 & 2: Foundation + Auth
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckIcon />
              Vite + React 19 + TypeScript
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              TanStack Router + Query
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Tailwind CSS with Theme System
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Zustand State Management
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Authentication System
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Protected Routes
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Toggle Theme (
            {theme === 'system' ? `system/${resolvedTheme}` : resolvedTheme})
          </button>

          <button
            type="button"
            onClick={() =>
              setTheme(theme === 'high-contrast' ? 'light' : 'high-contrast')
            }
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-pressed={theme === 'high-contrast'}
          >
            High Contrast {theme === 'high-contrast' ? '(On)' : '(Off)'}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
