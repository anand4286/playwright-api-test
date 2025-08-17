#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { generateFromSpec } from './generator.js';
// import { startServer } from './server.js';

const program = new Command();

// Function to detect OpenAPI specification files
async function detectOpenAPISpecs() {
  const patterns = [
    '*.json',
    '*.yaml',
    '*.yml'
  ];
  
  const allFiles = [];
  for (const pattern of patterns) {
    const files = await glob(pattern, { cwd: process.cwd() });
    allFiles.push(...files);
  }
  
  const specFiles = [];
  
  for (const file of allFiles) {
    try {
      // Skip common non-spec files
      const fileName = path.basename(file, path.extname(file)).toLowerCase();
      if (fileName === 'package' || fileName === 'package-lock' || 
          fileName === 'tsconfig' || fileName === 'jest.config' ||
          fileName === 'webpack.config' || fileName === 'rollup.config') {
        continue;
      }
      
      const filePath = path.resolve(file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // More accurate OpenAPI detection
      const hasOpenAPIIndicators = (
        // OpenAPI 3.x
        (content.includes('"openapi"') && content.includes('"3.')) ||
        (content.includes('openapi:') && content.includes('3.')) ||
        // Swagger 2.x
        (content.includes('"swagger"') && content.includes('"2.')) ||
        (content.includes('swagger:') && content.includes('2.')) ||
        // Must have both info and paths sections
        ((content.includes('"info"') || content.includes('info:')) && 
         (content.includes('"paths"') || content.includes('paths:')))
      );
      
      // Additional check to avoid false positives
      const hasPackageIndicators = content.includes('"scripts"') || 
                                  content.includes('"dependencies"') ||
                                  content.includes('"devDependencies"');
      
      if (hasOpenAPIIndicators && !hasPackageIndicators) {
        specFiles.push(file);
      }
    } catch (error) {
      // Skip files that can't be read or parsed
      continue;
    }
  }
  
  return specFiles.sort();
}

program
  .name('playwright-api-generator')
  .description('Generate Playwright API tests and documentation from OpenAPI specs')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate tests and documentation from OpenAPI spec')
  .option('-s, --spec <path>', 'Path to OpenAPI spec file (JSON or YAML)')
  .option('-u, --url <url>', 'URL to OpenAPI spec')
  .option('-o, --output <path>', 'Output directory', './generated')
  .option('--auto-detect', 'Automatically detect OpenAPI specs in current folder')
  .option('--no-tests', 'Skip test generation')
  .option('--no-docs', 'Skip documentation generation')
  .option('--open', 'Open generated documentation in browser')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting API Test Generator...\n'));
      
      let specPath = options.spec;
      
      // Auto-detect OpenAPI specs if no spec is provided or if auto-detect is enabled
      if (!options.spec && !options.url) {
        console.log(chalk.yellow('🔍 No spec provided, auto-detecting OpenAPI specs...\n'));
        const detectedSpecs = await detectOpenAPISpecs();
        
        if (detectedSpecs.length === 0) {
          console.error(chalk.red('❌ Error: No OpenAPI specification files found in current directory'));
          console.log(chalk.gray('   Supported formats: *.json, *.yaml, *.yml'));
          console.log(chalk.gray('   Expected patterns: *api*.json, *swagger*.json, *openapi*.yaml, etc.'));
          process.exit(1);
        }
        
        if (detectedSpecs.length === 1) {
          specPath = detectedSpecs[0];
          console.log(chalk.green(`✅ Found OpenAPI spec: ${specPath}\n`));
        } else {
          console.log(chalk.yellow('📋 Multiple OpenAPI specs found:'));
          detectedSpecs.forEach((spec, index) => {
            console.log(chalk.gray(`   ${index + 1}. ${spec}`));
          });
          console.log(chalk.blue('\n🔄 Processing all detected specs...\n'));
          
          // Process all specs
          for (const spec of detectedSpecs) {
            const specName = path.basename(spec, path.extname(spec));
            const outputDir = path.join(options.output, specName);
            
            console.log(chalk.cyan(`\n📁 Processing: ${spec} → ${outputDir}`));
            
            const config = {
              specPath: spec,
              outputDir: outputDir,
              generateTests: options.tests !== false,
              generateMatrix: true,
              generateFlows: true,
              generateDocs: options.docs !== false,
              includeExamples: true,
              includeNegativeTests: true,
              openBrowser: false
            };

            await generateFromSpec(config);
          }
          
          console.log(chalk.green('\n✅ All specs processed successfully!'));
          return;
        }
      }

      const config = {
        specPath: specPath,
        specUrl: options.url,
        outputDir: options.output,
        generateTests: options.tests !== false,
        generateMatrix: true,
        generateFlows: true,
        generateDocs: options.docs !== false,
        includeExamples: true,
        includeNegativeTests: true,
        openBrowser: options.open || false
      };

      await generateFromSpec(config);
      
      console.log(chalk.green('✅ Generation completed successfully!'));
      
      if (config.openBrowser) {
        const open = require('open');
        const indexPath = path.join(config.outputDir, 'docs', 'index.html');
        if (await fs.pathExists(indexPath)) {
          await open(indexPath);
        }
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('auto')
  .description('Auto-detect and generate from all OpenAPI specs in current folder')
  .option('-o, --output <path>', 'Output directory', './generated')
  .option('--no-tests', 'Skip test generation')
  .option('--no-docs', 'Skip documentation generation')
  .option('--open', 'Open generated documentation in browser')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Auto-detecting OpenAPI specifications...\n'));
      
      const detectedSpecs = await detectOpenAPISpecs();
      
      if (detectedSpecs.length === 0) {
        console.error(chalk.red('❌ No OpenAPI specification files found in current directory'));
        console.log(chalk.gray('   Supported formats: *.json, *.yaml, *.yml'));
        console.log(chalk.gray('   Expected content: swagger, openapi, info, paths'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✅ Found ${detectedSpecs.length} OpenAPI spec(s):`));
      detectedSpecs.forEach((spec, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${spec}`));
      });
      console.log();
      
      // Process all specs
      for (const spec of detectedSpecs) {
        const specName = path.basename(spec, path.extname(spec));
        const outputDir = path.join(options.output, specName);
        
        console.log(chalk.cyan(`📁 Processing: ${chalk.white(spec)} → ${chalk.white(outputDir)}`));
        
        const config = {
          specPath: spec,
          outputDir: outputDir,
          generateTests: options.tests !== false,
          generateMatrix: true,
          generateFlows: true,
          generateDocs: options.docs !== false,
          includeExamples: true,
          includeNegativeTests: true,
          openBrowser: false
        };

        await generateFromSpec(config);
        console.log(chalk.green(`✅ Completed: ${spec}`));
      }
      
      console.log(chalk.green(`\n🎉 Successfully processed ${detectedSpecs.length} OpenAPI specification(s)!`));
      
      if (options.open && detectedSpecs.length > 0) {
        const firstSpec = detectedSpecs[0];
        const specName = path.basename(firstSpec, path.extname(firstSpec));
        const indexPath = path.join(options.output, specName, 'traceability-matrix.html');
        
        if (await fs.pathExists(indexPath)) {
          const open = require('open');
          await open(indexPath);
          console.log(chalk.blue('🌐 Opened documentation in browser'));
        }
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start development server to view generated documentation')
  .option('-p, --port <number>', 'Port number', '3000')
  .option('-d, --dir <path>', 'Directory to serve', './generated')
  .action(async (options) => {
    try {
      console.log(chalk.yellow('Server functionality not yet implemented'));
      // await startServer(options.dir, parseInt(options.port));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('demo')
  .description('Run demo with Petstore API')
  .option('-o, --output <path>', 'Output directory', './demo-output')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🐾 Running Petstore API demo...\n'));
      
      const config = {
        specUrl: 'https://petstore.swagger.io/v2/swagger.json',
        outputDir: options.output,
        generateTests: true,
        generateDocs: true,
        openBrowser: true
      };

      await generateFromSpec(config);
      
      console.log(chalk.green('✅ Demo completed! Opening documentation...'));
      
      const open = require('open');
      const indexPath = path.join(config.outputDir, 'docs', 'index.html');
      if (await fs.pathExists(indexPath)) {
        await open(indexPath);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse();
