# Testing Strategy

## Testing Pyramid

| Level | Tool | Coverage | Focus |
|-------|------|----------|-------|
| Unit | Vitest | 80%+ | Hooks, utils, stores |
| Component | Testing Library | 70%+ | UI components |
| Integration | Testing Library | 50%+ | Feature flows |
| E2E | Playwright | Critical paths | Full user flows |

## Testing Stack

| Type | Tool | Location |
|------|------|----------|
| Unit/Component | Vitest + Testing Library | `src/**/*.test.{ts,tsx}` |
| E2E (Functional) | Playwright | `e2e/*.spec.ts` |
| E2E (Visual) | Playwright | `e2e/*.visual.spec.ts` |
| E2E (Mobile) | Playwright | `e2e/*.mobile.spec.ts` |

## Commands

```bash
# Unit tests
pnpm test:web              # Run all
pnpm test:web --watch      # Watch mode
pnpm test:web --coverage   # With coverage

# E2E tests
pnpm test:web:e2e                              # All E2E
npx playwright test --project=chromium         # Functional (28)
npx playwright test --project=visual           # Visual (7)
npx playwright test --project=mobile           # Mobile (12)
npx playwright test --ui                       # Interactive mode
npx playwright show-report                     # HTML report
npx playwright test --update-snapshots        # Update visual baselines
```

## Unit Test Patterns

### Store Tests

```typescript
// stores/session.store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './session.store';

describe('SessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('should add participant', () => {
    const participant = { id: 'p1', displayName: 'User 1' };

    useSessionStore.getState().addParticipant(participant);

    expect(useSessionStore.getState().participants.get('p1')).toEqual(participant);
  });

  it('should remove participant', () => {
    useSessionStore.getState().addParticipant({ id: 'p1', displayName: 'User 1' });
    useSessionStore.getState().removeParticipant('p1');

    expect(useSessionStore.getState().participants.has('p1')).toBe(false);
  });
});
```

### Hook Tests

```typescript
// hooks/useMediaDevices.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMediaDevices } from './useMediaDevices';

describe('useMediaDevices', () => {
  it('should enumerate devices after permission grant', async () => {
    const mockDevices = [
      { deviceId: 'mic1', kind: 'audioinput', label: 'Microphone' },
      { deviceId: 'cam1', kind: 'videoinput', label: 'Camera' },
    ];

    vi.spyOn(navigator.mediaDevices, 'enumerateDevices')
      .mockResolvedValue(mockDevices);
    vi.spyOn(navigator.mediaDevices, 'getUserMedia')
      .mockResolvedValue(new MediaStream());

    const { result } = renderHook(() => useMediaDevices());

    await act(async () => {
      await result.current.requestPermissions();
    });

    await waitFor(() => {
      expect(result.current.audioInputs).toHaveLength(1);
      expect(result.current.videoInputs).toHaveLength(1);
    });
  });
});
```

## Component Test Patterns

```typescript
// components/ParticipantList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantList } from './ParticipantList';
import { useSessionStore } from '../stores/session.store';

describe('ParticipantList', () => {
  beforeEach(() => {
    useSessionStore.setState({
      participants: new Map([
        ['p1', { id: 'p1', displayName: 'Alice', roleId: 'candidate' }],
        ['p2', { id: 'p2', displayName: 'Bob', roleId: 'observer' }],
      ]),
      myParticipantId: 'p1',
    });
  });

  it('should render all participants', () => {
    render(<ParticipantList />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('should call onParticipantClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<ParticipantList onParticipantClick={onClick} />);
    await user.click(screen.getByText('Alice'));

    expect(onClick).toHaveBeenCalledWith('p1');
  });
});
```

## E2E Test Patterns

### Functional Tests

```typescript
// e2e/session-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Session Flow', () => {
  test('should join session and see participants', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await page.goto('/session/test-session');
    await expect(page.locator('h1')).toContainText('Session Lobby');

    await page.click('button:has-text("Join Session")');

    await expect(page.locator('[data-testid="session-room"]')).toBeVisible();
  });
});
```

### Visual Regression Tests

```typescript
// e2e/components.visual.spec.ts
import { test, expect } from '@playwright/test';

test('should match home page screenshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveScreenshot('home.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### Mobile Tests

```typescript
// e2e/responsive.mobile.spec.ts
import { test, expect } from '@playwright/test';

test('content should not overflow on mobile', async ({ page }) => {
  await page.goto('/');
  const viewportWidth = page.viewportSize()?.width ?? 390;
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
});
```

## Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: [/.*\.visual\.spec\.ts/, /.*\.mobile\.spec\.ts/],
    },
    {
      name: 'visual',
      testMatch: /.*\.visual\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
  },
});
```

## Mocking Patterns

### API Mocking

```typescript
import { vi } from 'vitest';
import { sessionService } from '../services/session.service';

vi.mock('../services/session.service', () => ({
  sessionService: {
    get: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
  },
}));

beforeEach(() => {
  vi.mocked(sessionService.get).mockResolvedValue({
    id: 'session-1',
    name: 'Test Session',
  });
});
```

### WebSocket Mocking

```typescript
const mockWebSocket = {
  subscribe: vi.fn(() => vi.fn()),
  emit: vi.fn(),
  send: vi.fn(),
};

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => mockWebSocket,
}));
```

## Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 1000+ | 1410 |
| E2E Tests | 50+ | 47 |
| Main Bundle | < 150KB | 36.75KB |

## Related Documentation

- [Testing Patterns Skill](../../.claude/skills/testing-patterns/)
- [Coding Standards](./coding-standards.md)
