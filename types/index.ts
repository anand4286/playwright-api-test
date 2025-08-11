// Core Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  mobile: string;
  dateOfBirth: Date;
  address: Address;
  company: Company;
  avatar: string;
  bio: string;
  website: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Company {
  name: string;
  department: string;
  jobTitle: string;
}

// Authentication Types
export interface AuthData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// API Types
export interface ApiEndpoints {
  auth: {
    register: string;
    login: string;
    logout: string;
    refresh: string;
    forgotPassword: string;
    resetPassword: string;
  };
  users: {
    profile: string;
    updateProfile: string;
    changePassword: string;
    uploadAvatar: string;
    deleteAccount: string;
  };
  profile: {
    get: string;
    update: string;
    updateEmail: string;
    updatePhone: string;
    updateAddress: string;
    preferences: string;
  };
}

export interface ApiRequestData {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: any;
  testId: string;
  scenarioName: string;
}

export interface ApiResponseData {
  status: number | string;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
  testId: string;
  scenarioName: string;
  error?: string;
}

export interface ApiHelperResponse {
  response: any;
  responseBody: any;
  responseTime: number;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  testId: string;
  scenarioName: string;
}

export interface RequestOptions {
  data?: any;
  headers?: Record<string, string>;
  scenarioName?: string;
  timeout?: number;
}

// Test Types
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: string[];
  expectedOutcome: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  tags: string[];
}

export interface TestExecutionData {
  testName: string;
  status: 'started' | 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  testId: string;
  startTime?: number;
}

export interface TestResult {
  title: string;
  file: string;
  line: number;
  status: 'passed' | 'failed' | 'skipped' | 'flaky' | 'interrupted' | 'timedOut';
  duration: number;
  error?: string;
  retry: number;
  annotations: any[];
  tags: string[];
  timestamp: string;
}

export interface TestReportData {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  tests: TestResult[];
  summary: TestSummary;
  apiLogs: any[];
}

export interface TestSummary {
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  success: boolean;
}

// Data Generation Types
export interface GeneratedTestData {
  users: User[];
  apiEndpoints: ApiEndpoints;
  testScenarios: TestScenario[];
  authData: AuthData;
  generatedAt: string;
  seed: number;
}

// Logging Types
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  type: 'api_request' | 'api_response' | 'test_execution';
  [key: string]: any;
}

// Dashboard Types
export interface DashboardMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  successRate: number;
  totalApiRequests: number;
  avgResponseTime: number;
}

export interface ApiLogSummary {
  methodCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  avgResponseTimes: Record<string, number>;
  totalRequests: number;
  totalResponses: number;
}

export interface ApiLogsReport {
  totalRequests: number;
  requests: any[];
  summary: ApiLogSummary;
  generatedAt: string;
}

// Traceability Types
export interface Requirement {
  id: string;
  category: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  testCases: string[];
  coverage: number;
  status: 'Covered' | 'Partial' | 'Limited' | 'Not Covered';
  businessRule: string;
  acceptanceCriteria: string[];
}

export interface BusinessRule {
  id: string;
  description: string;
  category: string;
  requirements: string[];
}

export interface TestCaseMapping {
  [testCaseId: string]: {
    requirement: string;
    description: string;
    automationStatus: 'Automated' | 'Manual' | 'Not Automated';
    lastExecuted: string;
    status: 'Pass' | 'Fail' | 'Not Run';
  };
}

export interface TraceabilityMatrix {
  version: string;
  generatedAt: string;
  project: string;
  requirements: Requirement[];
  businessRules: BusinessRule[];
  testCaseMapping: TestCaseMapping;
  coverageMetrics: CoverageMetrics;
}

export interface CoverageMetrics {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercentage: number;
  totalTestCases: number;
  automatedTestCases: number;
  automationPercentage: number;
  lastUpdated: string;
}

// Utility Types
export type TestPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'flaky';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';
