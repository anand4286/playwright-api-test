#!/usr/bin/env node

import { LogConverter, ConverterConfig } from './log-converter.js';
import * as path from 'path';
import * as fs from 'fs';

/**
 * CLI interface for the Log Converter
 * 
 * Usage: node log-converter-cli.js [options]
 * 
 * Examples:
 *   # Convert current logs to tests
 *   node log-converter-cli.js
 * 
 *   # Convert with custom configuration
 *   node log-converter-cli.js --input ./custom-logs --output ./generated-tests
 * 
 *   # Batch mode for large migrations
 *   node log-converter-cli.js --batch-size 100 --migration-mode full
 * 
 *   # Supertest migration
 *   node log-converter-cli.js --input ./supertest-logs --legacy-mode supertest
 */

interface CLIOptions {
  input?: string;
  output?: string;
  projectName?: string;
  environments?: string[];
  batchSize?: number;
  migrationMode?: 'full' | 'incremental';
  legacyMode?: string;
  format?: string;
  help?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

class LogConverterCLI {
  private options: CLIOptions = {};

  constructor() {
    this.parseArguments();
  }

  /**
   * Main CLI entry point
   */
  async run(): Promise<void> {
    if (this.options.help) {
      this.showHelp();
      return;
    }

    try {
      console.log('🔄 Playwright API Test Log Converter');
      console.log('═'.repeat(50));

      if (this.options.dryRun) {
        console.log('🧪 DRY RUN MODE - No files will be created');
      }

      const config = this.buildConfig();
      this.validateConfig(config);

      if (this.options.verbose) {
        this.logConfiguration(config);
      }

      const converter = new LogConverter(config);
      
      let report;
      if (config.migrationMode === 'full' && config.batchSize > 0) {
        console.log('📦 Running in batch mode for large migration...');
        report = await converter.convertInBatches();
      } else {
        console.log('🚀 Running standard conversion...');
        report = await converter.convert();
      }

      this.logResults(report);

    } catch (error) {
      console.error('❌ Conversion failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   */
  private parseArguments(): void {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--input':
        case '-i':
          this.options.input = args[++i];
          break;
          
        case '--output':
        case '-o':
          this.options.output = args[++i];
          break;
          
        case '--project-name':
        case '-p':
          this.options.projectName = args[++i];
          break;
          
        case '--environments':
        case '-e':
          this.options.environments = args[++i].split(',').map(e => e.trim());
          break;
          
        case '--batch-size':
        case '-b':
          this.options.batchSize = parseInt(args[++i]);
          break;
          
        case '--migration-mode':
        case '-m':
          const mode = args[++i];
          if (mode === 'full' || mode === 'incremental') {
            this.options.migrationMode = mode;
          } else {
            throw new Error(`Invalid migration mode: ${mode}. Use 'full' or 'incremental'`);
          }
          break;
          
        case '--legacy-mode':
        case '-l':
          this.options.legacyMode = args[++i];
          break;
          
        case '--format':
        case '-f':
          this.options.format = args[++i];
          break;
          
        case '--verbose':
        case '-v':
          this.options.verbose = true;
          break;
          
        case '--dry-run':
        case '-d':
          this.options.dryRun = true;
          break;
          
        case '--help':
        case '-h':
          this.options.help = true;
          break;
          
        default:
          console.warn(`Unknown option: ${arg}`);
          break;
      }
    }
  }

  /**
   * Build converter configuration from CLI options
   */
  private buildConfig(): ConverterConfig {
    const currentDir = process.cwd();
    
    return {
      // Input configuration
      logsDirectory: this.options.input || path.join(currentDir, 'logs'),
      logFormats: ['playwright', 'supertest', 'generic'],
      
      // Output configuration
      outputDirectory: this.options.output || path.join(currentDir, 'generated-tests'),
      projectName: this.options.projectName || 'Generated API Tests',
      
      // Generation options
      environments: this.options.environments || ['dev', 'staging', 'qa', 'prod'],
      generateDataFiles: true,
      generateUtilities: true,
      generateFixtures: true,
      reuseExistingComponents: true,
      
      // Migration options
      migrationMode: this.options.migrationMode || 'incremental',
      batchSize: this.options.batchSize || 50,
      
      // Template options
      templateStyle: 'typescript',
      includeComments: true,
      includeDocumentation: true
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: ConverterConfig): void {
    if (!fs.existsSync(config.logsDirectory)) {
      throw new Error(`Input logs directory not found: ${config.logsDirectory}`);
    }

    if (!config.projectName.trim()) {
      throw new Error('Project name cannot be empty');
    }

    if (config.environments.length === 0) {
      throw new Error('At least one environment must be specified');
    }

    if (config.batchSize <= 0) {
      throw new Error('Batch size must be greater than 0');
    }
  }

  /**
   * Log configuration details
   */
  private logConfiguration(config: ConverterConfig): void {
    console.log('\n📋 Configuration:');
    console.log(`  Input: ${config.logsDirectory}`);
    console.log(`  Output: ${config.outputDirectory}`);
    console.log(`  Project: ${config.projectName}`);
    console.log(`  Environments: ${config.environments.join(', ')}`);
    console.log(`  Migration Mode: ${config.migrationMode}`);
    console.log(`  Batch Size: ${config.batchSize}`);
    console.log(`  Template: ${config.templateStyle}`);
  }

  /**
   * Log conversion results
   */
  private logResults(report: any): void {
    console.log('\n📊 CONVERSION RESULTS');
    console.log('═'.repeat(30));
    console.log(`✅ Tests Generated: ${report.summary.testsGenerated}`);
    console.log(`📄 Files Created: ${report.summary.filesCreated}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    
    if (report.migrationProgress) {
      console.log(`📦 Batches: ${report.migrationProgress.batchesProcessed}/${report.migrationProgress.totalBatches}`);
    }

    console.log('\n💡 Recommendations:');
    report.recommendations.slice(0, 5).forEach((rec: string) => {
      console.log(`  • ${rec}`);
    });

    console.log(`\n📂 Generated tests: ${this.options.output || './generated-tests'}`);
    console.log('\n🎉 Conversion completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Review generated test files');
    console.log('  2. Customize test data and assertions');
    console.log('  3. Run tests: npm run test:dev');
    console.log('  4. Configure CI/CD pipeline');
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
🔄 Playwright API Test Log Converter

Convert API logs (Playwright, Supertest, etc.) into complete Playwright test suites.

USAGE:
  node log-converter-cli.js [options]

OPTIONS:
  -i, --input <dir>           Input logs directory (default: ./logs)
  -o, --output <dir>          Output directory (default: ./generated-tests)
  -p, --project-name <name>   Project name (default: "Generated API Tests")
  -e, --environments <list>   Comma-separated environments (default: dev,staging,qa,prod)
  -b, --batch-size <num>      Batch size for large migrations (default: 50)
  -m, --migration-mode <mode> Migration mode: full | incremental (default: incremental)
  -l, --legacy-mode <type>    Legacy test framework (supertest, mocha, jest)
  -v, --verbose               Verbose output
  -d, --dry-run               Preview changes without creating files
  -h, --help                  Show this help

EXAMPLES:
  # Basic conversion
  node log-converter-cli.js

  # Custom input/output
  node log-converter-cli.js -i ./api-logs -o ./my-tests

  # Large migration with batching
  node log-converter-cli.js -b 100 -m full

  # Supertest migration
  node log-converter-cli.js -l supertest -i ./supertest-logs

  # Preview changes
  node log-converter-cli.js --dry-run -v

MIGRATION WORKFLOW:
  1. Place your API logs in the input directory
  2. Run the converter with appropriate options
  3. Review generated test files
  4. Customize test data and assertions
  5. Run tests across environments

For large legacy migrations (6000+ tests):
  1. Organize logs by test suite/feature
  2. Use batch mode for processing
  3. Run conversion in stages
  4. Validate each batch before proceeding

SUPPORTED LOG FORMATS:
  • Playwright HTTP logs (with emoji formatting)
  • Supertest/Mocha/Chai logs
  • Generic HTTP request/response logs
  • Custom API testing framework logs

OUTPUT STRUCTURE:
  generated-tests/
  ├── tests/              # Test files organized by suite
  ├── utils/              # Reusable utilities and helpers
  ├── config/             # Environment configurations
  ├── types/              # TypeScript definitions
  ├── data/               # Test data generators
  ├── scripts/            # Test execution scripts
  └── README.md           # Generated documentation

For more information, visit: https://github.com/your-repo/playwright-api-test
`);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new LogConverterCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
