/**
 * Auth Service
 * Handles authentication API calls and token management.
 */

import { apiClient, ApiError } from '@/shared/services/api-client';
import type {
  UserRole,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  CurrentUserResponse,
  SessionJoinResponse,
} from '@/types';

export type {
  UserRole,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  CurrentUserResponse,
  SessionJoinResponse,
};

// =============================================================================
// Auth Service Class
// =============================================================================

class AuthService {
  private readonly basePath = '/v1/auth';

  /**
   * Login with email, password, and tenant ID.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(`${this.basePath}/login`, credentials, {
      skipAuth: true,
    });
  }

  /**
   * Logout the current user.
   */
  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }
    await apiClient.post<void>(`${this.basePath}/logout`, { refreshToken });
  }

  /**
   * Refresh access token using refresh token.
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    return apiClient.post<RefreshResponse>(
      `${this.basePath}/refresh`,
      { refreshToken },
      { skipAuth: true }
    );
  }

  /**
   * Get current authenticated user info.
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    return apiClient.get<CurrentUserResponse>(`${this.basePath}/me`);
  }

  /**
   * Request password reset email.
   */
  async forgotPassword(email: string, tenantId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.basePath}/forgot-password`,
      { email, tenantId },
      { skipAuth: true }
    );
  }

  /**
   * Reset password with token.
   */
  async resetPassword(
    token: string,
    password: string
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.basePath}/reset-password`,
      { token, newPassword: password },
      { skipAuth: true }
    );
  }

  // =============================================================================
  // SSO Methods
  // =============================================================================

  /**
   * Build the SSO login URL for direct browser redirect.
   *
   * The backend uses redirect-based OAuth (standard flow):
   * 1. Browser redirects to: /api/v1/sso/{tenantSlug}/login/{providerId}
   * 2. Backend returns HTTP 302 to OAuth provider
   * 3. OAuth provider redirects to backend callback
   * 4. Backend redirects to frontend with tokens in query params
   *
   * @param provider - OAuth provider ID (e.g., 'google', 'okta')
   * @param tenantSlug - Tenant identifier (slug, not ID)
   * @param redirectUri - Frontend callback URL
   * @returns Full URL to redirect the browser to
   */
  buildSSOLoginUrl(
    provider: string,
    tenantSlug: string,
    redirectUri: string
  ): string {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const params = new URLSearchParams({ redirect_uri: redirectUri });
    return `${apiBase}/v1/sso/${tenantSlug}/login/${provider}?${params.toString()}`;
  }

  /**
   * Initiate SSO login by redirecting to backend SSO endpoint.
   * This method performs the redirect directly.
   *
   * @param provider - OAuth provider ID
   * @param tenantSlug - Tenant identifier (slug)
   * @param redirectUri - Frontend callback URL (optional, defaults to current origin + /sso/callback)
   */
  initiateSSO(
    provider: string,
    tenantSlug: string,
    redirectUri?: string
  ): void {
    const callbackUrl = redirectUri || `${window.location.origin}/sso/callback`;
    const ssoUrl = this.buildSSOLoginUrl(provider, tenantSlug, callbackUrl);
    window.location.href = ssoUrl;
  }

  /**
   * Parse tokens from SSO callback URL query parameters.
   * Backend redirects to frontend with tokens in URL after successful OAuth.
   *
   * Expected query params from backend:
   * - access_token: JWT access token
   * - refresh_token: Refresh token
   * - expires_at: Token expiration timestamp (ISO 8601)
   * - is_new_user: Whether this is a new user registration (optional)
   * - user_id: User ID (optional)
   * - email: User email (optional)
   * - name: User display name (optional)
   * - tenant_id: Tenant ID (optional)
   * - role: User role (optional)
   *
   * @param searchParams - URL search params from callback
   * @returns Parsed login response or null if tokens missing
   */
  parseSSOCallbackParams(searchParams: URLSearchParams): LoginResponse | null {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const expiresAt = searchParams.get('expires_at');

    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: searchParams.get('user_id') || '',
        email: searchParams.get('email') || '',
        name: searchParams.get('name') || null,
        tenantId: searchParams.get('tenant_id') || '',
        role: (searchParams.get('role') as UserRole) || 'VIEWER',
      },
    };
  }

  // =============================================================================
  // Realtime Token
  // =============================================================================

  /**
   * Request a realtime token for WebSocket connection.
   * Called when joining a session to get authenticated WebSocket access.
   *
   * Note: The backend identifies the session via accessToken in the body,
   * not via a path parameter. The sessionId param is kept for caller convenience
   * (logging, error messages) but is not sent to the server.
   *
   * @param _sessionId - Session ID (for caller reference only, not sent to backend)
   * @param sessionAccessToken - Session access token (from invite link or created session)
   * @param roleId - Role ID the user is joining as
   * @param displayName - Display name shown to other participants
   * @param userId - Optional authenticated user ID (for logged-in users)
   * @returns Session join response including realtime token and WebSocket endpoint
   */
  async requestRealtimeToken(
    _sessionId: string,
    sessionAccessToken: string,
    roleId: string,
    displayName: string,
    userId?: string
  ): Promise<SessionJoinResponse> {
    const response = await apiClient.post<{ join: SessionJoinResponse }>(
      '/v1/sessions/join',
      {
        accessToken: sessionAccessToken,
        roleId,
        displayName,
        userId,
      }
    );
    return response.join;
  }

  // =============================================================================
  // Token Utilities
  // =============================================================================

  /**
   * Check if a token is expired or will expire within buffer seconds.
   * @param expiresAt - ISO datetime string of token expiry
   * @param bufferSeconds - Seconds before actual expiry to consider expired (default: 60)
   */
  isTokenExpired(expiresAt: string, bufferSeconds = 60): boolean {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const bufferMs = bufferSeconds * 1000;

    return now >= expiryTime - bufferMs;
  }

  /**
   * Extract tenant ID from subdomain.
   * For production: acme.app.com → 'acme'
   * For local dev: Falls back to VITE_DEFAULT_TENANT env variable.
   */
  getTenantFromSubdomain(): string | null {
    const hostname = window.location.hostname;

    // Skip extraction for localhost and IP addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
    ) {
      const tenant = import.meta.env.VITE_DEFAULT_TENANT;
      return typeof tenant === 'string' && tenant.length > 0 ? tenant : null;
    }

    // Extract subdomain (first part before the domain)
    const parts = hostname.split('.');

    // Need at least 3 parts: subdomain.domain.tld
    if (parts.length >= 3) {
      const subdomain = parts[0]!; // Safe: length check ensures existence
      // Exclude common non-tenant subdomains
      if (subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'api') {
        return subdomain;
      }
    }

    // Fallback to env variable
    const tenant = import.meta.env.VITE_DEFAULT_TENANT;
    return typeof tenant === 'string' && tenant.length > 0 ? tenant : null;
  }

  /**
   * Validate login credentials before sending.
   * Returns error messages or null if valid.
   */
  validateCredentials(credentials: Partial<LoginCredentials>): {
    email?: string;
    password?: string;
    tenantId?: string;
  } | null {
    const errors: { email?: string; password?: string; tenantId?: string } = {};

    if (!credentials.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = 'Invalid email format';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    }

    if (!credentials.tenantId) {
      errors.tenantId = 'Tenant is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }
}

// Export singleton instance
export const authService = new AuthService();

// Re-export ApiError for convenience
export { ApiError };
