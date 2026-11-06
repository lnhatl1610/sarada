import { defineConfig } from '@playwright/test'

const baseURL = process.env.E2E_STOREFRONT_URL ?? 'http://127.0.0.1:5173'
const mutationsEnabled = process.env.E2E_ALLOW_MUTATIONS === 'true'

if (mutationsEnabled && process.env.E2E_ISOLATED_DATABASE !== 'true') {
  throw new Error('Set E2E_ISOLATED_DATABASE=true only when the API uses a disposable test database.')
}

if (mutationsEnabled && !['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) {
  throw new Error('Mutation E2E scenarios are restricted to a local Storefront URL.')
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
