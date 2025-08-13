#!/usr/bin/env node

import { Command } from 'commander';
import { SwaggerBatchProcessor } from './SwaggerBatchProcessor';
import chalk from 'chalk';

const program = new Command();

program
  .name('swagger-batch')
  .description('Batch process multiple OpenAPI specifications')
  .version('1.0.0')
  .argument('[input-dir]', 'OpenAPI specs directory', './openapi-specs')
  .argument('[output-dir]', 'Requirements output directory', './requirements')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (inputDir, outputDir, options) => {
    try {
      if (options.verbose) {
        console.log(chalk.blue('📝 Verbose mode enabled'));
      }

      const processor = new SwaggerBatchProcessor(inputDir, outputDir);
      const result = await processor.processAllSpecs();

      if (result.successfulApis > 0) {
        console.log(chalk.green('\n🎉 Batch processing completed successfully!'));
        console.log(chalk.blue('Next steps:'));
        console.log('  1. Start dashboard: npx swagger-dashboard start');
        console.log(`  2. Open browser: http://localhost:8888`);
      } else {
        console.log(chalk.yellow('\n⚠️  No APIs were processed successfully.'));
        console.log('Check the error messages above for details.');
      }

    } catch (error) {
      console.error(chalk.red('❌ Batch processing failed:'), error);
      process.exit(1);
    }
  });

program.parse();
