#!/usr/bin/env node

/**
 * Quick Start Script for Log Converter
 * 
 * This script provides an easy way to test the log converter with your existing logs
 */

import { LogConverter } from './log-converter.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function quickStart() {
  console.log('🚀 Quick Start - Log to Test Converter');
  console.log('═'.repeat(50));
  
  // Get the project root (go up from utils/log-converter)
  const projectRoot = path.resolve(__dirname, '../../');
  const logsDir = path.join(projectRoot, 'logs');
  const outputDir = path.join(projectRoot, 'generated-tests');
  
  console.log(`📁 Input logs: ${logsDir}`);
  console.log(`📂 Output: ${outputDir}`);
  
  const config = {
    // Input configuration
    logsDirectory: logsDir,
    logFormats: ['playwright', 'supertest', 'generic'],
    
    // Output configuration
    outputDirectory: outputDir,
    projectName: 'Generated Playwright Tests',
    
    // Generation options
    environments: ['dev', 'staging', 'qa', 'prod'],
    generateDataFiles: true,
    generateUtilities: true,
    generateFixtures: true,
    reuseExistingComponents: true,
    
    // Migration options
    migrationMode: 'incremental' as const,
    batchSize: 10, // Small batch for testing
    
    // Template options
    templateStyle: 'typescript' as const,
    includeComments: true,
    includeDocumentation: true
  };
  
  try {
    console.log('\n🔍 Creating log converter...');
    const converter = new LogConverter(config);
    
    console.log('🏗️  Starting conversion...');
    const report = await converter.convert();
    
    console.log('\n✅ Conversion completed!');
    console.log('📊 Summary:');
    console.log(`  • Tests generated: ${report.summary.testsGenerated}`);
    console.log(`  • Files created: ${report.summary.filesCreated}`);
    console.log(`  • Warnings: ${report.summary.warnings}`);
    console.log(`  • Errors: ${report.summary.errors}`);
    
    console.log('\n💡 Next steps:');
    console.log('  1. Check the generated-tests directory');
    console.log('  2. Review generated test files');
    console.log('  3. Run: cd generated-tests && npm install');
    console.log('  4. Run tests: npm run test:dev');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  quickStart();
}
