import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    // the map stays off until a visitor turns it on; most specs are about what is on it,
    // so they start as somebody who already did. the one that checks the panel opts out
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:4173',
          localStorage: [{ name: 'strays-map-tiles', value: 'yes' }],
        },
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_URL: 'https://api.invalid',
      MEDIA_ORIGIN: 'https://example.r2.cloudflarestorage.com',
      VITE_CONTACT_EMAIL: 'e2e@example.test',
      VITE_MOCK_API: 'true',
    },
  },
});
