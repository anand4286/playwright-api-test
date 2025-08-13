import fs from 'fs';
import path from 'path';
import { SwaggerRequirementGenerator } from './SwaggerRequirementGenerator';
import { ProcessingResult, BatchProcessingResult } from './types';

export class SwaggerBatchProcessor {
  private openApiDir: string;
  private outputDir: string;
  private processedApis: ProcessingResult[] = [];

  constructor(openApiDir: string, outputDir: string = './requirements') {
    this.openApiDir = openApiDir;
    this.outputDir = outputDir;
  }

  async processAllSpecs(): Promise<BatchProcessingResult> {
    console.log('🔗 Swagger API Batch Processor');
    console.log('=====================================');
    console.log(`📁 Input Directory: ${this.openApiDir}`);
    console.log(`📁 Output Directory: ${this.outputDir}`);
    console.log('');

    if (!fs.existsSync(this.openApiDir)) {
      throw new Error(`OpenAPI specs directory not found: ${this.openApiDir}`);
    }

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }

    // Find all OpenAPI spec files
    const specFiles = this.findSpecFiles();
    
    if (specFiles.length === 0) {
      console.log('⚠️  No OpenAPI specification files found in the directory.');
      console.log('   Supported formats: .json, .yaml, .yml');
      return this.createBatchResult();
    }

    console.log(`🔍 Found ${specFiles.length} OpenAPI specification files:`);
    specFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');

    // Process each spec file
    for (const specFile of specFiles) {
      try {
        console.log(`🔄 Processing: ${specFile}`);
        const specPath = path.join(this.openApiDir, specFile);
        
        const generator = new SwaggerRequirementGenerator(specPath);
        const { requirements, testCases } = generator.generateRequirements();
        generator.saveResults(this.outputDir);

        this.processedApis.push({
          success: true,
          apiName: generator['apiName'], // Access private property
          fileName: specFile,
          requirements: requirements.length,
          testCases: testCases.length
        });

        console.log(`✅ Successfully processed: ${specFile}\n`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error processing ${specFile}:`, errorMessage);
        
        this.processedApis.push({
          success: false,
          apiName: specFile,
          fileName: specFile,
          requirements: 0,
          testCases: 0,
          error: errorMessage
        });
        console.log('');
      }
    }

    const result = this.createBatchResult();
    this.generateSummaryReport(result);
    this.printSummary(result);
    
    return result;
  }

  private findSpecFiles(): string[] {
    const files = fs.readdirSync(this.openApiDir);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.json', '.yaml', '.yml'].includes(ext);
    });
  }

  private createBatchResult(): BatchProcessingResult {
    const successfulApis = this.processedApis.filter(api => api.success);
    const failedApis = this.processedApis.filter(api => !api.success);

    return {
      totalApis: this.processedApis.length,
      successfulApis: successfulApis.length,
      failedApis: failedApis.length,
      totalRequirements: successfulApis.reduce((sum, api) => sum + api.requirements, 0),
      totalTestCases: successfulApis.reduce((sum, api) => sum + api.testCases, 0),
      results: this.processedApis,
      processedAt: new Date().toISOString()
    };
  }

  private generateSummaryReport(result: BatchProcessingResult): void {
    const reportPath = path.join(this.outputDir, 'batch-processing-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
    console.log('📋 Summary Report:');
    console.log(`   Total APIs Processed: ${result.totalApis}`);
    console.log(`   Successful: ${result.successfulApis}`);
    console.log(`   Failed: ${result.failedApis}`);
    console.log(`   Total Requirements Generated: ${result.totalRequirements}`);
    console.log(`   Total Test Cases Generated: ${result.totalTestCases}`);
    console.log(`   Report saved: ${reportPath}`);
    console.log('');
  }

  private printSummary(result: BatchProcessingResult): void {
    console.log('=====================================');
    console.log('🎯 Batch Processing Complete!');
    console.log(`✅ Successful: ${result.successfulApis}`);
    console.log(`❌ Errors: ${result.failedApis}`);
    console.log(`📊 Total APIs: ${result.totalApis}`);
    console.log('');
    
    if (result.successfulApis > 0) {
      console.log('🚀 Next Steps:');
      console.log(`1. Start the Swagger Dashboard server`);
      console.log(`2. Open dashboard in browser`);
      console.log(`3. Select an API from the dropdown to view requirements`);
      console.log(`4. Generate and run tests using the generated requirements`);
    }
  }

  // Static method for one-time processing
  static async process(openApiDir: string, outputDir?: string): Promise<BatchProcessingResult> {
    const processor = new SwaggerBatchProcessor(openApiDir, outputDir);
    return processor.processAllSpecs();
  }
}
