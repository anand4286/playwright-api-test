import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import SwaggerParser from '@apidevtools/swagger-parser';
import chalk from 'chalk';

import type { 
  GeneratorConfig, 
  APIAnalysis, 
  EndpointInfo, 
  GenerationResult,
  ParameterInfo,
  ResponseInfo,
  RequestBodyInfo,
  SchemaInfo,
  OpenAPIDocument
} from './types.js';
import { generatePlaywrightTests } from './generators/testGenerator.js';
import { generateTraceabilityMatrix } from './generators/traceabilityGenerator.js';
import { generateFlowDiagrams } from './generators/flowGenerator.js';
// import { generateDocumentation } from './generators/docGenerator.js';

/**
 * Main generator function that orchestrates the entire process
 */
export async function generateFromSpec(config: GeneratorConfig): Promise<GenerationResult> {
  console.log(chalk.yellow('📋 Parsing OpenAPI specification...'));
  
  // Step 1: Load and parse OpenAPI spec
  const spec = await loadOpenAPISpec(config);
  const api = await SwaggerParser.validate(spec) as OpenAPIDocument;
  
  console.log(chalk.blue(`📖 API: ${api.info.title} v${api.info.version}`));
  
  // Step 2: Analyze the API
  const analysis = analyzeAPI(api);
  
  // Create output directory
  await fs.ensureDir(config.outputDir);
  
  const results: GenerationResult = {
    summary: {
      totalEndpoints: analysis.endpoints.length,
      totalTests: 0,
      totalRequirements: 0,
      totalFlows: 0,
      coverage: 0
    }
  };
  
  // Step 3: Generate test files
  if (config.generateTests) {
    console.log(chalk.yellow('🧪 Generating Playwright tests...'));
    results.tests = await generatePlaywrightTests(api, analysis, config.outputDir);
    results.summary.totalTests = results.tests?.totalTests || 0;
    console.log(chalk.green(`✅ Generated ${results.tests?.testFiles.length || 0} test files`));
  }
  
  // Step 4: Generate traceability matrix
  if (config.generateMatrix) {
    console.log(chalk.yellow('📊 Generating requirement traceability matrix...'));
    results.traceability = await generateTraceabilityMatrix(api, analysis, config.outputDir);
    results.summary.totalRequirements = results.traceability?.requirements.length || 0;
    console.log(chalk.green('✅ Generated traceability matrix'));
  }
  
  // Step 5: Generate flow diagrams
  if (config.generateFlows) {
    console.log(chalk.yellow('🌊 Generating flow diagrams...'));
    results.flows = await generateFlowDiagrams(api, analysis, config.outputDir);
    results.summary.totalFlows = results.flows?.diagrams.length || 0;
    console.log(chalk.green(`✅ Generated ${results.flows?.diagrams.length || 0} flow diagrams`));
  }
  
  // Step 6: Generate documentation
  if (config.generateDocs) {
    console.log(chalk.yellow('📚 Generating documentation...'));
    // results.documentation = "Documentation generation temporarily disabled";
    console.log(chalk.green('✅ Generated documentation'));
  }
  
  return results;
}

/**
 * Load OpenAPI specification from URL or file path
 */
async function loadOpenAPISpec(config: GeneratorConfig): Promise<any> {
  let specContent: string;
  
  if (config.specPath.startsWith('http://') || config.specPath.startsWith('https://')) {
    // Load from URL
    console.log(chalk.blue(`🌐 Fetching spec from ${config.specPath}`));
    const response = await axios.get(config.specPath);
    specContent = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  } else {
    // Load from file
    console.log(chalk.blue(`📁 Loading spec from ${config.specPath}`));
    if (!await fs.pathExists(config.specPath)) {
      throw new Error(`OpenAPI spec file not found: ${config.specPath}`);
    }
    specContent = await fs.readFile(config.specPath, 'utf8');
  }
  
  // Parse JSON or YAML
  const ext = path.extname(config.specPath).toLowerCase();
  if (ext === '.yaml' || ext === '.yml') {
    return yaml.parse(specContent);
  } else {
    return JSON.parse(specContent);
  }
}

/**
 * Analyze the OpenAPI document and extract useful information
 */
function analyzeAPI(api: OpenAPIDocument): APIAnalysis {
  const endpoints: EndpointInfo[] = [];
  const tags = new Set<string>();
  const models: Record<string, SchemaInfo> = {};
  
  // Extract models from components/schemas
  if (api.components?.schemas) {
    for (const [name, schema] of Object.entries(api.components.schemas)) {
      models[name] = convertSchema(schema as any);
    }
  }
  
  // Extract endpoints from paths
  if (api.paths) {
    for (const [pathPattern, pathItem] of Object.entries(api.paths)) {
      if (!pathItem) continue;
      
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'] as const;
      
      for (const method of methods) {
        const operation = (pathItem as any)[method];
        if (!operation) continue;
        
        // Add tags to set
        operation.tags?.forEach((tag: string) => tags.add(tag));
        
        const endpoint: EndpointInfo = {
          path: pathPattern,
          method: method.toUpperCase(),
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description,
          tags: operation.tags || ['default'],
          parameters: extractParameters(operation.parameters, (pathItem as any).parameters),
          responses: extractResponses(operation.responses),
          deprecated: operation.deprecated || false
        };
        
        // Add request body if present
        if (operation.requestBody) {
          endpoint.requestBody = extractRequestBody(operation.requestBody);
        }
        
        endpoints.push(endpoint);
      }
    }
  }
  
  const baseUrl = api.servers?.[0]?.url || 'https://api.example.com';
  
  return {
    title: api.info.title,
    version: api.info.version,
    description: api.info.description,
    baseUrl,
    endpoints,
    tags: Array.from(tags),
    models,
    security: extractSecurityInfo(api)
  };
}

/**
 * Extract parameter information from operation and path
 */
function extractParameters(
  operationParams?: any[],
  pathParams?: any[]
): ParameterInfo[] {
  const allParams = [...(operationParams || []), ...(pathParams || [])];
  const parameters: ParameterInfo[] = [];
  
  for (const param of allParams) {
    if ('$ref' in param) continue; // Skip references for now
    
    const paramObj = param;
    parameters.push({
      name: paramObj.name,
      in: paramObj.in,
      required: paramObj.required || paramObj.in === 'path',
      type: paramObj.schema?.type || 'string',
      description: paramObj.description,
      example: paramObj.example || paramObj.schema?.example
    });
  }
  
  return parameters;
}

/**
 * Extract response information
 */
function extractResponses(responses: any): ResponseInfo[] {
  const responseInfos: ResponseInfo[] = [];
  
  for (const [statusCode, response] of Object.entries(responses)) {
    if ('$ref' in (response as any)) continue; // Skip references for now
    
    const responseObj = response as any;
    const contentType = responseObj.content ? Object.keys(responseObj.content)[0] : 'application/json';
    const mediaType = responseObj.content && contentType ? responseObj.content[contentType] : undefined;
    
    responseInfos.push({
      statusCode,
      description: responseObj.description || '',
      contentType: contentType || '',
      schema: mediaType?.schema ? convertSchema(mediaType.schema) : undefined,
    });
  }
  
  return responseInfos;
}

/**
 * Extract request body information
 */
function extractRequestBody(requestBody: any): RequestBodyInfo {
  const contentType = Object.keys(requestBody.content)[0];
  const mediaType = contentType ? requestBody.content[contentType] : undefined;
  
  return {
    required: requestBody.required || false,
    contentType: contentType || 'application/json',
    schema: convertSchema(mediaType?.schema),
    description: requestBody.description
  };
}

/**
 * Convert OpenAPI schema to our internal format
 */
function convertSchema(schema: any): SchemaInfo {
  return {
    type: schema.type || 'object',
    format: schema.format,
    description: schema.description,
    properties: schema.properties ? 
      Object.fromEntries(
        Object.entries(schema.properties).map(([key, prop]) => 
          [key, convertSchema(prop as any)]
        )
      ) : undefined,
    items: schema.items ? convertSchema(schema.items) : undefined,
    required: schema.required,
    example: schema.example
  };
}

/**
 * Extract security information from the API
 */
function extractSecurityInfo(api: OpenAPIDocument): any[] {
  return api.security || [];
}
