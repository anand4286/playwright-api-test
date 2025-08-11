# Enhanced Test-Specific Logging System

The Playwright API Testing Framework now features an **intelligent logging system** that creates separate log files for each test case and tracks test steps within each test.

## 🎯 Key Features

✅ **Test-Specific Log Files**: Each test case gets its own log file  
✅ **Test Step Tracking**: Detailed step-by-step logging within each test  
✅ **Automatic File Naming**: Log files named based on test case names  
✅ **Beautiful Formatting**: Enhanced logs with emojis and structured layout  
✅ **Smart Archiving**: Archives all test-specific logs automatically  

## 📁 Log File Structure

### Current Logs Directory
```
logs/
├── should_authenticate_user_with_valid_credentials_sm_http-live.log  # Test-specific log
├── user_registration_flow_http-live.log                             # Another test log
├── performance_test_large_payload_http-live.log                     # Performance test log
└── error.log                                                        # Global error log
```

### Archived Logs
```
logs/archive/by-environment/dev/
├── dev_2025-08-11_12-03-38_authentication-test_should_authenticate_user_with_valid_credentials_sm_http-live.log
├── dev_2025-08-11_12-03-38_authentication-test_error.log
└── dev_2025-08-11_10-15-22_regression-test_user_profile_update_http-live.log
```

## 🔍 Log Content Example

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

================================================================================
📥 HTTP RESPONSE
================================================================================
🧪 Test Case: should authenticate user with valid credentials @smoke @critical-path
📍 Test Step: Setup User Authentication
📊 Status: 201 Created
⏱️  Response Time: 665ms
⏰ Timestamp: 2025-08-11T12:03:11.322Z
🏷️  Test ID: 65440000-0403-4c31-a794-8af994ed8d5d
🎭 Scenario: User Authentication
```

## 🚀 Usage

### Automatic Test Context Detection
The system automatically:
- **Captures test names** from Playwright test titles
- **Creates test-specific log files** with sanitized names
- **Tracks test execution** from start to finish

### Manual Step Tracking
In your tests, you can add step tracking:

```typescript
test('should complete user registration flow', async ({ apiHelper }) => {
  // Step 1: Create user
  apiHelper.setStep('Create New User');
  const response = await apiHelper.registerUser(userData);
  
  // Step 2: Verify user
  apiHelper.setStep('Verify User Registration');
  apiHelper.validateResponse(response, 201);
  
  // Step 3: Login user
  apiHelper.setStep('Login with New Credentials');
  const loginResponse = await apiHelper.loginUser(credentials);
});
```

### TestActions Integration
The `TestActions` class automatically sets test steps:

```typescript
async createTestUser(testData: any): Promise<User & { id: string }> {
  // Automatically sets step: "Create Test User"
  // ...
}

async setupAuthentication(userId: string): Promise<any> {
  // Automatically sets step: "Setup User Authentication"
  // ...
}
```

## 📋 File Naming Convention

### Test Log Files
```
{sanitized_test_name}_http-live.log
```

Examples:
- `should_authenticate_user_with_valid_credentials_sm_http-live.log`
- `user_registration_with_invalid_email_http-live.log`
- `performance_test_concurrent_requests_http-live.log`

### Archived Files
```
{environment}_{date}_{time}_{test_suite}_{original_log_name}
```

Examples:
- `dev_2025-08-11_12-03-38_authentication-test_should_authenticate_user_with_valid_credentials_sm_http-live.log`
- `staging_2025-08-11_10-15-22_regression-test_user_profile_update_http-live.log`

## 🔧 Configuration

### Environment Variables
```bash
ENABLE_FULL_LOGS=true           # Enable test-specific logging
ENABLE_CONSOLE_LOGGING=true     # Also output to console
LOG_HEADERS=true                # Include HTTP headers
LOG_REQUEST_BODY=true           # Include request bodies
LOG_RESPONSE_BODY=true          # Include response bodies
```

### Test Execution Commands
```bash
# Standard test with enhanced logging
npm run test:dev:verbose

# Specific test with logging
npm run test:dev:verbose -- --grep "authentication"

# Advanced test runner with logging
./scripts/run-tests.sh -e dev -s smoke --full-logs
```

## 📊 Benefits

### 1. **Isolated Debugging**
- Each test has its own log file
- No mixing of different test outputs
- Easy to find specific test issues

### 2. **Step-by-Step Analysis**
- Clear test step boundaries
- Detailed HTTP request/response tracking
- Precise timing information

### 3. **Organized Storage**
- Test-specific archives
- Environment-based organization
- Easy search and retrieval

### 4. **Performance Analysis**
- Individual test performance metrics
- Response time tracking per step
- Resource usage per test case

### 5. **Team Collaboration**
- Share specific test logs easily
- Clear test case identification
- Standardized log format

## 🔍 Advanced Usage

### Search Test-Specific Logs
```bash
# Search in specific test logs
npm run logs:search "authentication" type=should_authenticate

# Find all failed authentication tests
npm run logs:search "error" env=dev date=2025-08-11
```

### Archive Specific Test Runs
```bash
# Archive after running specific test suite
npm run test:dev:verbose -- --grep "@smoke"
npm run logs:archive dev smoke-tests

# Archive performance test results
npm run test:qa:verbose -- --grep "@performance"
npm run logs:archive qa performance-tests
```

### Monitor Real-Time Test Logs
```bash
# Monitor specific test log in real-time
tail -f logs/should_authenticate_user_with_valid_credentials_sm_http-live.log

# Monitor all test logs
npm run monitor:http
```

## 🎯 Best Practices

### 1. **Descriptive Test Names**
- Use clear, descriptive test names
- Include test type indicators (@smoke, @regression)
- Avoid special characters that don't sanitize well

### 2. **Strategic Step Setting**
- Set steps at logical boundaries
- Use descriptive step names
- Group related actions under one step

### 3. **Log Analysis Workflow**
1. Run tests with verbose logging
2. Check individual test log files for detailed analysis
3. Archive logs with descriptive test suite names
4. Use search functionality to find patterns

### 4. **Storage Management**
- Regular cleanup of old test-specific logs
- Archive important test runs immediately
- Use environment-specific naming conventions

## 🏁 Summary

The enhanced logging system provides:

✅ **Complete Test Isolation**: Each test gets its own log file  
✅ **Detailed Step Tracking**: Know exactly what happened when  
✅ **Beautiful Formatting**: Easy-to-read logs with visual indicators  
✅ **Smart Organization**: Automatic archiving and categorization  
✅ **Efficient Storage**: Only essential logs are preserved  
✅ **Easy Debugging**: Find and analyze specific test issues quickly  

Start using enhanced logging today:
```bash
npm run test:dev:verbose -- --grep "your-test-name"
```

Your test-specific logs will be automatically created and ready for analysis! 🚀
