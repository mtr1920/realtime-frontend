import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AuthState {
  // State - tokens only, no user data
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setToken: (token: string) => void;
  setTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  }) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Selectors (for convenience)
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  isTokenExpired: (bufferSeconds?: number) => boolean;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    immer(
      persist(
      (set, get) => ({
        // Initial state - tokens only
        token: null,
        refreshToken: null,
        expiresAt: null,
        isAuthenticated: false,
        isLoading: true,

        // Actions
        setToken: (token) =>
          set((state) => {
            state.token = token;
          }),

        setTokens: (tokens) =>
          set((state) => {
            state.token = tokens.accessToken;
            state.refreshToken = tokens.refreshToken;
            state.expiresAt = tokens.expiresAt;
            // Tokens present means authenticated (user will be fetched via TanStack Query)
            state.isAuthenticated = true;
            state.isLoading = false;
          }),

        setAuthenticated: (authenticated) =>
          set((state) => {
            state.isAuthenticated = authenticated;
          }),

        logout: () =>
          set((state) => {
            state.token = null;
            state.refreshToken = null;
            state.expiresAt = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        // Selectors
        getAccessToken: () => get().token,
        getRefreshToken: () => get().refreshToken,

        isTokenExpired: (bufferSeconds = 60) => {
          const { expiresAt } = get();
          if (!expiresAt) return true;

          const expiryTime = new Date(expiresAt).getTime();
          const now = Date.now();
          const bufferMs = bufferSeconds * 1000;

          return now >= expiryTime - bufferMs;
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          token: state.token,
          refreshToken: state.refreshToken,
          expiresAt: state.expiresAt,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state, error) => {
          // Handle ALL cases: success, no data, or error
          if (error) {
            console.error('Auth store hydration failed:', error);
          }

          // Token presence is sufficient for auth (user fetched via TanStack Query)
          const hasValidAuth = !!state?.token;

          // Defer setState to next microtask - store isn't fully assigned during callback
          queueMicrotask(() => {
            useAuthStore.setState({
              isAuthenticated: hasValidAuth,
              isLoading: false,
            });
          });
        },
      }
      )
    )
  )
);

/**
 * Hook to track hydration state using Zustand's built-in persist API.
 * This correctly handles all hydration scenarios without manual state tracking.
 */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    // If already hydrated, ensure state is set
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Subscribe to hydration completion
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  return hydrated;
}

/**
 * Helper to wait for hydration (useful for SSR or initial load).
 * Uses Zustand's built-in persist API for reliable hydration detection.
 */
export const waitForHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    if (useAuthStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
};
