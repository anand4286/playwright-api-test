# Log Converter - API Logs to Playwright Tests

This utility converts API logs from various sources (Playwright, Supertest, Mocha/Chai, etc.) into complete Playwright test suites with full multi-environment support.

## 🎯 Purpose

Perfect for:
- **Legacy Test Migration**: Convert 6000+ Supertest/Mocha/Chai tests to Playwright
- **Log-Based Test Generation**: Generate tests from existing API logs
- **Multi-Environment Testing**: Create tests that work across dev/staging/qa/prod
- **Test Automation**: Generate comprehensive test suites automatically

## 🚀 Quick Start

### 1. Convert Current Logs
```bash
# Basic conversion using existing logs
cd utils/log-converter
node quick-start.js
```

### 2. Custom Conversion
```bash
# Convert with custom options
node log-converter-cli.js --input ./my-logs --output ./my-tests --project-name "My API Tests"
```

### 3. Large Migration (for your 6000+ tests)
```bash
# Batch processing for large migrations
node log-converter-cli.js --batch-size 100 --migration-mode full --legacy-mode supertest
```

## 📁 Directory Structure

```
log-converter/
├── log-analyzer.ts        # Parses logs and extracts test information
├── test-generator.ts      # Generates Playwright test files
├── log-converter.ts       # Main orchestrator
├── log-converter-cli.ts   # Command-line interface
├── quick-start.ts         # Quick test script
└── README.md             # This file
```

## 🔧 Features

### Multi-Format Support
- ✅ **Playwright Logs**: Beautiful HTTP logs with emoji formatting
- ✅ **Supertest Logs**: Legacy Mocha/Chai test logs
- ✅ **Generic HTTP**: Any HTTP request/response logs
- ✅ **Custom Formats**: Extensible parser system

### Intelligent Generation
- 🧠 **Smart Mapping**: API calls → TestActions methods
- 🔄 **Data Generation**: Dynamic test data (no hardcoded values)
- 🌍 **Multi-Environment**: dev/staging/qa/prod support
- 📦 **Component Reuse**: Fixtures, utilities, and helpers

### Complete Test Suite
- 📝 **Test Files**: Organized by suite with proper structure
- 🛠️ **Utilities**: TestActions, DataLoaders, API helpers
- ⚙️ **Configuration**: Environment configs and endpoints
- 📋 **Documentation**: README and migration guides

## 🎛️ CLI Options

```bash
node log-converter-cli.js [options]

Options:
  -i, --input <dir>           Input logs directory (default: ./logs)
  -o, --output <dir>          Output directory (default: ./generated-tests)
  -p, --project-name <name>   Project name
  -e, --environments <list>   Environments: dev,staging,qa,prod
  -b, --batch-size <num>      Batch size for large migrations
  -m, --migration-mode <mode> full | incremental
  -l, --legacy-mode <type>    supertest | mocha | jest
  -v, --verbose               Verbose output
  -d, --dry-run               Preview without creating files
  -h, --help                  Show help
```

## 📊 Example Output

After conversion, you'll get:

```
generated-tests/
├── tests/
│   ├── authentication/
│   │   └── authentication.spec.ts
│   ├── user-management/
│   │   └── user-management.spec.ts
│   └── profile/
│       └── profile.spec.ts
├── utils/
│   ├── test-actions.ts
│   ├── test-fixtures.ts
│   └── data-generator.ts
├── config/
│   ├── dev.config.ts
│   ├── staging.config.ts
│   └── endpoints.ts
├── scripts/
│   └── run-tests.sh
└── README.md
```

## 🔄 Migration Workflow

### For Your 6000+ Test Migration:

1. **Prepare Source Logs**
   ```bash
   # Export your Supertest logs folder by folder
   # Place them in organized directories like:
   logs/
   ├── authentication/
   ├── user-management/
   ├── payments/
   └── reporting/
   ```

2. **Run Batch Conversion**
   ```bash
   node log-converter-cli.js \
     --input ./supertest-logs \
     --output ./playwright-tests \
     --batch-size 100 \
     --migration-mode full \
     --legacy-mode supertest \
     --project-name "Migrated API Tests"
   ```

3. **Review and Customize**
   - Check generated test files
   - Customize test data and assertions
   - Add business logic validations
   - Update environment configurations

4. **Validate**
   ```bash
   cd playwright-tests
   npm install
   npm run test:dev
   ```

## 🧪 Supported Input Formats

### Playwright Logs
```
📍 TEST STEP: Create Test User
⏰ Step Started: 2025-08-11T12:06:41.576Z

📤 HTTP REQUEST
🌐 Method: POST
🔗 URL: https://api.example.com/users
📤 Request Body: {...}

📥 HTTP RESPONSE
📊 Status: 201 Created
📥 Response Body: {...}
```

### Supertest Logs
```
request(app)
  .post('/api/users')
  .send({ name: 'Test User', email: 'test@example.com' })
  .expect(201)
  .expect((res) => {
    expect(res.body.id).to.be.a('number');
  });
```

### Generic HTTP Logs
```
POST /api/users HTTP/1.1
Content-Type: application/json
{"name": "Test User", "email": "test@example.com"}

HTTP/1.1 201 Created
{"id": 123, "name": "Test User", "email": "test@example.com"}
```

## 🎯 Generated Test Example

Input Log:
```
📍 TEST STEP: Create User
POST /users {"name": "John", "email": "john@example.com"}
Status: 201
```

Generated Test:
```typescript
test('should create user successfully @smoke', async ({ apiHelper }) => {
  testActions = new TestActions(apiHelper);
  
  // Step 1: Create User
  apiHelper.setStep('Create User');
  
  const result = await testActions.createTestUser({
    name: testData.user.fullName,
    email: testActions.generateUniqueEmail()
  });
  
  testActions.assertSuccessResponse(result);
  expect(result.responseBody.id).toBeDefined();
});
```

## 🌍 Multi-Environment Support

Generated tests automatically support multiple environments:

```bash
# Run in development
npm run test:dev

# Run in staging
npm run test:staging

# Run across all environments
npm run test:multi-env

# Environment-specific with verbose logging
npm run test:dev:verbose
```

## 🔧 Advanced Configuration

### Custom Parser
```typescript
// Add custom log format parser
class CustomLogFormat extends LogFormat {
  getName(): string { return 'Custom'; }
  
  canParse(content: string): boolean {
    return content.includes('CUSTOM_LOG_MARKER');
  }
  
  parse(content: string, filePath: string): ParsedTest | null {
    // Custom parsing logic
  }
}
```

### Custom Test Generation
```typescript
// Customize test generation
const config = {
  outputDirectory: './my-tests',
  environments: ['dev', 'staging', 'prod'],
  generateDataFiles: true,
  reuseExistingComponents: true,
  // Add custom generation rules
};
```

## 🚀 Ready to Migrate?

1. **Start Small**: Test with a few log files first
2. **Batch Process**: Use batch mode for large migrations
3. **Validate**: Review generated tests before full migration
4. **Customize**: Add business-specific logic and validations

The converter is designed to handle your **6000+ test migration** efficiently with intelligent batching and component reuse!

## 🎉 Next Steps

After successful conversion:
- Review generated test files
- Customize test data and assertions  
- Configure CI/CD pipeline
- Run tests across environments
- Add custom business logic validations

Happy testing! 🧪✨
