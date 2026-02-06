import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test.describe('404 Page', () => {
    test('should display 404 heading for invalid routes', async ({ page }) => {
      await page.goto('/this-route-does-not-exist');

      const heading = page.getByRole('heading', { name: '404' });
      await expect(heading).toBeVisible();
    });

    test('should display "Page not found" message', async ({ page }) => {
      await page.goto('/invalid-route-123');

      const message = page.getByText('Page not found');
      await expect(message).toBeVisible();
    });

    test('should have a link to go back home', async ({ page }) => {
      await page.goto('/does-not-exist');

      const homeLink = page.getByRole('link', { name: 'Go home' });
      await expect(homeLink).toBeVisible();
    });

    test('should navigate to home when "Go home" is clicked', async ({
      page,
    }) => {
      await page.goto('/unknown-page');

      const homeLink = page.getByRole('link', { name: 'Go home' });
      await homeLink.click();

      // Should redirect to login (since home redirects unauthenticated users)
      await expect(page).toHaveURL(/login/);
      await expect(
        page.getByRole('heading', { name: /welcome back/i })
      ).toBeVisible();
    });

    test('should work with deeply nested invalid routes', async ({ page }) => {
      await page.goto('/invalid/deeply/nested/route/path');

      const heading = page.getByRole('heading', { name: '404' });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Error Page Styling', () => {
    test('should be centered on the page', async ({ page }) => {
      await page.goto('/nonexistent');

      // Check the container has centering classes
      const container = page.locator('.flex.min-h-screen');
      await expect(container).toBeVisible();
    });

    test('should render with default light theme on error page', async ({ page }) => {
      // Navigate directly to 404 page
      await page.goto('/invalid');

      // Should be in light mode by default
      const html = page.locator('html');
      await expect(html).not.toHaveClass(/dark/);
    });
  });
});
