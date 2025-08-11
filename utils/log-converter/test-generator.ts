import * as fs from 'fs';
import * as path from 'path';
import { ParsedTest, TestStep, ParsedRequest, ParsedResponse } from './log-analyzer.js';

/**
 * Test Generator - Converts parsed logs into Playwright test files
 * 
 * Purpose: Generate complete test files, fixtures, utilities, and data from log analysis
 * Features: Multi-environment support, dynamic data generation, reusable components
 */

export interface GenerationConfig {
  outputDirectory: string;
  projectName: string;
  environments: string[];
  reuseExistingComponents: boolean;
  generateDataFiles: boolean;
  generateUtilities: boolean;
  generateFixtures: boolean;
  templateStyle: 'typescript' | 'javascript';
}

export interface GeneratedFile {
  filePath: string;
  content: string;
  type: 'test' | 'fixture' | 'utility' | 'data' | 'config';
  description: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  summary: {
    testsGenerated: number;
    fixturesGenerated: number;
    utilitiesGenerated: number;
    dataFilesGenerated: number;
  };
  recommendations: string[];
}

export class TestGenerator {
  private config: GenerationConfig;
  private existingComponents: Map<string, string> = new Map();
  private generatedEndpoints: Set<string> = new Set();
  private generatedDataTypes: Set<string> = new Set();

  constructor(config: GenerationConfig) {
    this.config = config;
    this.analyzeExistingComponents();
  }

  /**
   * Generate complete test suite from parsed logs
   */
  async generateTestSuite(tests: ParsedTest[]): Promise<GenerationResult> {
    console.log(`🏗️  Generating test suite for ${tests.length} tests...`);
    
    const files: GeneratedFile[] = [];
    const recommendations: string[] = [];

    // Ensure output directory exists
    this.ensureDirectoryExists(this.config.outputDirectory);

    // Group tests by suite
    const testsBySuite = this.groupTestsBySuite(tests);

    // Generate test files for each suite
    for (const [suiteName, suiteTests] of testsBySuite.entries()) {
      console.log(`📝 Generating suite: ${suiteName} (${suiteTests.length} tests)`);
      
      const suiteFiles = await this.generateSuiteFiles(suiteName, suiteTests);
      files.push(...suiteFiles);
    }

    // Generate shared components
    if (this.config.generateFixtures) {
      const fixtureFiles = await this.generateFixtures(tests);
      files.push(...fixtureFiles);
    }

    if (this.config.generateUtilities) {
      const utilityFiles = await this.generateUtilities(tests);
      files.push(...utilityFiles);
    }

    if (this.config.generateDataFiles) {
      const dataFiles = await this.generateDataFiles(tests);
      files.push(...dataFiles);
    }

    // Generate environment configs
    const configFiles = await this.generateEnvironmentConfigs();
    files.push(...configFiles);

    // Write all files
    await this.writeFiles(files);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(tests, files));

    console.log(`✅ Generation complete: ${files.length} files created`);

    return {
      files,
      summary: {
        testsGenerated: files.filter(f => f.type === 'test').length,
        fixturesGenerated: files.filter(f => f.type === 'fixture').length,
        utilitiesGenerated: files.filter(f => f.type === 'utility').length,
        dataFilesGenerated: files.filter(f => f.type === 'data').length
      },
      recommendations
    };
  }

  /**
   * Group tests by suite for organized generation
   */
  private groupTestsBySuite(tests: ParsedTest[]): Map<string, ParsedTest[]> {
    const grouped = new Map<string, ParsedTest[]>();
    
    tests.forEach(test => {
      const suite = test.suite || 'General';
      if (!grouped.has(suite)) {
        grouped.set(suite, []);
      }
      grouped.get(suite)!.push(test);
    });
    
    return grouped;
  }

  /**
   * Generate test files for a suite
   */
  private async generateSuiteFiles(suiteName: string, tests: ParsedTest[]): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // Create suite directory
    const suiteDir = path.join(this.config.outputDirectory, 'tests', this.sanitizeFileName(suiteName));
    this.ensureDirectoryExists(suiteDir);

    // Generate test file for the suite
    const testFile = await this.generateTestFile(suiteName, tests);
    files.push({
      filePath: path.join(suiteDir, `${this.sanitizeFileName(suiteName)}.spec.ts`),
      content: testFile,
      type: 'test',
      description: `Test suite for ${suiteName} (${tests.length} tests)`
    });

    return files;
  }

  /**
   * Generate a complete test file
   */
  private async generateTestFile(suiteName: string, tests: ParsedTest[]): Promise<string> {
    const imports = this.generateImports();
    const suiteDescription = this.generateSuiteDescription(suiteName, tests);
    const beforeHooks = this.generateBeforeHooks(tests);
    const testCases = tests.map(test => this.generateTestCase(test)).join('\n\n');
    const afterHooks = this.generateAfterHooks(tests);

    return `${imports}

${suiteDescription}
${beforeHooks}

${testCases}

${afterHooks}
});`;
  }

  /**
   * Generate test imports
   */
  private generateImports(): string {
    const baseImports = `import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import { API_ENDPOINTS } from '../../config/endpoints.js';
import type { User } from '../../types/index.js';`;

    // Add dynamic imports based on detected patterns
    const dynamicImports: string[] = [];
    
    if (this.generatedEndpoints.has('auth')) {
      dynamicImports.push("import { AuthUtils } from '../../utils/auth-utils.js';");
    }
    
    if (this.generatedDataTypes.has('user')) {
      dynamicImports.push("import { UserDataGenerator } from '../../utils/user-data-generator.js';");
    }

    return [baseImports, ...dynamicImports].join('\n');
  }

  /**
   * Generate suite description and setup
   */
  private generateSuiteDescription(suiteName: string, tests: ParsedTest[]): string {
    const tags = [...new Set(tests.flatMap(t => t.tags))];
    const tagComment = tags.length > 0 ? `\n * Tags: ${tags.map(t => `@${t}`).join(', ')}` : '';
    
    return `
/**
 * ${suiteName} Test Suite
 * 
 * Generated from log analysis
 * Tests: ${tests.length}${tagComment}
 * 
 * Purpose: Automated test suite generated from legacy API logs
 * Dependencies: TestActions, TestDataLoader, API_ENDPOINTS
 */
test.describe('${suiteName}', () => {
  let testActions: TestActions;
  let testData: any;`;
  }

  /**
   * Generate before hooks
   */
  private generateBeforeHooks(tests: ParsedTest[]): string {
    const needsAuthSetup = tests.some(test => 
      test.steps.some(step => 
        step.requests.some(req => 
          req.headers?.authorization || req.scenarioName?.includes('auth')
        )
      )
    );

    const needsUserCreation = tests.some(test =>
      test.steps.some(step =>
        step.requests.some(req =>
          req.body && typeof req.body === 'object' && 
          (req.body.email || req.body.username || req.body.name)
        )
      )
    );

    let hooks = `
  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    testData = TestDataLoader.loadTestData();`;

    if (needsUserCreation) {
      hooks += `
    
    // Setup test user for suite
    testData.user = await testActions.createTestUser(testData);`;
    }

    if (needsAuthSetup) {
      hooks += `
    
    // Setup authentication
    testData.auth = await testActions.setupAuthentication(testData.user.id);`;
    }

    hooks += `
  });`;

    return hooks;
  }

  /**
   * Generate individual test case
   */
  private generateTestCase(test: ParsedTest): string {
    const tags = test.tags.length > 0 ? ` ${test.tags.map(t => `@${t}`).join(' ')}` : '';
    const testDescription = this.generateTestDescription(test);
    const testSteps = test.steps.map((step, index) => this.generateTestStep(step, index)).join('\n\n');

    return `  /**
   * ${testDescription}
   */
  test('${test.testName}${tags}', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
${testSteps}
  });`;
  }

  /**
   * Generate test description
   */
  private generateTestDescription(test: ParsedTest): string {
    const stepCount = test.steps.length;
    const apiCallCount = test.steps.reduce((total, step) => total + step.requests.length, 0);
    
    return `${test.testName}
   * 
   * Generated from: ${test.testFile}
   * Steps: ${stepCount}
   * API Calls: ${apiCallCount}
   * Tags: ${test.tags.join(', ')}`;
  }

  /**
   * Generate test step implementation
   */
  private generateTestStep(step: TestStep, stepIndex: number): string {
    const stepComment = `    // Step ${stepIndex + 1}: ${step.stepName}`;
    const stepImplementation = step.requests.map(req => this.generateApiCall(req, step)).join('\n');
    const assertions = this.generateAssertions(step);

    return `${stepComment}
    apiHelper.setStep('${step.stepName}');
    
${stepImplementation}
${assertions}`;
  }

  /**
   * Generate API call implementation
   */
  private generateApiCall(request: ParsedRequest, step: TestStep): string {
    const method = request.method.toLowerCase();
    const endpoint = this.extractEndpointVariable(request.url);
    const hasBody = request.body && Object.keys(request.body).length > 0;
    const hasHeaders = request.headers && Object.keys(request.headers).length > 0;

    // Track endpoints for utility generation
    this.generatedEndpoints.add(endpoint);

    const actionMethod = this.getTestActionMethod(request, step);
    
    let apiCall = `    const result = await testActions.${actionMethod}(`;

    // Handle makeRequest method differently
    if (actionMethod === 'makeRequest') {
      const genericParams = this.generateGenericMethodCall(request);
      apiCall += genericParams;
    } else {
      // Add parameters for other TestAction methods
      const params: string[] = [];
      
      if (this.requiresUserId(request)) {
        params.push('testData.user.id');
      }
      
      if (hasBody) {
        params.push(this.generateRequestBody(request.body));
      }
      
      if (request.scenarioName) {
        params.push(`'${request.scenarioName}'`);
      }

      apiCall += params.join(', ');
    }

    apiCall += ');';

    return apiCall;
  }

  /**
   * Determine appropriate TestAction method for request
   */
  private getTestActionMethod(request: ParsedRequest, step: TestStep): string {
    const method = request.method.toLowerCase();
    const url = request.url.toLowerCase();
    const stepName = step.stepName.toLowerCase();

    // Map common patterns to TestAction methods
    if (stepName.includes('create') || stepName.includes('register')) {
      if (url.includes('user')) return 'createTestUser';
      return 'testUserRegistration';
    }
    
    if (stepName.includes('update') && url.includes('user')) {
      if (url.includes('email')) return 'updateEmailAddress';
      if (url.includes('phone')) return 'updatePhoneNumber';
      if (url.includes('address')) return 'updateAddress';
      return 'updateUserProfile';
    }
    
    if (stepName.includes('get') || stepName.includes('retrieve')) {
      if (url.includes('user')) return 'getUserProfile';
      if (url.includes('users')) return 'getAllUsers';
    }
    
    if (stepName.includes('delete')) {
      return 'testUserDeletion';
    }
    
    if (stepName.includes('auth') || stepName.includes('login')) {
      return 'setupAuthentication';
    }

    // Fallback to generic method name
    return 'makeRequest';
  }

  /**
   * Generate generic method call for unknown patterns
   */
  private generateGenericMethodCall(request: ParsedRequest): string {
    const method = request.method.toLowerCase();
    const endpoint = this.extractEndpointVariable(request.url);
    
    if (request.body && Object.keys(request.body).length > 0) {
      return `'${method.toUpperCase()}', ${endpoint}, ${JSON.stringify(request.body, null, 2)}`;
    }
    
    return `'${method.toUpperCase()}', ${endpoint}`;
  }

  /**
   * Extract endpoint as variable reference
   */
  private extractEndpointVariable(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Map common paths to endpoint constants
      if (path.includes('/users/') && path.match(/\/users\/\d+$/)) {
        return 'API_ENDPOINTS.USER_BY_ID(testData.user.id)';
      }
      if (path === '/users') {
        return 'API_ENDPOINTS.USERS';
      }
      if (path.includes('/posts')) {
        return 'API_ENDPOINTS.POSTS';
      }
      
      return `'${path}'`;
    } catch {
      return `'${url}'`;
    }
  }

  /**
   * Check if request requires user ID
   */
  private requiresUserId(request: ParsedRequest): boolean {
    const url = request.url.toLowerCase();
    return url.includes('/users/') && 
           (request.method === 'GET' || request.method === 'PUT' || request.method === 'DELETE');
  }

  /**
   * Generate request body
   */
  private generateRequestBody(body: any): string {
    if (!body || typeof body !== 'object') {
      return 'null';
    }

    // Generate dynamic data based on patterns
    const dynamicBody: any = {};
    
    Object.keys(body).forEach(key => {
      const value = body[key];
      
      if (key === 'email' || key.includes('email')) {
        dynamicBody[key] = 'testActions.generateUniqueEmail()';
      } else if (key === 'phone' || key.includes('phone')) {
        dynamicBody[key] = 'testActions.generateUniquePhone()';
      } else if (key === 'name' || key.includes('name')) {
        dynamicBody[key] = 'testData.user.fullName';
      } else if (key === 'username') {
        dynamicBody[key] = 'testData.user.username';
      } else if (typeof value === 'string' && value.includes('@')) {
        dynamicBody[key] = 'testActions.generateUniqueEmail()';
      } else if (typeof value === 'string' && value.startsWith('+')) {
        dynamicBody[key] = 'testActions.generateUniquePhone()';
      } else if (typeof value === 'object' && value !== null) {
        dynamicBody[key] = this.generateRequestBody(value);
      } else {
        dynamicBody[key] = JSON.stringify(value);
      }
    });

    return `{\n      ${Object.keys(dynamicBody).map(key => 
      `${key}: ${dynamicBody[key]}`
    ).join(',\n      ')}\n    }`;
  }

  /**
   * Generate assertions for test step
   */
  private generateAssertions(step: TestStep): string {
    const assertions: string[] = [];
    
    step.responses.forEach(response => {
      // Status assertions
      if (response.status >= 200 && response.status < 300) {
        assertions.push('    testActions.assertSuccessResponse(result);');
      } else if (response.status >= 400) {
        assertions.push(`    testActions.assertErrorResponse(result, ${response.status});`);
      }
      
      // Response body assertions
      if (response.body && typeof response.body === 'object') {
        const bodyAssertions = this.generateBodyAssertions(response.body);
        assertions.push(...bodyAssertions);
      }
    });

    return assertions.length > 0 ? assertions.join('\n') : '    // No specific assertions generated';
  }

  /**
   * Generate assertions for response body
   */
  private generateBodyAssertions(body: any): string[] {
    const assertions: string[] = [];
    
    if (body.id) {
      assertions.push('    expect(result.responseBody.id).toBeDefined();');
    }
    
    if (body.email) {
      assertions.push('    expect(result.responseBody.email).toMatch(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/);');
    }
    
    if (body.name) {
      assertions.push('    expect(result.responseBody.name).toBeTruthy();');
    }

    return assertions;
  }

  /**
   * Generate after hooks
   */
  private generateAfterHooks(tests: ParsedTest[]): string {
    const needsCleanup = tests.some(test => 
      test.steps.some(step => 
        step.requests.some(req => req.method === 'POST' && req.url.includes('/users'))
      )
    );

    if (!needsCleanup) {
      return '';
    }

    return `
  test.afterEach(async () => {
    // Cleanup any created test data
    if (testData.user?.id) {
      try {
        await testActions.testUserDeletion(testData.user.id);
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }
  });`;
  }

  /**
   * Generate fixture files
   */
  private async generateFixtures(tests: ParsedTest[]): Promise<GeneratedFile[]> {
    // Implementation for generating fixture files
    return [];
  }

  /**
   * Generate utility files
   */
  private async generateUtilities(tests: ParsedTest[]): Promise<GeneratedFile[]> {
    // Implementation for generating utility files
    return [];
  }

  /**
   * Generate data files
   */
  private async generateDataFiles(tests: ParsedTest[]): Promise<GeneratedFile[]> {
    // Implementation for generating data files
    return [];
  }

  /**
   * Generate environment configuration files
   */
  private async generateEnvironmentConfigs(): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    for (const env of this.config.environments) {
      const config = this.generateEnvironmentConfig(env);
      files.push({
        filePath: path.join(this.config.outputDirectory, 'config', `${env}.config.ts`),
        content: config,
        type: 'config',
        description: `Environment configuration for ${env}`
      });
    }

    return files;
  }

  /**
   * Generate environment configuration
   */
  private generateEnvironmentConfig(environment: string): string {
    const baseUrls: Record<string, string> = {
      dev: 'https://jsonplaceholder.typicode.com',
      staging: 'https://staging-api.example.com',
      qa: 'https://qa-api.example.com',
      prod: 'https://api.example.com'
    };

    return `export const ${environment.toUpperCase()}_CONFIG = {
  baseURL: '${baseUrls[environment] || 'https://api.example.com'}',
  timeout: 10000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};`;
  }

  /**
   * Write all generated files to disk
   */
  private async writeFiles(files: GeneratedFile[]): Promise<void> {
    for (const file of files) {
      this.ensureDirectoryExists(path.dirname(file.filePath));
      fs.writeFileSync(file.filePath, file.content);
      console.log(`📄 Generated: ${file.filePath}`);
    }
  }

  /**
   * Generate recommendations for the generated test suite
   */
  private generateRecommendations(tests: ParsedTest[], files: GeneratedFile[]): string[] {
    const recommendations: string[] = [];
    
    recommendations.push('Review generated test files and customize as needed');
    recommendations.push('Add environment-specific test data');
    recommendations.push('Configure CI/CD pipeline for multi-environment testing');
    recommendations.push('Add custom assertions based on business logic');
    
    if (tests.length > 100) {
      recommendations.push('Consider splitting large test suites into smaller, focused suites');
    }
    
    return recommendations;
  }

  /**
   * Analyze existing components to avoid duplication
   */
  private analyzeExistingComponents(): void {
    if (!this.config.reuseExistingComponents) return;
    
    // Scan existing files and track reusable components
    const existingDirs = [
      path.join(this.config.outputDirectory, 'utils'),
      path.join(this.config.outputDirectory, 'types'),
      path.join(this.config.outputDirectory, 'config')
    ];
    
    existingDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanExistingComponents(dir);
      }
    });
  }

  /**
   * Scan directory for existing components
   */
  private scanExistingComponents(directory: string): void {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
        const componentName = path.basename(file, path.extname(file));
        this.existingComponents.set(componentName, filePath);
      }
    });
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Sanitize filename for file system
   */
  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
