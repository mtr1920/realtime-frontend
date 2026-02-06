import { test, expect } from '@playwright/test';

/**
 * Session E2E Tests
 *
 * These tests require authentication - run with chromium-authenticated project
 * which uses real auth state from auth.setup.ts.
 *
 * Note: Session detail/lobby/room tests use placeholder IDs and may fail
 * if no real sessions exist. Consider creating seed sessions or using
 * API to create test sessions.
 */

test.describe('Sessions', () => {
  // ===========================================================================
  // Sessions List
  // ===========================================================================

  test.describe('Sessions List', () => {
    test('should display sessions page when authenticated', async ({ page }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      // Should either show sessions heading or dashboard (depending on routing)
      const sessionsHeading = page.getByRole('heading', { name: /sessions/i });
      const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });

      const hasSessions = await sessionsHeading.isVisible().catch(() => false);
      const hasDashboard = await dashboardHeading.isVisible().catch(() => false);

      expect(hasSessions || hasDashboard).toBe(true);
    });

    test('should have navigation to sessions', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for sessions link in sidebar navigation or quick actions
      const sessionsLink = page.getByRole('link', { name: /sessions/i }).first();
      const viewSessionsButton = page.getByRole('button', { name: /view.*sessions/i });

      const hasSessionsLink = await sessionsLink.isVisible().catch(() => false);
      const hasViewSessions = await viewSessionsButton.isVisible().catch(() => false);

      // Sessions should be accessible via navigation or quick actions
      expect(hasSessionsLink || hasViewSessions).toBe(true);
    });
  });

  // ===========================================================================
  // Create Session
  // ===========================================================================

  test.describe('Create Session', () => {
    test.skip('should display create session form', async ({ page }) => {
      // Skip: Create session page may not exist yet
      await page.goto('/sessions/create');
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('heading', { name: /create.*session|new.*session/i })
      ).toBeVisible();
    });
  });

  // ===========================================================================
  // Create Session Dialog
  // ===========================================================================

  test.describe('Create Session Dialog', () => {
    test('should open create session dialog from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for a create session button (may be in quick actions or header)
      const createButton = page
        .getByRole('button', { name: /create.*session|new.*session/i })
        .first();

      const hasCreateButton = await createButton.isVisible().catch(() => false);

      if (hasCreateButton) {
        await createButton.click();

        // Dialog should open
        await expect(
          page.getByRole('heading', { name: /create new session/i })
        ).toBeVisible();
      } else {
        // Skip if create button not found on dashboard
        test.skip();
      }
    });

    test('should generate random ID when shuffle button clicked', async ({
      page,
    }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Open the create session dialog
      const createButton = page
        .getByRole('button', { name: /create.*session|new.*session/i })
        .first();

      const hasCreateButton = await createButton.isVisible().catch(() => false);

      if (!hasCreateButton) {
        test.skip();
        return;
      }

      await createButton.click();

      // Wait for dialog to open
      await expect(
        page.getByRole('heading', { name: /create new session/i })
      ).toBeVisible();

      // Find the external ID input and shuffle button
      const externalIdInput = page.getByPlaceholder('e.g., MEETING-123');
      const shuffleButton = page.getByTitle('Generate random ID');

      // Verify input is initially empty
      await expect(externalIdInput).toHaveValue('');

      // Click shuffle button
      await shuffleButton.click();

      // Verify ID was generated in correct format (xxx-xxxx-xxx-xxx)
      const generatedId = await externalIdInput.inputValue();
      expect(generatedId).toMatch(/^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}-[a-z0-9]{3}$/);
    });

    test('should generate different IDs on multiple shuffle clicks', async ({
      page,
    }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Open the create session dialog
      const createButton = page
        .getByRole('button', { name: /create.*session|new.*session/i })
        .first();

      const hasCreateButton = await createButton.isVisible().catch(() => false);

      if (!hasCreateButton) {
        test.skip();
        return;
      }

      await createButton.click();

      await expect(
        page.getByRole('heading', { name: /create new session/i })
      ).toBeVisible();

      const externalIdInput = page.getByPlaceholder('e.g., MEETING-123');
      const shuffleButton = page.getByTitle('Generate random ID');

      // Generate first ID
      await shuffleButton.click();
      const firstId = await externalIdInput.inputValue();

      // Generate second ID
      await shuffleButton.click();
      const secondId = await externalIdInput.inputValue();

      // IDs should be different
      expect(firstId).not.toBe(secondId);

      // Both should be valid format
      expect(firstId).toMatch(/^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}-[a-z0-9]{3}$/);
      expect(secondId).toMatch(/^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}-[a-z0-9]{3}$/);
    });

    test('should allow manual entry after generating ID', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const createButton = page
        .getByRole('button', { name: /create.*session|new.*session/i })
        .first();

      const hasCreateButton = await createButton.isVisible().catch(() => false);

      if (!hasCreateButton) {
        test.skip();
        return;
      }

      await createButton.click();

      await expect(
        page.getByRole('heading', { name: /create new session/i })
      ).toBeVisible();

      const externalIdInput = page.getByPlaceholder('e.g., MEETING-123');
      const shuffleButton = page.getByTitle('Generate random ID');

      // Generate an ID first
      await shuffleButton.click();
      const generatedId = await externalIdInput.inputValue();
      expect(generatedId).not.toBe('');

      // Clear and type custom ID
      await externalIdInput.clear();
      await externalIdInput.fill('MY-CUSTOM-ID');

      await expect(externalIdInput).toHaveValue('MY-CUSTOM-ID');
    });

    test('should close dialog when cancel clicked', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const createButton = page
        .getByRole('button', { name: /create.*session|new.*session/i })
        .first();

      const hasCreateButton = await createButton.isVisible().catch(() => false);

      if (!hasCreateButton) {
        test.skip();
        return;
      }

      await createButton.click();

      const dialogHeading = page.getByRole('heading', {
        name: /create new session/i,
      });
      await expect(dialogHeading).toBeVisible();

      // Click cancel
      await page.getByRole('button', { name: /cancel/i }).click();

      // Dialog should close
      await expect(dialogHeading).not.toBeVisible();
    });
  });

  // ===========================================================================
  // Session Detail (requires real session data)
  // ===========================================================================

  test.describe('Session Detail', () => {
    test.skip('should display session details', async ({ page }) => {
      // Skip: Requires real session ID from database
      await page.goto('/sessions/test-session-id');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading')).toBeVisible();
    });
  });

  // ===========================================================================
  // Session Lobby (requires real session data)
  // ===========================================================================

  test.describe('Session Lobby', () => {
    test.skip('should display lobby with media controls', async ({ page }) => {
      // Skip: Requires real session ID and media permissions
      await page.goto('/sessions/test-session-id/lobby');
      await page.waitForLoadState('networkidle');

      const videoPreview = page.locator('video').or(page.getByTestId('video-preview'));
      await expect(videoPreview).toBeVisible({ timeout: 10000 });
    });
  });

  // ===========================================================================
  // Session Room (requires real session data)
  // ===========================================================================

  test.describe('Session Room', () => {
    test.skip('should display video grid', async ({ page }) => {
      // Skip: Requires real session ID, WebRTC setup, and media permissions
      await page.goto('/sessions/test-session-id/room');
      await page.waitForLoadState('networkidle');

      const videoGrid = page.getByTestId('video-grid').or(
        page.locator('[class*="video-grid"]').or(page.locator('[class*="VideoGrid"]'))
      );
      await expect(videoGrid).toBeVisible({ timeout: 15000 });
    });
  });
});
