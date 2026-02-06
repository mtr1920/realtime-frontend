/**
 * PermissionGate Component Tests
 * Tests for conditional rendering based on user permissions.
 *
 * Note: PermissionGate uses usePermissions which uses useCurrentUser.
 * We mock useCurrentUser to avoid needing full query infrastructure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import {
  resetAuthStore,
  setAuthenticated,
  createMockUser,
  getMockCurrentUserState,
  setMockCurrentUser,
  resetMockCurrentUser,
} from '@/features/auth/test/auth-test-utils';

// Mock useCurrentUser using centralized helper
vi.mock('@/shared/hooks/useCurrentUser', () => ({
  useCurrentUser: () => getMockCurrentUserState(),
}));

describe('PermissionGate', () => {
  beforeEach(() => {
    resetAuthStore();
    resetMockCurrentUser();
  });

  describe('single permission (permission prop)', () => {
    it('renders children when user has required permission', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      render(
        <PermissionGate permission="canViewSessions">
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders fallback when user lacks permission', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      render(
        <PermissionGate
          permission="canCreateSession"
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('renders null by default when permission denied', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      const { container } = render(
        <PermissionGate permission="canCreateSession">
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });

    it('renders children when higher role has the permission', () => {
      setMockCurrentUser(createMockUser('ADMIN'));
      setAuthenticated('ADMIN');
      render(
        <PermissionGate permission="canViewSessions">
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });

  describe('all permissions (permissions prop)', () => {
    it('renders children when user has all permissions', () => {
      setMockCurrentUser(createMockUser('ADMIN'));
      setAuthenticated('ADMIN');
      render(
        <PermissionGate permissions={['canViewSessions', 'canCreateSession']}>
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders fallback when user lacks any permission', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      render(
        <PermissionGate
          permissions={['canViewSessions', 'canCreateSession']}
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      // VIEWER has canViewSessions but not canCreateSession
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('renders children for empty permissions array', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      render(
        <PermissionGate permissions={[]}>
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      // Empty array means no permissions required - should render
      // Note: This depends on the hasAllPermissions returning true for empty array
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });

  describe('any permission (anyOf prop)', () => {
    it('renders children when user has at least one of anyOf permissions', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      render(
        <PermissionGate anyOf={['canViewSessions', 'canCreateSession']}>
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      // VIEWER has canViewSessions but not canCreateSession
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders children when user has all anyOf permissions', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      render(
        <PermissionGate anyOf={['canViewSessions', 'canCreateSession']}>
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders fallback when user has none of anyOf permissions', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      render(
        <PermissionGate
          anyOf={['canManageBilling', 'canAccessAdmin']}
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('exact role (role prop)', () => {
    it('renders children for exact role match only', () => {
      setMockCurrentUser(createMockUser('ADMIN'));
      setAuthenticated('ADMIN');
      render(
        <PermissionGate role="ADMIN">
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders fallback for non-matching role', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      render(
        <PermissionGate
          role="ADMIN"
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('renders fallback even for higher role (exact match required)', () => {
      setMockCurrentUser(createMockUser('OWNER'));
      setAuthenticated('OWNER');
      render(
        <PermissionGate
          role="ADMIN"
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      // OWNER is higher than ADMIN but exact match is required
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('minimum role (minRole prop)', () => {
    it('renders children when user meets minRole', () => {
      setMockCurrentUser(createMockUser('ADMIN'));
      setAuthenticated('ADMIN');
      render(
        <PermissionGate minRole="MEMBER">
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders children when user exactly matches minRole', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      render(
        <PermissionGate minRole="MEMBER">
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders fallback when user is below minRole', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      render(
        <PermissionGate
          minRole="MEMBER"
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('renders children for OWNER when minRole is VIEWER', () => {
      setMockCurrentUser(createMockUser('OWNER'));
      setAuthenticated('OWNER');
      render(
        <PermissionGate minRole="VIEWER">
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });

  describe('unauthenticated user', () => {
    it('renders fallback for unauthenticated user with permission check', () => {
      // User is not authenticated (resetAuthStore was called)
      render(
        <PermissionGate
          permission="canViewSessions"
          fallback={<div data-testid="fallback">Please log in</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('renders fallback for unauthenticated user with role check', () => {
      render(
        <PermissionGate
          role="MEMBER"
          fallback={<div data-testid="fallback">Please log in</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('renders fallback for unauthenticated user with minRole check', () => {
      render(
        <PermissionGate
          minRole="VIEWER"
          fallback={<div data-testid="fallback">Please log in</div>}
        >
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('fallback behavior', () => {
    it('renders custom fallback component', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      const CustomFallback = () => (
        <div data-testid="custom-fallback">
          <span>Custom Access Denied</span>
          <button>Request Access</button>
        </div>
      );

      render(
        <PermissionGate permission="canManageBilling" fallback={<CustomFallback />}>
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );

      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Request Access' })).toBeInTheDocument();
    });

    it('renders string fallback', () => {
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');
      render(
        <PermissionGate permission="canManageBilling" fallback="Access Denied">
          <div data-testid="protected">Protected Content</div>
        </PermissionGate>
      );
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });
});
