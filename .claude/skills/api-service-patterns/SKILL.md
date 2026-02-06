---
name: api-service-patterns
description: Use when creating API services, making HTTP requests, or handling API errors
---

# API Service Patterns

Service layer patterns for REST API communication.

## Overview

This skill covers the apiClient, service class patterns, error handling, and authentication flows.

---

## apiClient Architecture

```typescript
// shared/services/api-client.ts
import { ApiError } from '@/shared/errors';
import { useAuthStore } from '@/shared/stores/auth.store';

interface RequestOptions {
  params?: Record<string, unknown>;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    method: string,
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, skipAuth = false, signal } = options;

    // Build URL with params
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // Make request
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });

    // Handle response
    if (!response.ok) {
      const error = await this.parseError(response);
      throw error;
    }

    // Handle empty responses
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Convenience methods
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, data, options);
  }

  put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, data, options);
  }

  patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, data, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const data = await response.json();
      return new ApiError(
        data.message || response.statusText,
        response.status,
        data.code,
        data.details,
        response.headers.get('x-request-id') ?? undefined
      );
    } catch {
      return new ApiError(response.statusText, response.status);
    }
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_URL);
```

---

## Service Class Pattern

```typescript
// ✅ CORRECT - Service class with typed methods
// features/sessions/api/sessions.service.ts
import { apiClient, ApiError } from '@/shared/services/api-client';
import type {
  Session,
  CreateSessionInput,
  UpdateSessionInput,
  SessionFilters,
} from '@/types';

class SessionService {
  private readonly basePath = '/v1/sessions';

  async create(input: CreateSessionInput): Promise<Session> {
    return apiClient.post<Session>(this.basePath, input);
  }

  async list(filters?: SessionFilters): Promise<Session[]> {
    return apiClient.get<Session[]>(this.basePath, { params: filters });
  }

  async getOne(id: string): Promise<Session> {
    return apiClient.get<Session>(`${this.basePath}/${id}`);
  }

  async update(id: string, updates: UpdateSessionInput): Promise<Session> {
    return apiClient.put<Session>(`${this.basePath}/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  // Domain-specific methods
  async start(id: string): Promise<Session> {
    return apiClient.post<Session>(`${this.basePath}/${id}/start`);
  }

  async end(id: string): Promise<Session> {
    return apiClient.post<Session>(`${this.basePath}/${id}/end`);
  }

  // Public endpoint - joins session with access token
  // Sessions can be joined when status is CREATED, WAITING, or ACTIVE
  async join(params: JoinSessionParams): Promise<JoinResponse> {
    return apiClient.post<{ join: JoinResponse }>(
      `${this.basePath}/join`,
      params,
      { skipAuth: true }
    ).then(res => res.join);
  }

  // Get invite info (requires auth) - returns access token and available roles
  async getInviteInfo(id: string): Promise<InviteInfoResponse> {
    return apiClient.get<InviteInfoResponse>(
      `${this.basePath}/${id}/invite-info`
    );
  }

  // Exchange invite code for access token (public)
  async exchangeCode(code: string): Promise<ExchangeCodeResponse> {
    return apiClient.post<ExchangeCodeResponse>(
      `${this.basePath}/exchange-code`,
      { code },
      { skipAuth: true }
    );
  }
}

// Join types
interface JoinSessionParams {
  accessToken: string;
  roleId: string;
  displayName: string;
  userId?: string;
}

interface JoinResponse {
  sessionId: string;
  participantId: string;
  realtimeToken: string;
  expiresAt: string;
  wsEndpoint: string;
}

interface InviteInfoResponse {
  accessToken: string;
  roles: Array<{ id: string; name: string; isObserver: boolean }>;
}

interface ExchangeCodeResponse {
  accessToken: string;
  roleId: string;
  sessionId: string;
  requiresAuth: boolean;
}

// Singleton export
export const sessionService = new SessionService();

// Re-export for convenience
export { ApiError };
export type { Session, CreateSessionInput };
```

---

## Auth Service Special Pattern

```typescript
// ✅ CORRECT - Auth service with skipAuth for login
class AuthService {
  private readonly basePath = '/v1/auth';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Login doesn't need auth token
    return apiClient.post<LoginResponse>(
      `${this.basePath}/login`,
      credentials,
      { skipAuth: true }
    );
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Refresh uses the refresh token, not access token
    return apiClient.post<TokenResponse>(
      `${this.basePath}/refresh`,
      { refreshToken },
      { skipAuth: true }
    );
  }

  async logout(): Promise<void> {
    return apiClient.post<void>(`${this.basePath}/logout`);
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(`${this.basePath}/me`);
  }

  async ssoLogin(provider: string, code: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(
      `${this.basePath}/sso/${provider}`,
      { code },
      { skipAuth: true }
    );
  }
}

export const authService = new AuthService();
```

---

## ApiError Class

```typescript
// ✅ CORRECT - Duck-typed error class
// shared/errors/api-error.ts
export class ApiError extends Error {
  readonly _tag = 'ApiError' as const; // For duck typing across module boundaries

  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Helper methods
  isNotFound(): boolean {
    return this.status === 404;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isValidation(): boolean {
    return this.status === 422;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

// Type guard for duck typing
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    (error as { _tag: unknown })._tag === 'ApiError'
  );
}
```

---

## Request Cancellation

```typescript
// ✅ CORRECT - AbortController for cancellable requests
export function useSessionData(sessionId: string) {
  const [data, setData] = useState<Session | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    sessionService
      .getOne(sessionId, { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') {
          handleError(err);
        }
      });

    return () => controller.abort();
  }, [sessionId]);

  return data;
}
```

---

## Token Refresh Flow

```typescript
// ✅ CORRECT - Interceptor pattern for token refresh
class ApiClient {
  private refreshPromise: Promise<void> | null = null;

  async request<T>(...args): Promise<T> {
    try {
      return await this.doRequest<T>(...args);
    } catch (error) {
      if (isApiError(error) && error.isUnauthorized()) {
        // Attempt token refresh
        await this.refreshToken();
        // Retry original request
        return this.doRequest<T>(...args);
      }
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    // Deduplicate concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await authService.refreshToken(refreshToken);
        useAuthStore.getState().setTokens(response.accessToken, response.refreshToken);
      } catch (error) {
        useAuthStore.getState().logout();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}
```

---

## Pagination Pattern

```typescript
// ✅ CORRECT - Paginated response handling
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class SessionService {
  async listPaginated(params: {
    page?: number;
    pageSize?: number;
    filters?: SessionFilters;
  }): Promise<PaginatedResponse<Session>> {
    return apiClient.get<PaginatedResponse<Session>>(this.basePath, {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...params.filters,
      },
    });
  }
}

// Hook usage
export function useSessions(page: number, filters?: SessionFilters) {
  return useQuery({
    queryKey: queryKeys.sessions.all({ page, ...filters }),
    queryFn: () => sessionService.listPaginated({ page, filters }),
    placeholderData: keepPreviousData, // Keep old data while fetching new page
  });
}
```

---

## File Upload Pattern

```typescript
// ✅ CORRECT - Multipart form data upload
class UploadService {
  async uploadFile(file: File, options?: { onProgress?: (percent: number) => void }): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options?.onProgress) {
          options.onProgress((event.loaded / event.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new ApiError(xhr.statusText, xhr.status));
        }
      };

      xhr.onerror = () => reject(new ApiError('Upload failed', 0));

      xhr.open('POST', `${import.meta.env.VITE_API_URL}/v1/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${useAuthStore.getState().accessToken}`);
      xhr.send(formData);
    });
  }
}
```

---

## Naming Conventions

| Element | Pattern | Example |
|---------|---------|---------|
| Service class | `[Entity]Service` | `SessionService`, `UserService` |
| Service instance | `[entity]Service` | `sessionService`, `userService` |
| Base path | `/v1/[entities]` | `/v1/sessions`, `/v1/users` |
| Method names | CRUD verbs | `create`, `list`, `getOne`, `update`, `delete` |
| Domain methods | Domain verbs | `start`, `end`, `join`, `approve` |

---

## Critical Rules

1. **Never use fetch directly** in components - use apiClient via services
2. **Use typed responses** - `apiClient.get<Session>()` not `apiClient.get()`
3. **Export ApiError** from service files for convenience
4. **Use skipAuth** for login/refresh endpoints
5. **Singleton pattern** - export single instance per service
6. **AbortController** for cancellable requests
7. **Duck typing** for ApiError checks across module boundaries

---

## Related Skills

- `tanstack-query-patterns` - Data fetching hooks
- `error-handling` - Error management
- `mutation-wrapper-patterns` - Mutation helpers
