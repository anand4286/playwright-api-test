import { LogAnalyzer, LogAnalysisResult } from './log-analyzer.js';
import { TestGenerator, GenerationConfig, GenerationResult } from './test-generator.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Log Converter - Main orchestrator for log-to-test conversion
 * 
 * Purpose: Convert API logs (Playwright, Supertest, etc.) into complete Playwright test suites
 * Features: 
 *   - Multi-format log parsing (Playwright, Supertest, generic HTTP)
 *   - Intelligent test generation with reusable components
 *   - Multi-environment support
 *   - Legacy migration capabilities
 */

export interface ConverterConfig {
  // Input configuration
  logsDirectory: string;
  logFormats: string[];
  
  // Output configuration
  outputDirectory: string;
  projectName: string;
  
  // Generation options
  environments: string[];
  generateDataFiles: boolean;
  generateUtilities: boolean;
  generateFixtures: boolean;
  reuseExistingComponents: boolean;
  
  // Migration options
  migrationMode: 'full' | 'incremental';
  batchSize: number;
  
  // Template options
  templateStyle: 'typescript' | 'javascript';
  includeComments: boolean;
  includeDocumentation: boolean;
}

export interface ConversionReport {
  summary: {
    logsProcessed: number;
    testsGenerated: number;
    filesCreated: number;
    errors: number;
    warnings: number;
  };
  details: {
    analysis: LogAnalysisResult;
    generation: GenerationResult;
    errors: string[];
    warnings: string[];
  };
  recommendations: string[];
  migrationProgress?: {
    batchesProcessed: number;
    totalBatches: number;
    completionPercentage: number;
  };
}

export class LogConverter {
  private config: ConverterConfig;
  private analyzer: LogAnalyzer;
  private generator: TestGenerator;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(config: ConverterConfig) {
    this.config = config;
    this.analyzer = new LogAnalyzer(config.logsDirectory);
    
    const generatorConfig: GenerationConfig = {
      outputDirectory: config.outputDirectory,
      projectName: config.projectName,
      environments: config.environments,
      reuseExistingComponents: config.reuseExistingComponents,
      generateDataFiles: config.generateDataFiles,
      generateUtilities: config.generateUtilities,
      generateFixtures: config.generateFixtures,
      templateStyle: config.templateStyle
    };
    
    this.generator = new TestGenerator(generatorConfig);
  }

  /**
   * Convert logs to complete test suite
   */
  async convert(): Promise<ConversionReport> {
    console.log('🚀 Starting log-to-test conversion...');
    console.log(`📁 Input: ${this.config.logsDirectory}`);
    console.log(`📂 Output: ${this.config.outputDirectory}`);
    
    try {
      // Step 1: Analyze logs
      console.log('\n📊 Analyzing logs...');
      const analysis = await this.analyzer.analyzeAllLogs();
      
      if (analysis.tests.length === 0) {
        throw new Error('No tests found in logs directory');
      }
      
      console.log(`✅ Analysis complete: ${analysis.tests.length} tests found`);
      this.logAnalysisSummary(analysis);
      
      // Step 2: Generate tests
      console.log('\n🏗️  Generating test suite...');
      const generation = await this.generator.generateTestSuite(analysis.tests);
      
      console.log(`✅ Generation complete: ${generation.files.length} files created`);
      this.logGenerationSummary(generation);
      
      // Step 3: Generate additional artifacts
      await this.generateAdditionalArtifacts(analysis);
      
      // Step 4: Create report
      const report = this.createConversionReport(analysis, generation);
      await this.saveConversionReport(report);
      
      console.log('\n🎉 Conversion completed successfully!');
      this.printFinalSummary(report);
      
      return report;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errors.push(errorMessage);
      console.error(`❌ Conversion failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Convert logs in batches (for large legacy migrations)
   */
  async convertInBatches(): Promise<ConversionReport> {
    console.log('🔄 Starting batch conversion...');
    
    const logFiles = this.getLogFiles();
    const totalBatches = Math.ceil(logFiles.length / this.config.batchSize);
    
    console.log(`📦 Processing ${logFiles.length} log files in ${totalBatches} batches`);
    
    let allTests: any[] = [];
    let batchesProcessed = 0;
    
    for (let i = 0; i < logFiles.length; i += this.config.batchSize) {
      const batch = logFiles.slice(i, i + this.config.batchSize);
      batchesProcessed++;
      
      console.log(`\n📦 Processing batch ${batchesProcessed}/${totalBatches} (${batch.length} files)`);
      
      try {
        const batchAnalysis = await this.processBatch(batch);
        allTests.push(...batchAnalysis.tests);
        
        const progress = (batchesProcessed / totalBatches) * 100;
        console.log(`✅ Batch ${batchesProcessed} complete (${progress.toFixed(1)}%)`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.warnings.push(`Batch ${batchesProcessed} failed: ${errorMessage}`);
        console.warn(`⚠️  Batch ${batchesProcessed} failed: ${errorMessage}`);
      }
    }
    
    // Generate final test suite from all batches
    console.log(`\n🏗️  Generating final test suite from ${allTests.length} tests...`);
    const generation = await this.generator.generateTestSuite(allTests);
    
    const analysis: LogAnalysisResult = {
      tests: allTests,
      endpoints: new Set(),
      methods: new Set(),
      dataPatterns: {},
      suites: new Set(),
      tags: new Set(),
      dependencies: new Map()
    };
    
    const report = this.createConversionReport(analysis, generation);
    report.migrationProgress = {
      batchesProcessed,
      totalBatches,
      completionPercentage: 100
    };
    
    await this.saveConversionReport(report);
    
    console.log('\n🎉 Batch conversion completed!');
    this.printFinalSummary(report);
    
    return report;
  }

  /**
   * Process a single batch of log files
   */
  private async processBatch(logFiles: string[]): Promise<LogAnalysisResult> {
    const tempAnalyzer = new LogAnalyzer('');
    const tests: any[] = [];
    
    for (const logFile of logFiles) {
      try {
        const test = await tempAnalyzer.analyzeLogFile(logFile);
        if (test) {
          tests.push(test);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.warnings.push(`Failed to process ${logFile}: ${errorMessage}`);
      }
    }
    
    return {
      tests,
      endpoints: new Set(),
      methods: new Set(),
      dataPatterns: {},
      suites: new Set(),
      tags: new Set(),
      dependencies: new Map()
    };
  }

  /**
   * Get all log files from the directory
   */
  private getLogFiles(): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(this.config.logsDirectory)) {
      throw new Error(`Logs directory not found: ${this.config.logsDirectory}`);
    }
    
    const scanDirectory = (dir: string) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          scanDirectory(itemPath);
        } else if (this.isLogFile(item)) {
          files.push(itemPath);
        }
      });
    };
    
    scanDirectory(this.config.logsDirectory);
    return files.sort();
  }

  /**
   * Check if file is a log file
   */
  private isLogFile(filename: string): boolean {
    const logExtensions = ['.log', '.txt', '.json'];
    const logPatterns = [
      /.*http.*\.log$/i,
      /.*api.*\.log$/i,
      /.*test.*\.log$/i,
      /.*request.*\.log$/i,
      /.*response.*\.log$/i
    ];
    
    return logExtensions.some(ext => filename.endsWith(ext)) ||
           logPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Generate additional artifacts (README, scripts, etc.)
   */
  private async generateAdditionalArtifacts(analysis: LogAnalysisResult): Promise<void> {
    console.log('📝 Generating additional artifacts...');
    
    // Generate README
    await this.generateReadme(analysis);
    
    // Generate run scripts
    await this.generateRunScripts();
    
    // Generate package.json updates
    await this.generatePackageJsonUpdates();
    
    // Generate playwright config
    await this.generatePlaywrightConfig();
  }

  /**
   * Generate README documentation
   */
  private async generateReadme(analysis: LogAnalysisResult): Promise<void> {
    const readmeContent = `# ${this.config.projectName} - Generated Test Suite

## Overview
This test suite was automatically generated from API logs using the Log Converter utility.

## Statistics
- **Tests Generated**: ${analysis.tests.length}
- **Test Suites**: ${analysis.suites.size}
- **API Endpoints**: ${analysis.endpoints.size}
- **HTTP Methods**: ${[...analysis.methods].join(', ')}
- **Tags**: ${[...analysis.tags].join(', ')}

## Project Structure
\`\`\`
${this.config.outputDirectory}/
├── tests/              # Generated test files
├── utils/              # Test utilities and helpers
├── config/             # Environment configurations
├── types/              # TypeScript type definitions
└── data/               # Test data files
\`\`\`

## Environment Support
This test suite supports multiple environments:
${this.config.environments.map(env => `- ${env.toUpperCase()}`).join('\n')}

## Running Tests

### Single Environment
\`\`\`bash
# Run tests in development environment
npm run test:dev

# Run with verbose logging
npm run test:dev:verbose

# Run specific suite
npm run test:dev -- --grep "Authentication"
\`\`\`

### Multi-Environment
\`\`\`bash
# Run across all environments
npm run test:multi-env

# Run specific suite across environments
npm run test:multi-env -- -s authentication
\`\`\`

## Generated Components

### Test Files
${[...analysis.suites].map(suite => `- **${suite}**: Tests for ${suite.toLowerCase()} functionality`).join('\n')}

### Utilities
- **TestActions**: Reusable test operations
- **TestDataLoader**: Dynamic test data generation
- **API Helpers**: HTTP request/response utilities

### Configuration
- **Environment Configs**: Environment-specific settings
- **Endpoint Definitions**: API endpoint constants
- **Test Fixtures**: Shared test setup and teardown

## Migration Notes
${this.config.migrationMode === 'full' ? 
  '- Complete migration from legacy test suite' : 
  '- Incremental migration in progress'}
- Original log format: Auto-detected
- Test data: Dynamically generated (no hardcoded values)
- Multi-environment ready

## Recommendations
${this.generateReadmeRecommendations(analysis).map(rec => `- ${rec}`).join('\n')}

## Support
For issues or questions about the generated test suite, please refer to the original log files or contact the development team.
`;

    const readmePath = path.join(this.config.outputDirectory, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`📄 Generated: ${readmePath}`);
  }

  /**
   * Generate run scripts for the test suite
   */
  private async generateRunScripts(): Promise<void> {
    const scriptsDir = path.join(this.config.outputDirectory, 'scripts');
    
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    // Read shell script template
    const templatePath = path.join(__dirname, 'templates', 'run-tests.sh');
    let runScript = '';
    
    try {
      runScript = fs.readFileSync(templatePath, 'utf-8');
      // Replace template variables
      runScript = runScript.replace('{{ENVIRONMENTS}}', this.config.environments.join(' '));
    } catch (error) {
      // Fallback to basic script if template not found
      runScript = `#!/bin/bash
# Basic test runner
for env in ${this.config.environments.join(' ')}; do
  echo "Running tests in $env..."
  TEST_ENV=$env npx playwright test
done`;
    }

    const scriptPath = path.join(scriptsDir, 'run-tests.sh');
    fs.writeFileSync(scriptPath, runScript);
    fs.chmodSync(scriptPath, '755');
    console.log(`📄 Generated: ${scriptPath}`);
  }

  /**
   * Generate package.json script updates
   */
  private async generatePackageJsonUpdates(): Promise<void> {
    const scripts: Record<string, string> = {};
    
    // Generate environment-specific scripts
    this.config.environments.forEach(env => {
      scripts[`test:${env}`] = `TEST_ENV=${env} npx playwright test`;
      scripts[`test:${env}:verbose`] = `TEST_ENV=${env} ENABLE_FULL_LOGS=true npx playwright test`;
      scripts[`test:${env}:debug`] = `TEST_ENV=${env} npx playwright test --debug`;
    });
    
    // Multi-environment scripts
    scripts['test:multi-env'] = './scripts/run-tests.sh';
    scripts['test:all-envs'] = `./scripts/run-tests.sh -e "${this.config.environments.join(' ')}"`;
    
    const scriptsContent = JSON.stringify(scripts, null, 2);
    const scriptsPath = path.join(this.config.outputDirectory, 'generated-scripts.json');
    
    fs.writeFileSync(scriptsPath, scriptsContent);
    console.log(`📄 Generated: ${scriptsPath}`);
    console.log('💡 Add these scripts to your package.json');
  }

  /**
   * Generate Playwright configuration
   */
  private async generatePlaywrightConfig(): Promise<void> {
    const configContent = `import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  reporter: [
    ['html', { outputFolder: 'reports/html-report' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://jsonplaceholder.typicode.com',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  projects: [
    ${this.config.environments.map(env => `{
      name: '${env}-api-tests',
      use: {
        baseURL: process.env.${env.toUpperCase()}_BASE_URL || 'https://${env === 'prod' ? 'api' : env + '-api'}.example.com'
      }
    }`).join(',\n    ')}
  ]
});`;

    const configPath = path.join(this.config.outputDirectory, 'playwright.config.ts');
    fs.writeFileSync(configPath, configContent);
    console.log(`📄 Generated: ${configPath}`);
  }

  /**
   * Create comprehensive conversion report
   */
  private createConversionReport(analysis: LogAnalysisResult, generation: GenerationResult): ConversionReport {
    return {
      summary: {
        logsProcessed: analysis.tests.length,
        testsGenerated: generation.summary.testsGenerated,
        filesCreated: generation.files.length,
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      details: {
        analysis,
        generation,
        errors: this.errors,
        warnings: this.warnings
      },
      recommendations: [
        ...generation.recommendations,
        ...this.generateAdditionalRecommendations(analysis)
      ]
    };
  }

  /**
   * Save conversion report to file
   */
  private async saveConversionReport(report: ConversionReport): Promise<void> {
    const reportPath = path.join(this.config.outputDirectory, 'conversion-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Conversion report saved: ${reportPath}`);
  }

  /**
   * Log analysis summary
   */
  private logAnalysisSummary(analysis: LogAnalysisResult): void {
    console.log(`  📊 Tests found: ${analysis.tests.length}`);
    console.log(`  🏗️  Suites: ${analysis.suites.size}`);
    console.log(`  🔗 Endpoints: ${analysis.endpoints.size}`);
    console.log(`  📨 HTTP Methods: ${[...analysis.methods].join(', ')}`);
    console.log(`  🏷️  Tags: ${[...analysis.tags].join(', ')}`);
  }

  /**
   * Log generation summary
   */
  private logGenerationSummary(generation: GenerationResult): void {
    console.log(`  📝 Test files: ${generation.summary.testsGenerated}`);
    console.log(`  🔧 Utility files: ${generation.summary.utilitiesGenerated}`);
    console.log(`  📋 Fixture files: ${generation.summary.fixturesGenerated}`);
    console.log(`  📦 Data files: ${generation.summary.dataFilesGenerated}`);
  }

  /**
   * Print final summary
   */
  private printFinalSummary(report: ConversionReport): void {
    console.log('\n📊 CONVERSION SUMMARY');
    console.log('═'.repeat(50));
    console.log(`✅ Tests Generated: ${report.summary.testsGenerated}`);
    console.log(`📄 Files Created: ${report.summary.filesCreated}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    
    if (report.migrationProgress) {
      console.log(`📦 Batches Processed: ${report.migrationProgress.batchesProcessed}/${report.migrationProgress.totalBatches}`);
      console.log(`🏁 Progress: ${report.migrationProgress.completionPercentage}%`);
    }
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('─'.repeat(30));
    report.recommendations.forEach(rec => console.log(`• ${rec}`));
    
    console.log(`\n📂 Output Directory: ${this.config.outputDirectory}`);
    console.log('🎉 Ready to run tests!');
  }

  /**
   * Generate README recommendations
   */
  private generateReadmeRecommendations(analysis: LogAnalysisResult): string[] {
    const recommendations: string[] = [];
    
    if (analysis.tests.length > 100) {
      recommendations.push('Consider running tests in parallel for better performance');
    }
    
    if (analysis.suites.size > 10) {
      recommendations.push('Use suite-specific test runs for targeted testing');
    }
    
    recommendations.push('Review generated test data for business logic accuracy');
    recommendations.push('Add custom assertions based on application requirements');
    recommendations.push('Configure CI/CD pipeline for automated testing');
    
    return recommendations;
  }

  /**
   * Generate additional recommendations
   */
  private generateAdditionalRecommendations(analysis: LogAnalysisResult): string[] {
    const recommendations: string[] = [];
    
    recommendations.push('Review and customize generated test assertions');
    recommendations.push('Add environment-specific test data as needed');
    recommendations.push('Configure test reporting and monitoring');
    
    return recommendations;
  }
}
