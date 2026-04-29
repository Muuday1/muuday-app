import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'path'
import dotenv from 'dotenv'

// Load .env.local so e2e vars (E2E_USER_EMAIL, etc.) are available without manual export
// dotenv does not override existing env vars by default, matching previous behaviour
dotenv.config({ path: resolve(__dirname, '.env.local') })

const baseURL = process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default defineConfig({
  globalSetup: './tests/e2e/global-setup.ts',
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
