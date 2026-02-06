# Pages and Routing

> TanStack Router configuration, page components, navigation patterns, and route protection.

## Overview

The application uses TanStack Router v1 for type-safe routing with:
- File-based route generation
- Protected routes with `beforeLoad`
- Lazy-loaded page components
- Centralized layouts
- Type-safe search params and route params

## Route Tree Structure

```
/                          # Index - redirects based on auth
├── /login                 # Public - LoginPage
├── /forgot-password       # Public - ForgotPasswordPage
├── /reset-password        # Public - ResetPasswordPage
├── /auth/callback/$provider # Public - SSO callback
├── /unauthorized          # Public - UnauthorizedPage
├── /join/$shareId         # Public - Share link resolver
├── /sessions/$sessionId/lobby # Public* - Session lobby (handles own auth)
├── /sessions/$sessionId/room  # Public* - Session room (handles own auth)
│
└── (dashboard-layout)     # Protected layout - requires auth
    ├── /dashboard         # DashboardPage
    ├── /sessions          # SessionsPage (list)
    ├── /sessions/create   # CreateSessionPage
    ├── /sessions/$sessionId # SessionDetailPage
    ├── /workspaces        # WorkspacesPage (list)
    ├── /workspaces/$workspaceId # WorkspaceDetailPage
    ├── /users             # UsersPage (list)
    ├── /users/$userId     # UserDetailPage
    ├── /settings          # SettingsPage
    │
    └── /admin/*           # Admin routes - requires ADMIN role
        ├── /admin         # AdminPage (dashboard)
        ├── /admin/domain-configs # DomainConfigsPage
        ├── /admin/webhooks # WebhooksPage
        ├── /admin/api-keys # ApiKeysPage
        ├── /admin/audit-logs # AuditLogsPage
        ├── /admin/settings # TenantSettingsPage
        ├── /admin/outcomes # OutcomesPage
        └── /admin/integrations # IntegrationsPage
```

## Router Configuration

```typescript
// apps/web/src/app/router/index.tsx
import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router';

export function createAppRouter(queryClient: QueryClient) {
  // Root route with error handling
  const rootRoute = createRootRoute({
    component: RootLayout,
    errorComponent: ({ error }) => (
      <ErrorFallback error={error instanceof Error ? error : new Error(String(error))} />
    ),
    notFoundComponent: NotFoundPage,
  });

  // Create router with query client context
  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',     // Preload on hover intent
    defaultPreloadStaleTime: 0,   // Always preload fresh
  });

  return router;
}
```

## Route Protection Patterns

### Authentication Guard

Protected routes use `beforeLoad` to check authentication:

```typescript
// Dashboard layout - requires authentication
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'dashboard-layout',
  component: DashboardLayout,
  beforeLoad: async ({ location }) => {
    // Wait for auth store to hydrate before checking
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
```

### Role-Based Authorization

Admin routes check role hierarchy:

```typescript
const roleHierarchy: UserRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];

function hasMinRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  const userIndex = roleHierarchy.indexOf(userRole);
  const requiredIndex = roleHierarchy.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

// Admin route example
const adminRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/admin',
  component: LazyAdminPage,
  beforeLoad: async () => {
    await waitForHydration();
    const user = useAuthStore.getState().user;
    if (!hasMinRole(user?.role, 'ADMIN')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
});
```

### Search Param Validation

Routes can validate and type search params:

```typescript
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LazyLoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    returnUrl: typeof search.returnUrl === 'string' ? search.returnUrl : undefined,
  }),
});

// Usage in component
function LoginPage() {
  const { returnUrl } = Route.useSearch();
  // returnUrl is typed as string | undefined
}
```

## Lazy Loading

All page components are lazy-loaded for code splitting:

```typescript
// apps/web/src/app/router/lazy.tsx
import { lazy, Suspense, type ComponentType } from 'react';

function PageLoadingFallback() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 motion-safe:animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

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

// Export lazy pages
export const LazyLoginPage = createLazyPage(
  () => import('@/pages/LoginPage'),
  'LoginPage'
);

export const LazyDashboardPage = createLazyPage(
  () => import('@/pages/DashboardPage'),
  'DashboardPage'
);
// ... more lazy pages
```

## Layout Components

### RootLayout

Provides global context (theme, auth, toast):

```typescript
// apps/web/src/app/layouts/RootLayout.tsx
export function RootLayout() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
```

### DashboardLayout

Provides authenticated app shell with sidebar:

```typescript
// apps/web/src/app/layouts/DashboardLayout.tsx
export function DashboardLayout() {
  return (
    <AppShell>
      <AppShellSidebar>
        <Sidebar />
      </AppShellSidebar>
      <AppShellContent>
        <Outlet />
      </AppShellContent>
    </AppShell>
  );
}
```

## Page Component Patterns

### Standard Page Structure

```typescript
// apps/web/src/pages/SessionsPage.tsx
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { PageHeader, EmptyState, DataTable } from '@realtime/ui';
import { queryKeys } from '@/shared/services/query-keys';
import { sessionService } from '@/features/sessions/api/session.service';

export function SessionsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Sessions"
        description="View and manage your sessions"
        actions={<CreateSessionButton />}
      />
      <Suspense fallback={<SessionsTableSkeleton />}>
        <SessionsContent />
      </Suspense>
    </div>
  );
}

function SessionsContent() {
  const { data: sessions } = useSuspenseQuery({
    queryKey: queryKeys.sessions.all(),
    queryFn: () => sessionService.list(),
  });

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title="No sessions yet"
        description="Create your first session to get started"
        action={<CreateSessionButton />}
      />
    );
  }

  return <SessionsTable sessions={sessions} />;
}
```

### Detail Page with Params

```typescript
// apps/web/src/pages/SessionDetailPage.tsx
import { useParams } from '@tanstack/react-router';

export function SessionDetailPage() {
  const { sessionId } = useParams({ from: '/sessions/$sessionId' });

  return (
    <Suspense fallback={<SessionDetailSkeleton />}>
      <SessionDetailContent sessionId={sessionId} />
    </Suspense>
  );
}

function SessionDetailContent({ sessionId }: { sessionId: string }) {
  const { data: session } = useSuspenseQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => sessionService.get(sessionId),
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Sessions', href: '/sessions' },
          { label: session.name },
        ]}
        title={session.name}
      />
      {/* ... content */}
    </div>
  );
}
```

## Navigation Patterns

### Programmatic Navigation

```typescript
import { useNavigate } from '@tanstack/react-router';

function CreateSessionButton() {
  const navigate = useNavigate();

  const handleCreate = async () => {
    const session = await createSession();
    navigate({ to: '/sessions/$sessionId', params: { sessionId: session.id } });
  };

  return <Button onClick={handleCreate}>Create Session</Button>;
}
```

### Link Component

```typescript
import { Link } from '@tanstack/react-router';

function SessionCard({ session }) {
  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: session.id }}
      className="block rounded-lg border p-4 hover:bg-muted/50"
    >
      <h3>{session.name}</h3>
    </Link>
  );
}
```

### Prefetching on Hover

```typescript
import { Link, useRouter } from '@tanstack/react-router';

function SessionCard({ session }) {
  const router = useRouter();

  const prefetchSession = () => {
    router.preloadRoute({
      to: '/sessions/$sessionId',
      params: { sessionId: session.id },
    });
  };

  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: session.id }}
      onMouseEnter={prefetchSession}
      onFocus={prefetchSession}
    >
      {session.name}
    </Link>
  );
}
```

## Pages Directory Reference

| Page | Path | Protection | Description |
|------|------|------------|-------------|
| `HomePage` | `/` | Public | Landing, redirects to dashboard/login |
| `LoginPage` | `/login` | Public | Authentication |
| `ForgotPasswordPage` | `/forgot-password` | Public | Password reset request |
| `ResetPasswordPage` | `/reset-password` | Public | Password reset form |
| `SSOCallbackPage` | `/auth/callback/$provider` | Public | OAuth callback |
| `UnauthorizedPage` | `/unauthorized` | Public | Access denied |
| `NotFoundPage` | `*` | Public | 404 page |
| `ShareLinkJoinPage` | `/join/$shareId` | Public | Share link resolver |
| `SessionLobbyPage` | `/sessions/$sessionId/lobby` | Mixed | Pre-session lobby |
| `SessionRoomPage` | `/sessions/$sessionId/room` | Mixed | Live session room |
| `DashboardPage` | `/dashboard` | Auth | Main dashboard |
| `SessionsPage` | `/sessions` | Auth | Session list |
| `CreateSessionPage` | `/sessions/create` | Auth | Create session form |
| `SessionDetailPage` | `/sessions/$sessionId` | Auth | Session details |
| `WorkspacesPage` | `/workspaces` | Auth | Workspace list |
| `WorkspaceDetailPage` | `/workspaces/$workspaceId` | Auth | Workspace details |
| `UsersPage` | `/users` | Auth | User list |
| `UserDetailPage` | `/users/$userId` | Auth | User details |
| `SettingsPage` | `/settings` | Auth | User settings |
| `AdminPage` | `/admin` | Admin | Admin dashboard |
| `DomainConfigsPage` | `/admin/domain-configs` | Admin | Domain configs |
| `WebhooksPage` | `/admin/webhooks` | Admin | Webhook management |
| `ApiKeysPage` | `/admin/api-keys` | Admin | API key management |
| `AuditLogsPage` | `/admin/audit-logs` | Admin | Audit log viewer |
| `TenantSettingsPage` | `/admin/settings` | Admin | Tenant settings |
| `OutcomesPage` | `/admin/outcomes` | Admin | Outcomes management |
| `IntegrationsPage` | `/admin/integrations` | Admin | Integration connectors |

## Error Handling

### Route-Level Error Boundary

```typescript
const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: ({ error }) => (
    <ErrorFallback
      error={error instanceof Error ? error : new Error(String(error))}
      onReset={() => window.location.reload()}
    />
  ),
  notFoundComponent: NotFoundPage,
});
```

### Per-Route Error Handling

```typescript
const sessionDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/sessions/$sessionId',
  component: LazySessionDetailPage,
  errorComponent: ({ error }) => (
    <SessionErrorDisplay error={error} />
  ),
});
```

## Critical Rules

1. **ALWAYS use `beforeLoad` for protection** - Never check auth in components
2. **ALWAYS wait for hydration** - Call `waitForHydration()` before checking auth store
3. **ALWAYS use lazy loading** - Create lazy wrappers for all page components
4. **ALWAYS type route params** - Use `useParams({ from: '/path/$param' })`
5. **PREFER `useSuspenseQuery`** - For data fetching in page components
6. **WRAP content in Suspense** - Provide skeleton fallbacks

## Related Documents

- [Architecture Overview](./architecture-overview.md) - Monorepo structure
- [State Management](./state-management.md) - Query patterns for pages
- [Component Architecture](./component-architecture.md) - Page component patterns
- See `routing-patterns` skill for implementation details
