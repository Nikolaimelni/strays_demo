import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_URL: 'http://localhost:3000',
      MEDIA_ORIGIN: 'https://example.r2.cloudflarestorage.com',
      VITE_CONTACT_EMAIL: 'e2e@example.test',
      VITE_MOCK_API: 'true',
    },
  },
});
