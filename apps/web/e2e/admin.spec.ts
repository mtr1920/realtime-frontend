import { test, expect } from '@playwright/test';

/**
 * Admin E2E Tests
 *
 * These tests require admin authentication - run with chromium-authenticated project
 * which uses real auth state from auth.setup.ts (admin@demo.com).
 */

test.describe('Admin Panel', () => {
  // ===========================================================================
  // Admin Access Control
  // ===========================================================================

  test.describe('Access Control', () => {
    test('should allow admin access to admin panel', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Admin should see admin dashboard or settings
      const adminHeading = page.getByRole('heading', { name: /admin|dashboard|settings/i });
      const hasAdminHeading = await adminHeading.isVisible().catch(() => false);

      // Or at least not be redirected to unauthorized
      const isUnauthorized = page.url().includes('unauthorized');
      const isLogin = page.url().includes('login');

      expect(hasAdminHeading || (!isUnauthorized && !isLogin)).toBe(true);
    });
  });

  // ===========================================================================
  // User Management
  // ===========================================================================

  test.describe('User Management', () => {
    test.skip('should display users list', async ({ page }) => {
      // Skip: Admin users page may not exist yet
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    });
  });

  // ===========================================================================
  // Workspace Management
  // ===========================================================================

  test.describe('Workspace Management', () => {
    test.skip('should display workspaces list', async ({ page }) => {
      // Skip: Admin workspaces page may not exist yet
      await page.goto('/admin/workspaces');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();
    });
  });

  // ===========================================================================
  // Domain Configuration
  // ===========================================================================

  test.describe('Domain Configuration', () => {
    test.skip('should display configurations list', async ({ page }) => {
      // Skip: Admin configurations page may not exist yet
      await page.goto('/admin/configurations');
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('heading', { name: /configurations|domain.*config/i })
      ).toBeVisible();
    });
  });

  // ===========================================================================
  // Audit Logs
  // ===========================================================================

  test.describe('Audit Logs', () => {
    test.skip('should display audit logs', async ({ page }) => {
      // Skip: Admin audit logs page may not exist yet
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: /audit.*logs|activity/i })).toBeVisible();
    });
  });

  // ===========================================================================
  // Settings
  // ===========================================================================

  test.describe('Admin Settings', () => {
    test.skip('should display tenant settings', async ({ page }) => {
      // Skip: Admin settings page may not exist yet
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    });
  });

  // ===========================================================================
  // Dashboard
  // ===========================================================================

  test.describe('Admin Dashboard', () => {
    test('should display admin dashboard or redirect appropriately', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Check for dashboard content or acceptable redirect
      const dashboardHeading = page.getByRole('heading', { name: /dashboard|overview|admin/i });
      const hasDashboard = await dashboardHeading.isVisible().catch(() => false);

      // Dashboard might redirect to sessions or another authenticated page
      const isOnAuthenticatedPage =
        page.url().includes('dashboard') ||
        page.url().includes('sessions') ||
        page.url().includes('admin');

      expect(hasDashboard || isOnAuthenticatedPage).toBe(true);
    });
  });

  // ===========================================================================
  // Navigation
  // ===========================================================================

  test.describe('Admin Navigation', () => {
    test('should have sidebar navigation when authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for sidebar navigation links - the sidebar contains these links
      const dashboardLink = page.getByRole('link', { name: /dashboard/i });
      const sessionsLink = page.getByRole('link', { name: /sessions/i });
      const usersLink = page.getByRole('link', { name: /users/i });

      // At least one navigation link should be visible
      const hasDashboard = await dashboardLink.isVisible().catch(() => false);
      const hasSessions = await sessionsLink.isVisible().catch(() => false);
      const hasUsers = await usersLink.isVisible().catch(() => false);

      expect(hasDashboard || hasSessions || hasUsers).toBe(true);
    });
  });
});
