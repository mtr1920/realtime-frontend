import { test, expect } from '@playwright/test';

test.describe('Home Page (Root Route)', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    // Should redirect to login with returnUrl
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display login page heading', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome back' })
    ).toBeVisible();
  });

  test('should display skip link on focus', async ({ page }) => {
    await page.goto('/login');

    // Focus on skip link
    await page.keyboard.press('Tab');

    // Skip link should be visible
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeVisible();
  });

  test('should show 404 page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
  });
});
