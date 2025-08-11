import { logAPIRequest, logAPIResponse } from '../utils/logger.js';

// Simple test to verify HTTP logging
console.log('Testing HTTP logging...');

console.log('Environment variables:');
console.log('ENABLE_FULL_LOGS:', process.env.ENABLE_FULL_LOGS);
console.log('ENABLE_CONSOLE_LOGGING:', process.env.ENABLE_CONSOLE_LOGGING);
console.log('LOG_HEADERS:', process.env.LOG_HEADERS);

// Test request data
const requestData = {
  method: 'POST',
  url: 'https://api.example.com/test',
  headers: { 'Content-Type': 'application/json' },
  body: { test: 'data' },
  testId: 'test-123',
  scenarioName: 'Test Scenario'
};

// Test response data  
const responseData = {
  status: 200,
  statusText: 'OK',
  headers: { 'Content-Type': 'application/json' },
  body: { success: true },
  responseTime: 150,
  testId: 'test-123',
  scenarioName: 'Test Scenario'
};

console.log('Calling logAPIRequest...');
logAPIRequest(requestData);

console.log('Calling logAPIResponse...');
logAPIResponse(responseData);

console.log('HTTP logging test complete.');
