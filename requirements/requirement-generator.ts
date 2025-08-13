import fs from 'fs/promises';
import path from 'path';

export interface Requirement {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  endpoint: string;
  method: string;
  operationId: string;
  acceptance_criteria: string[];
  tags: string[];
  security?: string[];
  parameters?: any[];
  responses?: any;
}

export interface TestCase {
  testCaseId: string;
  requirementId: string;
  title: string;
  description: string;
  priority: string;
  testType: 'positive' | 'negative' | 'boundary' | 'security';
  testSteps: string[];
  expectedResult: string;
  testData?: any;
}

export class RequirementGenerator {
  private spec: any;
  private requirements: Requirement[] = [];
  private testCases: TestCase[] = [];

  async loadSpec(specPath: string): Promise<void> {
    try {
      const specContent = await fs.readFile(specPath, 'utf-8');
      this.spec = JSON.parse(specContent);
      console.log(`✅ Loaded OpenAPI spec: ${this.spec.info?.title} v${this.spec.info?.version}`);
    } catch (error: any) {
      console.error('❌ Failed to load OpenAPI spec:', error.message);
      throw error;
    }
  }

  public async generateRequirements(): Promise<{ requirements: Requirement[], testCases: TestCase[] }> {
    if (!this.spec) {
      await this.loadSpec('/Users/Anand/github/playwright-api-test/openapi-spec/petstore-openapi-spec.json');
    }
    
    console.log('🚀 Generating requirements from OpenAPI specification...');
    
    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (typeof operation === 'object' && operation !== null && 'operationId' in operation && operation.operationId) {
          const requirement = this.createRequirement(path, method, operation);
          this.requirements.push(requirement);
          
          // Generate test cases for each requirement
          const testCases = this.generateTestCases(requirement);
          this.testCases.push(...testCases);
        }
      }
    }

    await this.saveRequirements();
    await this.saveTestCases();
    
    console.log(`✅ Generated ${this.requirements.length} requirements and ${this.testCases.length} test cases`);
    
    return {
      requirements: this.requirements,
      testCases: this.testCases
    };
  }

  private createRequirement(path: string, method: string, operation: any): Requirement {
    const category = this.getCategoryFromTags(operation.tags);
    const reqId = this.generateRequirementId(category, operation.operationId);
    
    return {
      id: reqId,
      category,
      title: operation.summary || `${method.toUpperCase()} ${path}`,
      description: operation.description || `API operation for ${operation.operationId}`,
      priority: this.determinePriority(operation),
      endpoint: path,
      method: method.toUpperCase(),
      operationId: operation.operationId,
      acceptance_criteria: this.generateAcceptanceCriteria(operation),
      tags: operation.tags || [],
      security: operation.security?.map((s: any) => Object.keys(s)[0]),
      parameters: operation.parameters,
      responses: operation.responses
    };
  }

  private getCategoryFromTags(tags: string[]): string {
    if (!tags || tags.length === 0) return 'General';
    const tag = tags[0];
    return tag.charAt(0).toUpperCase() + tag.slice(1) + ' Management';
  }

  private generateRequirementId(category: string, operationId: string): string {
    const categoryPrefix = category.split(' ')[0].toUpperCase().slice(0, 3);
    const counter = this.requirements.filter(r => r.category === category).length + 1;
    return `REQ-${categoryPrefix}-${counter.toString().padStart(3, '0')}`;
  }

  private determinePriority(operation: any): 'Critical' | 'High' | 'Medium' | 'Low' {
    const opId = operation.operationId?.toLowerCase() || '';
    
    if (opId.includes('login') || opId.includes('auth') || opId.includes('logout')) return 'Critical';
    if (opId.includes('create') || opId.includes('delete') || opId.includes('add')) return 'High';
    if (opId.includes('update') || opId.includes('put') || opId.includes('upload')) return 'High';
    if (opId.includes('find') || opId.includes('get')) return 'Medium';
    
    return 'Medium';
  }

  private generateAcceptanceCriteria(operation: any): string[] {
    const criteria: string[] = [];
    
    // Add response criteria
    if (operation.responses) {
      Object.entries(operation.responses).forEach(([code, response]: [string, any]) => {
        criteria.push(`Return ${code} status code: ${response.description}`);
      });
    }

    // Add parameter criteria
    if (operation.parameters) {
      const requiredParams = operation.parameters.filter((p: any) => p.required);
      if (requiredParams.length > 0) {
        criteria.push(`Validate required parameters: ${requiredParams.map((p: any) => p.name).join(', ')}`);
      }
      
      const optionalParams = operation.parameters.filter((p: any) => !p.required);
      if (optionalParams.length > 0) {
        criteria.push(`Support optional parameters: ${optionalParams.map((p: any) => p.name).join(', ')}`);
      }
    }

    // Add security criteria
    if (operation.security && operation.security.length > 0) {
      criteria.push(`Require authentication: ${operation.security.map((s: any) => Object.keys(s)[0]).join(', ')}`);
    }

    // Add content type criteria
    if (operation.consumes) {
      criteria.push(`Accept content types: ${operation.consumes.join(', ')}`);
    }

    return criteria;
  }

  private generateTestCases(requirement: Requirement): TestCase[] {
    const testCases: TestCase[] = [];
    let testCounter = 1;

    // Positive test case
    testCases.push({
      testCaseId: `${requirement.id}-TC-${testCounter.toString().padStart(3, '0')}`,
      requirementId: requirement.id,
      title: `${requirement.title} - Valid Request`,
      description: `Verify ${requirement.title.toLowerCase()} with valid data`,
      priority: requirement.priority,
      testType: 'positive',
      testSteps: [
        'Prepare valid test data',
        `Send ${requirement.method} request to ${requirement.endpoint}`,
        'Validate response status and data'
      ],
      expectedResult: `Should return successful response as per acceptance criteria`
    });
    testCounter++;

    // Negative test cases based on responses
    if (requirement.responses) {
      Object.entries(requirement.responses).forEach(([statusCode, response]: [string, any]) => {
        if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
          testCases.push({
            testCaseId: `${requirement.id}-TC-${testCounter.toString().padStart(3, '0')}`,
            requirementId: requirement.id,
            title: `${requirement.title} - Error ${statusCode}`,
            description: `Verify ${requirement.title.toLowerCase()} returns ${statusCode} for invalid input`,
            priority: requirement.priority,
            testType: 'negative',
            testSteps: [
              'Prepare invalid test data (based on error scenario)',
              `Send ${requirement.method} request to ${requirement.endpoint}`,
              `Validate ${statusCode} response`
            ],
            expectedResult: `Should return ${statusCode} status code: ${response.description}`
          });
          testCounter++;
        }
      });
    }

    // Security test case if authentication required
    if (requirement.security && requirement.security.length > 0) {
      testCases.push({
        testCaseId: `${requirement.id}-TC-${testCounter.toString().padStart(3, '0')}`,
        requirementId: requirement.id,
        title: `${requirement.title} - Unauthorized Access`,
        description: `Verify ${requirement.title.toLowerCase()} requires proper authentication`,
        priority: 'High',
        testType: 'security',
        testSteps: [
          'Prepare valid test data',
          `Send ${requirement.method} request to ${requirement.endpoint} without authentication`,
          'Validate unauthorized response'
        ],
        expectedResult: 'Should return 401 or 403 status code for unauthorized access'
      });
      testCounter++;
    }

    // Boundary test case for parameters
    if (requirement.parameters && requirement.parameters.length > 0) {
      const numericParams = requirement.parameters.filter(p => p.type === 'integer' || p.type === 'number');
      if (numericParams.length > 0) {
        testCases.push({
          testCaseId: `${requirement.id}-TC-${testCounter.toString().padStart(3, '0')}`,
          requirementId: requirement.id,
          title: `${requirement.title} - Boundary Values`,
          description: `Verify ${requirement.title.toLowerCase()} with boundary parameter values`,
          priority: 'Medium',
          testType: 'boundary',
          testSteps: [
            'Prepare test data with boundary values (min/max)',
            `Send ${requirement.method} request to ${requirement.endpoint}`,
            'Validate boundary value handling'
          ],
          expectedResult: 'Should handle boundary values appropriately'
        });
      }
    }

    return testCases;
  }

  private async saveRequirements(): Promise<void> {
    const requirementsDir = '/Users/Anand/github/playwright-api-test/requirements';
    await fs.mkdir(requirementsDir, { recursive: true });
    
    const timestamp = new Date().toISOString();
    const requirementsData = {
      metadata: {
        generated_at: timestamp,
        spec_title: this.spec.info?.title,
        spec_version: this.spec.info?.version,
        total_requirements: this.requirements.length
      },
      requirements: this.requirements
    };
    
    await fs.writeFile(
      path.join(requirementsDir, 'generated-requirements.json'),
      JSON.stringify(requirementsData, null, 2)
    );
    
    console.log(`📋 Requirements saved to: requirements/generated-requirements.json`);
  }

  private async saveTestCases(): Promise<void> {
    const testCasesDir = '/Users/Anand/github/playwright-api-test/test-cases';
    await fs.mkdir(testCasesDir, { recursive: true });
    
    const timestamp = new Date().toISOString();
    const testCasesData = {
      metadata: {
        generated_at: timestamp,
        total_test_cases: this.testCases.length,
        test_types: {
          positive: this.testCases.filter(tc => tc.testType === 'positive').length,
          negative: this.testCases.filter(tc => tc.testType === 'negative').length,
          boundary: this.testCases.filter(tc => tc.testType === 'boundary').length,
          security: this.testCases.filter(tc => tc.testType === 'security').length
        }
      },
      testCases: this.testCases
    };
    
    await fs.writeFile(
      path.join(testCasesDir, 'generated-test-cases.json'),
      JSON.stringify(testCasesData, null, 2)
    );
    
    console.log(`🧪 Test cases saved to: test-cases/generated-test-cases.json`);
  }
}

// Main execution
async function main() {
  try {
    const generator = new RequirementGenerator();
    const result = await generator.generateRequirements();
    
    console.log('\n📊 Generation Summary:');
    console.log(`   Requirements: ${result.requirements.length}`);
    console.log(`   Test Cases: ${result.testCases.length}`);
    console.log('\n✅ Requirements and test cases generation completed!');
    
  } catch (error: any) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
