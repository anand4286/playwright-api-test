#!/usr/bin/env node

/**
 * Test the log converter with current logs
 */

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLogConverter() {
  console.log('🧪 Testing Log Converter');
  console.log('═'.repeat(30));
  
  // Get project root
  const projectRoot = path.resolve(__dirname, '../../');
  const logsDir = path.join(projectRoot, 'logs');
  
  console.log(`📁 Checking logs directory: ${logsDir}`);
  
  if (!fs.existsSync(logsDir)) {
    console.error('❌ Logs directory not found');
    return;
  }
  
  // Count log files
  const logFiles = fs.readdirSync(logsDir)
    .filter(file => file.endsWith('.log'))
    .length;
    
  console.log(`📊 Found ${logFiles} log files`);
  
  if (logFiles === 0) {
    console.warn('⚠️  No log files found. Run some tests first:');
    console.log('   npm run test:dev:verbose');
    return;
  }
  
  console.log('✅ Ready to convert logs to tests!');
  console.log('\n🚀 To run the converter:');
  console.log('   cd utils/log-converter');
  console.log('   node quick-start.js');
  console.log('\n📚 Or read the documentation:');
  console.log('   cat utils/log-converter/README.md');
}

testLogConverter().catch(console.error);
