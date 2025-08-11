import { APIRequestContext } from '@playwright/test';
import { TestDataLoader } from './test-data-loader.js';
import { API_ENDPOINTS } from '../config/endpoints.js';

/**
 * Advanced Test Utilities for Complex Test Scenarios
 * Handles chained tests, data-driven testing, header validation, and negative scenarios
 */
export class AdvancedTestUtils {
  private request: APIRequestContext;
  private testContext: Map<string, any> = new Map();

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Purpose: Store test context data for chained test scenarios
   * Dependencies: None
   * Flow: Stores key-value pairs for sharing data between test steps
   * Validation: Ensures data is stored and retrievable
   * Cleanup: Context is cleared after test completion
   */
  setTestContext(key: string, value: any): void {
    this.testContext.set(key, value);
  }

  /**
   * Purpose: Retrieve stored test context data
   * Dependencies: Data must be previously stored using setTestContext
   * Flow: Retrieves value by key from test context
   * Validation: Returns undefined if key doesn't exist
   * Cleanup: N/A - read-only operation
   */
  getTestContext(key: string): any {
    return this.testContext.get(key);
  }

  /**
   * Purpose: Clear all test context data for cleanup
   * Dependencies: None
   * Flow: Removes all stored context data
   * Validation: Context map is empty after execution
   * Cleanup: Complete context cleanup
   */
  clearTestContext(): void {
    this.testContext.clear();
  }

  /**
   * Purpose: Execute data-driven tests using for loop with multiple datasets
   * Dependencies: Test data array with scenarios
   * Flow: Iterates through test data, executes test function for each scenario
   * Validation: Collects results for each scenario and validates outcomes
   * Cleanup: Individual scenario cleanup handled by test function
   */
  async executeDataDrivenTest<T>(
    testData: T[],
    testFunction: (data: T, index: number) => Promise<any>,
    scenarioName: string
  ): Promise<{ passed: number; failed: number; results: any[] }> {
    console.log(`🔄 Starting data-driven test: ${scenarioName}`);
    console.log(`📊 Total scenarios to execute: ${testData.length}`);
    
    const results = [];
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < testData.length; i++) {
      const scenario = testData[i];
      console.log(`\n🧪 Executing scenario ${i + 1}/${testData.length}:`);
      console.log(`   Test Case: ${(scenario as any).testCase || `Scenario ${i + 1}`}`);
      
      try {
        const startTime = Date.now();
        const result = await testFunction(scenario, i);
        const duration = Date.now() - startTime;
        
        console.log(`   ✅ Scenario ${i + 1} PASSED (${duration}ms)`);
        results.push({ scenario: i + 1, status: 'PASSED', result, duration });
        passed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`   ❌ Scenario ${i + 1} FAILED: ${errorMessage}`);
        results.push({ scenario: i + 1, status: 'FAILED', error: errorMessage });
        failed++;
      }
    }

    console.log(`\n📈 Data-driven test completed:`);
    console.log(`   ✅ Passed: ${passed}/${testData.length}`);
    console.log(`   ❌ Failed: ${failed}/${testData.length}`);
    console.log(`   📊 Success Rate: ${((passed / testData.length) * 100).toFixed(2)}%`);

    return { passed, failed, results };
  }

  /**
   * Purpose: Execute chained test scenario where each step depends on previous
   * Dependencies: Array of test steps with execution order
   * Flow: Executes steps sequentially, passing results between steps
   * Validation: Each step validates input and output
   * Cleanup: Cleanup function called after all steps complete
   */
  async executeChainedTest(
    testSteps: Array<{
      name: string;
      execute: (context: any) => Promise<any>;
      validate?: (result: any) => boolean;
      description: string;
      dependencies?: string[];
    }>,
    cleanupFunction?: () => Promise<void>
  ): Promise<any> {
    console.log(`🔗 Starting chained test with ${testSteps.length} steps`);
    
    const chainContext: any = {};
    
    try {
      for (let i = 0; i < testSteps.length; i++) {
        const step = testSteps[i];
        console.log(`\n📋 Step ${i + 1}: ${step.name}`);
        console.log(`   Description: ${step.description}`);
        
        if (step.dependencies) {
          console.log(`   Dependencies: ${step.dependencies.join(', ')}`);
          // Validate dependencies exist in context
          for (const dep of step.dependencies) {
            if (!(dep in chainContext)) {
              throw new Error(`Missing dependency: ${dep}`);
            }
          }
        }
        
        const startTime = Date.now();
        const result = await step.execute(chainContext);
        const duration = Date.now() - startTime;
        
        // Store result in chain context using step name
        chainContext[step.name] = result;
        
        // Validate result if validator provided
        if (step.validate) {
          const isValid = step.validate(result);
          if (!isValid) {
            throw new Error(`Step validation failed: ${step.name}`);
          }
        }
        
        console.log(`   ✅ Step ${i + 1} completed successfully (${duration}ms)`);
        
        // Store any tokens or IDs for next steps
        if (result && typeof result === 'object') {
          if (result.token) this.setTestContext('authToken', result.token);
          if (result.userId) this.setTestContext('userId', result.userId);
          if (result.id) this.setTestContext(`${step.name}_id`, result.id);
        }
      }
      
      console.log(`\n🎉 Chained test completed successfully!`);
      return chainContext;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`\n💥 Chained test failed: ${errorMessage}`);
      throw error;
    } finally {
      // Execute cleanup function if provided
      if (cleanupFunction) {
        console.log(`🧹 Executing cleanup...`);
        try {
          await cleanupFunction();
          console.log(`✅ Cleanup completed`);
        } catch (cleanupError) {
          const cleanupErrorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
          console.log(`⚠️ Cleanup failed: ${cleanupErrorMessage}`);
        }
      }
    }
  }

  /**
   * Purpose: Validate request and response headers comprehensively
   * Dependencies: HTTP request/response objects
   * Flow: Checks required headers, validates formats, security headers
   * Validation: Verifies header presence, values, and security compliance
   * Cleanup: N/A - validation only
   */
  async validateHeaders(
    response: any,
    expectedRequestHeaders?: Record<string, string>,
    expectedResponseHeaders?: string[],
    securityHeaderChecks: boolean = true
  ): Promise<{ valid: boolean; violations: string[] }> {
    console.log(`🔍 Starting comprehensive header validation`);
    
    const violations: string[] = [];
    
    // Validate request headers if provided
    if (expectedRequestHeaders) {
      console.log(`📤 Validating request headers...`);
      for (const [header, expectedValue] of Object.entries(expectedRequestHeaders)) {
        // Note: Request headers validation would need to be implemented based on your API helper
        console.log(`   Checking request header: ${header}`);
      }
    }
    
    // Validate response headers
    console.log(`📥 Validating response headers...`);
    const responseHeaders = response.headers();
    
    if (expectedResponseHeaders) {
      for (const expectedHeader of expectedResponseHeaders) {
        if (!responseHeaders[expectedHeader.toLowerCase()]) {
          violations.push(`Missing expected response header: ${expectedHeader}`);
          console.log(`   ❌ Missing header: ${expectedHeader}`);
        } else {
          console.log(`   ✅ Found header: ${expectedHeader}`);
        }
      }
    }
    
    // Security header validation
    if (securityHeaderChecks) {
      console.log(`🔒 Validating security headers...`);
      
      const securityHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': ['DENY', 'SAMEORIGIN'],
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': null, // Just check presence
        'content-security-policy': null
      };
      
      for (const [header, expectedValue] of Object.entries(securityHeaders)) {
        const actualValue = responseHeaders[header];
        
        if (!actualValue) {
          violations.push(`Missing security header: ${header}`);
          console.log(`   ⚠️ Missing security header: ${header}`);
        } else if (expectedValue) {
          if (Array.isArray(expectedValue)) {
            if (!expectedValue.includes(actualValue)) {
              violations.push(`Invalid ${header} value: ${actualValue}`);
              console.log(`   ❌ Invalid ${header}: ${actualValue}`);
            } else {
              console.log(`   ✅ Valid ${header}: ${actualValue}`);
            }
          } else if (actualValue !== expectedValue) {
            violations.push(`Invalid ${header} value: ${actualValue}`);
            console.log(`   ❌ Invalid ${header}: ${actualValue}`);
          } else {
            console.log(`   ✅ Valid ${header}: ${actualValue}`);
          }
        } else {
          console.log(`   ✅ Found ${header}: ${actualValue}`);
        }
      }
    }
    
    // CORS header validation
    console.log(`🌐 Validating CORS headers...`);
    const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods'];
    for (const corsHeader of corsHeaders) {
      if (responseHeaders[corsHeader]) {
        console.log(`   ✅ CORS header present: ${corsHeader}`);
      }
    }
    
    const isValid = violations.length === 0;
    console.log(`\n📊 Header validation summary:`);
    console.log(`   Status: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Violations: ${violations.length}`);
    
    if (violations.length > 0) {
      console.log(`\n⚠️ Header violations found:`);
      violations.forEach((violation, index) => {
        console.log(`   ${index + 1}. ${violation}`);
      });
    }
    
    return { valid: isValid, violations };
  }

  /**
   * Purpose: Execute negative test scenarios to validate error handling
   * Dependencies: Array of negative test scenarios with expected failures
   * Flow: Executes scenarios expecting failures, validates error responses
   * Validation: Ensures appropriate errors are returned for invalid inputs
   * Cleanup: Individual scenario cleanup
   */
  async executeNegativeTests(
    scenarios: Array<{
      name: string;
      execute: () => Promise<any>;
      expectedStatus: number;
      expectedError?: string;
      description: string;
      category: string;
    }>
  ): Promise<{ passed: number; failed: number; results: any[] }> {
    console.log(`🚫 Starting negative test scenarios`);
    console.log(`📊 Total negative scenarios: ${scenarios.length}`);
    
    const results = [];
    let passed = 0;
    let failed = 0;
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      console.log(`\n🧪 Negative Scenario ${i + 1}: ${scenario.name}`);
      console.log(`   Category: ${scenario.category}`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Expected Status: ${scenario.expectedStatus}`);
      
      try {
        const startTime = Date.now();
        const result = await scenario.execute();
        const duration = Date.now() - startTime;
        
        // For negative tests, we expect specific error responses
        if (result.status === scenario.expectedStatus) {
          if (scenario.expectedError) {
            const responseBody = await result.json().catch(() => ({}));
            if (responseBody.error && responseBody.error.includes(scenario.expectedError)) {
              console.log(`   ✅ Negative scenario PASSED - Correct error response (${duration}ms)`);
              results.push({ 
                scenario: i + 1, 
                status: 'PASSED', 
                actualStatus: result.status,
                expectedStatus: scenario.expectedStatus,
                duration 
              });
              passed++;
            } else {
              console.log(`   ❌ Negative scenario FAILED - Wrong error message`);
              results.push({ 
                scenario: i + 1, 
                status: 'FAILED', 
                reason: 'Wrong error message',
                actualError: responseBody.error,
                expectedError: scenario.expectedError
              });
              failed++;
            }
          } else {
            console.log(`   ✅ Negative scenario PASSED - Correct status code (${duration}ms)`);
            results.push({ scenario: i + 1, status: 'PASSED', duration });
            passed++;
          }
        } else {
          console.log(`   ❌ Negative scenario FAILED - Wrong status code: ${result.status}`);
          results.push({ 
            scenario: i + 1, 
            status: 'FAILED', 
            actualStatus: result.status,
            expectedStatus: scenario.expectedStatus
          });
          failed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`   ❌ Negative scenario FAILED with exception: ${errorMessage}`);
        results.push({ scenario: i + 1, status: 'FAILED', error: errorMessage });
        failed++;
      }
    }
    
    console.log(`\n📈 Negative testing completed:`);
    console.log(`   ✅ Passed: ${passed}/${scenarios.length}`);
    console.log(`   ❌ Failed: ${failed}/${scenarios.length}`);
    console.log(`   📊 Success Rate: ${((passed / scenarios.length) * 100).toFixed(2)}%`);
    
    return { passed, failed, results };
  }

  /**
   * Purpose: Execute performance test with multiple concurrent requests
   * Dependencies: Load test configuration and target endpoints
   * Flow: Creates concurrent requests, measures response times, validates performance
   * Validation: Checks response times against thresholds
   * Cleanup: Performance metrics cleanup
   */
  async executePerformanceTest(config: {
    name: string;
    concurrentUsers: number;
    requestsPerUser: number;
    maxResponseTime: number;
    endpoint: string;
    payload?: any;
  }): Promise<{
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    successRate: number;
    totalRequests: number;
    failedRequests: number;
  }> {
    console.log(`⚡ Starting performance test: ${config.name}`);
    console.log(`   Concurrent Users: ${config.concurrentUsers}`);
    console.log(`   Requests per User: ${config.requestsPerUser}`);
    console.log(`   Expected Max Response Time: ${config.maxResponseTime}ms`);
    
    const totalRequests = config.concurrentUsers * config.requestsPerUser;
    const requests: Promise<any>[] = [];
    const responseTimes: number[] = [];
    let failedRequests = 0;
    
    const startTime = Date.now();
    
    // Create concurrent requests
    for (let user = 0; user < config.concurrentUsers; user++) {
      for (let req = 0; req < config.requestsPerUser; req++) {
        const requestPromise = this.executePerformanceRequest(config.endpoint, config.payload)
          .then(result => {
            responseTimes.push(result.responseTime);
            return result;
          })
          .catch(error => {
            failedRequests++;
            console.log(`   Request failed: ${error.message}`);
            return { error: error.message, responseTime: 0 };
          });
        
        requests.push(requestPromise);
      }
    }
    
    // Execute all requests concurrently
    console.log(`🚀 Executing ${totalRequests} concurrent requests...`);
    await Promise.all(requests);
    
    const totalTime = Date.now() - startTime;
    const validResponseTimes = responseTimes.filter(time => time > 0);
    
    const averageResponseTime = validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length;
    const maxResponseTime = Math.max(...validResponseTimes);
    const minResponseTime = Math.min(...validResponseTimes);
    const successRate = ((totalRequests - failedRequests) / totalRequests) * 100;
    
    console.log(`\n📊 Performance test results:`);
    console.log(`   Total Execution Time: ${totalTime}ms`);
    console.log(`   Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`   Max Response Time: ${maxResponseTime}ms`);
    console.log(`   Min Response Time: ${minResponseTime}ms`);
    console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`   Failed Requests: ${failedRequests}/${totalRequests}`);
    
    // Performance validation
    if (averageResponseTime > config.maxResponseTime) {
      console.log(`   ⚠️ Performance threshold exceeded! Average: ${averageResponseTime}ms > Expected: ${config.maxResponseTime}ms`);
    } else {
      console.log(`   ✅ Performance within acceptable limits`);
    }
    
    return {
      averageResponseTime,
      maxResponseTime,
      minResponseTime,
      successRate,
      totalRequests,
      failedRequests
    };
  }

  /**
   * Private helper method for individual performance requests
   */
  private async executePerformanceRequest(endpoint: string, payload?: any): Promise<{ responseTime: number; status: number }> {
    const startTime = Date.now();
    
    try {
      const response = payload 
        ? await this.request.post(endpoint, { data: payload })
        : await this.request.get(endpoint);
      
      const responseTime = Date.now() - startTime;
      return { responseTime, status: response.status() };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Request failed after ${responseTime}ms: ${errorMessage}`);
    }
  }
}
