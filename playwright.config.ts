import { defineConfig, devices } from '@playwright/test'

// Key UI flows against the real static export, with Supabase stubbed at the network layer
// (tests/e2e/stub.ts). Run: npm run test:e2e
// Locally this uses the installed Microsoft Edge (no browser download). In CI set
// PW_CHANNEL=chromium after `npx playwright install chromium`.
const channel = process.env.PW_CHANNEL || 'msedge'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-360', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 }, channel } },
    { name: 'desktop', use: { ...devices['Desktop Edge'], channel } },
  ],
  webServer: {
    command: 'node scripts/build-test.mjs && node scripts/serve-out.mjs 4173',
    url: 'http://localhost:4173/bn/',
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
})
