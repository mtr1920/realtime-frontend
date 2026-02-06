---
name: testing-patterns
description: Use when writing tests, setting up test utilities, or implementing test mocks
---

# Testing Patterns

Vitest, React Testing Library, Playwright E2E, and mocking strategies.

## Overview

This skill covers unit testing with Vitest, component testing with React Testing Library, E2E testing with Playwright, and common mocking patterns.

---

## Test Commands

```bash
# Unit tests
pnpm test:web              # Run all tests
pnpm test:web --watch      # Watch mode
pnpm test:web --coverage   # With coverage
pnpm test:web src/features/auth  # Specific directory

# E2E tests
pnpm test:web:e2e          # Run all E2E tests
pnpm test:web:e2e --ui     # Interactive UI
pnpm test:web:e2e auth.spec.ts  # Specific spec
```

---

## Test File Organization

```
src/
├── features/
│   └── auth/
│       ├── hooks/
│       │   ├── useLogin.ts
│       │   └── useLogin.test.ts      # Unit test co-located
│       └── components/
│           ├── LoginForm.tsx
│           └── LoginForm.test.tsx    # Component test co-located
├── test/
│   ├── setup.ts                      # Global test setup
│   ├── test-utils.tsx                # Custom render, providers
│   ├── factories/                    # Test data factories
│   │   ├── session.factory.ts
│   │   └── user.factory.ts
│   └── mocks/                        # Mock implementations
│       ├── websocket.mock.ts
│       └── media-devices.mock.ts
└── e2e/                              # Playwright E2E tests
    ├── auth.spec.ts
    ├── session.spec.ts
    └── auth.setup.ts                 # Auth state setup
```

---

## Unit Test Pattern

```typescript
// ✅ CORRECT - Hook unit test
// features/auth/hooks/useLogin.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLogin } from './useLogin';
import { authService } from '../api/auth.service';
import { createTestWrapper, resetAuthStore } from '@/test';

vi.mock('../api/auth.service');

describe('useLogin', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
  });

  it('logs in successfully with valid credentials', async () => {
    const mockUser = { id: '1', email: 'test@example.com', role: 'MEMBER' };
    vi.mocked(authService.login).mockResolvedValue({
      user: mockUser,
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createTestWrapper(),
    });

    await result.current.login({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('handles login error', async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError('Invalid credentials', 401)
    );

    const { result } = renderHook(() => useLogin(), {
      wrapper: createTestWrapper(),
    });

    await expect(
      result.current.login({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

---

## Component Test Pattern

```typescript
// ✅ CORRECT - Component test with user interactions
// features/auth/components/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { createTestWrapper } from '@/test';

describe('LoginForm', () => {
  it('renders login form fields', () => {
    render(<LoginForm onSubmit={vi.fn()} />, {
      wrapper: createTestWrapper(),
    });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />, {
      wrapper: createTestWrapper(),
    });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />, {
      wrapper: createTestWrapper(),
    });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('disables submit button while loading', () => {
    render(<LoginForm onSubmit={vi.fn()} isLoading />, {
      wrapper: createTestWrapper(),
    });

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
```

---

## Test Wrapper

```typescript
// ✅ CORRECT - Custom test wrapper with providers
// test/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

interface WrapperOptions {
  initialRoute?: string;
  queryClient?: QueryClient;
}

export function createTestWrapper(options: WrapperOptions = {}) {
  const { initialRoute = '/', queryClient = createTestQueryClient() } = options;

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <ThemeProvider defaultTheme="light">
            {children}
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
```

---

## Test Factories

```typescript
// ✅ CORRECT - Factory functions for test data
// test/factories/session.factory.ts
import type { Session, SessionStatus } from '@/types';

let sessionIdCounter = 0;

export function createSession(overrides: Partial<Session> = {}): Session {
  sessionIdCounter++;
  return {
    id: `session-${sessionIdCounter}`,
    title: `Test Session ${sessionIdCounter}`,
    description: null,
    status: 'CREATED',
    scheduledAt: new Date().toISOString(),
    duration: 60,
    participantCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createSessionList(count: number, overrides: Partial<Session> = {}): Session[] {
  return Array.from({ length: count }, () => createSession(overrides));
}

export function createActiveSession(overrides: Partial<Session> = {}): Session {
  return createSession({ status: 'ACTIVE', ...overrides });
}

// Usage
const session = createSession({ title: 'Custom Title' });
const activeSessions = createSessionList(5, { status: 'ACTIVE' });
```

---

## Store Reset Pattern

```typescript
// ✅ CORRECT - Reset stores between tests
// test/auth-test-utils.ts
import { useAuthStore, initialAuthState } from '@/shared/stores/auth.store';

export function resetAuthStore() {
  useAuthStore.setState(initialAuthState);
}

export function setAuthenticated(role: UserRole = 'MEMBER') {
  useAuthStore.setState({
    user: createUser({ role }),
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    isAuthenticated: true,
    isLoading: false,
  });
}

// In tests
beforeEach(() => {
  resetAuthStore();
});

it('shows admin panel for admin users', () => {
  setAuthenticated('ADMIN');
  // ...
});
```

---

## Mock Patterns

### API Service Mock

```typescript
// ✅ CORRECT - Mock service module
vi.mock('@/features/auth/api/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// In test
vi.mocked(authService.login).mockResolvedValue(mockResponse);
```

### WebSocket Mock

```typescript
// ✅ CORRECT - WebSocket mock
// test/mocks/websocket.mock.ts
export class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readyState = WebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    MockWebSocket.instances.push(this);
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    // Store sent messages for assertions
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }

  // Test helper to simulate server message
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }

  static reset() {
    MockWebSocket.instances = [];
  }
}

// In setup.ts
vi.stubGlobal('WebSocket', MockWebSocket);
```

### MediaDevices Mock

```typescript
// ✅ CORRECT - MediaDevices mock
// test/mocks/media-devices.mock.ts
export function mockMediaDevices() {
  const mockStream = {
    getTracks: () => [
      { kind: 'audio', enabled: true, stop: vi.fn() },
      { kind: 'video', enabled: true, stop: vi.fn() },
    ],
    getAudioTracks: () => [{ kind: 'audio', enabled: true, stop: vi.fn() }],
    getVideoTracks: () => [{ kind: 'video', enabled: true, stop: vi.fn() }],
  };

  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
      enumerateDevices: vi.fn().mockResolvedValue([
        { deviceId: 'audio-1', kind: 'audioinput', label: 'Microphone' },
        { deviceId: 'video-1', kind: 'videoinput', label: 'Camera' },
      ]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
  });

  return mockStream;
}
```

---

## Parameterized Tests

```typescript
// ✅ CORRECT - Test multiple scenarios
describe('usePermissions', () => {
  const ALL_ROLES: UserRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];

  it.each(ALL_ROLES)('returns correct role for %s user', (role) => {
    setAuthenticated(role);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.role).toBe(role);
  });

  it.each([
    ['VIEWER', 'canCreateSession', false],
    ['MEMBER', 'canCreateSession', true],
    ['ADMIN', 'canDeleteSession', true],
    ['OWNER', 'canManageApiKeys', true],
  ])('%s user has %s: %s', (role, permission, expected) => {
    setAuthenticated(role as UserRole);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasPermission(permission as Permission)).toBe(expected);
  });
});
```

---

## E2E Test Pattern

```typescript
// ✅ CORRECT - Playwright E2E test
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('logs in with valid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
```

---

## Async Testing

```typescript
// ✅ CORRECT - Async assertions
import { waitFor } from '@testing-library/react';

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});

// Wait for hook state
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});

// Custom timeout
await waitFor(() => expect(something).toBe(true), { timeout: 5000 });
```

---

## Critical Rules

1. **Co-locate tests** with source files (`.test.ts` next to `.ts`)
2. **Reset stores** in `beforeEach` - isolation between tests
3. **Use factories** for test data - consistent and maintainable
4. **Mock at module level** - `vi.mock()` at top of file
5. **userEvent over fireEvent** - more realistic interactions
6. **waitFor for async** - don't use arbitrary delays
7. **Test wrapper** with all providers - consistent test environment
8. **Parameterized tests** for similar scenarios

---

## Related Skills

- `react-patterns` - Components and hooks
- `zustand-state-management` - Store testing
- `tanstack-query-patterns` - Query testing
