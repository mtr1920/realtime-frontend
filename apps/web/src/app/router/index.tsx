import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { RootLayout } from '@/app/layouts/RootLayout';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { ErrorFallback } from '@/shared/components/ErrorBoundary';
import { useAuthStore, waitForHydration } from '@/shared/stores/auth.store';
import { queryKeys } from '@/shared/services/query-keys';
import { ROLE_HIERARCHY } from '@/types';
import type { User, UserRole } from '@/types';

// Lazy-loaded page components for code splitting
import {
  LazyLoginPage,
  LazyForgotPasswordPage,
  LazyResetPasswordPage,
  LazySSOCallbackPage,
  LazyDashboardPage,
  LazySessionsPage,
  LazyCreateSessionPage,
  LazySessionDetailPage,
  LazySessionLobbyPage,
  LazySessionRoomPage,
  LazyWorkspacesPage,
  LazyCreateWorkspacePage,
  LazyWorkspaceDetailPage,
  LazyUsersPage,
  LazyUserDetailPage,
  LazySettingsPage,
  LazyAdminPage,
  LazyDomainConfigsPage,
  LazyWebhooksPage,
  LazyApiKeysPage,
  LazyAuditLogsPage,
  LazyTenantSettingsPage,
  LazyOutcomesPage,
  LazyIntegrationsPage,
  LazyShareLinkJoinPage,
} from './lazy';

/**
 * Check if user has at least the required role.
 */
function hasMinRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

/**
 * Get user from query client cache.
 * Returns cached user data if available.
 */
function getCachedUser(queryClient: QueryClient): User | undefined {
  return queryClient.getQueryData<User>(queryKeys.auth.user());
}

/**
 * Creates and configures the router with the given query client.
 */
export function createAppRouter(queryClient: QueryClient) {
  // Create root route
  const rootRoute = createRootRoute({
    component: RootLayout,
    errorComponent: ({ error }) => (
      <ErrorFallback
        error={error instanceof Error ? error : new Error(String(error))}
      />
    ),
    notFoundComponent: NotFoundPage,
  });

  // Create index route - redirects to dashboard if authenticated, login if not
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: async () => {
      // Wait for auth store to hydrate before checking auth status
      await waitForHydration();
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (isAuthenticated) {
        throw redirect({ to: '/dashboard' });
      } else {
        throw redirect({ to: '/login', search: { returnUrl: '/dashboard' } });
      }
    },
    component: HomePage,
  });

  // Create login route (lazy-loaded)
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LazyLoginPage,
    validateSearch: (search: Record<string, unknown>) => ({
      returnUrl: typeof search.returnUrl === 'string' ? search.returnUrl : undefined,
    }),
  });

  // Create forgot password route (lazy-loaded)
  const forgotPasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/forgot-password',
    component: LazyForgotPasswordPage,
  });

  // Create reset password route (lazy-loaded)
  const resetPasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/reset-password',
    component: LazyResetPasswordPage,
    validateSearch: (search: Record<string, unknown>) => ({
      token: typeof search.token === 'string' ? search.token : undefined,
    }),
  });

  // Create unauthorized route (kept inline - small component)
  const unauthorizedRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/unauthorized',
    component: UnauthorizedPage,
  });

  // Create SSO callback route (lazy-loaded)
  const ssoCallbackRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/auth/callback/$provider',
    component: LazySSOCallbackPage,
    validateSearch: (search: Record<string, unknown>) => ({
      code: typeof search.code === 'string' ? search.code : undefined,
      state: typeof search.state === 'string' ? search.state : undefined,
      error: typeof search.error === 'string' ? search.error : undefined,
    }),
  });

  // =============================================================================
  // Dashboard Routes (Protected)
  // =============================================================================

  // Dashboard layout route - requires authentication
  const dashboardLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'dashboard-layout',
    component: DashboardLayout,
    beforeLoad: async ({ location }) => {
      // Wait for auth store to hydrate before checking auth status
      await waitForHydration();
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (!isAuthenticated) {
        throw redirect({
          to: '/login',
          search: { returnUrl: location.pathname },
        });
      }
    },
  });

  // Dashboard home route (lazy-loaded)
  const dashboardRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/dashboard',
    component: LazyDashboardPage,
  });

  // Sessions routes (lazy-loaded)
  const sessionsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/sessions',
    component: LazySessionsPage,
  });

  const sessionsCreateRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/sessions/create',
    component: LazyCreateSessionPage,
  });

  const sessionDetailRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/sessions/$sessionId',
    component: LazySessionDetailPage,
  });

  // Session lobby route (lazy-loaded)
  // This route is PUBLIC - it handles both authenticated and unauthenticated access
  // The page component handles redirecting to login if the role requires auth
  const sessionLobbyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sessions/$sessionId/lobby',
    component: LazySessionLobbyPage,
    validateSearch: (search: Record<string, unknown>) => ({
      token: typeof search.token === 'string' ? search.token : undefined,
      roleId: typeof search.roleId === 'string' ? search.roleId : undefined,
      code: typeof search.code === 'string' ? search.code : undefined,
    }),
  });

  // Session room route (lazy-loaded)
  // This route is PUBLIC - it handles both authenticated and unauthenticated access
  // Users can access via:
  // 1. Authenticated users navigating from dashboard
  // 2. Unauthenticated users who joined via invite code (have realtimeToken in store)
  const sessionRoomRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sessions/$sessionId/room',
    component: LazySessionRoomPage,
  });

  // Share link join route (lazy-loaded)
  // This route is PUBLIC - resolves a share link and redirects to lobby
  const shareLinkJoinRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/join/$shareId',
    component: LazyShareLinkJoinPage,
  });

  // Workspaces routes (lazy-loaded)
  const workspacesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/workspaces',
    component: LazyWorkspacesPage,
  });

  const workspacesCreateRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/workspaces/create',
    component: LazyCreateWorkspacePage,
  });

  const workspaceDetailRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/workspaces/$workspaceId',
    component: LazyWorkspaceDetailPage,
  });

  // Users route (lazy-loaded)
  const usersRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/users',
    component: LazyUsersPage,
  });

  const userDetailRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/users/$userId',
    component: LazyUserDetailPage,
  });

  // Settings route (lazy-loaded)
  const settingsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/settings',
    component: LazySettingsPage,
  });

  // Admin routes - require ADMIN role (all lazy-loaded)
  const adminRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/admin',
    component: LazyAdminPage,
    beforeLoad: async () => {
      await waitForHydration();
      const user = getCachedUser(queryClient);
      if (!hasMinRole(user?.role, 'ADMIN')) {
        throw redirect({ to: '/unauthorized' });
      }
    },
  });

  const adminDomainConfigsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/admin/domain-configs',
    component: LazyDomainConfigsPage,
    beforeLoad: async () => {
      await waitForHydration();
      const user = getCachedUser(queryClient);
      if (!hasMinRole(user?.role, 'ADMIN')) {
        throw redirect({ to: '/unauthorized' });
      }
    },
  });

  const adminWebhooksRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/admin/webhooks',
    component: LazyWebhooksPage,
    beforeLoad: async () => {
      await waitForHydration();
      const user = getCachedUser(queryClient);
      if (!hasMinRole(user?.role, 'ADMIN')) {
        throw redirect({ to: '/unauthorized' });
      }
    },
  });

  const adminApiKeysRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/admin/api-keys',
    component: LazyApiKeysPage,
    beforeLoad: async () => {
      await waitForHydration();
      const user = getCachedUser(queryClient);
      if (!hasMinRole(user?.role, 'ADMIN')) {
        throw redirect({ to: '/unauthorized' });
      }
    },
  });

  const adminAuditLogsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/admin/audit-logs',
    component: LazyAuditLogsPage,
    beforeLoad: async () => {
      await waitForHydration();
      const user = getCachedUser(queryClient);
      if (!hasMinRole(user?.role, 'ADMIN')) {
        throw redirect({ to: '/unauthorized' });
      }
    },
  });

  const adminSettingsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/admin/settings',
    component: LazyTenantSettingsPage,
    beforeLoad: async () => {
      await waitForHydration();
      const user = getCachedUser(queryClient);
      if (!hasMinRole(user?.role, 'ADMIN')) {
        throw redirect({ to: '/unauthorized' });
      }
    },
  });

  const adminOutcomesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/admin/outcomes',
    component: LazyOutcomesPage,
    beforeLoad: async () => {
      await waitForHydration();
      const user = getCachedUser(queryClient);
      if (!hasMinRole(user?.role, 'ADMIN')) {
        throw redirect({ to: '/unauthorized' });
      }
    },
  });

  const adminIntegrationsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/admin/integrations',
    component: LazyIntegrationsPage,
    beforeLoad: async () => {
      await waitForHydration();
      const user = getCachedUser(queryClient);
      if (!hasMinRole(user?.role, 'ADMIN')) {
        throw redirect({ to: '/unauthorized' });
      }
    },
  });

  // Build route tree
  const routeTree = rootRoute.addChildren([
    indexRoute,
    loginRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    unauthorizedRoute,
    ssoCallbackRoute,
    // Session lobby is public - handles its own auth requirements
    sessionLobbyRoute,
    // Share link join is public - resolves share ID and redirects to lobby
    shareLinkJoinRoute,
    // Session room is public - handles its own access validation
    // (either authenticated OR has realtimeToken from invite code join)
    sessionRoomRoute,
    dashboardLayoutRoute.addChildren([
      dashboardRoute,
      sessionsRoute,
      sessionsCreateRoute,
      sessionDetailRoute,
      workspacesRoute,
      workspacesCreateRoute,
      workspaceDetailRoute,
      usersRoute,
      userDetailRoute,
      settingsRoute,
      adminRoute,
      adminDomainConfigsRoute,
      adminWebhooksRoute,
      adminApiKeysRoute,
      adminAuditLogsRoute,
      adminSettingsRoute,
      adminOutcomesRoute,
      adminIntegrationsRoute,
    ]),
  ]);

  // Create router instance
  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  return router;
}

// Type declaration for router
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
