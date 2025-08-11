# 🎭 Playwright API Testing Framework (TypeScript)

A comprehensive, enterprise-grade API testing framework built with Playwright and TypeScript. Features intelligent test-specific logging, multi-environment testing, comprehensive log storage system, and advanced test scenario execution.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40.0-green.svg)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-200%2B-brightgreen.svg)](#test-scenarios)
[![Status](https://img.shields.io/badge/Status-Enterprise%20Ready-success.svg)](#framework-status)

## ✅ Recent Updates

### 🌟 **Intelligent Test-Specific Logging System** (August 11, 2025 - Latest):

#### 🎯 **Enhanced Logging Features**:
- ✅ **Test-Specific Log Files**: Each test creates its own log file (e.g., `should_authenticate_user_with_valid_credentials_sm_http-live.log`)
- ✅ **Test Step Tracking**: Detailed step-by-step logging within each test with timestamps
- ✅ **Beautiful Formatted Logs**: Enhanced logs with emojis, structured layout, and visual indicators
- ✅ **Smart File Naming**: Automatic sanitization of test names for clean file names
- ✅ **Context Awareness**: Logs include test case names, step names, and execution context
- ✅ **Optimized Storage**: Only essential logs preserved (HTTP live + error logs)

#### 📁 **Comprehensive Log Storage System**:
- ✅ **Automatic Archiving**: Logs archived after verbose test runs with environment/suite context
- ✅ **Organized Storage**: Archives by date, environment, and test suite for easy retrieval
- ✅ **Powerful Search**: Full-text search across all archived logs with filtering
- ✅ **Size Management**: Automatic cleanup with configurable retention periods
- ✅ **Multiple Access Methods**: CLI scripts, npm commands, and TypeScript API

### 🌍 **Multi-Environment Testing Framework** (August 11, 2025):

#### 🚀 **Complete Environment Management**:
- ✅ **4 Environment Support**: Dev, Staging, QA, and Production with dedicated configurations
- ✅ **Cross-Environment Execution**: Run same tests across multiple environments
- ✅ **Shell Compatibility**: Fixed bash/zsh compatibility for reliable execution
- ✅ **Environment Validation**: Automatic configuration validation and comparison tools
- ✅ **Parallel Execution**: Support for concurrent multi-environment testing

### 📊 **Advanced HTTP Logging & Monitoring** (August 11, 2025):

#### 🔍 **Beautiful HTTP Logging**:
- ✅ **Real-Time Monitoring**: Live log files with `npm run monitor:http`
- ✅ **Complete Request/Response Capture**: Full URL, headers, body, timing, and status
- ✅ **Live Dashboard Integration**: Real-time log viewing with beautiful formatting
- ✅ **Configurable Detail Levels**: Control headers, body, and response logging
- ✅ **Performance Metrics**: Response time tracking and optimization insights

## 🚀 Key Features

- **🌍 Multi-Environment Testing**: Dev, Staging, QA, and Production with cross-environment execution
- **📁 Intelligent Logging**: Test-specific log files with step tracking and beautiful formatting
- **🗄️ Log Storage System**: Automatic archiving, powerful search, and organized storage
- **🔍 Real-Time Monitoring**: Live HTTP log monitoring with beautiful console output
- **🎯 Complete API Coverage**: Authentication, user management, profile operations, and workflows
- **🔧 Reusable Test Actions**: 35+ utility methods in TestActions class for common operations
- **🌐 Centralized Endpoint Management**: All API endpoints in configuration file for easy maintenance
- **📊 Real-time Dashboard**: Live monitoring with interactive charts and metrics
- **🔄 Dynamic Test Data**: Realistic data generation using Faker.js with configurable seeds
- **🗺️ Requirements Traceability**: Business rule mapping with coverage analysis
- **📈 Multiple Report Formats**: HTML, JSON, JUnit with embedded trace viewing
- **🔧 TypeScript Excellence**: Full type safety, IntelliSense, and strict mode compliance
- **🏷️ Smart Test Organization**: Tag-based execution for smoke, regression, and critical path tests
- **⚡ Performance Analysis**: Response time tracking and optimization insights
- **🐛 Advanced Debugging**: Inspector integration with step-by-step trace analysis

## 🚀 Quick Start

### 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd playwright-api-test

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### 🌍 Multi-Environment Testing

#### **Basic Commands**
```bash
# Run tests in different environments
npm run test:dev                 # Development environment
npm run test:staging             # Staging environment  
npm run test:qa                  # QA environment
npm run test:prod                # Production environment (limited workers)
```

#### **Verbose Logging (Recommended)**
```bash
# Run with beautiful HTTP logging and test-specific log files
npm run test:dev:verbose         # Creates test-specific log files
npm run test:staging:verbose     # Beautiful formatted logs
npm run test:qa:verbose          # Complete request/response details
```

#### **Advanced Multi-Environment Execution**
```bash
# Run across multiple environments
npm run test:multi-env:basic     # Basic tests across dev, staging, qa
npm run test:multi-env:parallel  # Parallel execution across environments

# Advanced test runner with full control
./scripts/run-tests.sh -e dev -s smoke --full-logs
./scripts/run-tests.sh -e staging -s regression --verbose
```

### 📁 Log Management

#### **View Current Logs**
```bash
# Monitor logs in real-time
npm run monitor:http             # Live HTTP log monitoring

# Test with live monitoring
npm run test:dev:live           # Test with real-time log viewing
```

#### **Log Storage and Archiving**
```bash
# Archive current logs
npm run logs:archive dev smoke           # Archive with environment and suite
npm run logs:archive staging regression  # Archive staging regression logs

# List archived logs
npm run logs:list 2025-08-11            # List by date
npm run logs:list dev                   # List by environment

# Search archived logs
npm run logs:search "API Request"       # Search all logs
npm run logs:search "authentication" env=dev  # Search with filters

# Show archive statistics
npm run logs:summary                    # Storage summary and stats
```

#### **Log Cleanup**
```bash
# Clean up old logs (default: 30 days)
npm run logs:cleanup

# Custom retention period
./scripts/manage-logs.sh cleanup 14     # Keep 14 days
```

## 📊 Test Organization

### 🏷️ **Test Categories**

#### **Smoke Tests** (Critical Path)
```bash
npm run test:dev:verbose -- --grep "@smoke"
```

#### **Regression Tests** (Full Coverage)
```bash
npm run test:staging:verbose -- --grep "@regression"  
```

#### **Performance Tests** (Load Testing)
```bash
npm run test:qa:verbose -- --grep "@performance"
```

### 📁 **Test Structure**

```
tests/
├── auth/                           # Authentication tests
│   └── authentication.spec.ts     # Login, logout, token validation
├── user-management/                # User CRUD operations
│   └── userRegistration.spec.ts   # User registration workflows
├── profile/                        # Profile management
│   └── profileManagement.spec.ts  # Profile updates and validation
└── advanced/                       # Advanced test scenarios
    ├── data-driven-clean.spec.ts  # Data-driven testing
    ├── chained-test-clean.spec.ts  # Sequential workflows
    ├── header-validation.spec.ts   # Header validation
    ├── negative-scenarios.spec.ts  # Error handling
    └── performance-tests.spec.ts   # Performance testing
```

## 🔧 Framework Components

### 🛠️ **Core Utilities**

#### **TestActions Class** (35+ Methods)
```typescript
import { TestActions } from './utils/test-actions';

// In your tests
test('user workflow', async ({ apiHelper }) => {
  const testActions = new TestActions(apiHelper);
  
  // Set test step for detailed logging
  apiHelper.setStep('Create Test User');
  const user = await testActions.createTestUser(testData);
  
  apiHelper.setStep('Setup Authentication');
  await testActions.setupAuthentication(user.id);
});
```

#### **Enhanced API Helper**
```typescript
// Automatic test context and step tracking
test('authentication flow', async ({ apiHelper }) => {
  // Test name automatically captured for log file naming
  
  apiHelper.setStep('Validate Credentials');
  const response = await apiHelper.post('/auth/login', { 
    data: credentials 
  });
  
  apiHelper.setStep('Verify Token');
  apiHelper.validateResponse(response, 200);
});
```

### 📁 **Log File Examples**

#### **Test-Specific Log Files**
```
logs/
├── should_authenticate_user_with_valid_credentials_sm_http-live.log
├── user_registration_with_invalid_email_http-live.log
├── performance_test_concurrent_requests_http-live.log
└── error.log
```

#### **Sample Log Content**
```log
================================================================================
🧪 TEST: should authenticate user with valid credentials @smoke @critical-path
📅 Started: 2025-08-11T12:03:10.655Z
================================================================================

📍 TEST STEP: Setup User Authentication
⏰ Step Started: 2025-08-11T12:03:10.655Z
────────────────────────────────────────────────────────────

================================================================================
📤 HTTP REQUEST
================================================================================
🧪 Test Case: should authenticate user with valid credentials @smoke @critical-path
📍 Test Step: Setup User Authentication
🌐 Method: POST
🔗 URL: https://jsonplaceholder.typicode.com/posts
⏰ Timestamp: 2025-08-11T12:03:10.655Z
🏷️  Test ID: 65440000-0403-4c31-a794-8af994ed8d5d
🎭 Scenario: User Authentication

📋 Request Headers:
{}

📤 Request Body:
{
  "title": "Login Request",
  "body": "{\"email\":\"testuser@example.com\",\"password\":\"SecurePassword123!\"}",
  "userId": 11
}
================================================================================
```

## 🌐 Environment Configuration

### 📝 **Environment Files**

```
environments/
├── dev.env          # Development configuration
├── staging.env      # Staging configuration  
├── qa.env          # QA configuration
└── prod.env        # Production configuration
```

#### **Sample Environment Configuration**
```bash
# dev.env
BASE_URL=https://api-dev.example.com
API_TIMEOUT=30000
RETRY_COUNT=3
ENABLE_FULL_LOGS=true
LOG_HEADERS=true
LOG_REQUEST_BODY=true
LOG_RESPONSE_BODY=true
WORKERS=3
```

### 🔧 **Environment Management**
```bash
# Validate environment configurations
npm run env:validate

# Compare environments
npm run env:compare

# Switch environment
npm run env:switch dev
```

## 📊 Advanced Test Scenarios

### 🎯 **Data-Driven Testing**
```typescript
// Automated test-specific logging
test('data-driven user validation', async ({ apiHelper }) => {
  const users = testData.multipleUsers;
  
  for (const userData of users) {
    apiHelper.setStep(`Validate User: ${userData.email}`);
    const response = await apiHelper.registerUser(userData);
    apiHelper.validateResponse(response, 201);
  }
});
```

### 🔗 **Chained Dependencies**
```typescript
test.describe.serial('User Journey', () => {
  let userId: string;
  
  test('create user', async ({ apiHelper }) => {
    apiHelper.setStep('Create New User Account');
    const response = await apiHelper.registerUser(testData.user);
    userId = response.responseBody.id;
  });
  
  test('login user', async ({ apiHelper }) => {
    apiHelper.setStep('Login with Created User');
    await apiHelper.loginUser({ email: testData.user.email, password: testData.user.password });
  });
});
```

### ⚡ **Performance Testing**
```typescript
test('concurrent operations', async ({ apiHelper }) => {
  apiHelper.setStep('Setup Concurrent Users');
  const users = Array.from({ length: 10 }, () => dataGenerator.generateUser());
  
  apiHelper.setStep('Execute Concurrent Registration');
  const startTime = Date.now();
  
  const promises = users.map(user => 
    apiHelper.registerUser(user)
  );
  
  const responses = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // Performance validation with detailed logging
  expect(duration).toBeLessThan(5000);
  expect(responses.every(r => r.status === 201)).toBe(true);
});
```

## 📈 Reports and Monitoring

### 📊 **Dashboard Features**
- **Real-time Test Execution**: Live monitoring with progress indicators
- **Interactive Charts**: Visual representation of test results and performance
- **Environment Comparison**: Side-by-side environment performance analysis
- **Historical Trends**: Test execution trends and performance over time

### 📋 **Report Formats**
```bash
# Automatic report opening after tests
npm run test:dev:verbose  # Auto-opens dashboard and HTML reports

# Manual report access
npx playwright show-report reports/dev-html-report
npm run open:reports
```

### 🔍 **Live Monitoring**
```bash
# Monitor HTTP logs in real-time
npm run monitor:http

# Test with live log monitoring
npm run test:dev:live
```

## 🔧 Configuration

### ⚙️ **Environment Variables**
```bash
# Enable enhanced logging
ENABLE_FULL_LOGS=true
ENABLE_CONSOLE_LOGGING=true

# Control log detail levels
LOG_HEADERS=true
LOG_REQUEST_BODY=true
LOG_RESPONSE_BODY=true

# Performance tuning
WORKERS=3
TIMEOUT=30000
RETRIES=2
```

### 📁 **Project Structure**
```
playwright-api-test/
├── config/                     # Configuration files
│   ├── endpoints.ts           # API endpoint definitions
│   └── playwright.config.js   # Playwright configuration
├── environments/              # Environment configurations
│   ├── dev.env               # Development environment
│   ├── staging.env           # Staging environment
│   ├── qa.env               # QA environment
│   └── prod.env             # Production environment
├── logs/                      # Test-specific log files
│   ├── archive/              # Archived logs by date/environment
│   ├── should_authenticate_user_with_valid_credentials_sm_http-live.log
│   └── error.log
├── scripts/                   # Automation scripts
│   ├── run-tests.sh          # Advanced test runner
│   ├── manage-logs.sh        # Log management utilities
│   └── monitor-http-logs.sh  # Real-time log monitoring
├── test-data/                 # External test data
│   ├── users.json            # User test data
│   ├── auth.json             # Authentication data
│   └── advanced/             # Advanced scenario data
├── tests/                     # Test suites
│   ├── auth/                 # Authentication tests
│   ├── user-management/      # User CRUD operations
│   ├── profile/              # Profile management
│   └── advanced/             # Advanced test scenarios
├── types/                     # TypeScript type definitions
├── utils/                     # Utility classes and helpers
│   ├── testFixtures.ts       # Enhanced test fixtures
│   ├── test-actions.ts       # Reusable test actions
│   ├── logger.ts             # Intelligent logging system
│   ├── logStorage.ts         # Log storage and archiving
│   └── httpLogger.ts         # HTTP request/response logging
└── docs/                      # Documentation
    ├── enhanced-logging-system.md
    └── log-storage.md
```

## 🎯 Best Practices

### 📝 **Test Writing**
```typescript
// Use descriptive test names for better log file naming
test('should authenticate user with valid credentials @smoke @critical-path', async ({ apiHelper }) => {
  // Set clear test steps for detailed logging
  apiHelper.setStep('Prepare Authentication Data');
  const credentials = testData.auth.validCredentials;
  
  apiHelper.setStep('Execute Login Request');
  const response = await apiHelper.loginUser(credentials);
  
  apiHelper.setStep('Validate Authentication Response');
  apiHelper.validateResponse(response, 200);
  expect(response.responseBody.token).toBeDefined();
});
```

### 🗂️ **Log Management**
```bash
# Archive logs immediately after important test runs
npm run test:prod:verbose
npm run logs:archive prod critical-path-tests

# Regular cleanup to manage storage
npm run logs:cleanup 30  # Keep 30 days of logs

# Search for patterns and issues
npm run logs:search "authentication.*failed"
npm run logs:search "timeout" env=staging
```

### 🌍 **Environment Management**
```bash
# Validate configurations before major runs
npm run env:validate

# Run smoke tests across all environments
./scripts/run-tests.sh -e dev,staging,qa -s smoke --full-logs

# Performance testing in dedicated environment
npm run test:qa:verbose -- --grep "@performance"
```

## 📚 Documentation

- **[Enhanced Logging System](docs/enhanced-logging-system.md)**: Complete guide to test-specific logging and step tracking
- **[Log Storage System](docs/log-storage.md)**: Comprehensive log archiving, search, and management
- **[Multi-Environment Testing](docs/multi-environment-testing.md)**: Environment configuration and cross-environment execution
- **[Advanced Test Scenarios](docs/advanced-test-scenarios.md)**: Data-driven, chained, and performance testing patterns

## 🚀 Getting Started Examples

### 🎯 **Simple Test Execution**
```bash
# Run authentication tests with beautiful logging
npm run test:dev:verbose -- --grep "authentication"

# Check generated log file
ls -la logs/should_authenticate_user_with_valid_credentials_sm_http-live.log

# Archive the logs
npm run logs:archive dev authentication-tests
```

### 🌍 **Multi-Environment Execution**
```bash
# Run across multiple environments with full logging
./scripts/run-tests.sh -e dev,staging -s smoke --full-logs

# Archive results from both environments
npm run logs:archive dev smoke-tests
npm run logs:archive staging smoke-tests

# Compare results across environments
npm run logs:search "response time" env=dev
npm run logs:search "response time" env=staging
```

### 📊 **Performance Analysis**
```bash
# Run performance tests with detailed logging
npm run test:qa:verbose -- --grep "@performance"

# Monitor logs in real-time during execution
npm run monitor:http

# Archive and analyze performance logs
npm run logs:archive qa performance-tests
npm run logs:search "Response Time.*[5-9][0-9][0-9]ms" env=qa
```

## 🏆 Framework Status

- **✅ Enterprise Ready**: Production-ready with comprehensive error handling
- **✅ 200+ Tests**: Extensive test coverage across all scenarios
- **✅ Multi-Environment**: Support for dev, staging, QA, and production
- **✅ Intelligent Logging**: Test-specific logs with step tracking
- **✅ Performance Optimized**: Efficient execution with configurable workers
- **✅ TypeScript Compliant**: Full type safety and IntelliSense support
- **✅ Comprehensive Documentation**: Detailed guides and best practices

## 📞 Support

For questions, issues, or contributions, please refer to:
- Framework documentation in the `docs/` directory
- Test examples in the `tests/` directory  
- Utility classes in the `utils/` directory
- Configuration examples in the `environments/` directory

---

**🎉 Start testing with confidence using the Playwright API Testing Framework!**

```bash
# Get started with enhanced logging
npm run test:dev:verbose

# Your test-specific logs will be automatically created! 📁✨
```
