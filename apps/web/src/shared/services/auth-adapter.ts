/**
 * Auth Adapter Interface
 * Decouples api-client from the auth store implementation.
 * This allows shared/services to remain independent of features/auth.
 */

export interface AuthAdapter {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  }) => void;
  logout: () => void;
  isTokenExpired: (bufferSeconds?: number) => boolean;
}

// Default no-op adapter for when auth is not configured
const noOpAdapter: AuthAdapter = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  setTokens: () => {},
  logout: () => {},
  isTokenExpired: () => true,
};

// Singleton adapter that can be configured at runtime
let currentAdapter: AuthAdapter = noOpAdapter;

/**
 * Configure the auth adapter.
 * Should be called during app initialization (in AuthProvider).
 */
export function configureAuthAdapter(adapter: AuthAdapter): void {
  currentAdapter = adapter;
}

/**
 * Get the configured auth adapter.
 */
export function getAuthAdapter(): AuthAdapter {
  return currentAdapter;
}
