/**
 * usePermissions Hook Tests
 * Tests for permission checking based on user roles.
 *
 * Note: usePermissions now uses useCurrentUser which requires QueryClient.
 * We mock useCurrentUser to avoid needing full query infrastructure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePermissions } from '@/shared/hooks';
import {
  resetAuthStore,
  setAuthenticated,
  createMockUser,
  ALL_ROLES,
} from '@/features/auth/test/auth-test-utils';
import type { UserRole, User } from '@/types';

// Mock useCurrentUser to provide user data
let mockUser: User | undefined = undefined;
vi.mock('@/shared/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: mockUser,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    invalidate: vi.fn(),
  }),
}));

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('usePermissions', () => {
  beforeEach(() => {
    resetAuthStore();
    mockUser = undefined;
  });

  describe('role property', () => {
    it('returns null when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.role).toBeNull();
    });

    it.each(ALL_ROLES)('returns correct role for %s user', (role) => {
      mockUser = createMockUser(role);
      setAuthenticated(role);
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.role).toBe(role);
    });
  });

  describe('isAuthenticated property', () => {
    it('returns false when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('returns true when authenticated', () => {
      mockUser = createMockUser('MEMBER');
      setAuthenticated('MEMBER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('returns false when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.hasRole('MEMBER')).toBe(false);
    });

    it.each(ALL_ROLES)('returns true for exact %s role match', (role) => {
      mockUser = createMockUser(role);
      setAuthenticated(role);
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.hasRole(role)).toBe(true);
    });

    it('returns false for non-matching role', () => {
      mockUser = createMockUser('MEMBER');
      setAuthenticated('MEMBER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.hasRole('ADMIN')).toBe(false);
      expect(result.current.hasRole('OWNER')).toBe(false);
      expect(result.current.hasRole('VIEWER')).toBe(false);
    });
  });

  describe('hasMinRole', () => {
    it('returns false when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.hasMinRole('VIEWER')).toBe(false);
    });

    // Test role hierarchy: VIEWER < MEMBER < ADMIN < OWNER
    describe('role hierarchy', () => {
      it.each([
        // [userRole, minRole, expected]
        ['VIEWER', 'VIEWER', true],
        ['VIEWER', 'MEMBER', false],
        ['VIEWER', 'ADMIN', false],
        ['VIEWER', 'OWNER', false],
        ['MEMBER', 'VIEWER', true],
        ['MEMBER', 'MEMBER', true],
        ['MEMBER', 'ADMIN', false],
        ['MEMBER', 'OWNER', false],
        ['ADMIN', 'VIEWER', true],
        ['ADMIN', 'MEMBER', true],
        ['ADMIN', 'ADMIN', true],
        ['ADMIN', 'OWNER', false],
        ['OWNER', 'VIEWER', true],
        ['OWNER', 'MEMBER', true],
        ['OWNER', 'ADMIN', true],
        ['OWNER', 'OWNER', true],
      ] as [UserRole, UserRole, boolean][])(
        '%s user hasMinRole(%s) returns %s',
        (userRole, minRole, expected) => {
          mockUser = createMockUser(userRole);
          setAuthenticated(userRole);
          const { result } = renderHook(() => usePermissions(), {
            wrapper: createWrapper(),
          });
          expect(result.current.hasMinRole(minRole)).toBe(expected);
        }
      );
    });

    it('higher roles have access to all lower role requirements', () => {
      mockUser = createMockUser('OWNER');
      setAuthenticated('OWNER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      // OWNER should have min role for all roles
      expect(result.current.hasMinRole('VIEWER')).toBe(true);
      expect(result.current.hasMinRole('MEMBER')).toBe(true);
      expect(result.current.hasMinRole('ADMIN')).toBe(true);
      expect(result.current.hasMinRole('OWNER')).toBe(true);
    });

    it('lower roles do not have access to higher role requirements', () => {
      mockUser = createMockUser('VIEWER');
      setAuthenticated('VIEWER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasMinRole('VIEWER')).toBe(true);
      expect(result.current.hasMinRole('MEMBER')).toBe(false);
      expect(result.current.hasMinRole('ADMIN')).toBe(false);
      expect(result.current.hasMinRole('OWNER')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('returns false when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.hasPermission('canViewSessions')).toBe(false);
    });

    // VIEWER permissions
    describe('VIEWER role permissions', () => {
      beforeEach(() => {
        mockUser = createMockUser('VIEWER');
        setAuthenticated('VIEWER');
      });

      it('grants canViewSessions to VIEWER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canViewSessions')).toBe(true);
      });

      it('grants canJoinSession to VIEWER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canJoinSession')).toBe(true);
      });

      it('grants canViewWorkspace to VIEWER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canViewWorkspace')).toBe(true);
      });

      it('denies canCreateSession to VIEWER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canCreateSession')).toBe(false);
      });

      it('denies canUseAI to VIEWER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canUseAI')).toBe(false);
      });
    });

    // MEMBER permissions
    describe('MEMBER role permissions', () => {
      beforeEach(() => {
        mockUser = createMockUser('MEMBER');
        setAuthenticated('MEMBER');
      });

      it('grants canCreateSession to MEMBER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canCreateSession')).toBe(true);
      });

      it('grants canViewRecordings to MEMBER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canViewRecordings')).toBe(true);
      });

      it('grants canUseAI to MEMBER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canUseAI')).toBe(true);
      });

      it('denies canInviteUsers to MEMBER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canInviteUsers')).toBe(false);
      });

      it('denies canAccessAdmin to MEMBER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canAccessAdmin')).toBe(false);
      });
    });

    // ADMIN permissions
    describe('ADMIN role permissions', () => {
      beforeEach(() => {
        mockUser = createMockUser('ADMIN');
        setAuthenticated('ADMIN');
      });

      it('grants canInviteUsers to ADMIN', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canInviteUsers')).toBe(true);
      });

      it('grants canAccessAdmin to ADMIN', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canAccessAdmin')).toBe(true);
      });

      it('grants canConfigureAI to ADMIN', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canConfigureAI')).toBe(true);
      });

      it('denies canManageBilling to ADMIN', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canManageBilling')).toBe(false);
      });

      it('denies canManageWorkspace to ADMIN', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canManageWorkspace')).toBe(false);
      });
    });

    // OWNER permissions
    describe('OWNER role permissions', () => {
      beforeEach(() => {
        mockUser = createMockUser('OWNER');
        setAuthenticated('OWNER');
      });

      it('grants canManageBilling to OWNER only', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canManageBilling')).toBe(true);
      });

      it('grants canManageWorkspace to OWNER only', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canManageWorkspace')).toBe(true);
      });

      it('grants canDeleteWorkspace to OWNER only', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        expect(result.current.hasPermission('canDeleteWorkspace')).toBe(true);
      });

      it('grants all lower-tier permissions to OWNER', () => {
        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });
        // Viewer permissions
        expect(result.current.hasPermission('canViewSessions')).toBe(true);
        // Member permissions
        expect(result.current.hasPermission('canCreateSession')).toBe(true);
        expect(result.current.hasPermission('canUseAI')).toBe(true);
        // Admin permissions
        expect(result.current.hasPermission('canAccessAdmin')).toBe(true);
        expect(result.current.hasPermission('canInviteUsers')).toBe(true);
      });
    });
  });

  describe('hasAnyPermission', () => {
    it('returns false when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(
        result.current.hasAnyPermission(['canViewSessions', 'canCreateSession'])
      ).toBe(false);
    });

    it('returns true with partial match', () => {
      mockUser = createMockUser('VIEWER');
      setAuthenticated('VIEWER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      // VIEWER has canViewSessions but not canCreateSession
      expect(
        result.current.hasAnyPermission(['canViewSessions', 'canCreateSession'])
      ).toBe(true);
    });

    it('returns true when all permissions are granted', () => {
      mockUser = createMockUser('ADMIN');
      setAuthenticated('ADMIN');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(
        result.current.hasAnyPermission(['canViewSessions', 'canCreateSession'])
      ).toBe(true);
    });

    it('returns false when no permissions are granted', () => {
      mockUser = createMockUser('VIEWER');
      setAuthenticated('VIEWER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      // VIEWER has neither canManageBilling nor canAccessAdmin
      expect(
        result.current.hasAnyPermission(['canManageBilling', 'canAccessAdmin'])
      ).toBe(false);
    });

    it('returns false for empty permission array', () => {
      mockUser = createMockUser('OWNER');
      setAuthenticated('OWNER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.hasAnyPermission([])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns false when not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(
        result.current.hasAllPermissions(['canViewSessions', 'canCreateSession'])
      ).toBe(false);
    });

    it('returns false with partial match', () => {
      mockUser = createMockUser('VIEWER');
      setAuthenticated('VIEWER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      // VIEWER has canViewSessions but not canCreateSession
      expect(
        result.current.hasAllPermissions(['canViewSessions', 'canCreateSession'])
      ).toBe(false);
    });

    it('returns true when all permissions are granted', () => {
      mockUser = createMockUser('ADMIN');
      setAuthenticated('ADMIN');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      // ADMIN has both
      expect(
        result.current.hasAllPermissions(['canViewSessions', 'canCreateSession'])
      ).toBe(true);
    });

    it('returns true for single permission that is granted', () => {
      mockUser = createMockUser('VIEWER');
      setAuthenticated('VIEWER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.hasAllPermissions(['canViewSessions'])).toBe(true);
    });

    it('returns true for empty permission array', () => {
      mockUser = createMockUser('VIEWER');
      setAuthenticated('VIEWER');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      expect(result.current.hasAllPermissions([])).toBe(true);
    });

    it('returns false when any permission is denied', () => {
      mockUser = createMockUser('ADMIN');
      setAuthenticated('ADMIN');
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });
      // ADMIN has canAccessAdmin but not canManageBilling
      expect(
        result.current.hasAllPermissions(['canAccessAdmin', 'canManageBilling'])
      ).toBe(false);
    });
  });

  describe('stability', () => {
    it('returns memoized object with stable references', () => {
      mockUser = createMockUser('MEMBER');
      setAuthenticated('MEMBER');
      const { result, rerender } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      });

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // Object identity should be preserved when state hasn't changed
      expect(firstResult.hasPermission).toBe(secondResult.hasPermission);
      expect(firstResult.hasRole).toBe(secondResult.hasRole);
      expect(firstResult.hasMinRole).toBe(secondResult.hasMinRole);
    });
  });
});
