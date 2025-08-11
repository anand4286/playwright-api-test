import { Page, Request, Response } from '@playwright/test';
import { logAPIRequest, logAPIResponse, logHTTPTransaction, logToConsole, getLogConfig } from './logger';
import { ApiRequestData, ApiResponseData } from '../types/index';

export class HTTPLogger {
  private page: Page;
  private testId: string;
  private scenarioName: string;
  private requestCounter: number = 0;
  private transactions: Map<string, ApiRequestData> = new Map();
  private config = getLogConfig();

  constructor(page: Page, testId: string, scenarioName: string) {
    this.page = page;
    this.testId = testId;
    this.scenarioName = scenarioName;
  }

  // Setup HTTP logging for the page
  async setupHTTPLogging(): Promise<void> {
    // Log all requests
    this.page.on('request', (request: Request) => {
      this.logRequest(request);
    });

    // Log all responses
    this.page.on('response', (response: Response) => {
      this.logResponse(response);
    });

    if (this.config.enableFullLogs) {
      logToConsole(`🔍 HTTP Logging enabled for test: ${this.scenarioName}`);
    }
  }

  private async logRequest(request: Request): Promise<void> {
    this.requestCounter++;
    const requestId = `${this.testId}-${this.requestCounter}`;

    try {
      const headers: Record<string, string> = {};
      request.headers() && Object.entries(request.headers()).forEach(([key, value]) => {
        headers[key] = value;
      });

      const requestData: ApiRequestData = {
        method: request.method(),
        url: request.url(),
        headers,
        body: await this.getRequestBody(request),
        testId: requestId,
        scenarioName: this.scenarioName
      };

      // Store for transaction logging
      this.transactions.set(request.url(), requestData);

      // Log the request
      logAPIRequest(requestData);

      if (this.config.enableFullLogs) {
        logToConsole(`📤 ${request.method()} ${request.url()}`);
      }
    } catch (error) {
      logToConsole(`❌ Error logging request: ${error}`);
    }
  }

  private async logResponse(response: Response): Promise<void> {
    try {
      const request = response.request();
      const requestData = this.transactions.get(request.url());

      const headers: Record<string, string> = {};
      response.headers() && Object.entries(response.headers()).forEach(([key, value]) => {
        headers[key] = value;
      });

      const responseData: ApiResponseData = {
        status: response.status(),
        statusText: response.statusText(),
        headers,
        body: await this.getResponseBody(response),
        responseTime: 0, // Playwright doesn't provide this directly
        testId: requestData?.testId || `${this.testId}-unknown`,
        scenarioName: this.scenarioName
      };

      // Log the response
      logAPIResponse(responseData);

      // Log complete transaction if request data is available
      if (requestData) {
        logHTTPTransaction(requestData, responseData, {
          requestUrl: request.url(),
          responseStatus: response.status()
        });
      }

      if (this.config.enableFullLogs) {
        logToConsole(`📥 ${response.status()} ${response.statusText()} - ${request.url()}`);
      }

      // Clean up stored request data
      this.transactions.delete(request.url());
    } catch (error) {
      logToConsole(`❌ Error logging response: ${error}`);
    }
  }

  private async getRequestBody(request: Request): Promise<any> {
    try {
      const postData = request.postData();
      if (!postData) return null;

      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(postData);
      } catch {
        return postData;
      }
    } catch (error) {
      return null;
    }
  }

  private async getResponseBody(response: Response): Promise<any> {
    try {
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        return await response.json();
      } else if (contentType.includes('text/') || contentType.includes('application/xml')) {
        return await response.text();
      } else {
        return `[Binary content: ${contentType}]`;
      }
    } catch (error) {
      return `[Error reading response body: ${error}]`;
    }
  }

  // Manual logging methods for test actions
  async logManualRequest(method: string, url: string, headers?: any, body?: any): Promise<void> {
    this.requestCounter++;
    const requestId = `${this.testId}-manual-${this.requestCounter}`;

    const requestData: ApiRequestData = {
      method,
      url,
      headers: headers || {},
      body,
      testId: requestId,
      scenarioName: this.scenarioName
    };

    logAPIRequest(requestData);
    
    if (this.config.enableFullLogs) {
      logToConsole(`📤 Manual Log: ${method} ${url}`);
    }
  }

  async logManualResponse(status: number, statusText: string, headers?: any, body?: any, responseTime?: number): Promise<void> {
    const responseData: ApiResponseData = {
      status,
      statusText,
      headers: headers || {},
      body,
      responseTime: responseTime || 0,
      testId: `${this.testId}-manual-response`,
      scenarioName: this.scenarioName
    };

    logAPIResponse(responseData);
    
    if (this.config.enableFullLogs) {
      logToConsole(`📥 Manual Log: ${status} ${statusText}`);
    }
  }

  // Get summary of logged requests
  getSummary(): { totalRequests: number; testId: string; scenarioName: string } {
    return {
      totalRequests: this.requestCounter,
      testId: this.testId,
      scenarioName: this.scenarioName
    };
  }
}

// Factory function to create HTTP logger
export function createHTTPLogger(page: Page, testId: string, scenarioName: string): HTTPLogger {
  return new HTTPLogger(page, testId, scenarioName);
}

// Global HTTP logging helper for test actions
export async function withHTTPLogging<T>(
  page: Page,
  testId: string,
  scenarioName: string,
  operation: (logger: HTTPLogger) => Promise<T>
): Promise<T> {
  const httpLogger = createHTTPLogger(page, testId, scenarioName);
  await httpLogger.setupHTTPLogging();
  
  try {
    const result = await operation(httpLogger);
    
    if (getLogConfig().enableFullLogs) {
      const summary = httpLogger.getSummary();
      logToConsole(`📊 HTTP Summary: ${summary.totalRequests} requests logged for ${scenarioName}`);
    }
    
    return result;
  } catch (error) {
    logToConsole(`❌ Error in HTTP logged operation: ${error}`);
    throw error;
  }
}
