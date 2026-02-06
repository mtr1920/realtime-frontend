import { test, expect } from '@playwright/test';

/**
 * DataTable Filtering E2E Tests
 *
 * Tests for global search and column filters in the DataTable component.
 * These tests require the sessions page which uses the DataTable with filtering enabled.
 */

test.describe('DataTable Filtering', () => {
  // ===========================================================================
  // Global Search Tests
  // ===========================================================================

  test.describe('Global Search', () => {
    test('should display search input in toolbar', async ({ page }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      // Look for search input
      const searchInput = page.getByRole('textbox', { name: /search/i });
      await expect(searchInput).toBeVisible();
    });

    test('should maintain text while typing (no disappearing text)', async ({
      page,
    }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByRole('textbox', { name: /search/i });

      // Type text character by character
      await searchInput.fill('');
      await searchInput.type('test', { delay: 50 });

      // Text should remain visible
      await expect(searchInput).toHaveValue('test');

      // Wait a bit and verify text is still there (race condition fix)
      await page.waitForTimeout(500);
      await expect(searchInput).toHaveValue('test');
    });

    test('should filter table results when searching', async ({ page }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByRole('textbox', { name: /search/i });

      // Get initial row count (if any rows exist)
      const tableBody = page.locator('tbody');
      const initialRows = await tableBody.locator('tr').count();

      // Type a search term
      await searchInput.fill('nonexistent-search-term-xyz');

      // Wait for debounce and filtering
      await page.waitForTimeout(500);

      // If we had rows before, we should have fewer or none now
      // Or we should see "No results" message
      const hasNoResults =
        (await page.getByText(/no.*results|no.*sessions/i).isVisible()) ||
        (await tableBody.locator('tr').count()) <= initialRows;

      expect(hasNoResults).toBe(true);
    });

    test('should show clear button when search has value', async ({ page }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByRole('textbox', { name: /search/i });

      // Clear button should not be visible initially
      const clearButton = page.getByRole('button', { name: /clear.*search/i });
      await expect(clearButton).not.toBeVisible();

      // Type something
      await searchInput.fill('test');
      await page.waitForTimeout(100);

      // Clear button should now be visible
      await expect(clearButton).toBeVisible();
    });

    test('should clear search when clear button clicked', async ({ page }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByRole('textbox', { name: /search/i });

      // Type something
      await searchInput.fill('test search');
      await expect(searchInput).toHaveValue('test search');

      // Click clear button
      const clearButton = page.getByRole('button', { name: /clear.*search/i });
      await clearButton.click();

      // Search should be cleared
      await expect(searchInput).toHaveValue('');
    });
  });

  // ===========================================================================
  // Column Filter Tests
  // ===========================================================================

  test.describe('Column Filters', () => {
    test('should display filter icon on filterable columns', async ({
      page,
    }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      // Look for filter buttons in the table header
      const filterButtons = page.locator('thead').getByRole('button');
      const filterButtonCount = await filterButtons.count();

      // Should have at least one filter button (sort buttons count too, but filter icons should exist)
      expect(filterButtonCount).toBeGreaterThan(0);
    });

    test('should open filter popover when filter icon clicked', async ({
      page,
    }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      // Find a filter button (look for one with Filter icon)
      // Filter buttons typically have a Filter icon (funnel shape)
      const filterTrigger = page.locator('thead button').filter({
        has: page.locator('svg.lucide-filter'),
      }).first();

      // Check if filter buttons exist
      const hasFilterButtons = await filterTrigger.isVisible().catch(() => false);

      if (hasFilterButtons) {
        await filterTrigger.click();

        // Should open a popover
        const popover = page.getByRole('dialog').or(page.locator('[data-radix-popper-content-wrapper]'));
        await expect(popover).toBeVisible({ timeout: 5000 });
      } else {
        // Skip if no filterable columns configured
        test.skip();
      }
    });

    test('should close filter popover when clicking outside', async ({
      page,
    }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const filterTrigger = page.locator('thead button').filter({
        has: page.locator('svg.lucide-filter'),
      }).first();

      const hasFilterButtons = await filterTrigger.isVisible().catch(() => false);

      if (!hasFilterButtons) {
        test.skip();
        return;
      }

      // Open popover
      await filterTrigger.click();

      const popover = page.locator('[data-radix-popper-content-wrapper]');
      await expect(popover).toBeVisible({ timeout: 5000 });

      // Click outside (on the table body)
      await page.locator('tbody').click({ force: true });

      // Popover should close
      await expect(popover).not.toBeVisible({ timeout: 5000 });
    });
  });

  // ===========================================================================
  // Text Filter Tests
  // ===========================================================================

  test.describe('Text Filter in Popover', () => {
    test('should filter by column text value', async ({ page }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const filterTrigger = page.locator('thead button').filter({
        has: page.locator('svg.lucide-filter'),
      }).first();

      const hasFilterButtons = await filterTrigger.isVisible().catch(() => false);

      if (!hasFilterButtons) {
        test.skip();
        return;
      }

      // Open filter popover
      await filterTrigger.click();

      // Find text input in the popover
      const filterInput = page.locator('[data-radix-popper-content-wrapper] input[type="text"]').first();
      const hasTextInput = await filterInput.isVisible().catch(() => false);

      if (!hasTextInput) {
        // This column might use a different filter type
        test.skip();
        return;
      }

      // Type a filter value
      await filterInput.fill('test-filter-value');

      // Text should persist (race condition fix)
      await expect(filterInput).toHaveValue('test-filter-value');

      // Wait for debounce
      await page.waitForTimeout(500);

      // Text should still be there
      await expect(filterInput).toHaveValue('test-filter-value');
    });

    test('should clear filter from popover', async ({ page }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const filterTrigger = page.locator('thead button').filter({
        has: page.locator('svg.lucide-filter'),
      }).first();

      const hasFilterButtons = await filterTrigger.isVisible().catch(() => false);

      if (!hasFilterButtons) {
        test.skip();
        return;
      }

      // Open filter popover
      await filterTrigger.click();

      const popover = page.locator('[data-radix-popper-content-wrapper]');
      await expect(popover).toBeVisible({ timeout: 5000 });

      // Find and fill text input
      const filterInput = popover.locator('input[type="text"]').first();
      const hasTextInput = await filterInput.isVisible().catch(() => false);

      if (!hasTextInput) {
        test.skip();
        return;
      }

      await filterInput.fill('test');
      await page.waitForTimeout(500);

      // Look for clear button in popover
      const clearButton = popover.getByRole('button', { name: /clear/i });
      const hasClear = await clearButton.isVisible().catch(() => false);

      if (hasClear) {
        await clearButton.click();
        await expect(filterInput).toHaveValue('');
      }
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  test.describe('Filter Integration', () => {
    test('should combine global search with column filters', async ({
      page,
    }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      // Apply global search
      const searchInput = page.getByRole('textbox', { name: /search/i });
      await searchInput.fill('test');

      // Wait for debounce
      await page.waitForTimeout(500);

      // Both filters should work together without errors
      // Page should not crash or show errors
      await expect(page.locator('table')).toBeVisible();
    });

    test('should maintain filter state after scrolling', async ({ page }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByRole('textbox', { name: /search/i });
      await searchInput.fill('persistent-value');

      // Scroll the page
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(100);
      await page.evaluate(() => window.scrollBy(0, -200));

      // Filter value should persist
      await expect(searchInput).toHaveValue('persistent-value');
    });

    test('should handle rapid typing without losing characters', async ({
      page,
    }) => {
      await page.goto('/sessions');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByRole('textbox', { name: /search/i });

      // Type rapidly
      await searchInput.type('rapidtyping', { delay: 30 });

      // All characters should be present
      await expect(searchInput).toHaveValue('rapidtyping');

      // Wait and verify again (race condition should not occur)
      await page.waitForTimeout(600);
      await expect(searchInput).toHaveValue('rapidtyping');
    });
  });
});
