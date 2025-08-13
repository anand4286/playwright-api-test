#!/usr/bin/env node

import { Command } from 'commander';
import { SwaggerRequirementGenerator } from './SwaggerRequirementGenerator';
import chalk from 'chalk';
import path from 'path';

const program = new Command();

program
  .name('swagger-generate')
  .description('Generate requirements for a single OpenAPI specification')
  .version('1.0.0')
  .argument('<spec-file>', 'OpenAPI specification file (JSON, YAML, or YML)')
  .option('-o, --output <dir>', 'Output directory for generated files', './requirements')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (specFile, options) => {
    try {
      if (!specFile) {
        console.error(chalk.red('❌ Please provide an OpenAPI specification file'));
        process.exit(1);
      }

      const specPath = path.resolve(specFile);
      
      if (options.verbose) {
        console.log(chalk.blue(`📝 Processing: ${specPath}`));
        console.log(chalk.blue(`📁 Output directory: ${options.output}`));
      }

      console.log(chalk.blue('🔄 Generating requirements...'));
      
      const generator = new SwaggerRequirementGenerator(specPath);
      const { requirements, testCases } = generator.generateRequirements();
      const metrics = generator.generateMetrics();
      
      generator.saveResults(options.output);

      console.log(chalk.green('✅ Requirements generation complete!'));
      console.log(`📊 API: ${generator['apiName']}`);
      console.log(`📋 Requirements: ${requirements.length}`);
      console.log(`🧪 Test Cases: ${testCases.length}`);
      console.log(`📈 Total Endpoints: ${metrics.totalEndpoints}`);
      
      if (options.verbose) {
        console.log(chalk.blue('\n📊 Detailed Metrics:'));
        console.log(`  Endpoints by Method:`, metrics.endpointsByMethod);
        console.log(`  Requirements by Category:`, metrics.requirementsByCategory);
        console.log(`  Test Cases by Priority:`, metrics.testCasesByPriority);
      }

      console.log(chalk.blue('\n🚀 Next steps:'));
      console.log('  1. Review the generated requirements');
      console.log('  2. Start dashboard: npx swagger-dashboard start');
      console.log('  3. Implement the test cases in your testing framework');

    } catch (error) {
      console.error(chalk.red('❌ Generation failed:'), error);
      process.exit(1);
    }
  });

program.parse();
