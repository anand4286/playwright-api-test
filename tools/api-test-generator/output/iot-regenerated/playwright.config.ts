import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: 'https://api.iotplatform.com/v2',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'API Tests',
      testDir: './tests',
      use: {
        baseURL: 'https://api.iotplatform.com/v2',
      },
    },
  ],
});