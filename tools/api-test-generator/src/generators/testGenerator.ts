import fs from 'fs-extra';
import path from 'path';
import type { APIAnalysis, EndpointInfo, TestGenerationResult, RequestBodyInfo, ResponseInfo, ParameterInfo } from '../types.js';

/**
 * Generate Playwright API tests from OpenAPI specification
 */
export async function generatePlaywrightTests(
  api: any,
  analysis: APIAnalysis,
  outputDir: string
): Promise<TestGenerationResult> {
  const testDir = path.join(outputDir, 'tests');
  await fs.ensureDir(testDir);
  
  const testFiles: string[] = [];
  let totalTests = 0;
  
  // Group endpoints by tags for organized test files
  const endpointsByTag = groupEndpointsByTag(analysis.endpoints);
  
  // Generate configuration file
  await generatePlaywrightConfig(testDir, analysis.baseUrl);
  
  // Generate base test setup
  await generateBaseTestSetup(testDir, analysis);
  
  // Generate test files for each tag
  for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
    const testFile = await generateTestFileForTag(testDir, tag, endpoints, analysis);
    testFiles.push(testFile);
    totalTests += endpoints.length * 2; // Positive and negative tests
  }
  
  // Generate coverage report
  const coverageReport = await generateCoverageReport(testDir, analysis, totalTests);
  
  return {
    testFiles,
    testSuites: Object.keys(endpointsByTag).length,
    totalTests,
    coverageReport
  };
}

/**
 * Group endpoints by their primary tag
 */
function groupEndpointsByTag(endpoints: EndpointInfo[]): Record<string, EndpointInfo[]> {
  const grouped: Record<string, EndpointInfo[]> = {};
  
  for (const endpoint of endpoints) {
    const tag = endpoint.tags[0] || 'default';
    if (!grouped[tag]) {
      grouped[tag] = [];
    }
    grouped[tag].push(endpoint);
  }
  
  return grouped;
}

/**
 * Generate Playwright configuration file
 */
async function generatePlaywrightConfig(testDir: string, baseUrl: string): Promise<void> {
  const config = `import { defineConfig } from '@playwright/test';

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
    baseURL: '${baseUrl}',
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
        baseURL: '${baseUrl}',
      },
    },
  ],
});`;

  await fs.writeFile(path.join(testDir, '..', 'playwright.config.ts'), config);
}

/**
 * Generate base test setup and utilities
 */
async function generateBaseTestSetup(testDir: string, analysis: APIAnalysis): Promise<void> {
  const setupCode = `import { test as base, expect } from '@playwright/test';

export interface TestData {
  apiKey?: string;
  bearerToken?: string;
  userId?: string;
  petId?: string;
  orderId?: string;
}

export const test = base.extend<TestData>({
  apiKey: async ({}, use) => {
    const apiKey = process.env.API_KEY || 'special-key';
    await use(apiKey);
  },
  
  bearerToken: async ({}, use) => {
    const token = process.env.BEARER_TOKEN || '';
    await use(token);
  },
  
  userId: async ({}, use) => {
    const userId = \`user_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
    await use(userId);
  },
  
  petId: async ({}, use) => {
    const petId = Math.floor(Math.random() * 1000000).toString();
    await use(petId);
  },
  
  orderId: async ({}, use) => {
    const orderId = Math.floor(Math.random() * 1000).toString();
    await use(orderId);
  }
});

export { expect };

export class APIClient {
  constructor(private request: any, private baseURL: string) {}
  
  async get(endpoint: string, options: any = {}) {
    return await this.request.get(this.baseURL + endpoint, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }
  
  async post(endpoint: string, data: any = {}, options: any = {}) {
    return await this.request.post(this.baseURL + endpoint, {
      data,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }
  
  async put(endpoint: string, data: any = {}, options: any = {}) {
    return await this.request.put(this.baseURL + endpoint, {
      data,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }
  
  async delete(endpoint: string, options: any = {}) {
    return await this.request.delete(this.baseURL + endpoint, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }
}`;

  await fs.writeFile(path.join(testDir, 'setup.ts'), setupCode);
}

/**
 * Generate test file for a specific tag/module
 */
async function generateTestFileForTag(
  testDir: string,
  tag: string,
  endpoints: EndpointInfo[],
  analysis: APIAnalysis
): Promise<string> {
  const fileName = tag.toLowerCase().replace(/\\s+/g, '-') + '.spec.ts';
  const filePath = path.join(testDir, fileName);
  
  const testContent = generateTestContentForTag(tag, endpoints, analysis);
  await fs.writeFile(filePath, testContent);
  
  return fileName;
}

/**
 * Generate test content for a tag
 */
function generateTestContentForTag(tag: string, endpoints: EndpointInfo[], analysis: APIAnalysis): string {
  let content = `import { test, expect, APIClient } from './setup';

describe('${tag} API Tests', () => {
  let apiClient: APIClient;
  
  test.beforeAll(async ({ request }) => {
    apiClient = new APIClient(request, '${analysis.baseUrl}');
  });

`;

  for (const endpoint of endpoints) {
    content += generateTestsForEndpoint(endpoint);
  }
  
  content += '});\\n';
  
  return content;
}

/**
 * Generate test cases for a specific endpoint
 */
function generateTestsForEndpoint(endpoint: EndpointInfo): string {
  const testName = endpoint.operationId || `${endpoint.method} ${endpoint.path}`;
  
  return `
  test.describe('${testName}', () => {
    test('should work successfully', async ({ request }) => {
      const response = await apiClient.${endpoint.method.toLowerCase()}('${endpoint.path}');
      expect(response.status()).toBeLessThan(400);
    });
    
    test('should handle errors gracefully', async ({ request }) => {
      const response = await apiClient.${endpoint.method.toLowerCase()}('${endpoint.path}/invalid');
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
`;
}

/**
 * Generate coverage report
 */
async function generateCoverageReport(
  testDir: string,
  analysis: APIAnalysis,
  totalTests: number
): Promise<string> {
  const reportPath = path.join(testDir, '..', 'coverage-report.md');
  
  const report = `# API Test Coverage Report

## Summary
- **Total Endpoints**: ${analysis.endpoints.length}
- **Total Tests Generated**: ${totalTests}
- **Coverage**: ${((totalTests / (analysis.endpoints.length * 2)) * 100).toFixed(1)}%

## Endpoints Coverage

| Method | Path | Operation ID | Status |
|--------|------|--------------|--------|
${analysis.endpoints.map(e => 
    `| ${e.method} | ${e.path} | ${e.operationId || 'N/A'} | ✅ Covered |`
  ).join('\\n')}

## Test Files Generated
${analysis.tags.map(tag => `- ${tag.toLowerCase().replace(/\\s+/g, '-')}.spec.ts`).join('\\n')}

Generated on: ${new Date().toISOString()}
`;

  await fs.writeFile(reportPath, report);
  return reportPath;
}
