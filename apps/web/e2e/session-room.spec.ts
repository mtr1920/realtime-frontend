/**
 * Session Room Video E2E Tests
 *
 * Tests WebRTC video functionality in the session room.
 * Requires a running backend with WebSocket support.
 */

import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

test.describe('Session Room Video', () => {
  // Helper to set mock auth state
  async function mockAuth(page: Page): Promise<void> {
    await page.goto('/');
    await page.evaluate(() => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        tenantId: 'test-tenant',
        role: 'ADMIN',
      };

      const mockAuthState = {
        state: {
          user: mockUser,
          token: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          isAuthenticated: true,
          isLoading: false,
        },
        version: 0,
      };

      localStorage.setItem('auth-storage', JSON.stringify(mockAuthState));
    });
  }

  // Helper to mock session config with video enabled
  async function mockSessionWithVideo(page: Page): Promise<void> {
    await page.evaluate(() => {
      const mockSession = {
        state: {
          sessionId: 'test-session',
          localParticipantId: 'local-participant',
          session: {
            id: 'test-session',
            config: {
              enabledModules: ['video', 'audio', 'chat'],
            },
          },
          participants: new Map([
            [
              'local-participant',
              {
                id: 'local-participant',
                displayName: 'Test User',
                role: {
                  permissions: { canPublishAudio: true, canPublishVideo: true },
                },
              },
            ],
          ]),
        },
      };
      localStorage.setItem('session-storage', JSON.stringify(mockSession));
    });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // ===========================================================================
  // Video Grid Display
  // ===========================================================================

  test.describe('Video Grid Display', () => {
    test.skip('should display video grid container when video module enabled', async ({
      page,
    }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      // Wait for lazy load
      await expect(page.getByTestId('video-grid-container')).toBeVisible({
        timeout: 15000,
      });
    });

    test.skip('should show loading state while video grid loads', async ({
      page,
    }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      // Loading state should appear briefly
      await expect(page.getByTestId('video-grid-container')).toBeVisible({
        timeout: 15000,
      });
    });

    test.skip('should display local participant video tile', async ({
      page,
    }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      await expect(page.getByTestId('video-grid-container')).toBeVisible({
        timeout: 15000,
      });

      // Local participant should be visible
      await expect(page.getByText('Test User')).toBeVisible();
    });
  });

  // ===========================================================================
  // Media Controls
  // ===========================================================================

  test.describe('Media Controls', () => {
    test.skip('should have microphone toggle button', async ({ page }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      const micButton = page.getByRole('button', { name: /microphone|mute/i });
      await expect(micButton).toBeVisible({ timeout: 10000 });
    });

    test.skip('should have camera toggle button', async ({ page }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      const cameraButton = page.getByRole('button', { name: /camera|video/i });
      await expect(cameraButton).toBeVisible({ timeout: 10000 });
    });

    test.skip('should toggle microphone on click', async ({ page }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      const micButton = page.getByRole('button', { name: /microphone|mute/i });
      await expect(micButton).toBeVisible({ timeout: 10000 });

      // Get initial state
      const initialPressed = await micButton.getAttribute('aria-pressed');

      // Click to toggle
      await micButton.click();

      // State should change
      await expect(micButton).toHaveAttribute(
        'aria-pressed',
        initialPressed === 'true' ? 'false' : 'true'
      );
    });

    test.skip('should toggle camera on click', async ({ page }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      const cameraButton = page.getByRole('button', { name: /camera|video/i });
      await expect(cameraButton).toBeVisible({ timeout: 10000 });

      // Get initial state
      const initialPressed = await cameraButton.getAttribute('aria-pressed');

      // Click to toggle
      await cameraButton.click();

      // State should change
      await expect(cameraButton).toHaveAttribute(
        'aria-pressed',
        initialPressed === 'true' ? 'false' : 'true'
      );
    });

    test.skip('should have screen share button', async ({ page }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      const screenShareButton = page.getByRole('button', {
        name: /screen.*share|share.*screen/i,
      });
      await expect(screenShareButton).toBeVisible({ timeout: 10000 });
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  test.describe('Accessibility', () => {
    test.skip('should have accessible labels for media controls', async ({
      page,
    }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      // All buttons should have aria-label
      const micButton = page.getByRole('button', { name: /microphone|mute/i });
      const cameraButton = page.getByRole('button', { name: /camera|video/i });
      const leaveButton = page.getByRole('button', { name: /leave/i });

      await expect(micButton).toHaveAttribute('aria-label');
      await expect(cameraButton).toHaveAttribute('aria-label');
      await expect(leaveButton).toHaveAttribute('aria-label');
    });

    test.skip('should have aria-pressed on toggle buttons', async ({
      page,
    }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      const micButton = page.getByRole('button', { name: /microphone|mute/i });
      await expect(micButton).toHaveAttribute('aria-pressed');
    });

    test.skip('should be keyboard navigable', async ({ page }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      // Tab to controls
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Focus should be on a control button
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveRole('button');
    });
  });

  // ===========================================================================
  // Config-Driven Rendering
  // ===========================================================================

  test.describe('Config-Driven Rendering', () => {
    test.skip('should show audio-only view when video module disabled', async ({
      page,
    }) => {
      await mockAuth(page);

      // Mock session WITHOUT video module
      await page.evaluate(() => {
        const mockSession = {
          state: {
            sessionId: 'test-session',
            localParticipantId: 'local-participant',
            session: {
              id: 'test-session',
              config: {
                enabledModules: ['audio', 'chat'], // No video
              },
            },
            participants: new Map([
              [
                'local-participant',
                {
                  id: 'local-participant',
                  displayName: 'Test User',
                  role: {
                    permissions: {
                      canPublishAudio: true,
                      canPublishVideo: false,
                    },
                  },
                },
              ],
            ]),
          },
        };
        localStorage.setItem('session-storage', JSON.stringify(mockSession));
      });

      await page.goto('/sessions/test-session/room');

      // Should show audio-only view
      await expect(
        page.getByRole('region', { name: /audio.*session/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test.skip('should not show camera button when canPublishVideo is false', async ({
      page,
    }) => {
      await mockAuth(page);

      await page.evaluate(() => {
        const mockSession = {
          state: {
            sessionId: 'test-session',
            localParticipantId: 'local-participant',
            session: {
              id: 'test-session',
              config: {
                enabledModules: ['audio'],
              },
            },
            participants: new Map([
              [
                'local-participant',
                {
                  id: 'local-participant',
                  displayName: 'Test User',
                  role: {
                    permissions: {
                      canPublishAudio: true,
                      canPublishVideo: false,
                    },
                  },
                },
              ],
            ]),
          },
        };
        localStorage.setItem('session-storage', JSON.stringify(mockSession));
      });

      await page.goto('/sessions/test-session/room');

      // Camera button should not be visible
      const cameraButton = page.getByRole('button', { name: /camera|video/i });
      await expect(cameraButton).not.toBeVisible({ timeout: 5000 });
    });
  });

  // ===========================================================================
  // Leave Session
  // ===========================================================================

  test.describe('Leave Session', () => {
    test.skip('should have leave button', async ({ page }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      const leaveButton = page.getByRole('button', { name: /leave/i });
      await expect(leaveButton).toBeVisible({ timeout: 10000 });
    });

    test.skip('should navigate away when leave button clicked', async ({
      page,
    }) => {
      await mockAuth(page);
      await mockSessionWithVideo(page);
      await page.goto('/sessions/test-session/room');

      const leaveButton = page.getByRole('button', { name: /leave/i });
      await leaveButton.click();

      // Should navigate away from room
      await expect(page).not.toHaveURL(/room/, { timeout: 10000 });
    });
  });
});
