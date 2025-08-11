import * as fs from 'fs';
import * as path from 'path';

/**
 * Log Analyzer - Parses API logs and extracts test information
 * 
 * Purpose: Parse HTTP logs to understand test structure, API calls, and data flow
 * Supports: Multiple log formats (Playwright, Supertest, custom formats)
 */

export interface ParsedRequest {
  method: string;
  url: string;
  fullUrl: string;
  headers: Record<string, any>;
  body: any;
  timestamp: string;
  testId?: string;
  scenarioName?: string;
}

export interface ParsedResponse {
  status: number;
  statusText?: string;
  headers: Record<string, any>;
  body: any;
  responseTime?: number;
  timestamp: string;
}

export interface TestStep {
  stepName: string;
  stepNumber: number;
  timestamp: string;
  requests: ParsedRequest[];
  responses: ParsedResponse[];
  assertions?: string[];
  dataExtracted?: Record<string, any>;
}

export interface ParsedTest {
  testName: string;
  testFile: string;
  testId?: string;
  tags: string[];
  suite: string;
  steps: TestStep[];
  duration?: number;
  status: 'passed' | 'failed' | 'skipped';
  dependencies?: string[];
  dataFlow?: Record<string, any>;
}

export interface LogAnalysisResult {
  tests: ParsedTest[];
  endpoints: Set<string>;
  methods: Set<string>;
  dataPatterns: Record<string, any>;
  suites: Set<string>;
  tags: Set<string>;
  dependencies: Map<string, string[]>;
}

export class LogAnalyzer {
  private logsDirectory: string;
  private logFormats: LogFormat[] = [];

  constructor(logsDirectory: string) {
    this.logsDirectory = logsDirectory;
    this.initializeLogFormats();
  }

  /**
   * Initialize supported log formats
   */
  private initializeLogFormats(): void {
    this.logFormats = [
      new PlaywrightLogFormat(),
      new SupertestLogFormat(),
      new GenericHttpLogFormat()
    ];
  }

  /**
   * Analyze all log files in the directory
   */
  async analyzeAllLogs(): Promise<LogAnalysisResult> {
    const logFiles = this.findLogFiles();
    const tests: ParsedTest[] = [];
    const endpoints = new Set<string>();
    const methods = new Set<string>();
    const suites = new Set<string>();
    const tags = new Set<string>();
    const dependencies = new Map<string, string[]>();
    const dataPatterns: Record<string, any> = {};

    console.log(`📁 Found ${logFiles.length} log files to analyze...`);

    for (const logFile of logFiles) {
      try {
        console.log(`🔍 Analyzing: ${path.basename(logFile)}`);
        const parsedTest = await this.analyzeLogFile(logFile);
        
        if (parsedTest) {
          tests.push(parsedTest);
          
          // Collect metadata
          suites.add(parsedTest.suite);
          parsedTest.tags.forEach(tag => tags.add(tag));
          
          // Collect API patterns
          parsedTest.steps.forEach(step => {
            step.requests.forEach(req => {
              endpoints.add(this.extractEndpoint(req.url));
              methods.add(req.method);
            });
          });
          
          // Analyze data patterns
          this.extractDataPatterns(parsedTest, dataPatterns);
        }
      } catch (error: any) {
        console.warn(`⚠️  Failed to analyze ${logFile}: ${error?.message || error}`);
      }
    }

    console.log(`✅ Analysis complete: ${tests.length} tests parsed`);

    return {
      tests,
      endpoints,
      methods,
      dataPatterns,
      suites,
      tags,
      dependencies
    };
  }

  /**
   * Analyze a single log file
   */
  async analyzeLogFile(logFile: string): Promise<ParsedTest | null> {
    const content = fs.readFileSync(logFile, 'utf-8');
    
    // Try each log format until one succeeds
    for (const format of this.logFormats) {
      if (format.canParse(content)) {
        console.log(`📋 Using ${format.getName()} format for ${path.basename(logFile)}`);
        return format.parse(content, logFile);
      }
    }
    
    console.warn(`❌ No suitable format found for ${logFile}`);
    return null;
  }

  /**
   * Find all log files in the directory
   */
  private findLogFiles(): string[] {
    const logFiles: string[] = [];
    
    if (!fs.existsSync(this.logsDirectory)) {
      console.warn(`❌ Logs directory not found: ${this.logsDirectory}`);
      return logFiles;
    }
    
    const files = fs.readdirSync(this.logsDirectory);
    
    for (const file of files) {
      const filePath = path.join(this.logsDirectory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && this.isLogFile(file)) {
        logFiles.push(filePath);
      }
    }
    
    return logFiles.sort();
  }

  /**
   * Check if file is a log file
   */
  private isLogFile(filename: string): boolean {
    const logExtensions = ['.log', '.txt', '.json'];
    const logPatterns = [
      /.*http.*\.log$/i,
      /.*api.*\.log$/i,
      /.*test.*\.log$/i,
      /.*request.*\.log$/i,
      /.*response.*\.log$/i
    ];
    
    return logExtensions.some(ext => filename.endsWith(ext)) ||
           logPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Extract endpoint pattern from URL
   */
  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // If not a full URL, assume it's already a path
      return url.split('?')[0]; // Remove query parameters
    }
  }

  /**
   * Extract data patterns for test data generation
   */
  private extractDataPatterns(test: ParsedTest, patterns: Record<string, any>): void {
    test.steps.forEach(step => {
      step.requests.forEach(req => {
        if (req.body && typeof req.body === 'object') {
          this.analyzeDataStructure(req.body, patterns, `${req.method}_${this.extractEndpoint(req.url)}`);
        }
      });
    });
  }

  /**
   * Analyze data structure to understand patterns
   */
  private analyzeDataStructure(data: any, patterns: Record<string, any>, context: string): void {
    if (!patterns[context]) {
      patterns[context] = {
        fields: new Set(),
        types: {},
        examples: {}
      };
    }
    
    Object.keys(data).forEach(key => {
      patterns[context].fields.add(key);
      patterns[context].types[key] = typeof data[key];
      patterns[context].examples[key] = data[key];
    });
  }
}

/**
 * Abstract base class for log format parsers
 */
abstract class LogFormat {
  abstract getName(): string;
  abstract canParse(content: string): boolean;
  abstract parse(content: string, filePath: string): ParsedTest | null;

  protected extractTestName(content: string, filePath: string): string {
    // Try to extract from file name first
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Clean up the file name to make it readable
    return fileName
      .replace(/_http-live$/, '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/^should\s+/, 'should ');
  }

  protected extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Common tag patterns
    const tagPatterns = [
      /@(\w+)/g,
      /\[(\w+)\]/g,
      /#(\w+)/g
    ];
    
    tagPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !tags.includes(match[1])) {
          tags.push(match[1]);
        }
      }
    });
    
    return tags;
  }

  protected extractSuite(testName: string, filePath: string): string {
    // Extract suite from file path or test name
    const pathParts = filePath.split(path.sep);
    const testDir = pathParts.find(part => part.includes('test'));
    
    if (testDir) {
      const index = pathParts.indexOf(testDir);
      if (index + 1 < pathParts.length) {
        return pathParts[index + 1];
      }
    }
    
    // Fallback to test name analysis
    if (testName.includes('auth')) return 'Authentication';
    if (testName.includes('user')) return 'User Management';
    if (testName.includes('profile')) return 'Profile Management';
    if (testName.includes('performance')) return 'Performance';
    
    return 'General';
  }
}

/**
 * Playwright log format parser
 */
class PlaywrightLogFormat extends LogFormat {
  getName(): string {
    return 'Playwright';
  }

  canParse(content: string): boolean {
    return content.includes('📤 HTTP REQUEST') && 
           content.includes('📥 HTTP RESPONSE') &&
           content.includes('📍 TEST STEP:');
  }

  parse(content: string, filePath: string): ParsedTest | null {
    const testName = this.extractTestName(content, filePath);
    const tags = this.extractTags(content);
    const suite = this.extractSuite(testName, filePath);
    
    const steps = this.parseSteps(content);
    
    return {
      testName,
      testFile: path.basename(filePath),
      tags,
      suite,
      steps,
      status: 'passed', // Assume passed if log exists
      dependencies: this.extractDependencies(content)
    };
  }

  private parseSteps(content: string): TestStep[] {
    const steps: TestStep[] = [];
    const stepSections = content.split('📍 TEST STEP:').slice(1);
    
    stepSections.forEach((section, index) => {
      const stepName = this.extractStepName(section);
      const requests = this.parseRequests(section);
      const responses = this.parseResponses(section);
      
      steps.push({
        stepName,
        stepNumber: index + 1,
        timestamp: this.extractTimestamp(section),
        requests,
        responses,
        assertions: this.extractAssertions(section)
      });
    });
    
    return steps;
  }

  private extractStepName(section: string): string {
    const match = section.match(/^([^\n]+)/);
    return match ? match[1].trim() : 'Unknown Step';
  }

  private extractTimestamp(section: string): string {
    const match = section.match(/⏰ Step Started: ([^\n]+)/);
    return match ? match[1].trim() : new Date().toISOString();
  }

  private parseRequests(section: string): ParsedRequest[] {
    const requests: ParsedRequest[] = [];
    const requestSections = section.split('📤 HTTP REQUEST').slice(1);
    
    requestSections.forEach(reqSection => {
      const request = this.parseRequest(reqSection);
      if (request) {
        requests.push(request);
      }
    });
    
    return requests;
  }

  private parseRequest(section: string): ParsedRequest | null {
    const methodMatch = section.match(/🌐 Method: (\w+)/);
    const urlMatch = section.match(/🔗 URL: ([^\n]+)/);
    const timestampMatch = section.match(/⏰ Timestamp: ([^\n]+)/);
    const testIdMatch = section.match(/🏷️  Test ID: ([^\n]+)/);
    const scenarioMatch = section.match(/🎭 Scenario: ([^\n]+)/);
    
    if (!methodMatch || !urlMatch) {
      return null;
    }
    
    const headers = this.parseHeaders(section, '📋 Request Headers:');
    const body = this.parseBody(section, '📤 Request Body:');
    
    return {
      method: methodMatch[1],
      url: urlMatch[1],
      fullUrl: urlMatch[1],
      headers,
      body,
      timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
      testId: testIdMatch ? testIdMatch[1] : undefined,
      scenarioName: scenarioMatch ? scenarioMatch[1] : undefined
    };
  }

  private parseResponses(section: string): ParsedResponse[] {
    const responses: ParsedResponse[] = [];
    const responseSections = section.split('📥 HTTP RESPONSE').slice(1);
    
    responseSections.forEach(resSection => {
      const response = this.parseResponse(resSection);
      if (response) {
        responses.push(response);
      }
    });
    
    return responses;
  }

  private parseResponse(section: string): ParsedResponse | null {
    const statusMatch = section.match(/📊 Status: (\d+)(?:\s+([^\n]+))?/);
    const responseTimeMatch = section.match(/⏱️  Response Time: (\d+)ms/);
    const timestampMatch = section.match(/⏰ Timestamp: ([^\n]+)/);
    
    if (!statusMatch) {
      return null;
    }
    
    const headers = this.parseHeaders(section, '📋 Response Headers:');
    const body = this.parseBody(section, '📥 Response Body:');
    
    return {
      status: parseInt(statusMatch[1]),
      statusText: statusMatch[2] || '',
      headers,
      body,
      responseTime: responseTimeMatch ? parseInt(responseTimeMatch[1]) : undefined,
      timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString()
    };
  }

  private parseHeaders(section: string, headerMarker: string): Record<string, any> {
    const headerStart = section.indexOf(headerMarker);
    if (headerStart === -1) return {};
    
    const headerSection = section.substring(headerStart + headerMarker.length);
    const nextSection = headerSection.search(/^[📋📤📥🌐📊⏱️⏰🏷️🎭]/m);
    const headerContent = nextSection === -1 ? headerSection : headerSection.substring(0, nextSection);
    
    try {
      // Try to parse as JSON
      const jsonMatch = headerContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // Fallback to manual parsing
    }
    
    return {};
  }

  private parseBody(section: string, bodyMarker: string): any {
    const bodyStart = section.indexOf(bodyMarker);
    if (bodyStart === -1) return null;
    
    const bodySection = section.substring(bodyStart + bodyMarker.length);
    const nextSection = bodySection.search(/^[📋📤📥🌐📊⏱️⏰🏷️🎭]/m);
    const bodyContent = nextSection === -1 ? bodySection : bodySection.substring(0, nextSection);
    
    try {
      // Try to parse as JSON
      const jsonMatch = bodyContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // Return as string if not JSON
      return bodyContent.trim();
    }
    
    return null;
  }

  private extractAssertions(section: string): string[] {
    const assertions: string[] = [];
    
    // Look for common assertion patterns
    const assertionPatterns = [
      /expect\([^)]+\)\.to[^;]+/g,
      /assert\([^)]+\)/g,
      /should\s+[^;]+/g
    ];
    
    assertionPatterns.forEach(pattern => {
      const matches = section.matchAll(pattern);
      for (const match of matches) {
        assertions.push(match[0]);
      }
    });
    
    return assertions;
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Look for dependency patterns
    const dependencyPatterns = [
      /depends on:\s*([^\n]+)/gi,
      /requires:\s*([^\n]+)/gi,
      /after:\s*([^\n]+)/gi
    ];
    
    dependencyPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        dependencies.push(match[1].trim());
      }
    });
    
    return dependencies;
  }
}

/**
 * Supertest log format parser (for legacy migration)
 * Handles format like:
 * $ env KEY=st5 node_modules/.bin/mocha -g @iblogin
 * ABC ==> TC01 success IB Login ==> tags: @iblogin
 * URL : POST https://abc.com/login/
 * Request Header { ... }
 * Request Payload { ... }
 * RESPONSE Http Status Code : 200
 * Response header: { ... }
 * Response Payload { ... }
 */
class SupertestLogFormat extends LogFormat {
  getName(): string {
    return 'Supertest';
  }

  canParse(content: string): boolean {
    // Check for your specific Supertest/Mocha format patterns
    const patterns = [
      /\$ env .* node_modules\/\.bin\/mocha/,
      /==> TC\d+/,
      /==> tags: @/,
      /URL\s*:\s*(GET|POST|PUT|DELETE|PATCH)/,
      /Request Header/,
      /Request Payload/,
      /RESPONSE/,
      /Http Status Code\s*:\s*\d+/,
      /Response header:/,
      /Response Payload/,
      /Initialization/
    ];
    
    // Need at least 4 patterns to match for confidence
    const matchCount = patterns.filter(pattern => pattern.test(content)).length;
    return matchCount >= 4;
  }

  parse(content: string, filePath: string): ParsedTest | null {
    try {
      // Extract test name from the TC line or file name
      const testName = this.extractSupertestTestName(content, filePath);
      const tags = this.extractSupertestTags(content);
      const suite = this.extractSuite(testName, filePath);
      
      // Parse all test steps from the log
      const steps = this.parseSupertestSteps(content);
      
      return {
        testName,
        testFile: path.basename(filePath),
        tags,
        suite,
        steps,
        status: steps.length > 0 ? 'passed' : 'failed'
      };
    } catch (error) {
      console.warn(`Failed to parse Supertest log ${filePath}:`, error);
      return null;
    }
  }

  private extractSupertestTestName(content: string, filePath: string): string {
    // Try to extract from TC line: "ABC ==> TC01 success IB Login ==> tags: @iblogin"
    const tcMatch = content.match(/==> (TC\d+[^=]*?) ==>/);
    if (tcMatch) {
      return tcMatch[1].trim();
    }
    
    // Try to extract from mocha command: "$ env KEY=st5 node_modules/.bin/mocha -g @iblogin"
    const mochaMatch = content.match(/mocha -g (@\w+)/);
    if (mochaMatch) {
      return `Test ${mochaMatch[1]}`;
    }
    
    // Fallback to file name
    return this.extractTestName(content, filePath);
  }

  private extractSupertestTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract from tags line: "==> tags: @iblogin"
    const tagsMatch = content.match(/tags:\s*(@\w+(?:\s+@\w+)*)/);
    if (tagsMatch) {
      const tagMatches = tagsMatch[1].match(/@\w+/g);
      if (tagMatches) {
        tags.push(...tagMatches.map(tag => tag.substring(1))); // Remove @
      }
    }
    
    // Extract from mocha command: "-g @iblogin"
    const mochaTagMatch = content.match(/mocha -g (@\w+)/);
    if (mochaTagMatch) {
      tags.push(mochaTagMatch[1].substring(1)); // Remove @
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private parseSupertestSteps(content: string): TestStep[] {
    const steps: TestStep[] = [];
    
    // Split content by step separators (lines with asterisks)
    const stepSections = content.split(/\*{20,}/);
    
    let stepNumber = 1;
    for (const section of stepSections) {
      if (section.trim().length === 0) continue;
      
      const step = this.parseSupertestStep(section, stepNumber);
      if (step) {
        steps.push(step);
        stepNumber++;
      }
    }
    
    return steps;
  }

  private parseSupertestStep(section: string, stepNumber: number): TestStep | null {
    // Look for URL line: "URL : POST https://abc.com/login/"
    const urlMatch = section.match(/URL\s*:\s*(GET|POST|PUT|DELETE|PATCH)\s+(https?:\/\/[^\s]+)/i);
    if (!urlMatch) {
      return null;
    }
    
    const method = urlMatch[1].toUpperCase();
    const url = urlMatch[2];
    
    // Extract request data
    const request = this.parseSupertestRequest(section, method, url);
    const response = this.parseSupertestResponse(section);
    
    // Extract step name from section (usually after "Initialization" or from test context)
    const stepName = this.extractStepName(section, method, url);
    
    return {
      stepName,
      stepNumber,
      timestamp: new Date().toISOString(),
      requests: request ? [request] : [],
      responses: response ? [response] : [],
      assertions: this.extractSupertestAssertions(section)
    };
  }

  private parseSupertestRequest(section: string, method: string, url: string): ParsedRequest | null {
    // Parse request headers
    const headers = this.parseSupertestHeaders(section, 'Request Header');
    
    // Parse request payload
    const body = this.parseSupertestPayload(section, 'Request Payload');
    
    return {
      method,
      url,
      fullUrl: url,
      headers,
      body,
      timestamp: new Date().toISOString()
    };
  }

  private parseSupertestResponse(section: string): ParsedResponse | null {
    // Parse status code: "Http Status Code : 200"
    const statusMatch = section.match(/Http Status Code\s*:\s*(\d+)/);
    if (!statusMatch) {
      return null;
    }
    
    const status = parseInt(statusMatch[1]);
    
    // Parse response headers
    const headers = this.parseSupertestHeaders(section, 'Response header');
    
    // Parse response payload
    const body = this.parseSupertestPayload(section, 'Response Payload');
    
    return {
      status,
      headers,
      body,
      timestamp: new Date().toISOString()
    };
  }

  private parseSupertestHeaders(section: string, headerType: string): Record<string, any> {
    const headers: Record<string, any> = {};
    
    // Find the header section
    const headerPattern = new RegExp(`${headerType}\\s*\\n*\\s*\\{([^}]+)\\}`, 's');
    const headerMatch = section.match(headerPattern);
    
    if (headerMatch) {
      try {
        // Clean up the header content and parse as JSON
        const headerContent = headerMatch[1];
        const cleanedContent = `{${headerContent}}`;
        const parsedHeaders = JSON.parse(cleanedContent);
        Object.assign(headers, parsedHeaders);
      } catch (error) {
        // If JSON parsing fails, try line-by-line parsing
        const lines = headerMatch[1].split('\n');
        for (const line of lines) {
          const keyValueMatch = line.match(/["']([^"']+)["']\s*:\s*["']([^"']+)["']/);
          if (keyValueMatch) {
            headers[keyValueMatch[1]] = keyValueMatch[2];
          }
        }
      }
    }
    
    return headers;
  }

  private parseSupertestPayload(section: string, payloadType: string): any {
    // Find the payload section
    const payloadPattern = new RegExp(`${payloadType}\\s*\\n*\\s*\\{([^}]+)\\}`, 's');
    const payloadMatch = section.match(payloadPattern);
    
    if (payloadMatch) {
      try {
        // Clean up and parse as JSON
        const payloadContent = `{${payloadMatch[1]}}`;
        return JSON.parse(payloadContent);
      } catch (error) {
        // Return as string if JSON parsing fails
        return payloadMatch[1].trim();
      }
    }
    
    return null;
  }

  private extractStepName(section: string, method: string, url: string): string {
    // Look for "Initialization" lines
    const initMatch = section.match(/Initialization\s+(.+)/);
    if (initMatch) {
      return initMatch[1].trim();
    }
    
    // Extract from URL path
    const urlPath = url.split('/').pop() || url;
    return `${method} ${urlPath}`;
  }

  private extractSupertestAssertions(section: string): string[] {
    const assertions: string[] = [];
    
    // Look for status code assertion
    const statusMatch = section.match(/Http Status Code\s*:\s*(\d+)/);
    if (statusMatch) {
      assertions.push(`expect(response.status).toBe(${statusMatch[1]})`);
    }
    
    // Look for response body assertions (basic checks)
    if (section.includes('Response Payload')) {
      assertions.push('expect(response.body).toBeDefined()');
    }
    
    return assertions;
  }
}

/**
 * Generic HTTP log format parser
 */
class GenericHttpLogFormat extends LogFormat {
  getName(): string {
    return 'Generic HTTP';
  }

  canParse(content: string): boolean {
    // Fallback parser for any HTTP logs
    return content.includes('HTTP') || 
           content.includes('GET') || 
           content.includes('POST') ||
           content.includes('PUT') ||
           content.includes('DELETE');
  }

  parse(content: string, filePath: string): ParsedTest | null {
    // Generic implementation
    const testName = this.extractTestName(content, filePath);
    const tags = this.extractTags(content);
    const suite = this.extractSuite(testName, filePath);
    
    return {
      testName,
      testFile: path.basename(filePath),
      tags,
      suite,
      steps: [],
      status: 'passed'
    };
  }
}
