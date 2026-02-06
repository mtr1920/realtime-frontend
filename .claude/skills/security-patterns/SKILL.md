---
name: security-patterns
description: Use when implementing security measures, authentication, or handling sensitive data
---

# Security Patterns

XSS prevention, token storage, input validation, and security best practices.

## Overview

This skill covers frontend security patterns including XSS prevention, secure token handling, input sanitization, and CSRF protection.

---

## Token Storage

```typescript
// CORRECT - Store tokens in memory with HttpOnly cookie refresh
// Zustand store for access token (memory only, not persisted)
const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      accessToken: null,
      refreshToken: null, // Only if needed for SSR, otherwise use HttpOnly cookie

      setTokens: (access, refresh) =>
        set((state) => {
          state.accessToken = access;
          state.refreshToken = refresh;
        }),

      clearTokens: () =>
        set((state) => {
          state.accessToken = null;
          state.refreshToken = null;
        }),
    }))
  )
);

// WRONG - Never store tokens in localStorage
localStorage.setItem('accessToken', token); // XSS can steal this!
```

### Token Refresh Flow

```typescript
// CORRECT - Silent token refresh
class ApiClient {
  private refreshPromise: Promise<void> | null = null;

  async request<T>(path: string, options: RequestOptions): Promise<T> {
    try {
      return await this.doRequest<T>(path, options);
    } catch (error) {
      if (isApiError(error) && error.status === 401 && !options.skipAuth) {
        await this.refreshTokens();
        return this.doRequest<T>(path, options);
      }
      throw error;
    }
  }

  private async refreshTokens(): Promise<void> {
    // Deduplicate concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Use HttpOnly cookie for refresh (sent automatically)
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          throw new Error('Refresh failed');
        }

        const { accessToken } = await response.json();
        useAuthStore.getState().setTokens(accessToken, null);
      } catch {
        useAuthStore.getState().clearTokens();
        window.location.href = '/login';
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}
```

---

## XSS Prevention

### React Built-in Protection

```typescript
// CORRECT - React escapes content by default
function UserProfile({ user }: { user: User }) {
  return (
    <div>
      {/* Safely escaped */}
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}

// DANGEROUS - Never set innerHTML with user content
// Use DOMPurify if you must render HTML:
// import DOMPurify from 'dompurify';
// const sanitized = DOMPurify.sanitize(userContent);

// DANGEROUS - Never inject into href without validation
<a href={userProvidedUrl}>Link</a>
```

### URL Validation

```typescript
// CORRECT - Validate URLs before using
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function SafeLink({ href, children }: { href: string; children: ReactNode }) {
  if (!isValidUrl(href)) {
    return <span>{children}</span>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// DANGEROUS - javascript: URLs can execute code
// Never allow javascript: protocol in hrefs
```

### Content Security Policy Headers

```typescript
// CORRECT - CSP header in server config
// vite.config.ts for dev
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'", // Remove unsafe-inline in production
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' wss: https:",
        "frame-ancestors 'none'",
      ].join('; '),
    },
  },
});
```

---

## Input Validation

### Zod Schema Validation

```typescript
// CORRECT - Validate and sanitize input
import { z } from 'zod';

const createSessionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title too long')
    .transform((val) => val.trim()), // Trim whitespace

  description: z
    .string()
    .max(1000)
    .optional()
    .transform((val) => val?.trim()),

  email: z
    .string()
    .email('Invalid email')
    .toLowerCase(), // Normalize to lowercase

  url: z
    .string()
    .url('Invalid URL')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: 'URL must use http or https' }
    ),
});
```

### File Upload Validation

```typescript
// CORRECT - Validate file uploads
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 10MB)' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  // Check magic bytes for images
  return { valid: true };
}

// WRONG - Trust file extension
// if (file.name.endsWith('.jpg')) { ... } // Can be spoofed
```

---

## CSRF Protection

```typescript
// CORRECT - Include CSRF token in requests
// Get token from meta tag or cookie
const csrfToken = document
  .querySelector('meta[name="csrf-token"]')
  ?.getAttribute('content');

// Include in API client
class ApiClient {
  async request<T>(path: string, options: RequestOptions): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    };

    return fetch(path, { headers, credentials: 'include', ...options });
  }
}

// CORRECT - SameSite cookies
// Server should set: Set-Cookie: session=...; SameSite=Strict; HttpOnly; Secure
```

---

## Sensitive Data Handling

```typescript
// CORRECT - Mask sensitive data in UI
function ApiKeyDisplay({ apiKey }: { apiKey: string }) {
  const [isRevealed, setIsRevealed] = useState(false);

  const maskedKey = `${apiKey.slice(0, 8)}${'*'.repeat(24)}${apiKey.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <code className="font-mono">
        {isRevealed ? apiKey : maskedKey}
      </code>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsRevealed(!isRevealed)}
      >
        {isRevealed ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}

// WRONG - Log sensitive data
// console.log('API Key:', apiKey); // Don't log secrets!
// console.log('User password:', password);
```

### Clear Sensitive Data on Logout

```typescript
// CORRECT - Clear all sensitive data on logout
async function logout() {
  // Clear auth state
  useAuthStore.getState().clearTokens();

  // Clear session state
  useSessionStore.getState().reset();

  // Clear query cache
  queryClient.clear();

  // Clear any local storage
  localStorage.removeItem('preferences');

  // Redirect to login
  window.location.href = '/login';
}
```

---

## Error Messages

```typescript
// CORRECT - Generic error messages for auth
const AUTH_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  // Don't reveal which field is wrong
  USER_NOT_FOUND: 'Invalid email or password', // Same message!
  WRONG_PASSWORD: 'Invalid email or password',  // Same message!
  ACCOUNT_LOCKED: 'Account temporarily locked. Try again later.',
};

// WRONG - Reveals too much information
// 'User not found' // Attacker knows email doesn't exist
// 'Wrong password' // Attacker knows email exists
```

---

## Rate Limiting (Client-Side)

```typescript
// CORRECT - Client-side rate limiting for expensive operations
function useRateLimitedAction(limit: number, windowMs: number) {
  const timestamps = useRef<number[]>([]);

  const canExecute = useCallback(() => {
    const now = Date.now();
    timestamps.current = timestamps.current.filter(
      (ts) => now - ts < windowMs
    );
    return timestamps.current.length < limit;
  }, [limit, windowMs]);

  const execute = useCallback(
    async <T>(action: () => Promise<T>): Promise<T> => {
      if (!canExecute()) {
        throw new Error('Rate limit exceeded. Please wait.');
      }
      timestamps.current.push(Date.now());
      return action();
    },
    [canExecute]
  );

  return { execute, canExecute };
}

// Usage
const { execute } = useRateLimitedAction(5, 60000); // 5 per minute

const handleSubmit = async () => {
  try {
    await execute(() => createSession(data));
  } catch (error) {
    if (error.message.includes('Rate limit')) {
      toast.error('Too many requests. Please wait.');
    }
  }
};
```

---

## Secure Forms

```typescript
// CORRECT - Disable autocomplete for sensitive fields
<input
  type="password"
  name="new-password"
  autoComplete="new-password"
/>

<input
  type="text"
  name="otp"
  autoComplete="one-time-code"
  inputMode="numeric"
  pattern="[0-9]*"
/>

// CORRECT - Prevent form data in URL
<form method="POST" action="/api/auth/login">
  {/* Form data in body, not URL */}
</form>

// WRONG - GET request with password
// Password would appear in URL!
```

---

## External Links

```typescript
// CORRECT - Secure external links
function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer" // Prevents tab-napping
    >
      {children}
      <ExternalLinkIcon className="ml-1 h-3 w-3 inline" />
    </a>
  );
}

// rel="noopener" - Prevents window.opener access
// rel="noreferrer" - Prevents Referer header
```

---

## Critical Rules

1. **Never store tokens in localStorage** - use memory + HttpOnly cookies
2. **Never render unsanitized HTML** - use DOMPurify if HTML is required
3. **Validate URLs** before using in href - check protocol
4. **Same error message** for auth failures - don't reveal info
5. **Include CSRF token** in state-changing requests
6. **Clear all data on logout** - tokens, cache, storage
7. **Mask sensitive data** in UI - API keys, tokens
8. **noopener noreferrer** on external links

---

## Related Skills

- `api-service-patterns` - Token handling
- `error-handling` - Secure error messages
- `form-validation` - Input validation
