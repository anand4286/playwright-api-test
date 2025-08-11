#!/usr/bin/env npx tsx

/**
 * ENTERPRISE SUPERTEST TO PLAYWRIGHT CONVERTER
 * 
 * Designed for massive scale migrations:
 * - 6000+ tests
 * - 700+ endpoints  
 * - 25 environments
 * - 52,000 total tests
 * 
 * Uses pattern extraction instead of hardcoded values
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';

interface SupertestAnalysis {
  endpoints: EndpointPattern[];
  environments: EnvironmentConfig[];
  testPatterns: TestPattern[];
  dataPatterns: DataPattern[];
  utilities: UtilityPattern[];
}

interface EndpointPattern {
  path: string;
  method: string;
  middleware: string[];
  auth: AuthType;
  parameters: Parameter[];
  responses: ResponsePattern[];
}

interface EnvironmentConfig {
  name: string;
  baseUrl: string;
  config: Record<string, any>;
  secrets: string[];
}

interface TestPattern {
  describe: string;
  tests: TestCase[];
  setup: SetupPattern[];
  teardown: TeardownPattern[];
}

interface TestCase {
  name: string;
  endpoint: string;
  method: string;
  expectedStatus: number;
  assertions: AssertionPattern[];
}

class EnterpriseSupertestConverter {
  private supertestPath: string;
  private playwrightPath: string;
  private analysis: SupertestAnalysis;

  constructor(supertestPath: string, playwrightPath: string) {
    this.supertestPath = supertestPath;
    this.playwrightPath = playwrightPath;
  }

  /**
   * PHASE 1: Analyze existing Supertest codebase
   */
  async analyzeSupertest(): Promise<SupertestAnalysis> {
    console.log('🔍 ANALYZING SUPERTEST CODEBASE');
    console.log('===============================');

    const analysis: SupertestAnalysis = {
      endpoints: await this.extractEndpoints(),
      environments: await this.extractEnvironments(),
      testPatterns: await this.extractTestPatterns(),
      dataPatterns: await this.extractDataPatterns(),
      utilities: await this.extractUtilities()
    };

    console.log(\`📊 Analysis Results:\`);
    console.log(\`   Endpoints: \${analysis.endpoints.length}\`);
    console.log(\`   Environments: \${analysis.environments.length}\`);
    console.log(\`   Test Patterns: \${analysis.testPatterns.length}\`);
    console.log(\`   Data Patterns: \${analysis.dataPatterns.length}\`);
    console.log(\`   Utilities: \${analysis.utilities.length}\`);

    this.analysis = analysis;
    return analysis;
  }

  /**
   * PHASE 2: Extract Playwright patterns from working tests
   */
  async extractPlaywrightPatterns(): Promise<PlaywrightPatterns> {
    console.log('🎭 EXTRACTING PLAYWRIGHT PATTERNS');
    console.log('=================================');

    const patterns = {
      testStructure: await this.analyzePlaywrightStructure(),
      fixtures: await this.analyzePlaywrightFixtures(),
      testActions: await this.analyzeTestActions(),
      configurations: await this.analyzeConfigurations()
    };

    console.log(\`✅ Extracted \${Object.keys(patterns).length} pattern types\`);
    return patterns;
  }

  /**
   * PHASE 3: Generate enterprise-scale Playwright tests
   */
  async generatePlaywrightTests(): Promise<GenerationResult> {
    console.log('🚀 GENERATING PLAYWRIGHT TESTS');
    console.log('==============================');

    const results = {
      tests: await this.generateTests(),
      fixtures: await this.generateFixtures(),
      utilities: await this.generateUtilities(),
      configs: await this.generateConfigurations(),
      data: await this.generateTestData()
    };

    console.log(\`✅ Generated:\`);
    console.log(\`   Tests: \${results.tests.length} files\`);
    console.log(\`   Fixtures: \${results.fixtures.length} files\`);
    console.log(\`   Utilities: \${results.utilities.length} files\`);
    console.log(\`   Configs: \${results.configs.length} files\`);
    console.log(\`   Data: \${results.data.length} files\`);

    return results;
  }

  /**
   * Extract all API endpoints from Supertest files
   */
  private async extractEndpoints(): Promise<EndpointPattern[]> {
    const endpoints: EndpointPattern[] = [];
    
    // Find all test files
    const testFiles = await glob(\`\${this.supertestPath}/**/*.{js,ts}\`);
    
    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Extract endpoint patterns
      const endpointMatches = content.match(/\\.(?:get|post|put|patch|delete)\\(['"]([^'"]+)['"]\\)/g);
      
      if (endpointMatches) {
        for (const match of endpointMatches) {
          const methodMatch = match.match(/\\.(\w+)\\(/);
          const pathMatch = match.match(/['"]([^'"]+)['"]/);
          
          if (methodMatch && pathMatch) {
            endpoints.push({
              path: pathMatch[1],
              method: methodMatch[1].toUpperCase(),
              middleware: this.extractMiddleware(content, pathMatch[1]),
              auth: this.extractAuthType(content, pathMatch[1]),
              parameters: this.extractParameters(content, pathMatch[1]),
              responses: this.extractResponses(content, pathMatch[1])
            });
          }
        }
      }
    }

    // Remove duplicates
    return this.deduplicateEndpoints(endpoints);
  }

  /**
   * Extract environment configurations
   */
  private async extractEnvironments(): Promise<EnvironmentConfig[]> {
    const environments: EnvironmentConfig[] = [];
    
    // Look for config files
    const configFiles = await glob(\`\${this.supertestPath}/**/config/**/*.{js,json}\`);
    const envFiles = await glob(\`\${this.supertestPath}/**/.env*\`);
    
    for (const file of [...configFiles, ...envFiles]) {
      try {
        const content = readFileSync(file, 'utf-8');
        const envConfig = this.parseEnvironmentConfig(content, file);
        if (envConfig) {
          environments.push(envConfig);
        }
      } catch (error) {
        console.warn(\`⚠️  Could not parse config file: \${file}\`);
      }
    }

    return environments;
  }

  /**
   * Generate dynamic TestActions based on extracted endpoints
   */
  private async generateDynamicTestActions(): Promise<string> {
    const endpoints = this.analysis.endpoints;
    
    let testActionsCode = \`
import { expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';

/**
 * GENERATED TestActions for \${endpoints.length} endpoints
 * Auto-generated from Supertest migration
 */
export class TestActions {
  private apiHelper: any;

  constructor(apiHelper: any) {
    this.apiHelper = apiHelper;
  }

\`;

    // Generate method for each endpoint
    for (const endpoint of endpoints) {
      const methodName = this.generateMethodName(endpoint);
      const method = this.generateTestMethod(endpoint);
      testActionsCode += method + '\\n\\n';
    }

    testActionsCode += \`
  /**
   * Utility methods
   */
  generateUniqueEmail(prefix: string = 'test'): string {
    return \`\${prefix}\${Date.now()}@example.com\`;
  }

  generateTestData(): any {
    return {
      timestamp: Date.now(),
      uuid: crypto.randomUUID(),
      environment: process.env.TEST_ENV || 'dev'
    };
  }
}
\`;

    return testActionsCode;
  }

  /**
   * Generate test method for specific endpoint
   */
  private generateTestMethod(endpoint: EndpointPattern): string {
    const methodName = this.generateMethodName(endpoint);
    const params = endpoint.parameters.map(p => \`\${p.name}: \${p.type}\`).join(', ');
    
    return \`
  /**
   * Test \${endpoint.method} \${endpoint.path}
   * Generated from Supertest pattern
   */
  async \${methodName}(\${params}): Promise<any> {
    if (this.apiHelper?.setStep) {
      this.apiHelper.setStep('\${methodName}');
    }

    const result = await this.apiHelper.\${endpoint.method.toLowerCase()}('\${endpoint.path}', {
      \${endpoint.method !== 'GET' ? 'data: requestData,' : ''}
      scenarioName: '\${methodName}'
    });

    this.apiHelper.assertSuccessResponse(result);
    return result;
  }\`;
  }

  /**
   * Generate method name from endpoint
   */
  private generateMethodName(endpoint: EndpointPattern): string {
    const pathParts = endpoint.path.split('/').filter(Boolean);
    const action = endpoint.method.toLowerCase();
    const resource = pathParts[pathParts.length - 1] || 'resource';
    
    return \`\${action}\${this.capitalize(resource)}\`;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Main execution method
   */
  async execute(): Promise<void> {
    console.log('🚀 ENTERPRISE SUPERTEST TO PLAYWRIGHT CONVERSION');
    console.log('================================================');
    
    try {
      // Phase 1: Analyze
      await this.analyzeSupertest();
      
      // Phase 2: Extract patterns
      const playwrightPatterns = await this.extractPlaywrightPatterns();
      
      // Phase 3: Generate
      const results = await this.generatePlaywrightTests();
      
      console.log('\\n🎉 CONVERSION COMPLETED SUCCESSFULLY');
      console.log('====================================');
      console.log(\`✅ Processed \${this.analysis.endpoints.length} endpoints\`);
      console.log(\`✅ Generated \${results.tests.length} test files\`);
      console.log(\`✅ Created \${this.analysis.environments.length} environment configs\`);
      
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      throw error;
    }
  }
}

// CLI execution
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const supertestPath = process.argv[2] || './supertest-project';
  const playwrightPath = process.argv[3] || './playwright-output';
  
  const converter = new EnterpriseSupertestConverter(supertestPath, playwrightPath);
  converter.execute().catch(console.error);
}

export { EnterpriseSupertestConverter };
