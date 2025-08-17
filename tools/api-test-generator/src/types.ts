// OpenAPI type definitions
export interface OpenAPIDocument {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: { url: string }[];
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  security?: any[];
}

export interface GeneratorConfig {
  specPath: string;
  outputDir: string;
  generateTests: boolean;
  generateMatrix: boolean;
  generateFlows: boolean;
  generateDocs: boolean;
  baseUrl?: string;
  authType?: 'apikey' | 'bearer' | 'basic' | 'oauth2';
  authValue?: string;
  includeExamples: boolean;
  includeNegativeTests: boolean;
  tests?: boolean;
  traceability?: boolean;
  flows?: boolean;
  documentation?: boolean;
}

export interface EndpointInfo {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: ParameterInfo[];
  requestBody?: RequestBodyInfo;
  responses: ResponseInfo[];
  security?: SecurityInfo[];
  deprecated?: boolean;
}

export interface ParameterInfo {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required: boolean;
  type: string;
  format?: string;
  example?: any;
  description?: string;
  enum?: string[];
}

export interface RequestBodyInfo {
  required: boolean;
  contentType: string;
  schema: SchemaInfo;
  example?: any;
  description?: string;
}

export interface ResponseInfo {
  statusCode: string;
  description: string;
  contentType?: string;
  schema?: SchemaInfo;
  example?: any;
}

export interface SchemaInfo {
  type: string;
  format?: string;
  properties?: Record<string, SchemaInfo>;
  items?: SchemaInfo;
  required?: string[];
  example?: any;
  enum?: string[];
  description?: string;
}

export interface SecurityInfo {
  type: 'apikey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  in?: 'query' | 'header' | 'cookie';
  name?: string;
}

export interface APIAnalysis {
  endpoints: EndpointInfo[];
  tags: string[];
  models: Record<string, SchemaInfo>;
  security: SecurityInfo[];
  baseUrl: string;
  version: string;
  title: string;
  description?: string;
}

export interface TestGenerationResult {
  testFiles: string[];
  testSuites: number;
  totalTests: number;
  coverageReport: string;
}

export interface TraceabilityResult {
  matrixFile: string;
  coverageReport: string;
  requirements: RequirementInfo[];
}

export interface RequirementInfo {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'implemented' | 'tested' | 'verified';
  endpoints: string[];
  testCases: string[];
  businessValue: string;
}

export interface FlowDiagramResult {
  diagrams: string[];
  interactive: string;
  mermaidFiles: string[];
}

export interface GenerationResult {
  tests?: TestGenerationResult;
  traceability?: TraceabilityResult;
  flows?: FlowDiagramResult;
  documentation?: string;
  summary: {
    totalEndpoints: number;
    totalTests: number;
    totalRequirements: number;
    totalFlows: number;
    coverage: number;
  };
}
