import { test, expect } from '@playwright/test';

test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should start in light mode by default', async ({ page }) => {
    await page.goto('/login');
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should apply dark mode when set via localStorage', async ({ page }) => {
    await page.goto('/login');

    // Set dark theme via localStorage
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'dark', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should apply light mode when set via localStorage', async ({ page }) => {
    await page.goto('/login');

    // First set to dark
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'dark', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Then set to light
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'light', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('should apply different styles in dark mode', async ({ page }) => {
    await page.goto('/login');
    const body = page.locator('body');

    // Get light mode background
    const lightBg = await body.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    // Set dark mode
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'dark', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });
    await page.reload();

    // Get dark mode background
    const darkBg = await body.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    // Backgrounds should be different
    expect(lightBg).not.toBe(darkBg);
  });
});

test.describe('Theme Persistence', () => {
  test('should persist dark theme across page reload', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Set dark theme
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'dark', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });
    await page.reload();

    // Should be dark (persisted)
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Reload again
    await page.reload();

    // Should still be dark
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should read theme from localStorage on page load', async ({ page }) => {
    // Set theme before navigating
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'dark', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });

    // Navigate to a different page and back
    await page.goto('/forgot-password');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

test.describe('System Preference', () => {
  test('should detect dark system preference', async ({ page }) => {
    // Clear storage first
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    // With 'system' theme (default), should resolve to dark
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should detect light system preference', async ({ page }) => {
    // Clear storage first
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    // With 'system' theme (default), should resolve to light
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test.describe('High Contrast Mode', () => {
  test('should apply high contrast mode via localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Set high contrast mode
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'high-contrast', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });
    await page.reload();

    await expect(page.locator('html')).toHaveClass(/high-contrast/);
  });

  test('should have very dark background in high contrast mode', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Set high contrast mode
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'high-contrast', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });
    await page.reload();
    await page.waitForTimeout(100);

    // Check body has black background
    const bgColor = await page.locator('body').evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });
    // High contrast should have very dark (black) background
    expect(bgColor).toBe('rgb(0, 0, 0)');
  });

  test('should toggle high contrast off via localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Set high contrast on
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'high-contrast', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/high-contrast/);

    // Set back to light
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'light', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/high-contrast/);
  });
});

test.describe('Reduced Motion', () => {
  test('should respect reduced motion preference', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    // HTML should have reduce-motion class
    await expect(page.locator('html')).toHaveClass(/reduce-motion/);
  });

  test('should not have reduce-motion class when not preferred', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();

    // HTML should not have reduce-motion class
    await expect(page.locator('html')).not.toHaveClass(/reduce-motion/);
  });
});

test.describe('No FOUC (Flash of Unstyled Content)', () => {
  test('should not flash wrong theme on load with dark preference', async ({
    page,
  }) => {
    // Set dark theme in localStorage before navigating
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'dark', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });

    // Navigate fresh - theme should be applied by FOUC script before React loads
    await page.goto('/login', { waitUntil: 'commit' });

    // Should have dark class immediately (no flash)
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should not flash wrong theme on load with high contrast preference', async ({
    page,
  }) => {
    // Set high-contrast theme in localStorage before navigating
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem(
        'ui-storage',
        JSON.stringify({
          state: { theme: 'high-contrast', isSidebarCollapsed: false },
          version: 0,
        })
      );
    });

    // Navigate fresh
    await page.goto('/login', { waitUntil: 'commit' });

    // Should have high-contrast class immediately
    await expect(page.locator('html')).toHaveClass(/high-contrast/);
  });
});
