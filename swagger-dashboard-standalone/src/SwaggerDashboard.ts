import { SwaggerRequirementGenerator } from './SwaggerRequirementGenerator';
import { SwaggerBatchProcessor } from './SwaggerBatchProcessor';
import { SwaggerServer } from './SwaggerServer';
import { DashboardConfig, ProcessingResult, BatchProcessingResult, OpenAPISpec } from './types';

export class SwaggerDashboard {
  private config: DashboardConfig;
  private server?: SwaggerServer;

  constructor(config: DashboardConfig = {}) {
    this.config = {
      port: 8888,
      openApiDir: './openapi-specs',
      requirementsDir: './requirements',
      enableCors: true,
      logLevel: 'info',
      ...config
    };
  }

  // Generate requirements for a single API spec
  async generateRequirements(specPath: string, outputDir?: string): Promise<{ requirements: any[], testCases: any[] }> {
    const generator = new SwaggerRequirementGenerator(specPath);
    const result = generator.generateRequirements();
    
    if (outputDir) {
      generator.saveResults(outputDir);
    }
    
    return result;
  }

  // Process all APIs in the specified directory
  async processAllSpecs(openApiDir?: string, outputDir?: string): Promise<BatchProcessingResult> {
    const inputDir = openApiDir || this.config.openApiDir!;
    const outDir = outputDir || this.config.requirementsDir!;
    
    const processor = new SwaggerBatchProcessor(inputDir, outDir);
    return processor.processAllSpecs();
  }

  // Start the dashboard server
  async startServer(config?: Partial<DashboardConfig>): Promise<void> {
    const serverConfig = { ...this.config, ...config };
    this.server = new SwaggerServer(serverConfig);
    await this.server.start();
  }

  // Stop the dashboard server
  stopServer(): void {
    if (this.server) {
      this.server.stop();
    }
  }

  // Generate requirements from OpenAPI spec object
  generateFromSpec(spec: OpenAPISpec): { requirements: any[], testCases: any[] } {
    const generator = SwaggerRequirementGenerator.fromSpec(spec);
    return generator.generateRequirements();
  }

  // Get server instance for custom middleware
  getServer(): SwaggerServer | undefined {
    return this.server;
  }

  // Full pipeline: process specs and start server
  async run(options: {
    processSpecs?: boolean;
    startServer?: boolean;
    openApiDir?: string;
    outputDir?: string;
    serverConfig?: Partial<DashboardConfig>;
  } = {}): Promise<{
    processingResult?: BatchProcessingResult;
    serverStarted: boolean;
  }> {
    const { 
      processSpecs = true, 
      startServer = true, 
      openApiDir, 
      outputDir, 
      serverConfig 
    } = options;

    let processingResult: BatchProcessingResult | undefined;

    // Process specs if requested
    if (processSpecs) {
      console.log('🔄 Processing OpenAPI specifications...');
      processingResult = await this.processAllSpecs(openApiDir, outputDir);
    }

    // Start server if requested
    let serverStarted = false;
    if (startServer) {
      console.log('🚀 Starting dashboard server...');
      await this.startServer(serverConfig);
      serverStarted = true;
    }

    return {
      processingResult,
      serverStarted
    };
  }

  // Static factory methods for convenience
  static async processSpecs(openApiDir: string, outputDir?: string): Promise<BatchProcessingResult> {
    const dashboard = new SwaggerDashboard();
    return dashboard.processAllSpecs(openApiDir, outputDir);
  }

  static async startDashboard(config?: DashboardConfig): Promise<SwaggerDashboard> {
    const dashboard = new SwaggerDashboard(config);
    await dashboard.startServer();
    return dashboard;
  }

  static async quickStart(options: {
    openApiDir?: string;
    outputDir?: string;
    port?: number;
  } = {}): Promise<SwaggerDashboard> {
    const dashboard = new SwaggerDashboard({
      port: options.port || 8888,
      openApiDir: options.openApiDir || './openapi-specs',
      requirementsDir: options.outputDir || './requirements'
    });

    await dashboard.run({
      processSpecs: true,
      startServer: true
    });

    return dashboard;
  }
}
