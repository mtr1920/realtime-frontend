/**
 * Lazy Loading Utilities for Route Components
 *
 * Provides lazy-loaded page components with Suspense fallback.
 */

import { lazy, Suspense, type ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading spinner component for lazy-loaded pages
 */
function PageLoadingFallback() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 motion-safe:motion-safe:animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

/**
 * Create a lazy-loaded component with Suspense wrapper
 */
function createLazyPage(
  importFn: () => Promise<{ default: AnyComponent } | Record<string, AnyComponent>>,
  exportName?: string
) {
  const LazyComponent = lazy(async () => {
    const module = await importFn();
    if (exportName && exportName in module) {
      return { default: (module as Record<string, AnyComponent>)[exportName]! };
    }
    return module as { default: AnyComponent };
  });

  return function LazyPage() {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyComponent />
      </Suspense>
    );
  };
}

// =============================================================================
// Public Pages (Auth)
// =============================================================================

export const LazyLoginPage = createLazyPage(
  () => import('@/pages/LoginPage'),
  'LoginPage'
);

export const LazyForgotPasswordPage = createLazyPage(
  () => import('@/pages/ForgotPasswordPage'),
  'ForgotPasswordPage'
);

export const LazyResetPasswordPage = createLazyPage(
  () => import('@/pages/ResetPasswordPage'),
  'ResetPasswordPage'
);

export const LazySSOCallbackPage = createLazyPage(
  () => import('@/pages/SSOCallbackPage'),
  'SSOCallbackPage'
);

// =============================================================================
// Dashboard Pages
// =============================================================================

export const LazyDashboardPage = createLazyPage(
  () => import('@/pages/DashboardPage'),
  'DashboardPage'
);

// =============================================================================
// Session Pages
// =============================================================================

export const LazySessionsPage = createLazyPage(
  () => import('@/pages/SessionsPage'),
  'SessionsPage'
);

export const LazyCreateSessionPage = createLazyPage(
  () => import('@/pages/CreateSessionPage'),
  'CreateSessionPage'
);

export const LazySessionDetailPage = createLazyPage(
  () => import('@/pages/SessionDetailPage'),
  'SessionDetailPage'
);

export const LazySessionLobbyPage = createLazyPage(
  () => import('@/pages/SessionLobbyPage'),
  'SessionLobbyPage'
);

export const LazySessionRoomPage = createLazyPage(
  () => import('@/pages/SessionRoomPage'),
  'SessionRoomPage'
);

export const LazyShareLinkJoinPage = createLazyPage(
  () => import('@/pages/ShareLinkJoinPage'),
  'ShareLinkJoinPage'
);

// =============================================================================
// Workspace Pages
// =============================================================================

export const LazyWorkspacesPage = createLazyPage(
  () => import('@/pages/WorkspacesPage'),
  'WorkspacesPage'
);

export const LazyCreateWorkspacePage = createLazyPage(
  () => import('@/pages/CreateWorkspacePage'),
  'CreateWorkspacePage'
);

export const LazyWorkspaceDetailPage = createLazyPage(
  () => import('@/pages/WorkspaceDetailPage'),
  'WorkspaceDetailPage'
);

// =============================================================================
// User Pages
// =============================================================================

export const LazyUsersPage = createLazyPage(
  () => import('@/pages/UsersPage'),
  'UsersPage'
);

export const LazyUserDetailPage = createLazyPage(
  () => import('@/pages/UserDetailPage'),
  'UserDetailPage'
);

// =============================================================================
// Settings Pages
// =============================================================================

export const LazySettingsPage = createLazyPage(
  () => import('@/pages/SettingsPage'),
  'SettingsPage'
);

// =============================================================================
// Admin Pages
// =============================================================================

export const LazyAdminPage = createLazyPage(
  () => import('@/pages/AdminPage'),
  'AdminPage'
);

export const LazyDomainConfigsPage = createLazyPage(
  () => import('@/pages/DomainConfigsPage'),
  'DomainConfigsPage'
);

export const LazyWebhooksPage = createLazyPage(
  () => import('@/pages/WebhooksPage'),
  'WebhooksPage'
);

export const LazyApiKeysPage = createLazyPage(
  () => import('@/pages/ApiKeysPage'),
  'ApiKeysPage'
);

export const LazyAuditLogsPage = createLazyPage(
  () => import('@/pages/AuditLogsPage'),
  'AuditLogsPage'
);

export const LazyTenantSettingsPage = createLazyPage(
  () => import('@/pages/TenantSettingsPage'),
  'TenantSettingsPage'
);

export const LazyOutcomesPage = createLazyPage(
  () => import('@/pages/OutcomesPage'),
  'OutcomesPage'
);

export const LazyIntegrationsPage = createLazyPage(
  () => import('@/pages/IntegrationsPage'),
  'IntegrationsPage'
);
