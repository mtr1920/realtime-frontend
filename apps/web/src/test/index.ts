/**
 * Test Utilities
 *
 * Main entry point for all test utilities, mocks, and factories.
 *
 * @example
 * ```ts
 * import {
 *   renderWithProviders,
 *   createMockSession,
 *   installMockWebSocket,
 *   getMockWebSocketInstance,
 * } from '@/test';
 * ```
 */

// Core test utilities
export {
  renderWithProviders,
  createTestQueryClient,
  setQueryData,
  getQueryState,
  flushPromises,
  advanceTimersAndFlush,
  renderHook,
  waitFor,
  waitForElementToBeRemoved,
  screen,
  within,
  act,
  vi,
} from './test-utils';

// Re-export all factories
export * from './factories';

// Re-export all mocks
export * from './mocks';

// Auth test utilities (from features/auth/test)
export {
  createMockUser,
  setAuthState,
  setAuthenticated,
  resetAuthStore,
  setLoadingState,
  ALL_ROLES,
  ROLE_HIERARCHY_INDEX,
  getMockCurrentUserState,
  setMockCurrentUser,
  resetMockCurrentUser,
} from '@/features/auth/test/auth-test-utils';
