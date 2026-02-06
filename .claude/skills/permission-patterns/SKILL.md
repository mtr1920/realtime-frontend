---
name: permission-patterns
description: Use when implementing role-based permissions, access control, or permission-based rendering
---

# Permission Patterns

Role-based permissions and access control using usePermissions.

## Overview

This skill covers the permission system, role hierarchy, permission-based rendering, and integration with UI components.

---

## Core Principle

```typescript
// ✅ CORRECT - Permission-based rendering
const { hasPermission, hasMinRole } = usePermissions();

return (
  <div>
    {hasPermission('canCreateSession') && <CreateSessionButton />}
    {hasMinRole('ADMIN') && <AdminPanel />}
  </div>
);

// ❌ WRONG - Hardcoded role checks
if (role === 'admin') {
  return <AdminPanel />;
}

// ❌ WRONG - Direct role comparison
if (user.role === 'OWNER') {
  // ...
}
```

---

## usePermissions Hook

### Full API Reference

```typescript
interface PermissionsResult {
  // Current role
  role: UserRole | null;
  isAuthenticated: boolean;

  // Role checks
  hasRole: (role: UserRole) => boolean;
  hasMinRole: (minRole: UserRole) => boolean;

  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

type Permission =
  | 'canCreateSession'
  | 'canEditSession'
  | 'canDeleteSession'
  | 'canViewAllSessions'
  | 'canManageUsers'
  | 'canManageSettings'
  | 'canViewAuditLogs'
  | 'canManageApiKeys'
  | 'canManageWebhooks'
  | 'canManageIntegrations';
```

### Basic Usage

```typescript
import { usePermissions } from '@/shared/hooks';

function SettingsPage() {
  const { hasPermission, hasMinRole, isAuthenticated } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h1>Settings</h1>

      {/* Permission-based sections */}
      {hasPermission('canManageUsers') && (
        <section>
          <h2>User Management</h2>
          <UserTable />
        </section>
      )}

      {hasPermission('canManageApiKeys') && (
        <section>
          <h2>API Keys</h2>
          <ApiKeyTable />
        </section>
      )}

      {/* Role-based sections */}
      {hasMinRole('OWNER') && (
        <section>
          <h2>Danger Zone</h2>
          <DeleteTenantButton />
        </section>
      )}
    </div>
  );
}
```

---

## Role Hierarchy

```
VIEWER < MEMBER < ADMIN < OWNER
```

### Role Permission Matrix

| Permission | VIEWER | MEMBER | ADMIN | OWNER |
|------------|--------|--------|-------|-------|
| `canCreateSession` | ❌ | ✅ | ✅ | ✅ |
| `canEditSession` | ❌ | ✅ | ✅ | ✅ |
| `canDeleteSession` | ❌ | ❌ | ✅ | ✅ |
| `canViewAllSessions` | ❌ | ❌ | ✅ | ✅ |
| `canManageUsers` | ❌ | ❌ | ✅ | ✅ |
| `canManageSettings` | ❌ | ❌ | ✅ | ✅ |
| `canViewAuditLogs` | ❌ | ❌ | ✅ | ✅ |
| `canManageApiKeys` | ❌ | ❌ | ❌ | ✅ |
| `canManageWebhooks` | ❌ | ❌ | ❌ | ✅ |
| `canManageIntegrations` | ❌ | ❌ | ❌ | ✅ |

### Implementation

```typescript
const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

const ROLE_PERMISSIONS: Record<UserRole, Record<Permission, boolean>> = {
  VIEWER: {
    canCreateSession: false,
    canEditSession: false,
    // ...
  },
  MEMBER: {
    canCreateSession: true,
    canEditSession: true,
    // ...
  },
  ADMIN: {
    canCreateSession: true,
    canEditSession: true,
    canDeleteSession: true,
    canManageUsers: true,
    // ...
  },
  OWNER: {
    // All permissions true
  },
};
```

---

## PermissionGate Component

```typescript
// ✅ CORRECT - Declarative permission gate
interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  minRole?: UserRole;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  minRole,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasMinRole } =
    usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (minRole) {
    hasAccess = hasAccess && hasMinRole(minRole);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage
<PermissionGate permission="canManageUsers">
  <UserManagementSection />
</PermissionGate>

<PermissionGate
  permissions={['canEditSession', 'canDeleteSession']}
  requireAll
  fallback={<ReadOnlyView />}
>
  <EditableView />
</PermissionGate>

<PermissionGate minRole="ADMIN">
  <AdminControls />
</PermissionGate>
```

---

## Protected Routes

```typescript
// ✅ CORRECT - Route-level permission check
interface ProtectedRouteProps {
  permission?: Permission;
  minRole?: UserRole;
  children: ReactNode;
}

export function ProtectedRoute({
  permission,
  minRole,
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasMinRole } = usePermissions();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (minRole && !hasMinRole(minRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Router configuration
const router = createBrowserRouter([
  {
    path: '/admin',
    element: (
      <ProtectedRoute minRole="ADMIN">
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/api-keys',
    element: (
      <ProtectedRoute permission="canManageApiKeys">
        <ApiKeysPage />
      </ProtectedRoute>
    ),
  },
]);
```

---

## Session Permissions (In-Session)

```typescript
// ✅ CORRECT - Session-specific permissions from roleConfig
// These come from PublicRoleConfig, not tenant role
interface RolePermissions {
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canShareScreen: boolean;
  canChat: boolean;
  canViewTranscript: boolean;
  canViewRecording: boolean;
  canEndSession: boolean;
  canMuteOthers: boolean;
  canRemoveParticipants: boolean;
}

// Access via useSessionConfig
const { roleConfig, isObserver, isFacilitator } = useSessionConfig();
const permissions = roleConfig?.permissions;

// Permission-based session controls
function SessionControls() {
  const { roleConfig } = useSessionConfig();
  const permissions = roleConfig?.permissions;

  return (
    <div>
      {permissions?.canPublishAudio && <MicToggle />}
      {permissions?.canPublishVideo && <CameraToggle />}
      {permissions?.canShareScreen && <ScreenShareButton />}
      {permissions?.canEndSession && <EndSessionButton />}
      {permissions?.canMuteOthers && <MuteAllButton />}
    </div>
  );
}
```

---

## Row-Level Actions

```typescript
// ✅ CORRECT - Permission-aware row actions
export function createSessionRowActions(
  handlers: SessionRowHandlers,
  permissions: PermissionsResult
): RowAction<Session>[] {
  return [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Pencil />,
      onClick: handlers.onEdit,
      // Hide if no permission
      hidden: !permissions.hasPermission('canEditSession'),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 />,
      variant: 'destructive',
      group: 'danger',
      onClick: handlers.onDelete,
      // Hide if no permission
      hidden: !permissions.hasPermission('canDeleteSession'),
    },
  ];
}

// Usage in component
function SessionsTable() {
  const permissions = usePermissions();

  const rowActions = useMemo(
    () => createSessionRowActions(handlers, permissions),
    [handlers, permissions]
  );

  return <DataTable rowActions={rowActions} ... />;
}
```

---

## Navigation Filtering

```typescript
// ✅ CORRECT - Filter nav items by permission
const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Sessions', path: '/sessions' },
  { label: 'Users', path: '/users', permission: 'canManageUsers' },
  { label: 'Settings', path: '/settings', minRole: 'ADMIN' },
  { label: 'API Keys', path: '/api-keys', permission: 'canManageApiKeys' },
];

function SidebarNav() {
  const { hasPermission, hasMinRole } = usePermissions();

  const visibleItems = navItems.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.minRole && !hasMinRole(item.minRole)) return false;
    return true;
  });

  return (
    <nav>
      {visibleItems.map((item) => (
        <NavLink key={item.path} to={item.path}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

---

## Server-Side Validation

```typescript
// ✅ CORRECT - Always validate on server too
// Frontend permissions are for UX, not security

// API endpoint
async function deleteSession(sessionId: string) {
  // Frontend already hides button if no permission
  // But ALWAYS validate on server
  const session = await db.session.findUnique({ where: { id: sessionId } });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Check user has permission (server-side)
  if (!hasPermission(currentUser, 'canDeleteSession')) {
    throw new ForbiddenError('Insufficient permissions');
  }

  await db.session.delete({ where: { id: sessionId } });
}
```

---

## Testing Permissions

```typescript
// ✅ CORRECT - Test permission-based rendering
describe('PermissionGate', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('shows content when user has permission', () => {
    setAuthenticated('ADMIN');

    render(
      <PermissionGate permission="canManageUsers">
        <div>Admin Content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('hides content when user lacks permission', () => {
    setAuthenticated('VIEWER');

    render(
      <PermissionGate permission="canManageUsers">
        <div>Admin Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('shows fallback when user lacks permission', () => {
    setAuthenticated('VIEWER');

    render(
      <PermissionGate
        permission="canManageUsers"
        fallback={<div>Access Denied</div>}
      >
        <div>Admin Content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
```

---

## Critical Rules

1. **Never hardcode role checks** - use `hasPermission()` or `hasMinRole()`
2. **Server validates too** - frontend permissions are for UX only
3. **Use PermissionGate** for declarative access control
4. **Protect routes** at router level with ProtectedRoute
5. **Filter navigation** based on permissions
6. **Hide disabled actions** - don't just disable, hide them
7. **Session vs Tenant permissions** - different sources, different purposes
8. **Test all permission scenarios** - each role should have tests

---

## Related Skills

- `domain-config-patterns` - Session-specific permissions
- `react-patterns` - Hook patterns
- `routing-patterns` - Protected routes
