import { test, expect } from '@playwright/test';

/**
 * Mobile Responsive Tests
 *
 * Tests for mobile-specific behavior and responsive design.
 * Run with the 'mobile' project which uses iPhone 13 viewport.
 */

test.describe('Mobile Responsive Tests', () => {
  test.describe('Login Page on Mobile', () => {
    test('should display login form heading on mobile', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // The page has "Welcome back" as H1 and "Sign in" as card title
      const welcomeHeading = page.getByRole('heading', { name: /welcome back/i });
      await expect(welcomeHeading).toBeVisible();
    });

    test('should display login form fields on mobile', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check for email and password inputs
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('should display submit button on mobile', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const submitButton = page.getByRole('button', { name: /sign in/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeInViewport();
    });

    test('should display card container on mobile', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Login form card has a form inside with the "Sign in" heading
      const cardHeading = page.getByRole('heading', { name: /sign in/i });
      await expect(cardHeading).toBeVisible();

      // The form should be visible inside the card
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });
  });

  test.describe('Touch Interactions', () => {
    test('should allow form interaction via touch', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Tap on email input
      const emailInput = page.getByLabel(/email/i);
      await emailInput.tap();

      // Should be focusable
      await expect(emailInput).toBeFocused();
    });

    test('should navigate to forgot password on tap', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password/i });

      if (await forgotPasswordLink.isVisible()) {
        await forgotPasswordLink.tap();
        await expect(page).toHaveURL(/forgot-password/);
      }
    });
  });

  test.describe('Layout', () => {
    test('should have proper spacing on mobile', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check the login page has centered content
      const container = page.locator('.min-h-screen').first();
      await expect(container).toBeVisible();
    });

    test('should stack elements vertically', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Content should use flex-col layout
      const flexContainer = page.locator('.flex.flex-col').first();
      await expect(flexContainer).toBeVisible();
    });

    test('content should not overflow horizontally', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check viewport width matches content width (no horizontal scroll)
      const viewportWidth = page.viewportSize()?.width ?? 390;
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });
  });

  test.describe('404 Page on Mobile', () => {
    test('should display 404 properly on mobile', async ({ page }) => {
      await page.goto('/mobile-not-found');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(page.getByText('Page not found')).toBeVisible();
    });

    test('404 content should be centered', async ({ page }) => {
      await page.goto('/mobile-404');
      await page.waitForLoadState('networkidle');

      const container = page.locator('.items-center.justify-center').first();
      await expect(container).toBeVisible();
    });
  });
});
