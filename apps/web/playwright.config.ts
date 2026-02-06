import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // =========================================================================
    // Auth Setup - runs first to create auth state
    // =========================================================================
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // =========================================================================
    // Unauthenticated Tests - public pages, auth flow
    // =========================================================================
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [
        /.*\.visual\.spec\.ts/,
        /.*\.mobile\.spec\.ts/,
        /.*\.setup\.ts/,
        /admin\.spec\.ts/,
        /session\.spec\.ts/,
        /session-room\.spec\.ts/,
        /data-table-filters\.spec\.ts/,
      ],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: [
        /.*\.visual\.spec\.ts/,
        /.*\.mobile\.spec\.ts/,
        /.*\.setup\.ts/,
        /admin\.spec\.ts/,
        /session\.spec\.ts/,
        /session-room\.spec\.ts/,
        /data-table-filters\.spec\.ts/,
      ],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: [
        /.*\.visual\.spec\.ts/,
        /.*\.mobile\.spec\.ts/,
        /.*\.setup\.ts/,
        /admin\.spec\.ts/,
        /session\.spec\.ts/,
        /session-room\.spec\.ts/,
        /data-table-filters\.spec\.ts/,
      ],
    },

    // =========================================================================
    // Authenticated Tests - require login (depends on setup)
    // =========================================================================
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: [/admin\.spec\.ts/, /session\.spec\.ts/, /session-room\.spec\.ts/, /data-table-filters\.spec\.ts/],
    },

    // =========================================================================
    // Visual Regression Tests
    // =========================================================================
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.visual\.spec\.ts/,
    },

    // =========================================================================
    // Mobile Tests
    // =========================================================================
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        // Use chromium for mobile emulation since webkit requires system dependencies
        browserName: 'chromium',
      },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
