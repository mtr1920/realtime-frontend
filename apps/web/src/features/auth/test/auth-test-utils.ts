/**
 * Auth Test Utilities
 * Shared helpers for auth testing.
 *
 * Note: Auth store is now token-only. User data is managed via TanStack Query.
 * These utilities help set up authenticated states for testing.
 */

import { vi } from 'vitest';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { User, UserRole } from '@/types';

/**
 * Default test user values.
 */
const DEFAULT_USER: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  tenantId: 'test-tenant-id',
  role: 'MEMBER',
};

/**
 * Create a mock user with optional overrides.
 */
export function createMockUser(
  role: UserRole = 'MEMBER',
  overrides: Partial<User> = {}
): User {
  return {
    ...DEFAULT_USER,
    role,
    ...overrides,
  };
}

/**
 * Set auth store state for testing.
 * Note: User is no longer stored in auth store, only tokens.
 */
export function setAuthState(state: {
  isAuthenticated?: boolean;
  isLoading?: boolean;
  token?: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
}): void {
  useAuthStore.setState({
    isAuthenticated: state.isAuthenticated ?? false,
    isLoading: state.isLoading ?? false,
    token: state.token ?? null,
    refreshToken: state.refreshToken ?? null,
    expiresAt: state.expiresAt ?? null,
  });
}

/**
 * Set authenticated state with tokens.
 * Returns a mock user for use in tests (not stored in auth store).
 */
export function setAuthenticated(
  role: UserRole = 'MEMBER',
  userOverrides: Partial<User> = {}
): User {
  const user = createMockUser(role, userOverrides);
  setAuthState({
    isAuthenticated: true,
    isLoading: false,
    token: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  });
  return user;
}

/**
 * Reset auth store to default unauthenticated state.
 */
export function resetAuthStore(): void {
  useAuthStore.setState({
    token: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

/**
 * Set loading state.
 */
export function setLoadingState(): void {
  useAuthStore.setState({
    token: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
    isLoading: true,
  });
}

/**
 * All available roles for iteration.
 */
export const ALL_ROLES: UserRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];

/**
 * Role hierarchy index (higher = more permissions).
 */
export const ROLE_HIERARCHY_INDEX: Record<UserRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

// =============================================================================
// useCurrentUser Mock Helpers
// =============================================================================

/**
 * Module-level mock state for useCurrentUser.
 * Used by vi.mock factory functions in test files.
 */
let mockCurrentUser: User | undefined = undefined;
let mockCurrentUserLoading = false;
let mockCurrentUserError: Error | null = null;

/**
 * Get the current mock user state.
 * Used by vi.mock factory function for useCurrentUser.
 *
 * @example
 * ```ts
 * vi.mock('@/shared/hooks/useCurrentUser', () => ({
 *   useCurrentUser: () => getMockCurrentUserState(),
 * }));
 * ```
 */
export function getMockCurrentUserState() {
  return {
    user: mockCurrentUser,
    isLoading: mockCurrentUserLoading,
    isError: mockCurrentUserError !== null,
    error: mockCurrentUserError,
    refetch: vi.fn().mockResolvedValue(undefined),
    invalidate: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Set mock user for tests.
 * Call this in your test to set up the user state before rendering.
 */
export function setMockCurrentUser(
  user: User | undefined,
  loading = false,
  error: Error | null = null
): void {
  mockCurrentUser = user;
  mockCurrentUserLoading = loading;
  mockCurrentUserError = error;
}

/**
 * Reset mock user state.
 * Call in beforeEach to ensure clean state between tests.
 */
export function resetMockCurrentUser(): void {
  mockCurrentUser = undefined;
  mockCurrentUserLoading = false;
  mockCurrentUserError = null;
}
