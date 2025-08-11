import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Determine environment from TEST_ENV variable or default to 'dev'
const environment = process.env.TEST_ENV || 'dev';
const envFile = path.join(process.cwd(), 'environments', `${environment}.env`);

// Load environment-specific configuration
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`🌍 Loading configuration for: ${environment.toUpperCase()}`);
} else {
  console.warn(`⚠️  Environment file not found: ${envFile}, using default .env`);
  dotenv.config();
}

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: parseInt(process.env.RETRIES) || (process.env.CI ? 2 : 0),
  workers: parseInt(process.env.PARALLEL_WORKERS) || (process.env.CI ? 1 : undefined),
  timeout: parseInt(process.env.TIMEOUT) || 30000,
  globalTeardown: './utils/globalTeardown.ts',
  reporter: [
    ['html', { outputFolder: `reports/${environment}-html-report`, open: 'never' }],
    ['json', { outputFile: `reports/${environment}-test-results.json` }],
    ['junit', { outputFile: `reports/${environment}-junit-results.xml` }],
    ['./utils/customReporter.ts']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://jsonplaceholder.typicode.com',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Environment': environment,
      'X-API-Key': process.env.API_KEY || '',
    },
    ignoreHTTPSErrors: process.env.NODE_ENV !== 'production',
    // Trace configuration for debugging and analysis
    trace: process.env.CI ? 'on-first-retry' : (process.env.ENABLE_DEBUG_MODE === 'true' ? 'on' : 'on-first-retry'),
    screenshot: process.env.ENABLE_DEBUG_MODE === 'true' ? 'on' : 'only-on-failure',
    video: process.env.ENABLE_DEBUG_MODE === 'true' ? 'on' : 'retain-on-failure',
  },
  outputDir: `test-results/${environment}/`,
  
  // Environment-specific project configurations
  projects: [
    // Development Environment
    {
      name: `${environment}-api-tests`,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL,
      },
    },
    
    // Environment with enhanced debugging
    {
      name: `${environment}-api-tests-debug`,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL,
        trace: 'on',
        screenshot: 'on',
        video: 'on',
      },
    },
    
    // Environment for performance testing
    {
      name: `${environment}-performance-tests`,
      testMatch: '**/performance-*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
    
    // Environment for security testing
    {
      name: `${environment}-security-tests`,
      testMatch: '**/security-*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL,
        ignoreHTTPSErrors: false, // Strict SSL for security tests
      },
    },
  ],
});
