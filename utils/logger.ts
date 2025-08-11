import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { ApiRequestData, ApiResponseData, TestExecutionData } from '../types/index.js';

// Enhanced logging configuration
interface LoggingConfig {
  enableFullLogs: boolean;
  enableConsoleOutput: boolean;
  logLevel: string;
  includeHeaders: boolean;
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  maxBodySize: number;
  currentTestName?: string;
  currentStepName?: string;
  supertestFormat: boolean; // NEW: Enable Supertest-style logging
}

// Get logging configuration from environment variables
const getLoggingConfig = (): LoggingConfig => ({
  enableFullLogs: process.env.ENABLE_FULL_LOGS === 'true' || process.env.VERBOSE === 'true',
  enableConsoleOutput: process.env.ENABLE_CONSOLE_LOGGING === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  includeHeaders: process.env.LOG_HEADERS !== 'false',
  includeRequestBody: process.env.LOG_REQUEST_BODY !== 'false',
  includeResponseBody: process.env.LOG_RESPONSE_BODY !== 'false',
  maxBodySize: parseInt(process.env.MAX_LOG_BODY_SIZE || '10000'), // 10KB default
  currentTestName: undefined,
  currentStepName: undefined,
  supertestFormat: process.env.SUPERTEST_FORMAT === 'true' // NEW: Enable Supertest format
});

const config = getLoggingConfig();

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Function to sanitize test name for file name
const sanitizeTestName = (testName: string): string => {
  return testName
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
    .substring(0, 50); // Limit length
};

// Function to get current log file name based on test
const getCurrentLogFileName = (): string => {
  if (config.currentTestName) {
    const sanitized = sanitizeTestName(config.currentTestName);
    return `${sanitized}_http-live.log`;
  }
  return 'http-live.log';
};

// Helper function to write beautiful logs to test-specific file
const writeBeautifulLog = (content: string): void => {
  const logFileName = getCurrentLogFileName();
  const logFilePath = path.join(logsDir, logFileName);
  
  // Write to test-specific log file
  fs.appendFileSync(logFilePath, content + '\n');
  
  // Also write to console if enabled (may be captured by Playwright)
  if (config.enableConsoleOutput) {
    console.log(content);
  }
};

// Set current test context
export const setTestContext = (testName: string, stepName?: string): void => {
  config.currentTestName = testName;
  config.currentStepName = stepName;
  
  // Initialize log file for this test
  if (config.enableFullLogs) {
    const logFileName = getCurrentLogFileName();
    const logFilePath = path.join(logsDir, logFileName);
    
    if (!fs.existsSync(logFilePath)) {
      const header = `
================================================================================
🧪 TEST: ${testName}
📅 Started: ${new Date().toISOString()}
================================================================================

`;
      fs.writeFileSync(logFilePath, header);
    }
  }
};

// Set current step context
export const setStepContext = (stepName: string): void => {
  config.currentStepName = stepName;
  
  if (config.enableFullLogs && stepName) {
    const stepHeader = `
📍 TEST STEP: ${stepName}
⏰ Step Started: ${new Date().toISOString()}
${'─'.repeat(60)}

`;
    writeBeautifulLog(stepHeader);
  }
};

// Initialize live log file (clear at start)
export const initializeLiveLogging = (): void => {
  if (config.enableFullLogs) {
    const logFileName = getCurrentLogFileName();
    const logFilePath = path.join(logsDir, logFileName);
    fs.writeFileSync(logFilePath, `HTTP Live Logging Started: ${new Date().toISOString()}\n${'='.repeat(80)}\n\n`);
  }
};

// Export configuration for external use
export const getLogConfig = () => config;

// Helper to truncate large bodies
const truncateBody = (body: any, maxSize: number = config.maxBodySize): any => {
  if (!body) return body;
  
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  if (bodyStr.length <= maxSize) return body;
  
  return {
    truncated: true,
    originalSize: bodyStr.length,
    preview: bodyStr.substring(0, maxSize) + '...[TRUNCATED]'
  };
};

// Enhanced console format for full logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    if (meta.type === 'api_request') {
      let output = `\n🔄 [${timestamp}] ${level}: ${message}`;
      output += `\n   📡 ${meta.method} ${meta.url}`;
      
      if (config.includeHeaders && meta.headers) {
        output += `\n   📋 Headers:`;
        Object.entries(meta.headers).forEach(([key, value]) => {
          output += `\n      ${key}: ${value}`;
        });
      }
      
      if (config.includeRequestBody && meta.body) {
        output += `\n   📤 Request Body: ${JSON.stringify(meta.body, null, 2)}`;
      }
      
      if (meta.testId) output += `\n   🏷️  Test ID: ${meta.testId}`;
      if (meta.scenarioName) output += `\n   🎭 Scenario: ${meta.scenarioName}`;
      
      return output + '\n';
    }
    
    if (meta.type === 'api_response') {
      let output = `\n✅ [${timestamp}] ${level}: ${message}`;
      output += `\n   📊 Status: ${meta.status} ${meta.statusText || ''}`;
      output += `\n   ⏱️  Response Time: ${meta.responseTime}ms`;
      
      if (config.includeHeaders && meta.headers) {
        output += `\n   📋 Response Headers:`;
        Object.entries(meta.headers).forEach(([key, value]) => {
          output += `\n      ${key}: ${value}`;
        });
      }
      
      if (config.includeResponseBody && meta.body) {
        output += `\n   📥 Response Body: ${JSON.stringify(meta.body, null, 2)}`;
      }
      
      if (meta.testId) output += `\n   🏷️  Test ID: ${meta.testId}`;
      
      return output + '\n';
    }
    
    if (meta.type === 'test_execution') {
      let output = `\n🧪 [${timestamp}] ${level}: ${message}`;
      output += `\n   📝 Test: ${meta.testName}`;
      output += `\n   📊 Status: ${meta.status}`;
      output += `\n   ⏱️  Duration: ${meta.duration}ms`;
      
      if (meta.error) {
        output += `\n   ❌ Error: ${meta.error}`;
      }
      
      return output + '\n';
    }
    
    return `[${timestamp}] ${level}: ${message} ${JSON.stringify(meta)}`;
  })
);

// Custom format for API logs
const apiLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    }, null, config.enableFullLogs ? 2 : 0);
  })
);

// Create logger instance - only HTTP live logs for storage efficiency
const logger = winston.createLogger({
  level: config.enableFullLogs ? 'debug' : config.logLevel,
  format: apiLogFormat,
  transports: [
    // Only keep error log for critical issues
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 2,
    })
  ],
});

// Add console transport for enhanced logging when full logs are enabled
if (config.enableFullLogs && config.enableConsoleOutput) {
  logger.add(new winston.transports.Console({
    level: 'debug',
    format: consoleFormat
  }));
} else if (config.enableConsoleOutput) {
  logger.add(new winston.transports.Console({
    level: 'info',
    format: consoleFormat
  }));
}

// Enhanced API request logging helper
export const logAPIRequest = (requestData: ApiRequestData): void => {
  // Check if Supertest format is enabled
  if (config.supertestFormat) {
    logSupertestRequest(requestData);
    return;
  }

  // Original Playwright format
  // Beautiful console output with all details - this is our main log
  if (config.enableFullLogs) {
    let logOutput = '\n' + '='.repeat(80);
    logOutput += '\n📤 HTTP REQUEST';
    logOutput += '\n' + '='.repeat(80);
    logOutput += `\n🧪 Test Case: ${config.currentTestName || 'Unknown Test'}`;
    if (config.currentStepName) {
      logOutput += `\n📍 Test Step: ${config.currentStepName}`;
    }
    logOutput += `\n🌐 Method: ${requestData.method}`;
    logOutput += `\n🔗 URL: ${requestData.url}`;
    logOutput += `\n⏰ Timestamp: ${new Date().toISOString()}`;
    logOutput += `\n🏷️  Test ID: ${requestData.testId}`;
    logOutput += `\n🎭 Scenario: ${requestData.scenarioName}`;
    
    if (config.includeHeaders && requestData.headers) {
      logOutput += '\n\n📋 Request Headers:';
      logOutput += '\n' + JSON.stringify(requestData.headers, null, 2);
    }
    
    if (config.includeRequestBody && requestData.body) {
      logOutput += '\n\n📤 Request Body:';
      logOutput += '\n' + JSON.stringify(requestData.body, null, 2);
    }
    logOutput += '\n' + '='.repeat(80) + '\n';
    
    writeBeautifulLog(logOutput);
  }

  // Only log to console for JSON format (winston logs removed for efficiency)
  if (config.enableConsoleOutput) {
    const logData = {
      timestamp: new Date().toISOString().split('T')[1].replace('Z', ''),
      level: 'debug',
      message: '🔄 API Request',
      type: 'api_request',
      testCase: config.currentTestName,
      testStep: config.currentStepName,
      method: requestData.method,
      url: requestData.url,
      headers: config.includeHeaders ? requestData.headers : {},
      body: config.includeRequestBody ? truncateBody(requestData.body) : undefined,
      testId: requestData.testId,
      scenarioName: requestData.scenarioName
    };
    console.log(JSON.stringify(logData, null, 2));
  }
};

// Enhanced API response logging helper
export const logAPIResponse = (responseData: ApiResponseData): void => {
  // Check if Supertest format is enabled
  if (config.supertestFormat) {
    logSupertestResponse(responseData);
    return;
  }

  // Original Playwright format
  // Beautiful console output with all details - this is our main log
  if (config.enableFullLogs) {
    let logOutput = '\n' + '='.repeat(80);
    logOutput += '\n📥 HTTP RESPONSE';
    logOutput += '\n' + '='.repeat(80);
    logOutput += `\n🧪 Test Case: ${config.currentTestName || 'Unknown Test'}`;
    if (config.currentStepName) {
      logOutput += `\n📍 Test Step: ${config.currentStepName}`;
    }
    logOutput += `\n📊 Status: ${responseData.status} ${responseData.statusText}`;
    logOutput += `\n⏱️  Response Time: ${responseData.responseTime}ms`;
    logOutput += `\n⏰ Timestamp: ${new Date().toISOString()}`;
    logOutput += `\n🏷️  Test ID: ${responseData.testId}`;
    logOutput += `\n🎭 Scenario: ${responseData.scenarioName}`;
    
    if (config.includeHeaders && responseData.headers) {
      logOutput += '\n\n📋 Response Headers:';
      logOutput += '\n' + JSON.stringify(responseData.headers, null, 2);
    }
    
    if (config.includeResponseBody && responseData.body) {
      logOutput += '\n\n📥 Response Body:';
      logOutput += '\n' + JSON.stringify(responseData.body, null, 2);
    }
    logOutput += '\n' + '='.repeat(80) + '\n';
    
    writeBeautifulLog(logOutput);
  }

  // Only log to console for JSON format (winston logs removed for efficiency)
  if (config.enableConsoleOutput) {
    const logData = {
      timestamp: new Date().toISOString().split('T')[1].replace('Z', ''),
      level: 'debug',
      message: '✅ API Response',
      type: 'api_response',
      testCase: config.currentTestName,
      testStep: config.currentStepName,
      status: responseData.status,
      statusText: responseData.statusText,
      headers: config.includeHeaders ? responseData.headers : {},
      body: config.includeResponseBody ? truncateBody(responseData.body) : undefined,
      responseTime: responseData.responseTime,
      testId: responseData.testId,
      scenarioName: responseData.scenarioName
    };
    console.log(JSON.stringify(logData, null, 2));
  }
};

// Enhanced test execution logging
export const logTestExecution = (testData: TestExecutionData): void => {
  const logData = {
    type: 'test_execution',
    testName: testData.testName,
    status: testData.status,
    duration: testData.duration,
    error: testData.error,
    timestamp: new Date().toISOString(),
    testId: testData.testId
  };

  if (config.enableFullLogs) {
    logger.debug('🧪 Test Execution', logData);
  } else {
    logger.info('Test Execution', logData);
  }
};

// New: HTTP transaction logging (request + response pair)
export const logHTTPTransaction = (
  requestData: ApiRequestData, 
  responseData: ApiResponseData,
  additionalContext?: any
): void => {
  const transactionData = {
    type: 'http_transaction',
    transaction: {
      request: {
        method: requestData.method,
        url: requestData.url,
        headers: config.includeHeaders ? requestData.headers : undefined,
        body: config.includeRequestBody ? truncateBody(requestData.body) : undefined,
      },
      response: {
        status: responseData.status,
        statusText: responseData.statusText,
        headers: config.includeHeaders ? responseData.headers : undefined,
        body: config.includeResponseBody ? truncateBody(responseData.body) : undefined,
        responseTime: responseData.responseTime,
      },
      context: additionalContext,
      timestamp: new Date().toISOString(),
      testId: requestData.testId,
      scenarioName: requestData.scenarioName
    }
  };

  if (config.enableFullLogs) {
    logger.debug('🔄➡️✅ HTTP Transaction', transactionData);
  }
};

// New: Simple console logging for immediate feedback
export const logToConsole = (message: string, data?: any): void => {
  if (config.enableConsoleOutput) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data && config.enableFullLogs) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
};

// New: Export logging configuration for other modules
export { config as loggingConfig };

// ========================================
// SUPERTEST-STYLE LOGGING FUNCTIONS
// ========================================

/**
 * Format logs in Supertest/Mocha/Chai style for migration testing
 * This matches the exact format of your legacy logs for round-trip testing
 */

// Add test counter for TC numbering
let testCounter = 1;

/**
 * Start a new test in Supertest format
 */
export const startSupertestLog = (testName: string, tags: string[] = []): void => {
  if (!config.supertestFormat || !config.enableFullLogs) return;

  const tagString = tags.map(tag => `@${tag}`).join(' ');
  const logOutput = `
$ env KEY=playwright node_modules/.bin/mocha -g ${tagString || '@playwright'}

PLAYWRIGHT ==> TC${testCounter.toString().padStart(2, '0')} ${testName} ==> tags: ${tagString || '@playwright'}
**************************************
`;

  writeBeautifulLog(logOutput);
  testCounter++;
};

/**
 * Log API request in Supertest format
 */
export const logSupertestRequest = (requestData: ApiRequestData): void => {
  if (!config.supertestFormat || !config.enableFullLogs) return;

  let logOutput = `
URL : 

${requestData.method.toUpperCase()} ${requestData.url}

Request Header 

${JSON.stringify(requestData.headers || {}, null, 4)}

Request Payload

${JSON.stringify(requestData.body || {}, null, 4)}
`;

  writeBeautifulLog(logOutput);
};

/**
 * Log API response in Supertest format
 */
export const logSupertestResponse = (responseData: ApiResponseData): void => {
  if (!config.supertestFormat || !config.enableFullLogs) return;

  let logOutput = `
RESPONSE

Http Status Code : ${responseData.status}

Response header:
${JSON.stringify(responseData.headers || {}, null, 4)}

Response Payload
${JSON.stringify(responseData.body || {}, null, 4)}
`;

  writeBeautifulLog(logOutput);
};

/**
 * End a test step in Supertest format
 */
export const endSupertestStep = (stepName: string): void => {
  if (!config.supertestFormat || !config.enableFullLogs) return;

  const logOutput = `
Initialization ${stepName}
****************************************
`;

  writeBeautifulLog(logOutput);
};

/**
 * Modified main logging functions to support both formats
 */

// Enhanced API request logging helper with dual format support
export const logAPIRequestDual = (requestData: ApiRequestData): void => {
  if (config.supertestFormat) {
    logSupertestRequest(requestData);
  } else {
    logAPIRequest(requestData);
  }
};

// Enhanced API response logging helper with dual format support  
export const logAPIResponseDual = (responseData: ApiResponseData): void => {
  if (config.supertestFormat) {
    logSupertestResponse(responseData);
  } else {
    logAPIResponse(responseData);
  }
};

/**
 * Toggle Supertest format logging
 */
export const enableSupertestFormat = (enable: boolean = true): void => {
  config.supertestFormat = enable;
  if (enable) {
    console.log('🔄 Switched to Supertest-style logging format');
  } else {
    console.log('🔄 Switched to standard Playwright logging format');
  }
};

/**
 * Check if Supertest format is enabled
 */
export const isSupertestFormatEnabled = (): boolean => {
  return config.supertestFormat;
};
export default logger;
