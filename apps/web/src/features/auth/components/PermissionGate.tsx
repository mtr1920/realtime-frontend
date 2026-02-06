/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions.
 */

import { type ReactNode } from 'react';
import { usePermissions } from '@/shared/hooks';
import type { Permission, UserRole } from '@/types';

interface PermissionGateBaseProps {
  children: ReactNode;
  /**
   * Content to render if permission check fails.
   */
  fallback?: ReactNode;
}

interface PermissionGateWithPermission extends PermissionGateBaseProps {
  /**
   * Required permission.
   */
  permission: Permission;
  permissions?: never;
  anyOf?: never;
  role?: never;
  minRole?: never;
}

interface PermissionGateWithPermissions extends PermissionGateBaseProps {
  /**
   * Required permissions (all must be present).
   */
  permissions: Permission[];
  permission?: never;
  anyOf?: never;
  role?: never;
  minRole?: never;
}

interface PermissionGateWithAnyOf extends PermissionGateBaseProps {
  /**
   * Required permissions (any one must be present).
   */
  anyOf: Permission[];
  permission?: never;
  permissions?: never;
  role?: never;
  minRole?: never;
}

interface PermissionGateWithRole extends PermissionGateBaseProps {
  /**
   * Required exact role.
   */
  role: UserRole;
  permission?: never;
  permissions?: never;
  anyOf?: never;
  minRole?: never;
}

interface PermissionGateWithMinRole extends PermissionGateBaseProps {
  /**
   * Required minimum role (considering hierarchy).
   */
  minRole: UserRole;
  permission?: never;
  permissions?: never;
  anyOf?: never;
  role?: never;
}

type PermissionGateProps =
  | PermissionGateWithPermission
  | PermissionGateWithPermissions
  | PermissionGateWithAnyOf
  | PermissionGateWithRole
  | PermissionGateWithMinRole;

export function PermissionGate(props: PermissionGateProps) {
  const {
    children,
    fallback = null,
    permission,
    permissions,
    anyOf,
    role,
    minRole,
  } = props as PermissionGateBaseProps & {
    permission?: Permission;
    permissions?: Permission[];
    anyOf?: Permission[];
    role?: UserRole;
    minRole?: UserRole;
  };

  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasMinRole,
  } = usePermissions();

  // Check based on prop type
  let isAllowed = false;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (permissions) {
    isAllowed = hasAllPermissions(permissions);
  } else if (anyOf) {
    isAllowed = hasAnyPermission(anyOf);
  } else if (role) {
    isAllowed = hasRole(role);
  } else if (minRole) {
    isAllowed = hasMinRole(minRole);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
