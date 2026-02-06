import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 *
 * Screenshot-based tests to catch unintended visual changes.
 * Run with the 'visual' project.
 */

test.describe('Visual Regression Tests', () => {
  test.describe('Login Page', () => {
    test('should match login page screenshot in light mode', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Ensure light mode
      await page.evaluate(() => localStorage.clear());
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await page.waitForTimeout(100);

      await expect(page).toHaveScreenshot('login-light.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match login page screenshot in dark mode', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(100);

      await expect(page).toHaveScreenshot('login-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('404 Page', () => {
    test('should match 404 page screenshot in light mode', async ({ page }) => {
      await page.goto('/nonexistent-page');
      await page.waitForLoadState('networkidle');

      // Ensure light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await page.waitForTimeout(100);

      await expect(page).toHaveScreenshot('404-light.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match 404 page screenshot in dark mode', async ({ page }) => {
      await page.goto('/nonexistent-page');
      await page.waitForLoadState('networkidle');

      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(100);

      await expect(page).toHaveScreenshot('404-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Component States', () => {
    test('should match submit button hover state', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const button = page.getByRole('button', { name: /sign in/i });
      await button.hover();

      await expect(button).toHaveScreenshot('button-hover.png', {
        animations: 'disabled',
      });
    });

    test('should match email input focus state', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const emailInput = page.getByLabel(/email/i);
      await emailInput.focus();

      await expect(emailInput).toHaveScreenshot('input-focus.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Card Component', () => {
    test('should match login card screenshot', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // The login form is wrapped in a Card component - select by form's parent
      const form = page.locator('form');
      const card = form.locator('xpath=ancestor::div[contains(@class, "max-w")]').first();

      // If ancestor selector fails, fall back to form container
      if (!(await card.isVisible().catch(() => false))) {
        // Take screenshot of the form itself
        await expect(form).toHaveScreenshot('login-card.png', {
          animations: 'disabled',
        });
      } else {
        await expect(card).toHaveScreenshot('login-card.png', {
          animations: 'disabled',
        });
      }
    });
  });
});
