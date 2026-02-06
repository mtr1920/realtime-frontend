/**
 * Auth Store Tests
 *
 * Tests for token storage and authentication state.
 * Note: User data is now handled via TanStack Query (useCurrentUser),
 * so this store only manages tokens.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useAuthStore } from '@/shared/stores/auth.store';

// =============================================================================
// Test Setup
// =============================================================================

function resetStore() {
  useAuthStore.setState({
    token: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('Auth Store', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStore();
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have null token initially', () => {
      resetStore();
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
    });

    it('should have null refreshToken initially', () => {
      resetStore();
      const state = useAuthStore.getState();
      expect(state.refreshToken).toBeNull();
    });

    it('should not be authenticated initially', () => {
      resetStore();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  // ===========================================================================
  // setToken
  // ===========================================================================

  describe('setToken', () => {
    it('should store token correctly', () => {
      act(() => {
        useAuthStore.getState().setToken('test-access-token');
      });

      expect(useAuthStore.getState().token).toBe('test-access-token');
    });

    it('should not change authentication state when only setting token', () => {
      act(() => {
        useAuthStore.getState().setToken('test-access-token');
      });

      // setToken alone doesn't change authentication state
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // ===========================================================================
  // setTokens
  // ===========================================================================

  describe('setTokens', () => {
    const tokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    it('should store all tokens correctly', () => {
      act(() => {
        useAuthStore.getState().setTokens(tokens);
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-456');
      expect(state.expiresAt).toBe(tokens.expiresAt);
    });

    it('should set isAuthenticated to true when tokens are set', () => {
      act(() => {
        useAuthStore.getState().setTokens(tokens);
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should set isLoading to false when tokens are set', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
        useAuthStore.getState().setTokens(tokens);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // setAuthenticated
  // ===========================================================================

  describe('setAuthenticated', () => {
    it('should set isAuthenticated to true', () => {
      act(() => {
        useAuthStore.getState().setAuthenticated(true);
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false', () => {
      act(() => {
        useAuthStore.getState().setAuthenticated(true);
        useAuthStore.getState().setAuthenticated(false);
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // ===========================================================================
  // logout
  // ===========================================================================

  describe('logout', () => {
    beforeEach(() => {
      // Setup authenticated state
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      act(() => {
        useAuthStore.getState().setTokens(tokens);
      });
    });

    it('should clear all tokens', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.expiresAt).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should set isLoading to false', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // setLoading
  // ===========================================================================

  describe('setLoading', () => {
    it('should set loading to true', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
        useAuthStore.getState().setLoading(false);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // Selectors
  // ===========================================================================

  describe('selectors', () => {
    describe('getAccessToken', () => {
      it('should return access token when set', () => {
        act(() => {
          useAuthStore.getState().setToken('my-access-token');
        });

        expect(useAuthStore.getState().getAccessToken()).toBe('my-access-token');
      });

      it('should return null when not set', () => {
        expect(useAuthStore.getState().getAccessToken()).toBeNull();
      });
    });

    describe('getRefreshToken', () => {
      it('should return refresh token when set', () => {
        act(() => {
          useAuthStore.getState().setTokens({
            accessToken: 'access',
            refreshToken: 'my-refresh-token',
            expiresAt: new Date().toISOString(),
          });
        });

        expect(useAuthStore.getState().getRefreshToken()).toBe('my-refresh-token');
      });

      it('should return null when not set', () => {
        expect(useAuthStore.getState().getRefreshToken()).toBeNull();
      });
    });

    describe('isTokenExpired', () => {
      it('should return true when no expiresAt', () => {
        expect(useAuthStore.getState().isTokenExpired()).toBe(true);
      });

      it('should return false when token is valid', () => {
        const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

        act(() => {
          useAuthStore.getState().setTokens({
            accessToken: 'access',
            refreshToken: 'refresh',
            expiresAt: futureDate,
          });
        });

        expect(useAuthStore.getState().isTokenExpired()).toBe(false);
      });

      it('should return true when token is expired', () => {
        const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

        act(() => {
          useAuthStore.getState().setTokens({
            accessToken: 'access',
            refreshToken: 'refresh',
            expiresAt: pastDate,
          });
        });

        expect(useAuthStore.getState().isTokenExpired()).toBe(true);
      });

      it('should consider buffer time', () => {
        // Token expires in 30 seconds
        const expiresAt = new Date(Date.now() + 30000).toISOString();

        act(() => {
          useAuthStore.getState().setTokens({
            accessToken: 'access',
            refreshToken: 'refresh',
            expiresAt,
          });
        });

        // With default 60 second buffer, should be considered expired
        expect(useAuthStore.getState().isTokenExpired(60)).toBe(true);

        // With 10 second buffer, should still be valid
        expect(useAuthStore.getState().isTokenExpired(10)).toBe(false);
      });

      it('should use custom buffer seconds', () => {
        // Token expires in 2 minutes
        const expiresAt = new Date(Date.now() + 120000).toISOString();

        act(() => {
          useAuthStore.getState().setTokens({
            accessToken: 'access',
            refreshToken: 'refresh',
            expiresAt,
          });
        });

        // With 3 minute buffer, should be expired
        expect(useAuthStore.getState().isTokenExpired(180)).toBe(true);

        // With 1 minute buffer, should be valid
        expect(useAuthStore.getState().isTokenExpired(60)).toBe(false);
      });
    });
  });

  // ===========================================================================
  // State Transitions
  // ===========================================================================

  describe('state transitions', () => {
    it('should handle full login->logout cycle', () => {
      const tokens = {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      // Login (setTokens)
      act(() => {
        useAuthStore.getState().setTokens(tokens);
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('access');

      // Logout
      act(() => {
        useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('should handle token refresh', () => {
      // Initial tokens
      act(() => {
        useAuthStore.getState().setTokens({
          accessToken: 'old-access',
          refreshToken: 'old-refresh',
          expiresAt: new Date(Date.now() + 1000).toISOString(),
        });
      });

      // Refresh tokens
      const newExpiry = new Date(Date.now() + 3600000).toISOString();
      act(() => {
        useAuthStore.getState().setTokens({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresAt: newExpiry,
        });
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.expiresAt).toBe(newExpiry);
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
