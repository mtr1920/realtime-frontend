---
name: routing-patterns
description: Use when implementing routing, navigation, protected routes, or lazy loading
---

# Routing Patterns

TanStack Router patterns, protected routes, and lazy loading.

## Overview

This skill covers route configuration, protected routes, lazy loading, navigation guards, and URL parameter handling.

---

## Route Configuration

```typescript
// ✅ CORRECT - Route configuration
// app/router/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from '@/app/layouts/RootLayout';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { ProtectedRoute } from '@/features/auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      // Public routes
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'sso/callback', element: <SSOCallbackPage /> },

      // Protected routes with layout
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'sessions', element: <SessionsPage /> },
          { path: 'sessions/new', element: <CreateSessionPage /> },
          { path: 'sessions/:sessionId', element: <SessionDetailPage /> },

          // Admin routes
          {
            path: 'admin',
            element: (
              <ProtectedRoute minRole="ADMIN">
                <AdminPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'users',
            element: (
              <ProtectedRoute permission="canManageUsers">
                <UsersPage />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // Session room (separate layout)
      {
        path: 'sessions/:sessionId/room',
        element: (
          <ProtectedRoute>
            <SessionRoomPage />
          </ProtectedRoute>
        ),
      },

      // Share link (public with token)
      { path: 'join/:sessionId', element: <ShareLinkJoinPage /> },

      // Error pages
      { path: 'unauthorized', element: <UnauthorizedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

---

## Protected Route Component

```typescript
// ✅ CORRECT - Protected route with permission check
// features/auth/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { usePermissions } from '@/shared/hooks';
import { LoadingScreen } from '@/shared/components';
import type { Permission, UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: Permission;
  minRole?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  permission,
  minRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission, hasMinRole } = usePermissions();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check permission
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check minimum role
  if (minRole && !hasMinRole(minRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## Lazy Loading Routes

```typescript
// ✅ CORRECT - Lazy load heavy pages
// app/router/lazy.tsx
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/shared/components';

// Lazy imports
const SessionRoomPage = lazy(() => import('@/pages/SessionRoomPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));

// Wrapper with suspense
function LazyRoute({ Component }: { Component: React.LazyExoticComponent<() => JSX.Element> }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component />
    </Suspense>
  );
}

// In router config
{
  path: 'sessions/:sessionId/room',
  element: (
    <ProtectedRoute>
      <LazyRoute Component={SessionRoomPage} />
    </ProtectedRoute>
  ),
}
```

---

## Navigation Hooks

```typescript
// ✅ CORRECT - Navigation patterns
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';

function SessionDetail() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Navigate to another page
  const goToEdit = () => {
    navigate(`/sessions/${sessionId}/edit`);
  };

  // Navigate with state
  const goBackToList = () => {
    navigate('/sessions', { state: { scrollToId: sessionId } });
  };

  // Navigate and replace history
  const handleComplete = () => {
    navigate('/sessions', { replace: true });
  };

  // Go back
  const goBack = () => {
    navigate(-1);
  };

  // Update search params
  const setFilter = (status: string) => {
    setSearchParams({ status });
  };

  // Read search params
  const tab = searchParams.get('tab') ?? 'overview';

  // Read location state (e.g., from redirect)
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  return <div>...</div>;
}
```

---

## Route Parameters

```typescript
// ✅ CORRECT - Type-safe route params
// Define param types
interface SessionParams {
  sessionId: string;
}

interface SessionQueryParams {
  tab?: 'overview' | 'participants' | 'recordings';
  page?: string;
}

function SessionDetailPage() {
  const { sessionId } = useParams<keyof SessionParams>() as SessionParams;
  const [searchParams] = useSearchParams();

  const tab = (searchParams.get('tab') as SessionQueryParams['tab']) ?? 'overview';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  // Validate sessionId
  if (!sessionId) {
    return <Navigate to="/sessions" replace />;
  }

  return <SessionDetail sessionId={sessionId} initialTab={tab} />;
}
```

---

## Redirect After Login

```typescript
// ✅ CORRECT - Redirect to original destination after login
// pages/LoginPage.tsx
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useLogin();

  // Get redirect destination
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (data: LoginFormData) => {
    await login(data);
    navigate(from, { replace: true });
  };

  return <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />;
}

// ProtectedRoute saves original location
if (!isAuthenticated) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}
```

---

## Breadcrumbs

```typescript
// ✅ CORRECT - Dynamic breadcrumbs from route
import { useMatches, Link } from 'react-router-dom';

interface RouteHandle {
  crumb?: (data: unknown) => string;
}

function Breadcrumbs() {
  const matches = useMatches();

  const crumbs = matches
    .filter((match) => Boolean((match.handle as RouteHandle)?.crumb))
    .map((match) => ({
      path: match.pathname,
      label: (match.handle as RouteHandle).crumb!(match.data),
    }));

  return (
    <nav className="flex gap-2">
      {crumbs.map((crumb, index) => (
        <Fragment key={crumb.path}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {index === crumbs.length - 1 ? (
            <span className="text-muted-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:underline">
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

// In route config
{
  path: 'sessions/:sessionId',
  element: <SessionDetailPage />,
  handle: {
    crumb: (data) => data?.session?.title ?? 'Session',
  },
  loader: async ({ params }) => {
    return { session: await sessionService.getOne(params.sessionId!) };
  },
}
```

---

## Route Loaders (Data Loading)

```typescript
// ✅ CORRECT - Route loader for data prefetching
import { defer, Await } from 'react-router-dom';

// Route config with loader
{
  path: 'sessions/:sessionId',
  element: <SessionDetailPage />,
  loader: async ({ params }) => {
    // Return promise for streaming
    return defer({
      session: sessionService.getOne(params.sessionId!),
      participants: sessionService.getParticipants(params.sessionId!),
    });
  },
}

// Page component
function SessionDetailPage() {
  const { session, participants } = useLoaderData() as {
    session: Promise<Session>;
    participants: Promise<Participant[]>;
  };

  return (
    <div>
      <Suspense fallback={<SessionHeaderSkeleton />}>
        <Await resolve={session}>
          {(resolvedSession) => <SessionHeader session={resolvedSession} />}
        </Await>
      </Suspense>

      <Suspense fallback={<ParticipantListSkeleton />}>
        <Await resolve={participants}>
          {(resolvedParticipants) => <ParticipantList participants={resolvedParticipants} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

---

## Navigation Guards

```typescript
// ✅ CORRECT - Prevent navigation with unsaved changes
import { useBlocker } from 'react-router-dom';

function EditSessionPage() {
  const [isDirty, setIsDirty] = useState(false);

  // Block navigation when form is dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  return (
    <>
      <SessionForm
        onChange={() => setIsDirty(true)}
        onSubmit={() => setIsDirty(false)}
      />

      {blocker.state === 'blocked' && (
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to leave?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => blocker.reset()}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => blocker.proceed()}>
                Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
```

---

## Scroll Restoration

```typescript
// ✅ CORRECT - Scroll to top on navigation
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// In App
function App() {
  return (
    <>
      <ScrollToTop />
      <RouterProvider router={router} />
    </>
  );
}
```

---

## Page Titles

Titles are automatic via `RouteTitle` component in DashboardLayout.

### Adding a New Page Title

```typescript
// In apps/web/src/app/router/route-titles.ts

// Static route - add to routeTitles object
export const routeTitles: Record<string, string> = {
  // ...existing routes
  '/new-page': 'New Page',
};

// Dynamic route - add to dynamicRouteTitles array
export const dynamicRouteTitles: Array<{
  pattern: RegExp;
  getTitle: (params: Record<string, string>) => string;
}> = [
  // ...existing patterns
  {
    pattern: /^\/items\/([^/]+)$/,
    getTitle: () => 'Item Details',
  },
];
```

### Override (Rare)

Use `usePageTitle()` only when page needs custom title based on fetched data:

```typescript
// ✅ CORRECT - Dynamic title based on data
import { usePageTitle } from '@/shared/hooks';

function SessionDetailPage() {
  const { data: session } = useSession(sessionId);

  // Override route-based title with session name
  usePageTitle(session?.title ? `Session: ${session.title}` : 'Session Details');

  return <div>...</div>;
}
```

```typescript
// ❌ WRONG - Don't use for static titles
function DashboardPage() {
  usePageTitle('Dashboard'); // Automatic via route-titles.ts
}
```

---

## Critical Rules

1. **Lazy load heavy pages** - especially session room, admin
2. **Protected routes** wrap route elements, not layouts
3. **Save redirect location** - in state for post-login redirect
4. **Type route params** - avoid `as unknown` casts
5. **Use replace** for redirects after form submit
6. **Block navigation** when form is dirty
7. **Scroll to top** on route change
8. **Handle 404** - catch-all route at end

---

## Related Skills

- `permission-patterns` - Route-level permissions
- `react-patterns` - Component patterns
- `feature-module-architecture` - Route organization
