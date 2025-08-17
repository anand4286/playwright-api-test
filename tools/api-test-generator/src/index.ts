#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { generateFromSpec } from './generator.js';
import type { GeneratorConfig } from './types.js';

const program = new Command();

program
  .name('playwright-api-test-generator')
  .description('Generate Playwright API tests and requirement traceability matrix from OpenAPI specs')
  .version('1.0.0');

program
  .argument('<spec>', 'OpenAPI specification URL or file path')
  .option('-o, --output <dir>', 'Output directory', './api-tests-output')
  .option('--no-tests', 'Skip test generation')
  .option('--no-matrix', 'Skip traceability matrix generation')
  .option('--no-flows', 'Skip flow diagram generation')
  .option('--no-docs', 'Skip documentation generation')
  .option('--base-url <url>', 'Override base URL')
  .option('--auth-type <type>', 'Authentication type (apikey|bearer|basic|oauth2)')
  .option('--auth-value <value>', 'Authentication value')
  .option('--examples', 'Include example data in tests', false)
  .option('--negative-tests', 'Include negative test scenarios', true)
  .action(async (spec: string, options: any) => {
    try {
      console.log(chalk.blue('🚀 Starting API test generation...'));
      
      const config: GeneratorConfig = {
        specPath: spec,
        outputDir: options.output,
        generateTests: options.tests !== false,
        generateMatrix: options.matrix !== false,
        generateFlows: options.flows !== false,
        generateDocs: options.docs !== false,
        baseUrl: options.baseUrl,
        authType: options.authType,
        authValue: options.authValue,
        includeExamples: options.examples,
        includeNegativeTests: options.negativeTests
      };
      
      const result = await generateFromSpec(config);
      
      console.log(chalk.green('\\n✅ Generation completed successfully!'));
      console.log(chalk.cyan('\\n📊 Summary:'));
      console.log(chalk.cyan(`   • Endpoints: ${result.summary.totalEndpoints}`));
      console.log(chalk.cyan(`   • Tests: ${result.summary.totalTests}`));
      console.log(chalk.cyan(`   • Requirements: ${result.summary.totalRequirements}`));
      console.log(chalk.cyan(`   • Flow Diagrams: ${result.summary.totalFlows}`));
      console.log(chalk.cyan(`   • Coverage: ${result.summary.coverage.toFixed(1)}%`));
      
      console.log(chalk.yellow('\\n📁 Generated files:'));
      console.log(chalk.gray(`   Output directory: ${config.outputDir}`));
      
      if (result.tests) {
        console.log(chalk.gray(`   Test files: ${result.tests.testFiles.length} files`));
      }
      
      if (result.traceability) {
        console.log(chalk.gray(`   Traceability matrix: ${result.traceability.matrixFile}`));
      }
      
      if (result.flows) {
        console.log(chalk.gray(`   Flow diagrams: ${result.flows.interactive}`));
      }
      
      if (result.documentation) {
        console.log(chalk.gray(`   Documentation: ${result.documentation}`));
      }
      
      console.log(chalk.green('\\n🎉 Ready to test your API!'));
      console.log(chalk.blue('\\nNext steps:'));
      console.log(chalk.blue('  1. cd ' + config.outputDir));
      console.log(chalk.blue('  2. npm install'));
      console.log(chalk.blue('  3. npx playwright install'));
      console.log(chalk.blue('  4. npx playwright test'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add example command
program
  .command('example')
  .description('Generate tests for the Petstore example API')
  .option('-o, --output <dir>', 'Output directory', './petstore-api-tests')
  .action(async (options: any) => {
    const petstoreUrl = 'https://petstore.swagger.io/v2/swagger.json';
    console.log(chalk.blue('🐾 Generating tests for Petstore API...'));
    
    const config: GeneratorConfig = {
      specPath: petstoreUrl,
      outputDir: options.output,
      generateTests: true,
      generateMatrix: true,
      generateFlows: true,
      generateDocs: true,
      includeExamples: true,
      includeNegativeTests: true
    };
    
    try {
      const result = await generateFromSpec(config);
      console.log(chalk.green('\\n🎉 Petstore API tests generated successfully!'));
      console.log(chalk.blue(`Check out the results in: ${config.outputDir}`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
