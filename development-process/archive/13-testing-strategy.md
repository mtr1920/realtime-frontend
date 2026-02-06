---
title: "13. Testing Strategy"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 13. Testing Strategy

### 13.1 Testing Pyramid

| Level | Tool | Coverage Target | Examples |
|-------|------|-----------------|----------|
| Unit | Vitest | 80%+ | Hooks, utils, stores |
| Component | Testing Library | 70%+ | UI components |
| Integration | Testing Library | 50%+ | Feature flows |
| E2E | Playwright | Critical paths | Login, observer join, screen share + recording mix, AI interaction, outcome review, integration sync |

### 13.2 Unit Test Example

```typescript
// features/session/stores/session.store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './session.store';

describe('SessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('should set session data from snapshot', () => {
    const snapshot = {
      sessionId: 'session-123',
      status: 'ACTIVE',
      config: { domainType: 'interview' },
      participants: [
        { id: 'p1', displayName: 'User 1', roleId: 'candidate' },
      ],
      myParticipantId: 'p1',
      myRole: { id: 'candidate', name: 'Candidate' },
      serverSeq: 5,
    };

    useSessionStore.getState().setSession(snapshot);

    const state = useSessionStore.getState();
    expect(state.sessionId).toBe('session-123');
    expect(state.status).toBe('ACTIVE');
    expect(state.participants.size).toBe(1);
    expect(state.myParticipantId).toBe('p1');
    expect(state.lastServerSeq).toBe(5);
  });

  it('should add participant', () => {
    const participant = { id: 'p2', displayName: 'User 2', roleId: 'observer' };

    useSessionStore.getState().addParticipant(participant);

    expect(useSessionStore.getState().participants.get('p2')).toEqual(participant);
  });

  it('should remove participant', () => {
    useSessionStore.getState().addParticipant({ id: 'p1', displayName: 'User 1' });
    useSessionStore.getState().removeParticipant('p1');

    expect(useSessionStore.getState().participants.has('p1')).toBe(false);
  });
});
```

### 13.3 Component Test Example

```typescript
// features/session/components/ParticipantList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantList } from './ParticipantList';
import { useSessionStore } from '../stores/session.store';

describe('ParticipantList', () => {
  it('should render all participants', () => {
    // Setup store with participants
    useSessionStore.setState({
      participants: new Map([
        ['p1', { id: 'p1', displayName: 'Alice', roleId: 'candidate', status: 'ACTIVE' }],
        ['p2', { id: 'p2', displayName: 'Bob', roleId: 'observer', status: 'ACTIVE' }],
      ]),
      myParticipantId: 'p1',
    });

    render(<ParticipantList />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('should call onParticipantClick when participant clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    useSessionStore.setState({
      participants: new Map([
        ['p1', { id: 'p1', displayName: 'Alice', roleId: 'candidate' }],
      ]),
    });

    render(<ParticipantList onParticipantClick={onClick} />);

    await user.click(screen.getByText('Alice'));

    expect(onClick).toHaveBeenCalledWith('p1');
  });
});
```

### 13.4 E2E Test Example

```typescript
// e2e/session-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Session Flow', () => {
  test('should join session and see participants', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to session
    await page.goto('/session/test-session-id');

    // Wait for lobby
    await expect(page.locator('h1')).toContainText('Session Lobby');

    // Join session
    await page.click('button:has-text("Join Session")');

    // Verify in session room
    await expect(page.locator('[data-testid="session-room"]')).toBeVisible();
    await expect(page.locator('[data-testid="participant-list"]')).toBeVisible();
  });

  test('should handle AI interaction', async ({ page }) => {
    // ... setup ...

    // Start AI session
    await page.click('button:has-text("Start AI")');

    // Verify AI status
    await expect(page.locator('[data-testid="ai-status"]')).toContainText('Listening');

    // Simulate speaking
    await page.click('[data-testid="push-to-talk"]');
    await page.waitForTimeout(2000);
    await page.click('[data-testid="push-to-talk"]');

    // Verify AI response
    await expect(page.locator('[data-testid="ai-transcript"]')).not.toBeEmpty();
  });
});
```

### 13.5 Implemented E2E Tests (Phase 1)

The following E2E tests have been implemented for Phase 1 foundation:

#### 13.5.1 Test Files Overview

| File | Tests | Coverage |
|------|-------|----------|
| `e2e/home.spec.ts` | 5 | Home page rendering, theme toggle |
| `e2e/theme.spec.ts` | 5 | Theme system, light/dark mode |
| `e2e/accessibility.spec.ts` | 11 | Keyboard navigation, ARIA, skip link |
| `e2e/errors.spec.ts` | 7 | 404 page, error handling |
| `e2e/components.visual.spec.ts` | 7 | Visual regression snapshots |
| `e2e/responsive.mobile.spec.ts` | 12 | Mobile layout, touch interactions |

**Total: 47 tests**

#### 13.5.2 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
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
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/.*\.visual\.spec\.ts/, /.*\.mobile\.spec\.ts/],
    },
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.visual\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium', // Uses chromium for mobile emulation
      },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 13.5.3 Theme System Tests

```typescript
// e2e/theme.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Theme System', () => {
  test('should start in light mode by default', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should toggle to dark mode when button is clicked', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const button = page.getByRole('button', { name: 'Toggle Theme' });

    await button.click();
    await expect(html).toHaveClass(/dark/);
  });

  test('should apply dark mode styles to background', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Toggle Theme' });
    await button.click();

    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    // Dark mode background should be dark (low RGB values)
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });
});
```

#### 13.5.4 Accessibility Tests

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.describe('Keyboard Navigation', () => {
    test('should navigate to skip link first on Tab', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Tab');

      const skipLink = page.getByRole('link', { name: 'Skip to main content' });
      await expect(skipLink).toBeFocused();
    });

    test('should activate button with Enter key', async ({ page }) => {
      await page.goto('/');
      const html = page.locator('html');
      const button = page.getByRole('button', { name: 'Toggle Theme' });

      await button.focus();
      await page.keyboard.press('Enter');
      await expect(html).toHaveClass(/dark/);
    });
  });

  test.describe('Skip Link', () => {
    test('should be hidden initially', async ({ page }) => {
      await page.goto('/');
      const skipLink = page.getByRole('link', { name: 'Skip to main content' });
      await expect(skipLink).toHaveClass(/sr-only/);
    });

    test('should become visible on focus', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Tab');

      const skipLink = page.getByRole('link', { name: 'Skip to main content' });
      await expect(skipLink).not.toHaveClass(/sr-only/);
    });
  });

  test.describe('Semantic HTML', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
    });

    test('should have main landmark', async ({ page }) => {
      await page.goto('/');
      const main = page.getByRole('main');
      await expect(main).toBeVisible();
    });
  });
});
```

#### 13.5.5 Visual Regression Tests

```typescript
// e2e/components.visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.describe('Home Page', () => {
    test('should match home page screenshot in light mode', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('home-light.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match home page screenshot in dark mode', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Toggle Theme' }).click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('home-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});
```

#### 13.5.6 Mobile Responsive Tests

```typescript
// e2e/responsive.mobile.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mobile Responsive Tests', () => {
  test.describe('Home Page on Mobile', () => {
    test('should display main heading on mobile', async ({ page }) => {
      await page.goto('/');
      const heading = page.getByRole('heading', { name: 'Realtime Platform' });
      await expect(heading).toBeVisible();
    });

    test('should display all feature list items', async ({ page }) => {
      await page.goto('/');
      const listItems = page.getByRole('listitem');
      await expect(listItems).toHaveCount(4);
    });
  });

  test.describe('Touch Interactions', () => {
    test('should toggle theme on tap', async ({ page }) => {
      await page.goto('/');
      const html = page.locator('html');
      const button = page.getByRole('button', { name: 'Toggle Theme' });

      await button.tap();
      await expect(html).toHaveClass(/dark/);
    });
  });

  test.describe('Layout', () => {
    test('content should not overflow horizontally', async ({ page }) => {
      await page.goto('/');
      const viewportWidth = page.viewportSize()?.width ?? 390;
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });
  });
});
```

#### 13.5.7 Running E2E Tests

```bash
# Run all E2E tests
pnpm test:web:e2e

# Run specific project
npx playwright test --project=chromium     # Functional tests (28)
npx playwright test --project=visual       # Visual regression (7)
npx playwright test --project=mobile       # Mobile tests (12)

# Run with UI mode
npx playwright test --ui

# Update visual snapshots
npx playwright test --project=visual --update-snapshots

# Generate HTML report
npx playwright show-report
```

### 13.6 Legacy Profile Parity Coverage (Interview)

Minimum parity checks when running in the interview configuration, plus smoke tests for at least one non-interview domain profile (pre-sales or people management):

| Area | Scenarios |
|------|-----------|
| Observer flow | Observer lobby, read-only join, no publish controls |
| Preflight checks | Camera/mic permission prompts and fallbacks |
| Screen share | Required gating + share stop handling |
| Recording mix | Screen recording includes AI avatar audio |
| Recording fallback | Screen share ended -> switch to webcam recording |
| Inactivity | Warning + auto-submit/end |
| Network recovery | Reconnect without losing recording state |
| Compliance capture | Periodic screenshots + backend delivery |
| Outcomes | Summary + evaluation visible to permitted roles |
| Integrations | Connector sync status updates after completion |

---
