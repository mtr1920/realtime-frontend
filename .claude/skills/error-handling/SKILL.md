---
name: error-handling
description: Use when implementing error handling, error boundaries, or displaying error states
---

# Error Handling

Error boundaries, centralized error handling, and user-friendly error messages.

## Overview

This skill covers the error handling architecture, ApiError class, handleError utility, ErrorBoundary components, and toast notifications.

---

## Error Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   API Layer     │────▶│   handleError   │────▶│   Toast/UI      │
│   (ApiError)    │     │   (Central)     │     │   (User sees)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Error Reporter │
                        │  (Logging/Track)│
                        └─────────────────┘
```

---

## ApiError Class

```typescript
// ✅ CORRECT - Duck-typed error class
// shared/errors/api-error.ts
export class ApiError extends Error {
  readonly _tag = 'ApiError' as const; // Duck typing for module boundaries

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

  isNetworkError(): boolean {
    return this.status === 0;
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

## handleError Utility

```typescript
// ✅ CORRECT - Central error handler
// shared/errors/error-handler.ts
import { toast } from 'sonner';
import { isApiError } from './api-error';
import { getErrorMessage, getErrorSeverity } from './error-messages';
import { reportError } from './error-reporter';

interface HandleErrorOptions {
  message?: string;           // Custom message override
  severity?: 'info' | 'warning' | 'error';
  silent?: boolean;           // Don't show toast
  context?: string;           // For error tracking
}

export function handleError(
  error: unknown,
  options: HandleErrorOptions = {}
): void {
  const { message, severity, silent = false, context } = options;

  // Don't show toast for auth errors (redirect instead)
  if (isApiError(error) && error.isUnauthorized()) {
    reportError(error, { context: context ?? 'auth' });
    // Auth redirect handled elsewhere
    return;
  }

  // Get user-friendly message
  const displayMessage = message ?? getErrorMessage(error);
  const displaySeverity = severity ?? getErrorSeverity(error);

  // Report for tracking/logging
  reportError(error, { context });

  // Show toast if not silent
  if (!silent) {
    switch (displaySeverity) {
      case 'info':
        toast.info(displayMessage);
        break;
      case 'warning':
        toast.warning(displayMessage);
        break;
      case 'error':
      default:
        toast.error(displayMessage);
        break;
    }
  }
}
```

---

## Error Messages

```typescript
// ✅ CORRECT - User-friendly error messages
// shared/errors/error-messages.ts
import { isApiError } from './api-error';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This operation conflicts with existing data.',
  422: 'The provided data is invalid.',
  429: 'Too many requests. Please try again later.',
  500: 'An unexpected error occurred. Please try again.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service is under maintenance. Please try again later.',
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  SESSION_EXPIRED: 'Your session has expired.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
};

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    // Check for specific error code first
    if (error.code && ERROR_CODE_MESSAGES[error.code]) {
      return ERROR_CODE_MESSAGES[error.code];
    }

    // Check for status-based message
    if (ERROR_MESSAGES[error.status]) {
      return ERROR_MESSAGES[error.status];
    }

    // Use API message if available
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return ERROR_CODE_MESSAGES.NETWORK_ERROR;
    }
    return error.message;
  }

  return 'An unexpected error occurred.';
}

export function getErrorSeverity(error: unknown): 'info' | 'warning' | 'error' {
  if (isApiError(error)) {
    if (error.status === 404) return 'warning';
    if (error.status === 429) return 'warning';
    if (error.status >= 500) return 'error';
    if (error.status >= 400) return 'warning';
  }
  return 'error';
}
```

---

## ErrorBoundary Component

```typescript
// ✅ CORRECT - Error boundary with fallback UI
// shared/components/ErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { reportError } from '@/shared/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportError(error, {
      context: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      const { error } = this.state;

      if (typeof fallback === 'function') {
        return fallback(error!);
      }

      if (fallback) {
        return fallback;
      }

      return <DefaultErrorFallback error={error!} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-muted-foreground">
        {error.message || 'An unexpected error occurred'}
      </p>
      <Button
        className="mt-4"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </Button>
    </div>
  );
}
```

---

## Usage in Mutations

```typescript
// ✅ CORRECT - Error handling in mutations
export function useCreateSession(options = {}) {
  const mutation = useMutation({
    mutationFn: sessionService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.root });
      toast.success('Session created');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      handleError(error, {
        context: 'create-session',
        // Let handleError determine message and severity
      });
      options.onError?.(error);
    },
  });

  return {
    create: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

// ✅ CORRECT - Custom error message
export function useDeleteSession() {
  return useMutation({
    mutationFn: sessionService.delete,
    onError: (error) => {
      handleError(error, {
        message: 'Failed to delete session. Please try again.',
        context: 'delete-session',
      });
    },
  });
}
```

---

## Usage in Queries

```typescript
// ✅ CORRECT - Query error handling with ErrorState
function SessionDetail({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading, isError, error, refetch } = useSession(sessionId);

  if (isLoading) {
    return <SessionSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        title="Failed to load session"
      />
    );
  }

  return <SessionContent session={session} />;
}

// ErrorState component
interface ErrorStateProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  const message = error ? getErrorMessage(error) : 'An unexpected error occurred';

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{message}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
```

---

## Global Error Handling

```typescript
// ✅ CORRECT - Setup in queryClient
// shared/services/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (isApiError(error) && error.isUnauthorized()) {
          return false;
        }
        // Don't retry 4xx errors
        if (isApiError(error) && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 30_000,
    },
    mutations: {
      onError: (error, _variables, _context, mutation) => {
        // Skip if mutation handles its own errors
        if (mutation.meta?.skipGlobalErrorHandler) {
          return;
        }
        handleError(error);
      },
    },
  },
});
```

---

## Async Function Wrapper

```typescript
// ✅ CORRECT - Try-catch wrapper for async handlers
async function handleSubmit() {
  try {
    await createSession(formData);
    navigate('/sessions');
  } catch (error) {
    handleError(error, { context: 'session-form' });
  }
}

// ✅ CORRECT - In event handlers
const handleClick = async () => {
  try {
    await startSession(sessionId);
  } catch (error) {
    handleError(error, { message: 'Failed to start session' });
  }
};
```

---

## Form Validation Errors

```typescript
// ✅ CORRECT - Display validation errors from API
function SessionForm() {
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (data: FormData) => {
    try {
      await createSession(data);
    } catch (error) {
      if (isApiError(error) && error.isValidation() && error.details) {
        // Map field errors from API
        const fieldErrors = error.details as Record<string, string[]>;
        setServerErrors(
          Object.fromEntries(
            Object.entries(fieldErrors).map(([key, messages]) => [
              key,
              messages[0],
            ])
          )
        );
      } else {
        handleError(error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="title"
        error={serverErrors.title}
      />
    </form>
  );
}
```

---

## Critical Rules

1. **Use handleError** for all error handling - centralizes logic
2. **Duck-type ApiError** - `_tag` check works across module boundaries
3. **User-friendly messages** - never show technical errors to users
4. **Report all errors** - for debugging and monitoring
5. **Wrap components** in ErrorBoundary - prevent full app crashes
6. **Handle auth errors specially** - redirect, don't toast
7. **Don't retry 4xx errors** - they won't succeed
8. **Silent mode for expected errors** - when you handle UI separately

---

## Related Skills

- `api-service-patterns` - API error handling
- `tanstack-query-patterns` - Query error states
- `mutation-wrapper-patterns` - Mutation error handling
