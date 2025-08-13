// OpenAPI Specification Types
export interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  host?: string;
  basePath?: string;
  schemes?: string[];
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string;
        description?: string;
        tags?: string[];
        parameters?: any[];
        requestBody?: any;
        responses: {
          [statusCode: string]: any;
        };
        security?: any[];
      };
    };
  };
  components?: {
    schemas?: any;
    securitySchemes?: any;
  };
  definitions?: any;
  securityDefinitions?: any;
}

// Requirement Types
export interface Requirement {
  id: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  endpoint: string;
  method: string;
  testCases: string[];
}

export interface TestCase {
  id: string;
  requirementId: string;
  name: string;
  description: string;
  method: string;
  endpoint: string;
  expectedStatus: number;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  testData?: any;
}

// Metrics Types
export interface ApiMetrics {
  totalEndpoints: number;
  totalRequirements: number;
  totalTestCases: number;
  endpointsByMethod: { [method: string]: number };
  requirementsByCategory: { [category: string]: number };
  testCasesByPriority: { [priority: string]: number };
}

// Configuration Types
export interface DashboardConfig {
  port?: number;
  openApiDir?: string;
  requirementsDir?: string;
  enableCors?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// Processing Results
export interface ProcessingResult {
  success: boolean;
  apiName: string;
  fileName: string;
  requirements: number;
  testCases: number;
  error?: string;
}

export interface BatchProcessingResult {
  totalApis: number;
  successfulApis: number;
  failedApis: number;
  totalRequirements: number;
  totalTestCases: number;
  results: ProcessingResult[];
  processedAt: string;
}

// CLI Options
export interface CliOptions {
  port?: number;
  input?: string;
  output?: string;
  config?: string;
  verbose?: boolean;
}
