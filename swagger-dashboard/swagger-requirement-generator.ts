import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OpenAPISpec {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
  };
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  method: string;
  endpoint: string;
  acceptance_criteria: string[];
  test_scenarios: string[];
}

interface TestCase {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  method: string;
  endpoint: string;
  test_type: string;
  test_data: any;
  expected_result: string;
  tags: string[];
}

export class SwaggerRequirementGenerator {
  private spec: OpenAPISpec;
  private apiName: string;
  private apiId: string;

  constructor(specPath: string) {
    const content = fs.readFileSync(specPath, 'utf8');
    const ext = path.extname(specPath).toLowerCase();
    
    if (ext === '.yaml' || ext === '.yml') {
      this.spec = yaml.load(content) as OpenAPISpec;
    } else {
      this.spec = JSON.parse(content);
    }
    
    this.apiName = this.spec.info.title;
    this.apiId = this.apiName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }

  generateRequirements(): { requirements: Requirement[], testCases: TestCase[] } {
    const requirements: Requirement[] = [];
    const testCases: TestCase[] = [];
    let reqIndex = 1;
    let tcIndex = 1;

    // Group paths by category/tag
    const categorizedPaths = this.categorizePaths();

    for (const [category, paths] of Object.entries(categorizedPaths)) {
      for (const [pathKey, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          const reqId = `REQ-${this.apiId.toUpperCase()}-${String(reqIndex).padStart(3, '0')}`;
          
          // Generate requirement
          const requirement: Requirement = {
            id: reqId,
            title: operation.summary || `${method.toUpperCase()} ${pathKey}`,
            description: operation.description || `${method.toUpperCase()} operation for ${pathKey}`,
            category: category,
            priority: this.determinePriority(method, operation),
            method: method.toUpperCase(),
            endpoint: pathKey,
            acceptance_criteria: this.generateAcceptanceCriteria(method, operation),
            test_scenarios: this.generateTestScenarios(method, operation)
          };

          requirements.push(requirement);

          // Generate test cases for this requirement
          const reqTestCases = this.generateTestCasesForRequirement(requirement, tcIndex);
          testCases.push(...reqTestCases);
          
          reqIndex++;
          tcIndex += reqTestCases.length;
        }
      }
    }

    return { requirements, testCases };
  }

  private categorizePaths(): Record<string, Record<string, Record<string, any>>> {
    const categorized: Record<string, Record<string, Record<string, any>>> = {};

    for (const [pathKey, pathObject] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathObject)) {
        if (typeof operation !== 'object' || !operation) continue;

        // Determine category from tags, path, or default
        let category = 'General';
        
        if (operation.tags && operation.tags.length > 0) {
          category = operation.tags[0];
        } else {
          // Extract category from path
          const pathParts = pathKey.split('/').filter(part => part && !part.startsWith('{'));
          if (pathParts.length > 0) {
            category = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
          }
        }

        if (!categorized[category]) {
          categorized[category] = {};
        }
        if (!categorized[category][pathKey]) {
          categorized[category][pathKey] = {};
        }
        categorized[category][pathKey][method] = operation;
      }
    }

    return categorized;
  }

  private determinePriority(method: string, operation: any): string {
    // Determine priority based on method and operation characteristics
    if (method.toLowerCase() === 'delete') return 'High';
    if (method.toLowerCase() === 'post') return 'High';
    if (method.toLowerCase() === 'put' || method.toLowerCase() === 'patch') return 'Medium';
    if (operation.deprecated) return 'Low';
    if (operation.security && operation.security.length > 0) return 'High';
    return 'Medium';
  }

  private generateAcceptanceCriteria(method: string, operation: any): string[] {
    const criteria: string[] = [];
    
    // Basic HTTP criteria
    criteria.push(`The ${method.toUpperCase()} request should return appropriate HTTP status codes`);
    
    // Response criteria
    if (operation.responses) {
      for (const [statusCode, response] of Object.entries(operation.responses)) {
        if (statusCode === '200' || statusCode === '201') {
          criteria.push(`Successful response (${statusCode}) should return valid data format`);
        } else if (statusCode.startsWith('4')) {
          criteria.push(`Client error (${statusCode}) should return appropriate error message`);
        } else if (statusCode.startsWith('5')) {
          criteria.push(`Server error (${statusCode}) should be handled gracefully`);
        }
      }
    }

    // Authentication criteria
    if (operation.security) {
      criteria.push('Request should handle authentication/authorization properly');
    }

    // Request body criteria
    if (operation.requestBody) {
      criteria.push('Request body should be validated according to schema');
    }

    // Parameters criteria
    if (operation.parameters) {
      criteria.push('All required parameters should be validated');
      criteria.push('Optional parameters should have default behavior');
    }

    return criteria;
  }

  private generateTestScenarios(method: string, operation: any): string[] {
    const scenarios: string[] = [];
    
    // Happy path
    scenarios.push(`Valid ${method.toUpperCase()} request with correct parameters`);
    
    // Error scenarios
    if (operation.parameters) {
      scenarios.push('Missing required parameters');
      scenarios.push('Invalid parameter values');
    }
    
    if (operation.requestBody) {
      scenarios.push('Invalid request body format');
      scenarios.push('Missing required fields in request body');
    }
    
    // Authentication scenarios
    if (operation.security) {
      scenarios.push('Unauthorized access attempt');
      scenarios.push('Valid authentication');
    }
    
    // Edge cases
    scenarios.push('Large payload handling');
    scenarios.push('Concurrent request handling');
    
    return scenarios;
  }

  private generateTestCasesForRequirement(requirement: Requirement, startIndex: number): TestCase[] {
    const testCases: TestCase[] = [];
    let tcIndex = startIndex;

    // Positive test case
    testCases.push({
      id: `${requirement.id}-TC-${String(tcIndex).padStart(3, '0')}`,
      requirementId: requirement.id,
      title: `${requirement.method} ${requirement.endpoint} - Valid Request`,
      description: `Test successful ${requirement.method} operation for ${requirement.endpoint}`,
      category: requirement.category,
      priority: requirement.priority,
      method: requirement.method,
      endpoint: requirement.endpoint,
      test_type: 'positive',
      test_data: this.generateTestData(requirement.method, 'valid'),
      expected_result: 'Success response with valid data',
      tags: ['smoke', 'regression']
    });
    tcIndex++;

    // Negative test cases
    testCases.push({
      id: `${requirement.id}-TC-${String(tcIndex).padStart(3, '0')}`,
      requirementId: requirement.id,
      title: `${requirement.method} ${requirement.endpoint} - Invalid Data`,
      description: `Test ${requirement.method} operation with invalid data`,
      category: requirement.category,
      priority: requirement.priority,
      method: requirement.method,
      endpoint: requirement.endpoint,
      test_type: 'negative',
      test_data: this.generateTestData(requirement.method, 'invalid'),
      expected_result: 'Error response with appropriate status code',
      tags: ['regression', 'error-handling']
    });
    tcIndex++;

    // Edge case test
    testCases.push({
      id: `${requirement.id}-TC-${String(tcIndex).padStart(3, '0')}`,
      requirementId: requirement.id,
      title: `${requirement.method} ${requirement.endpoint} - Edge Case`,
      description: `Test ${requirement.method} operation edge cases`,
      category: requirement.category,
      priority: requirement.priority,
      method: requirement.method,
      endpoint: requirement.endpoint,
      test_type: 'boundary',
      test_data: this.generateTestData(requirement.method, 'edge'),
      expected_result: 'Proper handling of edge case scenarios',
      tags: ['edge-case', 'regression']
    });

    return testCases;
  }

  private generateTestData(method: string, type: 'valid' | 'invalid' | 'edge'): any {
    const baseData = {
      valid: {
        GET: { queryParams: { limit: 10, offset: 0 } },
        POST: { body: { name: 'Test Item', description: 'Test Description' } },
        PUT: { body: { id: 1, name: 'Updated Item' } },
        DELETE: { pathParams: { id: 1 } },
        PATCH: { body: { name: 'Patched Item' } }
      },
      invalid: {
        GET: { queryParams: { limit: -1, offset: 'invalid' } },
        POST: { body: { invalidField: 'test' } },
        PUT: { body: { id: 'invalid', name: null } },
        DELETE: { pathParams: { id: 'invalid' } },
        PATCH: { body: { invalidUpdate: true } }
      },
      edge: {
        GET: { queryParams: { limit: 999999, offset: 999999 } },
        POST: { body: { name: 'x'.repeat(1000) } },
        PUT: { body: { id: 0, name: '' } },
        DELETE: { pathParams: { id: 999999999 } },
        PATCH: { body: { name: '' } }
      }
    };

    return (baseData[type] as any)?.[method] || {};
  }

  saveResults(outputDir: string): void {
    const { requirements, testCases } = this.generateRequirements();

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save requirements
    const requirementsOutput = {
      apiInfo: {
        name: this.spec.info.title,
        version: this.spec.info.version,
        description: this.spec.info.description,
        baseUrl: this.spec.servers?.[0]?.url
      },
      generated: new Date().toISOString(),
      totalRequirements: requirements.length,
      requirements: requirements
    };

    fs.writeFileSync(
      path.join(outputDir, `${this.apiId}-generated-requirements.json`),
      JSON.stringify(requirementsOutput, null, 2)
    );

    // Save test cases
    const testCasesOutput = {
      apiInfo: {
        name: this.spec.info.title,
        version: this.spec.info.version,
        description: this.spec.info.description
      },
      generated: new Date().toISOString(),
      totalTestCases: testCases.length,
      testCases: testCases
    };

    fs.writeFileSync(
      path.join(outputDir, `${this.apiId}-generated-test-cases.json`),
      JSON.stringify(testCasesOutput, null, 2)
    );

    console.log(`✅ Generated ${requirements.length} requirements and ${testCases.length} test cases for ${this.apiName}`);
    console.log(`📁 Files saved: ${this.apiId}-generated-requirements.json, ${this.apiId}-generated-test-cases.json`);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const specPath = process.argv[2];
  const outputDir = process.argv[3] || './requirements';

  if (!specPath) {
    console.error('Usage: node swagger-requirement-generator.ts <openapi-spec-path> [output-dir]');
    process.exit(1);
  }

  if (!fs.existsSync(specPath)) {
    console.error(`Error: OpenAPI spec file not found: ${specPath}`);
    process.exit(1);
  }

  try {
    const generator = new SwaggerRequirementGenerator(specPath);
    generator.saveResults(outputDir);
  } catch (error) {
    console.error('Error generating requirements:', error);
    process.exit(1);
  }
}
