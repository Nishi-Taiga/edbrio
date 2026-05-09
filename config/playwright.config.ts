import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') })

export default defineConfig({
  testDir: '../tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], locale: 'ja-JP' },
    },
    {
      name: 'flows',
      testDir: '../tests/e2e/flows',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'ja-JP',
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
      },
      globalSetup: path.resolve(__dirname, '../tests/e2e/fixtures/seed.ts'),
      globalTeardown: path.resolve(__dirname, '../tests/e2e/fixtures/cleanup.ts'),
    },
    {
      name: 'mobile',
      testDir: '../tests/e2e/flows',
      testMatch: 'mobile-*.spec.ts',
      use: {
        ...devices['iPhone 14'],
        locale: 'ja-JP',
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
      },
      globalSetup: path.resolve(__dirname, '../tests/e2e/fixtures/seed.ts'),
      globalTeardown: path.resolve(__dirname, '../tests/e2e/fixtures/cleanup.ts'),
    },
  ],
})
