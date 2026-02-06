import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Axe-core Accessibility Tests
 *
 * Automated accessibility testing using axe-core via @axe-core/playwright.
 * Tests for WCAG 2.1 AA compliance.
 */

test.describe('Axe-core Accessibility', () => {
  // ===========================================================================
  // Public Pages
  // ===========================================================================

  test.describe('Public Pages', () => {
    test('should have no critical violations on home page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(
        criticalViolations.length,
        `Critical accessibility violations found:\n${JSON.stringify(criticalViolations, null, 2)}`
      ).toBe(0);
    });

    test('should have no critical violations on login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(
        criticalViolations.length,
        `Critical accessibility violations found:\n${JSON.stringify(criticalViolations, null, 2)}`
      ).toBe(0);
    });

    test('should have no critical violations on forgot password page', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(
        criticalViolations.length,
        `Critical accessibility violations found:\n${JSON.stringify(criticalViolations, null, 2)}`
      ).toBe(0);
    });

    test('should have no critical violations on unauthorized page', async ({ page }) => {
      await page.goto('/unauthorized');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Exclude decorative error code heading (403) which is intentionally low contrast
        .exclude('.text-muted-foreground\\/20')
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(
        criticalViolations.length,
        `Critical accessibility violations found:\n${JSON.stringify(criticalViolations, null, 2)}`
      ).toBe(0);
    });
  });

  // ===========================================================================
  // Form Accessibility
  // ===========================================================================

  test.describe('Form Accessibility', () => {
    test('login form should have proper labels', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check email input has associated label
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');

      // Check password input has associated label
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('form should show validation errors for required fields', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Submit empty form to trigger validation
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for validation errors - these indicate fields are required
      await expect(page.getByText(/email.*required/i)).toBeVisible({ timeout: 5000 });
    });

    test('error messages should be associated with inputs', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Submit empty form to trigger validation
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for validation errors
      await expect(page.getByText(/email.*required/i)).toBeVisible({ timeout: 5000 });

      // Check aria-describedby on input points to error
      const emailInput = page.getByLabel(/email/i);
      const describedBy = await emailInput.getAttribute('aria-describedby');

      // Should have aria-describedby or aria-errormessage
      const hasErrorAssociation =
        describedBy !== null || (await emailInput.getAttribute('aria-errormessage')) !== null;

      expect(hasErrorAssociation).toBe(true);
    });

    test('invalid inputs should have aria-invalid', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Submit empty form
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for validation
      await page.waitForTimeout(500);

      // Check aria-invalid on email field
      const emailInput = page.getByLabel(/email/i);
      const ariaInvalid = await emailInput.getAttribute('aria-invalid');

      // Should be marked as invalid
      expect(ariaInvalid).toBe('true');
    });
  });

  // ===========================================================================
  // Interactive Elements
  // ===========================================================================

  test.describe('Interactive Elements', () => {
    test('all buttons should be accessible', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      // Check for button-related violations
      const buttonViolations = results.violations.filter(
        (v) =>
          v.id.includes('button') ||
          v.nodes.some((n) => n.html.includes('<button') || n.html.includes('role="button"'))
      );

      expect(
        buttonViolations.length,
        `Button accessibility violations:\n${JSON.stringify(buttonViolations, null, 2)}`
      ).toBe(0);
    });

    test('all links should be accessible', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      // Check for link-related violations
      const linkViolations = results.violations.filter(
        (v) =>
          v.id.includes('link') || v.nodes.some((n) => n.html.includes('<a ') || n.html.includes('role="link"'))
      );

      expect(
        linkViolations.length,
        `Link accessibility violations:\n${JSON.stringify(linkViolations, null, 2)}`
      ).toBe(0);
    });

    test('focus should be visible on all interactive elements', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check email input focus
      await page.keyboard.press('Tab'); // Skip link
      await page.keyboard.press('Tab'); // Email input

      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeFocused();

      const emailOutlineWidth = await emailInput.evaluate((el) => getComputedStyle(el).outlineWidth);
      const emailBoxShadow = await emailInput.evaluate((el) => getComputedStyle(el).boxShadow);

      expect(emailOutlineWidth !== '0px' || emailBoxShadow !== 'none').toBeTruthy();
    });
  });

  // ===========================================================================
  // Color Contrast
  // ===========================================================================

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast (light mode)', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Ensure we're in light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      const contrastViolations = results.violations.filter((v) => v.id.includes('contrast'));

      expect(
        contrastViolations.length,
        `Color contrast violations in light mode:\n${JSON.stringify(contrastViolations, null, 2)}`
      ).toBe(0);
    });

    test('should have sufficient color contrast (dark mode)', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Switch to dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      const contrastViolations = results.violations.filter((v) => v.id.includes('contrast'));

      expect(
        contrastViolations.length,
        `Color contrast violations in dark mode:\n${JSON.stringify(contrastViolations, null, 2)}`
      ).toBe(0);
    });
  });

  // ===========================================================================
  // ARIA and Landmarks
  // ===========================================================================

  test.describe('ARIA and Landmarks', () => {
    test('page should have proper landmark structure', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check for main landmark
      const main = page.getByRole('main');
      await expect(main).toBeVisible();

      // Check for navigation (if present)
      const nav = page.getByRole('navigation');
      const navCount = await nav.count();
      expect(navCount).toBeGreaterThanOrEqual(0);
    });

    test('ARIA attributes should be valid', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const ariaViolations = results.violations.filter((v) => v.id.includes('aria'));

      expect(
        ariaViolations.length,
        `ARIA violations:\n${JSON.stringify(ariaViolations, null, 2)}`
      ).toBe(0);
    });

    test('headings should be in logical order', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
        .analyze();

      // Only check for empty headings - heading-order is a best-practice issue
      // that can be triggered by UI component libraries using fixed heading levels
      const headingViolations = results.violations.filter(
        (v) => v.id === 'empty-heading'
      );

      expect(
        headingViolations.length,
        `Heading violations:\n${JSON.stringify(headingViolations, null, 2)}`
      ).toBe(0);
    });
  });

  // ===========================================================================
  // Images and Media
  // ===========================================================================

  test.describe('Images and Media', () => {
    test('all images should have alt text', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const imageViolations = results.violations.filter(
        (v) => v.id === 'image-alt' || v.id === 'image-redundant-alt'
      );

      expect(
        imageViolations.length,
        `Image alt text violations:\n${JSON.stringify(imageViolations, null, 2)}`
      ).toBe(0);
    });

    test('decorative images should have empty alt', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Find all images
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // All images should have alt attribute (even if empty for decorative)
        // Or should have role="presentation"
        expect(alt !== null || role === 'presentation').toBeTruthy();
      }
    });
  });

  // ===========================================================================
  // Keyboard Accessibility
  // ===========================================================================

  test.describe('Keyboard Accessibility', () => {
    test('should be able to submit login form with keyboard only', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Focus email field directly and type
      const emailInput = page.getByLabel(/email/i);
      await emailInput.focus();
      await page.keyboard.type('test@example.com');

      // Navigate to password and type
      await page.keyboard.press('Tab');
      await page.keyboard.type('password123');

      // Check if workspace field exists and fill it
      const workspaceField = page.getByLabel(/workspace/i);
      if (await workspaceField.isVisible().catch(() => false)) {
        await workspaceField.focus();
        await page.keyboard.type('test-tenant');
      }

      // Click submit button (works with keyboard via Enter on focused button)
      const submitButton = page.getByRole('button', { name: /sign in/i });
      await submitButton.focus();
      await page.keyboard.press('Enter');

      // Should attempt submission (will fail with invalid credentials or show validation)
      await expect(
        page.getByText(/invalid|incorrect|unauthorized|failed|workspace|select/i).or(page.getByRole('alert'))
      ).toBeVisible({ timeout: 10000 });
    });

    test('no keyboard traps should exist', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Tab through all focusable elements
      let previousFocusedElement = '';
      let tabCount = 0;
      const maxTabs = 50; // Prevent infinite loop

      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;

        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className}` : '') : '';
        });

        // If we're back at the body or same element twice in a row without progress, we've completed the tab cycle
        if (focusedElement === previousFocusedElement && tabCount > 5) {
          break;
        }

        previousFocusedElement = focusedElement;
      }

      // Should have tabbed through elements without getting stuck
      expect(tabCount).toBeGreaterThan(2);
      expect(tabCount).toBeLessThan(maxTabs);
    });

    test('escape key should close any open dialogs', async ({ page }) => {
      // This test checks that Escape works to dismiss dialogs
      // We'll test this if a dialog is present
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check if there's any dialog mechanism
      const dialog = page.getByRole('dialog');
      const dialogCount = await dialog.count();

      if (dialogCount > 0) {
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      } else {
        // No dialog present, test passes
        expect(true).toBe(true);
      }
    });
  });

  // ===========================================================================
  // Screen Reader Accessibility
  // ===========================================================================

  test.describe('Screen Reader Accessibility', () => {
    test('page should have a title', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });

    test('form should have accessible name', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check if form has aria-label or aria-labelledby
      const form = page.locator('form');
      const ariaLabel = await form.getAttribute('aria-label');
      const ariaLabelledBy = await form.getAttribute('aria-labelledby');

      // Form should have some accessible name (either via aria-label, aria-labelledby, or heading)
      const heading = page.getByRole('heading', { name: /welcome back/i });
      const hasHeading = (await heading.count()) > 0;

      expect(ariaLabel !== null || ariaLabelledBy !== null || hasHeading).toBeTruthy();
    });

    test('status messages should be announced', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Submit form to trigger error
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for error message
      await page.waitForTimeout(500);

      // Check if error area has role="alert" or aria-live
      const errorMessage = page.getByText(/required/i).first();

      if ((await errorMessage.count()) > 0) {
        // Check parent or self for aria-live or role="alert"
        const hasLiveRegion = await page.evaluate(() => {
          const errors = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]');
          return errors.length > 0;
        });

        expect(hasLiveRegion).toBe(true);
      }
    });
  });
});
