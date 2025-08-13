import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { OpenAPISpec, Requirement, TestCase, ApiMetrics } from './types';

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
    let reqCounter = 1;
    let testCounter = 1;

    for (const [pathTemplate, pathItem] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          const category = this.categorizeEndpoint(method, pathTemplate, operation);
          const priority = this.determinePriority(method, pathTemplate, operation);
          
          const requirement: Requirement = {
            id: `REQ-${reqCounter.toString().padStart(3, '0')}`,
            category,
            priority,
            description: this.generateRequirementDescription(method, pathTemplate, operation),
            endpoint: `${method.toUpperCase()} ${pathTemplate}`,
            method: method.toUpperCase(),
            testCases: []
          };

          // Generate test cases for this requirement
          const reqTestCases = this.generateTestCases(requirement, pathTemplate, method, operation, testCounter);
          testCases.push(...reqTestCases);
          requirement.testCases = reqTestCases.map(tc => tc.id);
          testCounter += reqTestCases.length;

          requirements.push(requirement);
          reqCounter++;
        }
      }
    }

    return { requirements, testCases };
  }

  generateMetrics(): ApiMetrics {
    const { requirements, testCases } = this.generateRequirements();
    
    const endpointsByMethod: { [method: string]: number } = {};
    const requirementsByCategory: { [category: string]: number } = {};
    const testCasesByPriority: { [priority: string]: number } = {};

    // Count endpoints by method
    for (const [pathTemplate, pathItem] of Object.entries(this.spec.paths)) {
      for (const method of Object.keys(pathItem)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          const upperMethod = method.toUpperCase();
          endpointsByMethod[upperMethod] = (endpointsByMethod[upperMethod] || 0) + 1;
        }
      }
    }

    // Count requirements by category
    requirements.forEach(req => {
      requirementsByCategory[req.category] = (requirementsByCategory[req.category] || 0) + 1;
    });

    // Count test cases by priority
    testCases.forEach(tc => {
      testCasesByPriority[tc.priority] = (testCasesByPriority[tc.priority] || 0) + 1;
    });

    return {
      totalEndpoints: Object.values(endpointsByMethod).reduce((sum, count) => sum + count, 0),
      totalRequirements: requirements.length,
      totalTestCases: testCases.length,
      endpointsByMethod,
      requirementsByCategory,
      testCasesByPriority
    };
  }

  private categorizeEndpoint(method: string, path: string, operation: any): string {
    const methodUpper = method.toUpperCase();
    const summary = operation.summary?.toLowerCase() || '';
    const pathLower = path.toLowerCase();

    // Authentication endpoints
    if (pathLower.includes('/auth') || pathLower.includes('/login') || pathLower.includes('/token')) {
      return 'Authentication';
    }

    // File/Upload endpoints
    if (pathLower.includes('/upload') || pathLower.includes('/file') || pathLower.includes('/avatar')) {
      return 'File Operations';
    }

    // User/Profile management
    if (pathLower.includes('/user') || pathLower.includes('/profile')) {
      return 'User Management';
    }

    // CRUD Operations
    if (methodUpper === 'POST') return 'CRUD Operations';
    if (methodUpper === 'GET') return 'Data Retrieval';
    if (methodUpper === 'PUT' || methodUpper === 'PATCH') return 'Data Updates';
    if (methodUpper === 'DELETE') return 'Data Deletion';

    return 'General Operations';
  }

  private determinePriority(method: string, path: string, operation: any): 'HIGH' | 'MEDIUM' | 'LOW' {
    const methodUpper = method.toUpperCase();
    const pathLower = path.toLowerCase();

    // High priority: Authentication, core CRUD, security-related
    if (pathLower.includes('/auth') || pathLower.includes('/login')) return 'HIGH';
    if (methodUpper === 'POST' && !pathLower.includes('/comment')) return 'HIGH';
    if (methodUpper === 'DELETE') return 'HIGH';
    if (operation.security && operation.security.length > 0) return 'HIGH';

    // Medium priority: Updates, important reads
    if (methodUpper === 'PUT' || methodUpper === 'PATCH') return 'MEDIUM';
    if (methodUpper === 'GET' && path.includes('{')) return 'MEDIUM';

    // Low priority: List operations, comments, etc.
    return 'LOW';
  }

  private generateRequirementDescription(method: string, path: string, operation: any): string {
    const methodUpper = method.toUpperCase();
    const summary = operation.summary || '';
    
    if (summary) {
      return `Should ${summary.toLowerCase()}`;
    }

    const pathSegments = path.split('/').filter(segment => segment && !segment.startsWith('{'));
    const resource = pathSegments[pathSegments.length - 1] || 'resource';

    switch (methodUpper) {
      case 'GET':
        return path.includes('{') 
          ? `Should retrieve ${resource} by ID with valid authentication and return correct data`
          : `Should retrieve list of ${resource} with proper filtering and pagination`;
      case 'POST':
        return `Should create new ${resource} with valid data and proper validation`;
      case 'PUT':
        return `Should update existing ${resource} with valid data and authorization`;
      case 'PATCH':
        return `Should partially update ${resource} with valid fields and authorization`;
      case 'DELETE':
        return `Should delete ${resource} with proper authorization and cascade handling`;
      default:
        return `Should handle ${methodUpper} operation for ${resource}`;
    }
  }

  private generateTestCases(requirement: Requirement, path: string, method: string, operation: any, startCounter: number): TestCase[] {
    const testCases: TestCase[] = [];
    const methodUpper = method.toUpperCase();
    let counter = startCounter;

    // Positive test case
    testCases.push({
      id: `TC-${counter.toString().padStart(3, '0')}`,
      requirementId: requirement.id,
      name: `${methodUpper} ${path} - Valid Request`,
      description: `Test ${methodUpper} ${path} with valid data and authentication`,
      method: methodUpper,
      endpoint: path,
      expectedStatus: this.getExpectedStatus(methodUpper, 'positive'),
      category: requirement.category,
      priority: requirement.priority,
      testData: this.generateTestData(methodUpper, 'positive')
    });
    counter++;

    // Negative test cases
    if (operation.security || path.includes('/auth')) {
      testCases.push({
        id: `TC-${counter.toString().padStart(3, '0')}`,
        requirementId: requirement.id,
        name: `${methodUpper} ${path} - Unauthorized`,
        description: `Test ${methodUpper} ${path} without authentication should return 401`,
        method: methodUpper,
        endpoint: path,
        expectedStatus: 401,
        category: requirement.category,
        priority: 'HIGH',
        testData: this.generateTestData(methodUpper, 'unauthorized')
      });
      counter++;
    }

    // Invalid data test case for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(methodUpper)) {
      testCases.push({
        id: `TC-${counter.toString().padStart(3, '0')}`,
        requirementId: requirement.id,
        name: `${methodUpper} ${path} - Invalid Data`,
        description: `Test ${methodUpper} ${path} with invalid data should return 400`,
        method: methodUpper,
        endpoint: path,
        expectedStatus: 400,
        category: requirement.category,
        priority: 'MEDIUM',
        testData: this.generateTestData(methodUpper, 'invalid')
      });
      counter++;
    }

    // Not found test case for single resource endpoints
    if (path.includes('{')) {
      testCases.push({
        id: `TC-${counter.toString().padStart(3, '0')}`,
        requirementId: requirement.id,
        name: `${methodUpper} ${path} - Not Found`,
        description: `Test ${methodUpper} ${path} with non-existent ID should return 404`,
        method: methodUpper,
        endpoint: path,
        expectedStatus: 404,
        category: requirement.category,
        priority: 'MEDIUM',
        testData: this.generateTestData(methodUpper, 'notfound')
      });
    }

    return testCases;
  }

  private getExpectedStatus(method: string, scenario: string): number {
    if (scenario !== 'positive') return 400; // Default for negative cases

    switch (method) {
      case 'GET': return 200;
      case 'POST': return 201;
      case 'PUT': return 200;
      case 'PATCH': return 200;
      case 'DELETE': return 204;
      default: return 200;
    }
  }

  private generateTestData(method: string, scenario: string): any {
    const baseData = {
      positive: {
        GET: { queryParams: { limit: 20, offset: 0 } },
        POST: { body: { name: 'Test Item', description: 'Test Description' } },
        PUT: { body: { id: 1, name: 'Updated Item' } },
        DELETE: { pathParams: { id: 1 } },
        PATCH: { body: { name: 'Partially Updated' } }
      },
      invalid: {
        GET: { queryParams: { limit: -1, offset: 'invalid' } },
        POST: { body: { name: '', invalidField: 'should not exist' } },
        PUT: { body: { id: 'invalid', name: '' } },
        DELETE: { pathParams: { id: 'invalid' } },
        PATCH: { body: { invalidField: 'value' } }
      },
      unauthorized: {
        GET: { headers: { authorization: 'invalid-token' } },
        POST: { headers: { authorization: '' } },
        PUT: { headers: { authorization: 'Bearer invalid' } },
        DELETE: { headers: { authorization: null } },
        PATCH: { headers: { authorization: 'expired-token' } }
      },
      notfound: {
        GET: { pathParams: { id: 999999999 } },
        POST: { body: { relatedId: 999999999 } },
        PUT: { body: { id: 0, name: '' } },
        DELETE: { pathParams: { id: 999999999 } },
        PATCH: { body: { name: '' } }
      }
    };

    return (baseData as any)[scenario]?.[method] || {};
  }

  saveResults(outputDir: string): void {
    const { requirements, testCases } = this.generateRequirements();
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save requirements
    const reqFileName = `${this.apiId}-generated-requirements.json`;
    const reqFilePath = path.join(outputDir, reqFileName);
    fs.writeFileSync(reqFilePath, JSON.stringify({
      apiInfo: {
        title: this.apiName,
        version: this.spec.info.version,
        description: this.spec.info.description
      },
      requirements,
      metrics: this.generateMetrics(),
      generatedAt: new Date().toISOString()
    }, null, 2));

    // Save test cases
    const testFileName = `${this.apiId}-generated-test-cases.json`;
    const testFilePath = path.join(outputDir, testFileName);
    fs.writeFileSync(testFilePath, JSON.stringify({
      apiInfo: {
        title: this.apiName,
        version: this.spec.info.version
      },
      testCases,
      generatedAt: new Date().toISOString()
    }, null, 2));

    console.log(`✅ Generated ${requirements.length} requirements and ${testCases.length} test cases for ${this.apiName}`);
    console.log(`📁 Files saved: ${reqFileName}, ${testFileName}`);
  }

  // Static method to generate from spec object
  static fromSpec(spec: OpenAPISpec): SwaggerRequirementGenerator {
    // Create a temporary file
    const tempPath = `/tmp/swagger-spec-${Date.now()}.json`;
    fs.writeFileSync(tempPath, JSON.stringify(spec));
    
    const generator = new SwaggerRequirementGenerator(tempPath);
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    return generator;
  }
}
