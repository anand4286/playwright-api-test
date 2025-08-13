#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SwaggerRequirementGenerator } from './swagger-requirement-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SwaggerBatchProcessor {
  private openApiDir: string;
  private outputDir: string;
  private processedApis: Array<{ name: string, status: string, requirements: number, testCases: number }> = [];

  constructor(openApiDir: string, outputDir: string = './requirements') {
    this.openApiDir = openApiDir;
    this.outputDir = outputDir;
  }

  async processAllSpecs(): Promise<void> {
    console.log('🔗 Swagger API Batch Processor');
    console.log('=====================================');
    console.log(`📁 Input Directory: ${this.openApiDir}`);
    console.log(`📁 Output Directory: ${this.outputDir}`);
    console.log('');

    if (!fs.existsSync(this.openApiDir)) {
      console.error(`❌ Error: OpenAPI specs directory not found: ${this.openApiDir}`);
      process.exit(1);
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
      return;
    }

    console.log(`🔍 Found ${specFiles.length} OpenAPI specification files:`);
    specFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');

    // Process each spec file
    let successCount = 0;
    let errorCount = 0;

    for (const specFile of specFiles) {
      try {
        console.log(`🔄 Processing: ${specFile}`);
        const specPath = path.join(this.openApiDir, specFile);
        
        const generator = new SwaggerRequirementGenerator(specPath);
        const { requirements, testCases } = generator.generateRequirements();
        generator.saveResults(this.outputDir);

        this.processedApis.push({
          name: specFile,
          status: 'SUCCESS',
          requirements: requirements.length,
          testCases: testCases.length
        });

        successCount++;
        console.log(`✅ Successfully processed: ${specFile}\n`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error processing ${specFile}:`, errorMessage);
        this.processedApis.push({
          name: specFile,
          status: 'ERROR',
          requirements: 0,
          testCases: 0
        });
        errorCount++;
        console.log('');
      }
    }

    // Generate summary report
    this.generateSummaryReport();
    
    console.log('=====================================');
    console.log('🎯 Batch Processing Complete!');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total APIs: ${specFiles.length}`);
    console.log('');
    
    if (successCount > 0) {
      console.log('🚀 Next Steps:');
      console.log(`1. Start the Swagger Dashboard: npm run swagger-dashboard`);
      console.log(`2. Open dashboard: http://localhost:8888`);
      console.log(`3. Select an API from the dropdown to view requirements`);
      console.log(`4. Generate and run tests using the generated requirements`);
    }
  }

  private findSpecFiles(): string[] {
    const files = fs.readdirSync(this.openApiDir);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.json', '.yaml', '.yml'].includes(ext);
    });
  }

  private generateSummaryReport(): void {
    const reportPath = path.join(this.outputDir, 'batch-processing-summary.json');
    
    const summary = {
      processedAt: new Date().toISOString(),
      totalApis: this.processedApis.length,
      successfulApis: this.processedApis.filter(api => api.status === 'SUCCESS').length,
      failedApis: this.processedApis.filter(api => api.status === 'ERROR').length,
      totalRequirements: this.processedApis.reduce((sum, api) => sum + api.requirements, 0),
      totalTestCases: this.processedApis.reduce((sum, api) => sum + api.testCases, 0),
      apis: this.processedApis
    };

    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    
    console.log('📋 Summary Report:');
    console.log(`   Total APIs Processed: ${summary.totalApis}`);
    console.log(`   Successful: ${summary.successfulApis}`);
    console.log(`   Failed: ${summary.failedApis}`);
    console.log(`   Total Requirements Generated: ${summary.totalRequirements}`);
    console.log(`   Total Test Cases Generated: ${summary.totalTestCases}`);
    console.log(`   Report saved: ${reportPath}`);
    console.log('');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const openApiDir = process.argv[2] || './openapi-specs';
  const outputDir = process.argv[3] || './requirements';

  const processor = new SwaggerBatchProcessor(openApiDir, outputDir);
  processor.processAllSpecs().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { SwaggerBatchProcessor };
