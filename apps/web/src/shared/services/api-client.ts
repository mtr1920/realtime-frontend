/**
 * API Client for making HTTP requests
 * Handles authentication, error handling, and request/response interceptors
 */

import { getAuthAdapter } from './auth-adapter';

/**
 * ApiError class with duck-typing support.
 * Uses `_tag` for reliable type identification across module boundaries.
 */
export class ApiError extends Error {
  readonly _tag = 'ApiError' as const;

  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
    /** Request ID from server for tracing/debugging */
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  /** Internal: tracks retry attempts to prevent infinite loops */
  _retryCount?: number;
}

/** Max retries for 401 responses to prevent infinite refresh loops */
const MAX_AUTH_RETRIES = 5;

interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokenRefresh?: (
    accessToken: string,
    refreshToken: string,
    expiresAt: string
  ) => void;
  onUnauthorized?: () => void;
  isTokenExpired?: () => boolean;
}

/**
 * API response metadata (for tracing/debugging)
 */
interface ApiMeta {
  requestId?: string;
  timestamp?: string;
}

interface ApiEnvelope {
  success: boolean;
  data?: unknown;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  meta?: ApiMeta;
}

interface ApiErrorDetails {
  message: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

function parseApiEnvelope(payload: unknown): ApiEnvelope | null {
  if (!payload || typeof payload !== 'object' || !('success' in payload)) {
    return null;
  }

  const envelope = payload as ApiEnvelope;
  if (typeof envelope.success !== 'boolean') {
    return null;
  }

  return envelope;
}

function extractApiError(payload: unknown, status: number): ApiErrorDetails {
  const envelope = parseApiEnvelope(payload);
  const requestId = envelope?.meta?.requestId;

  if (envelope?.error) {
    return {
      message: envelope.error.message || `Request failed with status ${status}`,
      code: envelope.error.code,
      details: envelope.error.details,
      requestId,
    };
  }

  if (payload && typeof payload === 'object') {
    const maybe = payload as {
      message?: string;
      code?: string;
      details?: unknown;
      error?: {
        message?: string;
        code?: string;
        details?: unknown;
      };
    };

    if (maybe.error) {
      return {
        message: maybe.error.message || `Request failed with status ${status}`,
        code: maybe.error.code,
        details: maybe.error.details,
        requestId,
      };
    }

    if (maybe.message || maybe.code || maybe.details) {
      return {
        message: maybe.message || `Request failed with status ${status}`,
        code: maybe.code,
        details: maybe.details,
        requestId,
      };
    }
  }

  return { message: `Request failed with status ${status}`, requestId };
}

// Token refresh state to prevent multiple concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

class ApiClient {
  private config: ApiClientConfig;
  private requestInterceptors: Array<
    (config: RequestInit) => RequestInit | Promise<RequestInit>
  > = [];
  private responseInterceptors: Array<
    (response: Response) => Response | Promise<Response>
  > = [];

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(
    interceptor: (config: RequestInit) => RequestInit | Promise<RequestInit>
  ) {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(
    interceptor: (response: Response) => Response | Promise<Response>
  ) {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Build URL with query parameters
   * Properly concatenates baseUrl and path (handles trailing/leading slashes)
   */
  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    // Remove trailing slash from baseUrl and leading slash from path, then join
    const baseUrl = this.config.baseUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    const fullUrl = `${baseUrl}/${cleanPath}`;

    const url = new URL(fullUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Attempt to refresh the access token
   */
  private async tryRefreshToken(): Promise<boolean> {
    // If already refreshing, wait for the existing refresh attempt
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    const refreshToken = this.config.getRefreshToken?.();
    if (!refreshToken) {
      return false;
    }

    isRefreshing = true;
    refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      return await refreshPromise;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(refreshToken: string): Promise<boolean> {
    try {
      const url = this.buildUrl('/v1/auth/refresh');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const payload = (await response.json()) as unknown;
      const envelope = parseApiEnvelope(payload);
      const data = (envelope?.success ? envelope.data : payload) as {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: string;
      };

      if (!data.accessToken || !data.refreshToken || !data.expiresAt) {
        return false;
      }

      // Update tokens via callback
      this.config.onTokenRefresh?.(
        data.accessToken,
        data.refreshToken,
        data.expiresAt
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Make a request
   */
  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, skipAuth, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);

    // Proactively refresh token if expired (unless skipping auth)
    if (!skipAuth && this.config.isTokenExpired?.()) {
      const refreshed = await this.tryRefreshToken();
      if (!refreshed) {
        this.config.onUnauthorized?.();
        throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
      }
    }

    // Build initial config
    let config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    };

    // Add auth token if available and not skipping auth
    if (!skipAuth) {
      const token = this.config.getAuthToken?.();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    // Make request
    let response = await fetch(url, config);

    // Run response interceptors
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    // Handle errors
    let responseBody: unknown = undefined;
    if (response.status !== 204) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = undefined;
      }
    }

    if (!response.ok) {
      // Handle 401 with token refresh retry (with retry limit to prevent infinite loops)
      const retryCount = options._retryCount ?? 0;
      if (response.status === 401 && !skipAuth && retryCount < MAX_AUTH_RETRIES) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the request with new token, incrementing retry count
          return this.request<T>(method, path, {
            ...options,
            _retryCount: retryCount + 1,
          });
        }
        this.config.onUnauthorized?.();
      } else if (response.status === 401 && !skipAuth) {
        // Max retries exceeded - force logout
        this.config.onUnauthorized?.();
      }

      const errorDetails = extractApiError(responseBody, response.status);
      throw new ApiError(
        errorDetails.message,
        response.status,
        errorDetails.code,
        errorDetails.details,
        errorDetails.requestId
      );
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const envelope = parseApiEnvelope(responseBody);
    if (envelope) {
      if (envelope.success) {
        return envelope.data as T;
      }

      const errorDetails = extractApiError(responseBody, response.status);
      throw new ApiError(
        errorDetails.message,
        response.status,
        errorDetails.code,
        errorDetails.details,
        errorDetails.requestId
      );
    }

    return responseBody as T;
  }

  /**
   * GET request
   */
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  /**
   * POST request
   */
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  /**
   * GET request that returns a Blob (for file downloads).
   * Includes authentication headers.
   */
  async getBlob(path: string, options?: RequestOptions): Promise<Blob> {
    const { params, skipAuth, _retryCount = 0 } = options ?? {};
    const url = this.buildUrl(path, params);

    // Proactively refresh token if expired (unless skipping auth)
    if (!skipAuth && this.config.isTokenExpired?.()) {
      const refreshed = await this.tryRefreshToken();
      if (!refreshed) {
        this.config.onUnauthorized?.();
        throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
      }
    }

    const headers: Record<string, string> = {};

    if (!skipAuth) {
      const token = this.config.getAuthToken?.();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      // Handle 401 with token refresh retry (with retry limit)
      if (response.status === 401 && !skipAuth && _retryCount < MAX_AUTH_RETRIES) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return this.getBlob(path, { ...options, _retryCount: _retryCount + 1 });
        }
        this.config.onUnauthorized?.();
      } else if (response.status === 401 && !skipAuth) {
        this.config.onUnauthorized?.();
      }
      throw new ApiError(`Request failed`, response.status);
    }

    return response.blob();
  }

  /**
   * POST request that returns a Blob (for file exports).
   * Includes authentication headers.
   */
  async postBlob(path: string, body: unknown, options?: RequestOptions): Promise<Blob> {
    const { params, skipAuth, _retryCount = 0 } = options ?? {};
    const url = this.buildUrl(path, params);

    // Proactively refresh token if expired (unless skipping auth)
    if (!skipAuth && this.config.isTokenExpired?.()) {
      const refreshed = await this.tryRefreshToken();
      if (!refreshed) {
        this.config.onUnauthorized?.();
        throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = this.config.getAuthToken?.();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Handle 401 with token refresh retry (with retry limit)
      if (response.status === 401 && !skipAuth && _retryCount < MAX_AUTH_RETRIES) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return this.postBlob(path, body, { ...options, _retryCount: _retryCount + 1 });
        }
        this.config.onUnauthorized?.();
      } else if (response.status === 401 && !skipAuth) {
        this.config.onUnauthorized?.();
      }
      throw new ApiError(`Request failed`, response.status);
    }

    return response.blob();
  }
}

// Create singleton instance using auth adapter
export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',

  getAuthToken: () => {
    return getAuthAdapter().getAccessToken();
  },

  getRefreshToken: () => {
    return getAuthAdapter().getRefreshToken();
  },

  onTokenRefresh: (accessToken, refreshToken, expiresAt) => {
    getAuthAdapter().setTokens({
      accessToken,
      refreshToken,
      expiresAt,
    });
  },

  onUnauthorized: () => {
    // Just logout - let React Router/ProtectedRoute handle the redirect
    // This prevents double redirects and maintains proper routing state
    getAuthAdapter().logout();
  },

  isTokenExpired: () => {
    return getAuthAdapter().isTokenExpired(300); // 5 minute buffer for proactive refresh
  },
});
