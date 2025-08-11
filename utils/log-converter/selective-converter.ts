#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

/**
 * Selective Log Converter
 * 
 * Converts only log files with meaningful content (>1KB)
 * Creates individual test files for tests with actual implementation
 */

interface MeaningfulTest {
  name: string;
  originalFile: string;
  size: number;
  content: string;
  hasRealContent: boolean;
}

class SelectiveConverter {
  private logsDir: string;
  private outputDir: string;
  private meaningfulTests: MeaningfulTest[] = [];

  constructor(logsDir: string, outputDir: string) {
    this.logsDir = logsDir;
    this.outputDir = outputDir;
  }

  /**
   * Identify meaningful log files (>1KB with actual content)
   */
  async identifyMeaningfulLogs(): Promise<void> {
    const logFiles = fs.readdirSync(this.logsDir).filter(f => f.endsWith('.log'));
    
    console.log(`🔍 Analyzing ${logFiles.length} log files for meaningful content...`);
    
    for (const file of logFiles) {
      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if file has meaningful content
      const hasRealContent = this.hasMeaningfulContent(content, stats.size);
      
      if (hasRealContent) {
        this.meaningfulTests.push({
          name: this.extractTestName(file),
          originalFile: file,
          size: stats.size,
          content,
          hasRealContent: true
        });
        console.log(`✅ Found meaningful test: ${file} (${stats.size} bytes)`);
      } else {
        console.log(`⚠️  Skipping empty/minimal test: ${file} (${stats.size} bytes)`);
      }
    }
  }

  /**
   * Check if log content is meaningful
   */
  private hasMeaningfulContent(content: string, size: number): boolean {
    // Size-based filtering
    if (size < 1000) return false;
    
    // Content-based filtering
    const meaningfulPatterns = [
      /POST|GET|PUT|DELETE/i,           // HTTP methods
      /apiHelper\.setStep/,             // Test steps
      /testActions\./,                  // Test actions
      /expect\(/,                       // Assertions
      /response/i,                      // API responses
      /status.*\d{3}/i,                 // HTTP status codes
      /TC\d+/,                          // Test case IDs
      /authentication|login/i,          // Auth operations
      /\/api\//,                        // API endpoints
    ];
    
    return meaningfulPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Extract clean test name from filename
   */
  private extractTestName(filename: string): string {
    return filename
      .replace(/_http-live\.log$/, '')
      .replace(/\.log$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Convert meaningful logs to individual Playwright tests
   */
  async convertMeaningfulTests(): Promise<void> {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    console.log(`🏗️  Converting ${this.meaningfulTests.length} meaningful tests...`);

    for (const test of this.meaningfulTests) {
      const testContent = await this.generateMeaningfulTestFile(test);
      const filename = this.sanitizeFilename(test.name) + '.spec.ts';
      const filepath = path.join(this.outputDir, filename);
      
      fs.writeFileSync(filepath, testContent);
      console.log(`📄 Generated: ${filename}`);
    }
  }

  /**
   * Generate individual test file with real content
   */
  private async generateMeaningfulTestFile(test: MeaningfulTest): Promise<string> {
    const testImplementation = this.parseLogToTestImplementation(test.content);
    const tags = this.extractTags(test.content);
    const apiCalls = this.extractApiCalls(test.content);
    
    return `import { test, expect } from '../../utils/testFixtures.js';
import { TestActions } from '../../utils/test-actions.js';
import { TestDataLoader } from '../../utils/test-data-loader.js';
import { API_ENDPOINTS } from '../../config/endpoints.js';
import type { User } from '../../types/index.js';

/**
 * ${test.name}
 * 
 * Generated from: ${test.originalFile}
 * Size: ${test.size} bytes
 * API Calls: ${apiCalls.length}
 * Tags: ${tags.join(', ')}
 * 
 * This test has meaningful content from original logs
 */
test.describe('${test.name}', () => {
  let testActions: TestActions;
  let testData: any;

  test.beforeEach(async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    testData = TestDataLoader.loadTestData();
  });

  test('${test.name}${tags.length > 0 ? ' ' + tags.map(t => '@' + t).join(' ') : ''}', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
${testImplementation}
  });
});
`;
  }

  /**
   * Parse log content into test implementation
   */
  private parseLogToTestImplementation(content: string): string {
    const lines = content.split('\n');
    const implementation: string[] = [];
    
    let currentStep = '';
    let stepNumber = 1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract test steps
      if (trimmed.includes('setStep') || trimmed.includes('Step')) {
        const stepMatch = trimmed.match(/['"](.*?)['"]/);
        if (stepMatch) {
          currentStep = stepMatch[1];
          implementation.push(`    // Step ${stepNumber}: ${currentStep}`);
          implementation.push(`    apiHelper.setStep('${currentStep}');`);
          implementation.push('');
          stepNumber++;
        }
      }
      
      // Extract API calls
      if (trimmed.includes('POST') || trimmed.includes('GET') || trimmed.includes('PUT') || trimmed.includes('DELETE')) {
        const methodMatch = trimmed.match(/(POST|GET|PUT|DELETE)/i);
        const urlMatch = trimmed.match(/\/[a-zA-Z0-9\/\-_]*/);
        
        if (methodMatch && urlMatch) {
          const method = methodMatch[1].toUpperCase();
          const url = urlMatch[0];
          
          implementation.push(`    const result = await testActions.makeRequest('${method}', '${url}', {`);
          implementation.push('      // Request data extracted from logs');
          implementation.push('    });');
          implementation.push('    testActions.assertSuccessResponse(result);');
          implementation.push('');
        }
      }
      
      // Extract authentication
      if (trimmed.includes('auth') || trimmed.includes('login') || trimmed.includes('token')) {
        implementation.push('    const authResult = await testActions.setupAuthentication(testData.user);');
        implementation.push('    testActions.assertSuccessResponse(authResult);');
        implementation.push('');
      }
      
      // Extract assertions
      if (trimmed.includes('expect') || trimmed.includes('assert') || trimmed.includes('status')) {
        const statusMatch = trimmed.match(/(\d{3})/);
        if (statusMatch) {
          implementation.push(`    expect(result.status).toBe(${statusMatch[1]});`);
        }
      }
    }
    
    // If no meaningful implementation found, add basic structure
    if (implementation.length === 0) {
      implementation.push('    // Test implementation based on log analysis');
      implementation.push('    const result = await testActions.makeRequest(\'GET\', \'/api/test\', {});');
      implementation.push('    testActions.assertSuccessResponse(result);');
    }
    
    return implementation.join('\n');
  }

  /**
   * Extract tags from log content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Common tag patterns
    const tagPatterns = [
      { pattern: /@(\w+)/g, direct: true },
      { pattern: /smoke|critical/i, tag: 'smoke' },
      { pattern: /regression/i, tag: 'regression' },
      { pattern: /performance|concurrent/i, tag: 'performance' },
      { pattern: /auth|login|token/i, tag: 'auth' },
      { pattern: /header/i, tag: 'headers' },
      { pattern: /negative|error|fail/i, tag: 'negative' },
      { pattern: /TC\d+/i, tag: 'testcase' },
    ];
    
    for (const { pattern, tag, direct } of tagPatterns) {
      if (direct) {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleanTag = match.replace('@', '');
            if (!tags.includes(cleanTag)) tags.push(cleanTag);
          });
        }
      } else {
        if (pattern.test(content) && !tags.includes(tag!)) {
          tags.push(tag!);
        }
      }
    }
    
    return tags;
  }

  /**
   * Extract API calls from log content
   */
  private extractApiCalls(content: string): Array<{method: string, url: string}> {
    const calls: Array<{method: string, url: string}> = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const methodMatch = line.match(/(POST|GET|PUT|DELETE)/i);
      const urlMatch = line.match(/\/[a-zA-Z0-9\/\-_]*/);
      
      if (methodMatch && urlMatch) {
        calls.push({
          method: methodMatch[1].toUpperCase(),
          url: urlMatch[0]
        });
      }
    }
    
    return calls;
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  /**
   * Generate summary report
   */
  async generateReport(): Promise<void> {
    const report = {
      summary: {
        totalLogsAnalyzed: fs.readdirSync(this.logsDir).filter(f => f.endsWith('.log')).length,
        meaningfulTestsFound: this.meaningfulTests.length,
        emptyTestsSkipped: fs.readdirSync(this.logsDir).filter(f => f.endsWith('.log')).length - this.meaningfulTests.length,
        totalFilesGenerated: this.meaningfulTests.length
      },
      meaningfulTests: this.meaningfulTests.map(t => ({
        name: t.name,
        originalFile: t.originalFile,
        size: t.size,
        tags: this.extractTags(t.content),
        apiCalls: this.extractApiCalls(t.content).length
      }))
    };
    
    const reportPath = path.join(this.outputDir, '../meaningful-tests-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Meaningful tests report generated');
  }

  /**
   * Main execution
   */
  async execute(): Promise<void> {
    console.log('🎯 Selective Log Converter - Meaningful Tests Only');
    console.log('==================================================');
    
    await this.identifyMeaningfulLogs();
    console.log(`✅ Found ${this.meaningfulTests.length} meaningful tests`);
    
    await this.convertMeaningfulTests();
    console.log('✅ Generated meaningful test files');
    
    await this.generateReport();
    console.log('✅ Generated report');
    
    console.log('\n🎉 Selective conversion completed!');
    console.log(`📁 Meaningful tests: ${this.outputDir}`);
    console.log(`📊 Tests with real content: ${this.meaningfulTests.length}`);
  }
}

// CLI execution
async function main() {
  const logsDir = process.argv[2] || './logs';
  const outputDir = process.argv[3] || './generated-tests/tests/meaningful';
  
  const converter = new SelectiveConverter(logsDir, outputDir);
  await converter.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SelectiveConverter };
