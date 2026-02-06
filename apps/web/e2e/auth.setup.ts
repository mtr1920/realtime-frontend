/**
 * Playwright Auth Setup
 *
 * Performs actual login with seed credentials and saves the auth state
 * for reuse in authenticated tests.
 *
 * Credentials from prisma/seed.ts:
 * - Email: admin@demo.com
 * - Password: Admin123!
 * - Tenant: demo
 */
import { test as setup, expect } from '@playwright/test';

const ADMIN_AUTH_FILE = 'playwright/.auth/admin.json';

// Seed credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@demo.com',
  password: 'Admin123!',
  tenant: 'demo',
};

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill in the login form
  await page.getByLabel(/email/i).fill(ADMIN_CREDENTIALS.email);
  await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);

  // Fill workspace/tenant field if visible (not set via subdomain)
  const workspaceField = page.getByLabel(/workspace/i);
  if (await workspaceField.isVisible().catch(() => false)) {
    await workspaceField.fill(ADMIN_CREDENTIALS.tenant);
  }

  // Submit the form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard or sessions page
  // This indicates successful authentication
  await expect(page).toHaveURL(/dashboard|sessions/, { timeout: 15000 });

  // Verify auth state is set
  const authState = await page.evaluate(() => {
    const stored = localStorage.getItem('auth-storage');
    return stored ? JSON.parse(stored) : null;
  });

  expect(authState?.state?.isAuthenticated).toBe(true);
  expect(authState?.state?.user?.email).toBe(ADMIN_CREDENTIALS.email);

  // Save the storage state for reuse
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
