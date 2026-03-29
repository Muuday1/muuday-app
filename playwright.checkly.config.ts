import { defineConfig, devices } from '@playwright/test'

const baseURL =
  process.env.CHECKLY_BASE_URL ||
  process.env.BASE_URL ||
  process.env.E2E_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://muuday-app.vercel.app'

export default defineConfig({
  testDir: './checkly/tests',
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
