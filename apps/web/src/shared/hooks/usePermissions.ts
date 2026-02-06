/**
 * usePermissions Hook
 *
 * Hook for checking user permissions based on role.
 * Located in shared/ because it's used by navigation components.
 * Gets user from useCurrentUser (TanStack Query) instead of Zustand.
 */

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useCurrentUser } from './useCurrentUser';
import { ROLE_HIERARCHY } from '@/types';
import type { UserRole, Permission } from '@/types';

/**
 * Permission to minimum role mapping.
 */
const permissionRoles: Record<Permission, UserRole> = {
  // Session permissions - most users can do basic session actions
  canViewSessions: 'VIEWER',
  canCreateSession: 'MEMBER',
  canStartSession: 'MEMBER',
  canJoinSession: 'VIEWER',
  canEndSession: 'MEMBER',
  canDeleteSession: 'ADMIN',

  // User management - higher roles only
  canViewUsers: 'MEMBER',
  canInviteUsers: 'ADMIN',
  canManageUsers: 'ADMIN',
  canRemoveUsers: 'ADMIN',

  // Workspace permissions
  canViewWorkspace: 'VIEWER',
  canEditWorkspace: 'ADMIN',
  canManageWorkspace: 'OWNER',
  canDeleteWorkspace: 'OWNER',

  // Recording permissions
  canViewRecordings: 'MEMBER',
  canDownloadRecordings: 'MEMBER',
  canDeleteRecordings: 'ADMIN',
  canViewOutcomes: 'MEMBER',
  canDownloadOutcomes: 'MEMBER',
  canManageOutcomes: 'ADMIN',
  canViewCompliance: 'ADMIN',

  // AI permissions
  canUseAI: 'MEMBER',
  canConfigureAI: 'ADMIN',

  // Admin permissions - admin and owner only
  canAccessAdmin: 'ADMIN',
  canViewAuditLogs: 'ADMIN',
  canManageDomainConfigs: 'ADMIN',
  canManageBilling: 'OWNER',
  canManageIntegrations: 'ADMIN',
};

interface UsePermissionsReturn {
  /**
   * Check if user has a specific permission.
   */
  hasPermission: (permission: Permission) => boolean;
  /**
   * Check if user has any of the specified permissions.
   */
  hasAnyPermission: (permissions: Permission[]) => boolean;
  /**
   * Check if user has all of the specified permissions.
   */
  hasAllPermissions: (permissions: Permission[]) => boolean;
  /**
   * Check if user has a specific role.
   */
  hasRole: (role: UserRole) => boolean;
  /**
   * Check if user has at least the specified role (considering hierarchy).
   */
  hasMinRole: (role: UserRole) => boolean;
  /**
   * Current user's role.
   */
  role: UserRole | null;
  /**
   * Whether the user is authenticated.
   */
  isAuthenticated: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useCurrentUser();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const role = user?.role ?? null;

  const getRoleIndex = useCallback((r: UserRole): number => {
    return ROLE_HIERARCHY.indexOf(r);
  }, []);

  const hasMinRole = useCallback(
    (minRole: UserRole): boolean => {
      if (!role) return false;
      return getRoleIndex(role) >= getRoleIndex(minRole);
    },
    [role, getRoleIndex]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!role) return false;
      const requiredRole = permissionRoles[permission];
      return hasMinRole(requiredRole);
    },
    [role, hasMinRole]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasRole = useCallback(
    (checkRole: UserRole): boolean => {
      return role === checkRole;
    },
    [role]
  );

  return useMemo(
    () => ({
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasMinRole,
      role,
      isAuthenticated,
    }),
    [
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasMinRole,
      role,
      isAuthenticated,
    ]
  );
}
