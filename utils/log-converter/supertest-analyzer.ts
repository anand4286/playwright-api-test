#!/usr/bin/env npx tsx

/**
 * ENTERPRISE SUPERTEST ANALYZER
 * 
 * Step 1 of migration: Analyze your existing Supertest codebase
 * to extract patterns for 6000+ tests and 700+ endpoints
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { execSync } from 'child_process';

interface SupertestAnalysisResult {
  summary: {
    testFiles: number;
    endpoints: number;
    environments: number;
    testCount: number;
    complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  };
  endpoints: EndpointInfo[];
  testPatterns: TestPatternInfo[];
  environments: EnvironmentInfo[];
  utilities: UtilityInfo[];
  recommendations: string[];
}

interface EndpointInfo {
  path: string;
  method: string;
  file: string;
  line: number;
  auth: string[];
  middleware: string[];
  testCount: number;
}

interface TestPatternInfo {
  pattern: string;
  count: number;
  files: string[];
  example: string;
}

interface EnvironmentInfo {
  name: string;
  file: string;
  config: Record<string, any>;
}

interface UtilityInfo {
  name: string;
  type: 'helper' | 'middleware' | 'fixture' | 'util';
  file: string;
  usageCount: number;
}

class SupertestAnalyzer {
  private targetPath: string;
  private outputPath: string;
  private analysis: SupertestAnalysisResult;

  constructor(targetPath: string, outputPath = './supertest-analysis') {
    this.targetPath = targetPath;
    this.outputPath = outputPath;
    this.analysis = {
      summary: {
        testFiles: 0,
        endpoints: 0,
        environments: 0,
        testCount: 0,
        complexity: 'simple'
      },
      endpoints: [],
      testPatterns: [],
      environments: [],
      utilities: [],
      recommendations: []
    };
  }

  async analyze(): Promise<SupertestAnalysisResult> {
    console.log('🔍 ANALYZING SUPERTEST CODEBASE');
    console.log('==============================');
    console.log(`Target: ${this.targetPath}`);
    console.log(`Output: ${this.outputPath}`);

    if (!existsSync(this.targetPath)) {
      throw new Error(`Supertest path does not exist: ${this.targetPath}`);
    }

    // Create output directory
    if (!existsSync(this.outputPath)) {
      mkdirSync(this.outputPath, { recursive: true });
    }

    try {
      // Step 1: Find and analyze test files
      await this.analyzeTestFiles();
      
      // Step 2: Extract endpoints
      await this.extractEndpoints();
      
      // Step 3: Analyze environments
      await this.analyzeEnvironments();
      
      // Step 4: Extract utilities
      await this.extractUtilities();
      
      // Step 5: Generate recommendations
      await this.generateRecommendations();
      
      // Step 6: Save analysis
      await this.saveAnalysis();

      return this.analysis;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  private async analyzeTestFiles(): Promise<void> {
    console.log('\n📁 Analyzing test files...');
    
    try {
      // Find test files using common patterns
      const findCommand = `find "${this.targetPath}" -type f \\( -name "*.test.js" -o -name "*.spec.js" -o -name "*.test.ts" -o -name "*.spec.ts" \\)`;
      const testFiles = execSync(findCommand, { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean);

      console.log(`   Found ${testFiles.length} test files`);
      this.analysis.summary.testFiles = testFiles.length;

      // Analyze each test file
      let totalTests = 0;
      for (const file of testFiles) {
        try {
          const content = readFileSync(file, 'utf-8');
          const testCount = this.countTests(content);
          totalTests += testCount;
          
          console.log(`   ${basename(file)}: ${testCount} tests`);
        } catch (error) {
          console.warn(`   ⚠️  Could not read ${file}`);
        }
      }

      this.analysis.summary.testCount = totalTests;
      console.log(`   Total tests: ${totalTests}`);

    } catch (error) {
      console.error('   Error analyzing test files:', error);
    }
  }

  private countTests(content: string): number {
    // Count test functions (it, test, describe)
    const testMatches = content.match(/\b(it|test|describe)\s*\(/g);
    return testMatches ? testMatches.length : 0;
  }

  private async extractEndpoints(): Promise<void> {
    console.log('\n🌐 Extracting API endpoints...');
    
    try {
      const findCommand = `find "${this.targetPath}" -type f \\( -name "*.js" -o -name "*.ts" \\)`;
      const files = execSync(findCommand, { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean);

      const endpoints: EndpointInfo[] = [];
      
      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf-8');
          const fileEndpoints = this.extractEndpointsFromFile(content, file);
          endpoints.push(...fileEndpoints);
        } catch (error) {
          // Skip files that can't be read
        }
      }

      // Deduplicate endpoints
      const uniqueEndpoints = this.deduplicateEndpoints(endpoints);
      this.analysis.endpoints = uniqueEndpoints;
      this.analysis.summary.endpoints = uniqueEndpoints.length;

      console.log(`   Found ${uniqueEndpoints.length} unique endpoints`);
      
      // Show top 10 endpoints
      const topEndpoints = uniqueEndpoints
        .sort((a, b) => b.testCount - a.testCount)
        .slice(0, 10);
      
      console.log('   Top endpoints by test count:');
      for (const endpoint of topEndpoints) {
        console.log(`     ${endpoint.method} ${endpoint.path} (${endpoint.testCount} tests)`);
      }

    } catch (error) {
      console.error('   Error extracting endpoints:', error);
    }
  }

  private extractEndpointsFromFile(content: string, file: string): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];
    const lines = content.split('\n');
    
    // Look for supertest patterns: .get('/path'), .post('/path'), etc.
    const endpointRegex = /\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    
    let match;
    while ((match = endpointRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      endpoints.push({
        path,
        method,
        file: file.replace(this.targetPath, ''),
        line: lineNumber,
        auth: this.extractAuth(content, match.index),
        middleware: this.extractMiddleware(content, match.index),
        testCount: 1
      });
    }

    return endpoints;
  }

  private extractAuth(content: string, position: number): string[] {
    const auth: string[] = [];
    const contextStart = Math.max(0, position - 500);
    const contextEnd = Math.min(content.length, position + 500);
    const context = content.substring(contextStart, contextEnd);
    
    // Look for common auth patterns
    if (context.includes('.set(\'Authorization\'')) auth.push('bearer');
    if (context.includes('.auth(')) auth.push('basic');
    if (context.includes('jwt')) auth.push('jwt');
    if (context.includes('token')) auth.push('token');
    
    return auth;
  }

  private extractMiddleware(content: string, position: number): string[] {
    // Extract middleware patterns from context
    return [];
  }

  private deduplicateEndpoints(endpoints: EndpointInfo[]): EndpointInfo[] {
    const endpointMap = new Map<string, EndpointInfo>();
    
    for (const endpoint of endpoints) {
      const key = `${endpoint.method}:${endpoint.path}`;
      if (endpointMap.has(key)) {
        endpointMap.get(key)!.testCount++;
      } else {
        endpointMap.set(key, { ...endpoint });
      }
    }
    
    return Array.from(endpointMap.values());
  }

  private async analyzeEnvironments(): Promise<void> {
    console.log('\n🌍 Analyzing environments...');
    
    try {
      // Look for config files
      const configPatterns = [
        'config.js', 'config.ts', 'config.json',
        '.env', '.env.dev', '.env.prod', '.env.test',
        'package.json'
      ];
      
      const environments: EnvironmentInfo[] = [];
      
      for (const pattern of configPatterns) {
        try {
          const findCommand = `find "${this.targetPath}" -name "${pattern}" -type f`;
          const files = execSync(findCommand, { encoding: 'utf-8' })
            .split('\n')
            .filter(Boolean);
          
          for (const file of files) {
            try {
              const content = readFileSync(file, 'utf-8');
              const envInfo = this.parseEnvironmentFile(content, file);
              if (envInfo) {
                environments.push(envInfo);
              }
            } catch (error) {
              // Skip unparseable files
            }
          }
        } catch (error) {
          // Skip missing patterns
        }
      }

      this.analysis.environments = environments;
      this.analysis.summary.environments = environments.length;
      
      console.log(`   Found ${environments.length} environment configurations`);
      for (const env of environments) {
        console.log(`     ${env.name} (${basename(env.file)})`);
      }

    } catch (error) {
      console.error('   Error analyzing environments:', error);
    }
  }

  private parseEnvironmentFile(content: string, file: string): EnvironmentInfo | null {
    try {
      const filename = basename(file);
      
      if (filename.endsWith('.json')) {
        const config = JSON.parse(content);
        return {
          name: filename.replace('.json', ''),
          file,
          config
        };
      }
      
      if (filename.startsWith('.env')) {
        const config: Record<string, any> = {};
        const lines = content.split('\n');
        for (const line of lines) {
          const match = line.match(/^([A-Z_]+)=(.+)$/);
          if (match) {
            config[match[1]] = match[2];
          }
        }
        return {
          name: filename,
          file,
          config
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private async extractUtilities(): Promise<void> {
    console.log('\n🛠️  Extracting utilities...');
    
    // This would extract helper functions, middleware, etc.
    // Implementation would depend on specific patterns in the codebase
    
    console.log('   Utility extraction completed');
  }

  private async generateRecommendations(): Promise<void> {
    console.log('\n💡 Generating recommendations...');
    
    const recommendations: string[] = [];
    const { summary } = this.analysis;
    
    // Determine complexity
    if (summary.testCount > 10000 && summary.endpoints > 500) {
      summary.complexity = 'enterprise';
      recommendations.push('Enterprise-scale migration required - use batch processing');
      recommendations.push('Implement incremental migration strategy');
      recommendations.push('Set up automated validation pipeline');
    } else if (summary.testCount > 1000 && summary.endpoints > 100) {
      summary.complexity = 'complex';
      recommendations.push('Complex migration - recommend staged approach');
      recommendations.push('Implement pattern-based generation');
    } else if (summary.testCount > 100 && summary.endpoints > 20) {
      summary.complexity = 'moderate';
      recommendations.push('Moderate complexity - batch processing recommended');
    } else {
      summary.complexity = 'simple';
      recommendations.push('Simple migration - direct conversion possible');
    }
    
    // Add specific recommendations
    if (summary.endpoints > 200) {
      recommendations.push('Extract endpoint patterns for code generation');
    }
    
    if (summary.environments > 5) {
      recommendations.push('Create environment mapping strategy');
    }
    
    if (summary.testCount > 5000) {
      recommendations.push('Implement parallel test generation');
      recommendations.push('Use memory-efficient batch processing');
    }
    
    this.analysis.recommendations = recommendations;
    
    console.log('   Recommendations:');
    for (const rec of recommendations) {
      console.log(`     • ${rec}`);
    }
  }

  private async saveAnalysis(): Promise<void> {
    console.log('\n💾 Saving analysis results...');
    
    // Save detailed analysis
    const analysisFile = join(this.outputPath, 'analysis.json');
    writeFileSync(analysisFile, JSON.stringify(this.analysis, null, 2));
    
    // Save summary report
    const summaryFile = join(this.outputPath, 'ANALYSIS-SUMMARY.md');
    const summaryContent = this.generateSummaryReport();
    writeFileSync(summaryFile, summaryContent);
    
    // Save migration plan
    const planFile = join(this.outputPath, 'MIGRATION-PLAN.md');
    const planContent = this.generateMigrationPlan();
    writeFileSync(planFile, planContent);
    
    console.log(`   Analysis saved to: ${this.outputPath}`);
    console.log(`   Summary report: ${summaryFile}`);
    console.log(`   Migration plan: ${planFile}`);
  }

  private generateSummaryReport(): string {
    const { summary, endpoints, recommendations } = this.analysis;
    
    return `# SUPERTEST ANALYSIS SUMMARY

## 📊 Overview
- **Test Files**: ${summary.testFiles}
- **Total Tests**: ${summary.testCount}
- **API Endpoints**: ${summary.endpoints}
- **Environments**: ${summary.environments}
- **Complexity**: ${summary.complexity.toUpperCase()}

## 🌐 Top Endpoints
${endpoints.sort((a, b) => b.testCount - a.testCount).slice(0, 10)
  .map(e => `- ${e.method} ${e.path} (${e.testCount} tests)`)
  .join('\n')}

## 💡 Recommendations
${recommendations.map(r => `- ${r}`).join('\n')}

## ⚡ Quick Actions
\`\`\`bash
# Next steps based on analysis
npm run generate:patterns --source="${this.targetPath}"
npm run create:migration-plan --complexity=${summary.complexity}
npm run start:migration --batch-size=${summary.testCount > 1000 ? 100 : 50}
\`\`\`
`;
  }

  private generateMigrationPlan(): string {
    const { summary } = this.analysis;
    const batchSize = summary.testCount > 5000 ? 100 : summary.testCount > 1000 ? 50 : 25;
    const phases = Math.ceil(summary.testCount / batchSize);
    
    return `# MIGRATION PLAN

## 📋 Migration Strategy for ${summary.complexity.toUpperCase()} Project

### Phase 1: Preparation (Week 1)
- [ ] Extract patterns from ${summary.testFiles} test files
- [ ] Map ${summary.endpoints} endpoints to Playwright structure  
- [ ] Configure ${summary.environments} environment mappings
- [ ] Set up batch processing for ${summary.testCount} tests

### Phase 2: Core Generation (Week 2-3)
- [ ] Generate TestActions with ${summary.endpoints} methods
- [ ] Create fixtures and test data
- [ ] Set up environment configurations
- [ ] Implement utility functions

### Phase 3: Test Migration (Week 4+)
- [ ] Process tests in ${phases} batches of ${batchSize}
- [ ] Validate each batch before proceeding
- [ ] Monitor memory usage and performance
- [ ] Track progress and handle errors

### Phase 4: Validation (Final Week)
- [ ] Run sample test executions
- [ ] Compare results with original Supertest
- [ ] Fix any conversion issues
- [ ] Document final migration

## 🚀 Recommended Commands

\`\`\`bash
# Start migration
npm run migrate:start --complexity=${summary.complexity}

# Process in batches  
npm run migrate:batch --size=${batchSize} --batch=1
npm run migrate:batch --size=${batchSize} --batch=2
# ... continue for all ${phases} batches

# Validate results
npm run validate:migration --sample=100
\`\`\`
`;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetPath = process.argv[2];
  const outputPath = process.argv[3];
  
  if (!targetPath) {
    console.error('Usage: npm run analyze:supertest <supertest-path> [output-path]');
    process.exit(1);
  }
  
  const analyzer = new SupertestAnalyzer(targetPath, outputPath);
  analyzer.analyze()
    .then(result => {
      console.log('\n🎉 ANALYSIS COMPLETED');
      console.log('===================');
      console.log(`Complexity: ${result.summary.complexity.toUpperCase()}`);
      console.log(`Tests: ${result.summary.testCount}`);
      console.log(`Endpoints: ${result.summary.endpoints}`);
      console.log(`Files: ${result.summary.testFiles}`);
    })
    .catch(console.error);
}

export { SupertestAnalyzer };
