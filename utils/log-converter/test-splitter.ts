#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Suite Splitter
 * 
 * Splits a consolidated test suite into individual test files
 * for better management and parallel execution
 */

interface TestInfo {
  name: string;
  content: string;
  tags: string[];
  originalFile: string;
  steps: number;
  apiCalls: number;
}

class TestSplitter {
  private sourceFile: string;
  private outputDir: string;
  private tests: TestInfo[] = [];

  constructor(sourceFile: string, outputDir: string) {
    this.sourceFile = sourceFile;
    this.outputDir = outputDir;
  }

  /**
   * Parse the consolidated test file and extract individual tests
   */
  async parseTestFile(): Promise<void> {
    const content = fs.readFileSync(this.sourceFile, 'utf-8');
    
    // Extract imports and setup
    const imports = this.extractImports(content);
    const setup = this.extractSetup(content);
    
    // Split by test blocks
    const testBlocks = content.split(/test\(/);
    
    for (let i = 1; i < testBlocks.length; i++) {
      const testBlock = 'test(' + testBlocks[i];
      const testInfo = this.parseTestBlock(testBlock, imports, setup);
      
      if (testInfo) {
        this.tests.push(testInfo);
      }
    }
  }

  /**
   * Extract imports from the file
   */
  private extractImports(content: string): string {
    const lines = content.split('\n');
    const imports: string[] = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('import ') || line.trim().startsWith('type ')) {
        imports.push(line);
      } else if (line.trim() === '' || line.trim().startsWith('/**') || line.trim().startsWith('*')) {
        continue;
      } else {
        break;
      }
    }
    
    return imports.join('\n');
  }

  /**
   * Extract setup code
   */
  private extractSetup(content: string): string {
    const setupMatch = content.match(/test\.beforeEach\(async[^}]+}\);/s);
    return setupMatch ? setupMatch[0] : '';
  }

  /**
   * Parse individual test block
   */
  private parseTestBlock(testBlock: string, imports: string, setup: string): TestInfo | null {
    // Extract test name and tags
    const nameMatch = testBlock.match(/test\('([^']+)'/);
    if (!nameMatch) return null;
    
    const fullName = nameMatch[1];
    const tags = this.extractTags(fullName);
    const cleanName = fullName.replace(/@\w+/g, '').trim();
    
    // Extract test metadata from comments
    const commentMatch = testBlock.match(/\/\*\*(.*?)\*\//s);
    let originalFile = '';
    let steps = 0;
    let apiCalls = 0;
    
    if (commentMatch) {
      const comment = commentMatch[1];
      const fileMatch = comment.match(/Generated from: ([^\n]+)/);
      const stepsMatch = comment.match(/Steps: (\d+)/);
      const apiMatch = comment.match(/API Calls: (\d+)/);
      
      if (fileMatch) originalFile = fileMatch[1].trim();
      if (stepsMatch) steps = parseInt(stepsMatch[1]);
      if (apiMatch) apiCalls = parseInt(apiMatch[1]);
    }
    
    // Extract test body
    const bodyStart = testBlock.indexOf('{');
    const bodyEnd = this.findMatchingBrace(testBlock, bodyStart);
    const testBody = testBlock.substring(bodyStart + 1, bodyEnd).trim();
    
    // Create complete test file content
    const testContent = this.createTestFile(cleanName, fullName, testBody, tags, imports, setup, originalFile, steps, apiCalls);
    
    return {
      name: cleanName,
      content: testContent,
      tags,
      originalFile,
      steps,
      apiCalls
    };
  }

  /**
   * Extract tags from test name
   */
  private extractTags(testName: string): string[] {
    const tagMatches = testName.match(/@\w+/g);
    return tagMatches ? tagMatches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Find matching closing brace
   */
  private findMatchingBrace(text: string, startIndex: number): number {
    let count = 1;
    let index = startIndex + 1;
    
    while (index < text.length && count > 0) {
      if (text[index] === '{') count++;
      else if (text[index] === '}') count--;
      index++;
    }
    
    return index - 1;
  }

  /**
   * Create individual test file content
   */
  private createTestFile(
    cleanName: string, 
    fullName: string, 
    testBody: string, 
    tags: string[], 
    imports: string, 
    setup: string,
    originalFile: string,
    steps: number,
    apiCalls: number
  ): string {
    const fileName = this.sanitizeFileName(cleanName);
    
    return `${imports}

/**
 * ${cleanName}
 * 
 * Generated from: ${originalFile}
 * Steps: ${steps}
 * API Calls: ${apiCalls}
 * Tags: ${tags.join(', ')}
 * 
 * Auto-generated individual test file
 */
test.describe('${cleanName}', () => {
  let testActions: TestActions;
  let testData: any;

  ${setup}

  test('${fullName}', async ({ apiHelper }) => {
    testActions = new TestActions(apiHelper);
    
${testBody}
  });
});
`;
  }

  /**
   * Sanitize filename
   */
  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  /**
   * Generate all individual test files
   */
  async generateIndividualFiles(): Promise<void> {
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    console.log(`🏗️  Generating ${this.tests.length} individual test files...`);
    
    for (const test of this.tests) {
      const fileName = `${this.sanitizeFileName(test.name)}.spec.ts`;
      const filePath = path.join(this.outputDir, fileName);
      
      fs.writeFileSync(filePath, test.content);
      console.log(`📄 Generated: ${fileName}`);
    }
  }

  /**
   * Generate execution scripts for different scenarios
   */
  async generateExecutionScripts(): Promise<void> {
    const scriptsDir = path.join(path.dirname(this.outputDir), 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    // Script to run all tests
    const runAllScript = `#!/bin/bash
# Run all individual tests
echo "🚀 Running all ${this.tests.length} individual tests..."
npx playwright test tests/individual/
`;

    // Script to run by tags
    const runByTagsScript = `#!/bin/bash
# Run tests by specific tags
TAG=\${1:-smoke}
echo "🏷️  Running tests with tag: @\$TAG"
npx playwright test tests/individual/ --grep "@\$TAG"
`;

    // Script to run specific test
    const runSpecificScript = `#!/bin/bash
# Run specific test by name
TEST_NAME=\${1}
if [ -z "\$TEST_NAME" ]; then
  echo "Usage: ./run-specific.sh <test-name>"
  echo "Available tests:"
${this.tests.map(t => `  echo "  - ${this.sanitizeFileName(t.name)}"`).join('\n')}
  exit 1
fi
echo "🎯 Running specific test: \$TEST_NAME"
npx playwright test tests/individual/\$TEST_NAME.spec.ts
`;

    // Script to run parallel execution
    const runParallelScript = `#!/bin/bash
# Run tests in parallel by category
echo "⚡ Running tests in parallel..."
npx playwright test tests/individual/ --workers=4
`;

    fs.writeFileSync(path.join(scriptsDir, 'run-all-individual.sh'), runAllScript);
    fs.writeFileSync(path.join(scriptsDir, 'run-by-tags.sh'), runByTagsScript);
    fs.writeFileSync(path.join(scriptsDir, 'run-specific.sh'), runSpecificScript);
    fs.writeFileSync(path.join(scriptsDir, 'run-parallel.sh'), runParallelScript);

    // Make scripts executable
    fs.chmodSync(path.join(scriptsDir, 'run-all-individual.sh'), '755');
    fs.chmodSync(path.join(scriptsDir, 'run-by-tags.sh'), '755');
    fs.chmodSync(path.join(scriptsDir, 'run-specific.sh'), '755');
    fs.chmodSync(path.join(scriptsDir, 'run-parallel.sh'), '755');

    console.log('📄 Generated execution scripts:');
    console.log('  - run-all-individual.sh');
    console.log('  - run-by-tags.sh');
    console.log('  - run-specific.sh');
    console.log('  - run-parallel.sh');
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(): Promise<void> {
    const summary = {
      totalTests: this.tests.length,
      testsByTags: this.groupByTags(),
      testsByOriginalFile: this.groupByOriginalFile(),
      executionOptions: {
        runAll: 'npm run test:individual:all',
        runByTag: 'npm run test:individual:tag smoke',
        runSpecific: 'npm run test:individual:specific test-name',
        runParallel: 'npm run test:individual:parallel'
      }
    };

    const reportPath = path.join(path.dirname(this.outputDir), 'individual-tests-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    
    console.log(`📊 Summary report generated: individual-tests-report.json`);
  }

  private groupByTags(): Record<string, number> {
    const tagCounts: Record<string, number> = {};
    
    for (const test of this.tests) {
      for (const tag of test.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    
    return tagCounts;
  }

  private groupByOriginalFile(): Record<string, number> {
    const fileCounts: Record<string, number> = {};
    
    for (const test of this.tests) {
      const file = test.originalFile || 'unknown';
      fileCounts[file] = (fileCounts[file] || 0) + 1;
    }
    
    return fileCounts;
  }

  /**
   * Main execution method
   */
  async execute(): Promise<void> {
    console.log('🔄 Starting test suite splitting...');
    
    await this.parseTestFile();
    console.log(`✅ Parsed ${this.tests.length} tests from consolidated suite`);
    
    await this.generateIndividualFiles();
    console.log('✅ Generated individual test files');
    
    await this.generateExecutionScripts();
    console.log('✅ Generated execution scripts');
    
    await this.generateSummaryReport();
    console.log('✅ Generated summary report');
    
    console.log('\n🎉 Test suite splitting completed!');
    console.log(`📁 Individual tests: ${this.outputDir}`);
    console.log(`📊 Total tests: ${this.tests.length}`);
  }
}

// CLI execution
async function main() {
  const sourceFile = process.argv[2] || './generated-tests/tests/logs/logs.spec.ts';
  const outputDir = process.argv[3] || './generated-tests/tests/individual';
  
  console.log('🏗️  Test Suite Splitter');
  console.log('═══════════════════════');
  console.log(`📄 Source: ${sourceFile}`);
  console.log(`📁 Output: ${outputDir}`);
  console.log('');
  
  const splitter = new TestSplitter(sourceFile, outputDir);
  await splitter.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

export { TestSplitter };
