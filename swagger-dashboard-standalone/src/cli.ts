#!/usr/bin/env node

import { Command } from 'commander';
import { SwaggerDashboard } from './SwaggerDashboard';
import chalk from 'chalk';

const program = new Command();

program
  .name('swagger-dashboard')
  .description('Universal OpenAPI testing framework with interactive dashboard')
  .version('1.0.0');

program
  .command('start')
  .description('Start the dashboard server')
  .option('-p, --port <port>', 'Server port', '8888')
  .option('-i, --input <dir>', 'OpenAPI specs directory', './openapi-specs')
  .option('-o, --output <dir>', 'Requirements output directory', './requirements')
  .option('--no-process', 'Skip processing specs, just start server')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting Swagger Dashboard...'));
      
      const dashboard = new SwaggerDashboard({
        port: parseInt(options.port),
        openApiDir: options.input,
        requirementsDir: options.output
      });

      await dashboard.run({
        processSpecs: options.process !== false,
        startServer: true
      });

      console.log(chalk.green(`✅ Dashboard running on http://localhost:${options.port}`));
    } catch (error) {
      console.error(chalk.red('❌ Error starting dashboard:'), error);
      process.exit(1);
    }
  });

program
  .command('process')
  .description('Process OpenAPI specs and generate requirements')
  .option('-i, --input <dir>', 'OpenAPI specs directory', './openapi-specs')
  .option('-o, --output <dir>', 'Requirements output directory', './requirements')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔄 Processing OpenAPI specifications...'));
      
      const result = await SwaggerDashboard.processSpecs(options.input, options.output);
      
      console.log(chalk.green('✅ Processing complete!'));
      console.log(`📊 Processed ${result.totalApis} APIs`);
      console.log(`✅ Successful: ${result.successfulApis}`);
      console.log(`❌ Failed: ${result.failedApis}`);
      console.log(`📋 Requirements: ${result.totalRequirements}`);
      console.log(`🧪 Test Cases: ${result.totalTestCases}`);
    } catch (error) {
      console.error(chalk.red('❌ Error processing specs:'), error);
      process.exit(1);
    }
  });

program
  .command('quick-start')
  .description('Process specs and start dashboard in one command')
  .option('-p, --port <port>', 'Server port', '8888')
  .option('-i, --input <dir>', 'OpenAPI specs directory', './openapi-specs')
  .option('-o, --output <dir>', 'Requirements output directory', './requirements')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Swagger Dashboard Quick Start'));
      
      await SwaggerDashboard.quickStart({
        port: parseInt(options.port),
        openApiDir: options.input,
        outputDir: options.output
      });

      console.log(chalk.green(`✅ Dashboard ready at http://localhost:${options.port}`));
    } catch (error) {
      console.error(chalk.red('❌ Error in quick start:'), error);
      process.exit(1);
    }
  });

// Handle unrecognized commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command. Use --help to see available commands.'));
  process.exit(1);
});

// Default action (quick-start)
if (process.argv.length === 2) {
  SwaggerDashboard.quickStart().catch(error => {
    console.error(chalk.red('❌ Error:'), error);
    process.exit(1);
  });
} else {
  program.parse();
}
