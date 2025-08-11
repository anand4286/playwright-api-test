# 🎭 Playwright API Testing Framework - Quick Start Guide

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Quick Setup

```bash
# Clone or ensure you're in the project directory
cd /Users/Anand/github/playwright-api-test

# Run the automated setup script
./setup.sh
```

### Manual Setup (Alternative)

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Build TypeScript
npm run build

# Generate test data
npm run generate:data

# Type check
npm run type-check
```

## Quick Test Run

```bash
# Run smoke tests
npm run test:smoke

# Run all tests
npm test

# Start dashboard
npm run start:dashboard
# Open http://localhost:3000
```

## Project Structure Overview

```
📁 playwright-api-test/
├── 🔧 types/index.ts              # TypeScript definitions
├── 🧪 tests/                      # Test specifications
│   ├── auth/authentication.spec.ts
│   ├── profile/profileManagement.spec.ts
│   └── user-management/userRegistration.spec.ts
├── ⚙️ utils/                       # Utilities & helpers
│   ├── dataGenerator.ts           # Dynamic data generation
│   ├── logger.ts                  # Structured logging
│   ├── testFixtures.ts            # Test fixtures & API helpers
│   └── customReporter.ts          # Custom reporting
├── 📊 dashboard/                   # Real-time dashboard
│   ├── server.ts                  # Backend server
│   └── public/index.html          # Frontend UI
├── 📝 docs/test-plan.md           # Test planning
├── 📋 reports/                    # Generated reports
├── 📋 logs/                       # API & execution logs
└── 🗂️ test-data/                  # Generated test data
```

## Test Scenarios Included

### 1. 👤 User Management (10 scenarios)
- User registration with validation
- Duplicate email handling
- Profile CRUD operations
- Bulk user operations

### 2. 🔐 Authentication (11 scenarios)  
- Login/logout workflows
- Session management
- Token refresh & expiration
- Password management

### 3. 📝 Profile Management (14 scenarios)
- Email updates with verification
- Phone number management
- Address updates
- Profile picture handling

## Key Features Implemented

### ✅ API Testing
- **Comprehensive Coverage**: 35+ test scenarios
- **Dynamic Data**: Faker.js integration
- **Request/Response Logging**: Full API interaction tracking
- **Error Handling**: Negative test scenarios

### ✅ TypeScript Benefits
- **Type Safety**: Full type definitions for all components
- **IntelliSense**: Enhanced IDE support
- **Compile-time Checking**: Catch errors before runtime
- **Better Refactoring**: Safe code changes

### ✅ Logging & Monitoring
- **Structured Logging**: Winston-based logging system
- **API Logs**: Request/response with timing
- **Test Execution Logs**: Detailed test lifecycle tracking
- **Real-time Updates**: Live dashboard monitoring

### ✅ Reporting & Analytics
- **Multiple Formats**: HTML, JSON, JUnit reports
- **Custom Reporter**: Detailed test execution analysis
- **Dashboard**: Real-time test metrics and visualizations
- **Traceability Matrix**: Requirements to test case mapping

### ✅ Data Management
- **Dynamic Generation**: Realistic test data creation
- **Configurable Seeds**: Reproducible test data
- **Bulk Operations**: Performance testing support
- **Data Validation**: Type-safe data structures

### ✅ Modern Architecture
- **Modular Design**: Reusable components
- **Fixture Pattern**: Shared test utilities
- **Configuration Management**: Environment-based settings
- **Extensible Framework**: Easy to add new test scenarios

## Quick Commands Reference

```bash
# Development
npm run build                    # Build TypeScript
npm run type-check              # Type checking only

# Testing
npm test                        # All tests
npm run test:smoke             # Smoke tests only
npm run test:regression        # Regression tests only
npm run test:user-management   # User management tests
npm run test:auth              # Authentication tests
npm run test:profile           # Profile management tests

# Utilities
npm run generate:data          # Generate fresh test data
npm run start:dashboard        # Start monitoring dashboard
npm run test:report           # Open test reports

# Debug & Analysis
npm run test:debug            # Debug mode
npm run test:ui               # Interactive UI mode
npm run test:headed           # Headed browser mode
```

## Environment Configuration

Create or modify `.env` file:

```bash
# API Configuration
BASE_URL=https://jsonplaceholder.typicode.com
API_VERSION=v1

# Test Configuration
TIMEOUT=30000
RETRIES=2
PARALLEL_WORKERS=4

# Data Generation
GENERATE_DYNAMIC_DATA=true
DATA_SEED=12345
MAX_TEST_USERS=100

# Dashboard
DASHBOARD_PORT=3000
ENABLE_REAL_TIME_UPDATES=true

# Logging
LOG_LEVEL=info
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Run `npm run type-check` to identify issues
2. **Missing Dependencies**: Run `npm install` 
3. **Browser Issues**: Run `npx playwright install`
4. **Test Failures**: Check logs in `./logs/` directory
5. **Dashboard Not Loading**: Ensure port 3000 is available

### Getting Help

1. Check the test plan: `docs/test-plan.md`
2. Review logs: `tail -f logs/combined.log`
3. Dashboard insights: `npm run start:dashboard`
4. Test reports: `npm run test:report`

## Next Steps

1. **Customize Test Data**: Modify `utils/dataGenerator.ts`
2. **Add New Tests**: Create new `.spec.ts` files in test directories
3. **Extend API Helpers**: Add methods to `utils/testFixtures.ts`
4. **Configure Environments**: Update `.env` for different environments
5. **Enhance Dashboard**: Modify `dashboard/public/index.html`

---

**Framework Version**: 1.0.0 (TypeScript)  
**Last Updated**: August 11, 2025  
**Compatibility**: Playwright ^1.40.0, Node.js ^18.0.0, TypeScript ^5.2.2

🎉 **You now have a complete, modern, TypeScript-based API testing framework!**
