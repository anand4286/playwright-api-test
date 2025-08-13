# @anand4286/swagger-dashboard

[![npm version](https://badge.fury.io/js/@anand4286%2Fswagger-dashboard.svg)](https://badge.fury.io/js/@anand4286%2Fswagger-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **universal OpenAPI testing framework** with an interactive dashboard for processing 100+ API specifications. Automatically generates comprehensive test requirements and test cases from any OpenAPI/Swagger specification.

## 🚀 Features

- **Universal OpenAPI Support**: Works with OpenAPI 2.0/3.0 in JSON, YAML, or YML formats
- **Automatic Requirement Generation**: Creates comprehensive test requirements from API specs
- **Interactive Dashboard**: Web interface for managing multiple APIs
- **Batch Processing**: Process hundreds of OpenAPI specs simultaneously
- **CLI Tools**: Command-line tools for automation and CI/CD integration
- **Enterprise Ready**: Scalable architecture for large API portfolios

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g @anand4286/swagger-dashboard
```

### Local Installation
```bash
npm install @anand4286/swagger-dashboard
```

### As a Dependency
```bash
npm install @anand4286/swagger-dashboard --save
```

## 🚀 Quick Start

### 1. Global CLI Usage

```bash
# Quick start - process specs and start dashboard
swagger-dashboard quick-start

# Or step by step
swagger-dashboard process -i ./openapi-specs -o ./requirements
swagger-dashboard start -p 8888
```

### 2. Programmatic Usage

```typescript
import { SwaggerDashboard } from '@anand4286/swagger-dashboard';

// Quick start
const dashboard = await SwaggerDashboard.quickStart({
  openApiDir: './openapi-specs',
  outputDir: './requirements',
  port: 8888
});

// Or step by step
const dashboard = new SwaggerDashboard();
await dashboard.processAllSpecs('./openapi-specs', './requirements');
await dashboard.startServer({ port: 8888 });
```

### 3. Batch Processing Only

```bash
# Using CLI
swagger-batch ./openapi-specs ./requirements

# Or programmatically
import { SwaggerBatchProcessor } from '@anand4286/swagger-dashboard';

const processor = new SwaggerBatchProcessor('./openapi-specs', './requirements');
const result = await processor.processAllSpecs();
```

## 📁 Directory Structure

```
your-project/
├── openapi-specs/          # Place your OpenAPI specs here
│   ├── user-api.json
│   ├── product-api.yaml
│   └── payment-api.yml
├── requirements/           # Generated requirements (auto-created)
│   ├── user-api-generated-requirements.json
│   ├── product-api-generated-requirements.json
│   └── batch-processing-summary.json
└── package.json
```

## 🎯 CLI Commands

### Main Dashboard CLI

```bash
# Start dashboard with default settings
swagger-dashboard

# Process specs and start dashboard
swagger-dashboard quick-start --port 8888 --input ./specs --output ./reqs

# Process specs only
swagger-dashboard process --input ./openapi-specs --output ./requirements

# Start server only (skip processing)
swagger-dashboard start --port 8888 --no-process
```

### Batch Processing CLI

```bash
# Process all specs in directory
swagger-batch

# Custom directories
swagger-batch ./my-specs ./my-requirements

# Verbose output
swagger-batch --verbose
```

### Single API Generation CLI

```bash
# Generate requirements for one API
swagger-generate ./openapi-specs/my-api.json

# Custom output directory
swagger-generate ./specs/api.yaml --output ./custom-output

# Verbose output
swagger-generate ./api.json --verbose
```

## 📚 API Reference

### SwaggerDashboard Class

```typescript
import { SwaggerDashboard } from '@anand4286/swagger-dashboard';

const dashboard = new SwaggerDashboard({
  port: 8888,
  openApiDir: './openapi-specs',
  requirementsDir: './requirements',
  enableCors: true,
  logLevel: 'info'
});

// Generate requirements for single API
const result = await dashboard.generateRequirements('./api.json', './output');

// Process all APIs in directory
const batchResult = await dashboard.processAllSpecs('./specs', './reqs');

// Start dashboard server
await dashboard.startServer({ port: 9000 });

// Full pipeline
await dashboard.run({
  processSpecs: true,
  startServer: true,
  openApiDir: './specs',
  outputDir: './reqs'
});
```

### SwaggerRequirementGenerator Class

```typescript
import { SwaggerRequirementGenerator } from '@anand4286/swagger-dashboard';

// From file
const generator = new SwaggerRequirementGenerator('./api.json');
const { requirements, testCases } = generator.generateRequirements();
const metrics = generator.generateMetrics();
generator.saveResults('./output');

// From spec object
const generator2 = SwaggerRequirementGenerator.fromSpec(openApiSpec);
```

### SwaggerBatchProcessor Class

```typescript
import { SwaggerBatchProcessor } from '@anand4286/swagger-dashboard';

const processor = new SwaggerBatchProcessor('./specs', './requirements');
const result = await processor.processAllSpecs();

console.log(`Processed ${result.totalApis} APIs`);
console.log(`Generated ${result.totalRequirements} requirements`);
```

### SwaggerServer Class

```typescript
import { SwaggerServer } from '@anand4286/swagger-dashboard';

const server = new SwaggerServer({
  port: 8888,
  openApiDir: './openapi-specs',
  requirementsDir: './requirements'
});

await server.start();
```

## 📊 Generated Output

### Requirements Format

```json
{
  "apiInfo": {
    "title": "User Management API",
    "version": "1.0.0",
    "description": "API for managing users"
  },
  "requirements": [
    {
      "id": "REQ-001",
      "category": "CRUD Operations",
      "priority": "HIGH",
      "description": "Should create new user with valid data and proper validation",
      "endpoint": "POST /users",
      "method": "POST",
      "testCases": ["TC-001", "TC-002", "TC-003"]
    }
  ],
  "metrics": {
    "totalEndpoints": 12,
    "totalRequirements": 15,
    "totalTestCases": 45,
    "endpointsByMethod": { "GET": 6, "POST": 3, "PUT": 2, "DELETE": 1 },
    "requirementsByCategory": { "CRUD Operations": 8, "Authentication": 4 },
    "testCasesByPriority": { "HIGH": 20, "MEDIUM": 15, "LOW": 10 }
  }
}
```

### Test Cases Format

```json
{
  "testCases": [
    {
      "id": "TC-001",
      "requirementId": "REQ-001",
      "name": "POST /users - Valid Request",
      "description": "Test POST /users with valid data and authentication",
      "method": "POST",
      "endpoint": "/users",
      "expectedStatus": 201,
      "category": "CRUD Operations",
      "priority": "HIGH",
      "testData": {
        "body": {
          "name": "Test User",
          "email": "test@example.com"
        }
      }
    }
  ]
}
```

## 🌐 Dashboard Features

### Interactive Web Interface
- **API Selection**: Dropdown to choose from available APIs
- **Real-time Metrics**: Visual charts and statistics
- **Requirements Matrix**: Detailed breakdown of all requirements
- **Export Capabilities**: Download requirements and test cases

### REST API Endpoints
- `GET /api/swagger/available` - List all available APIs
- `GET /api/swagger/{apiId}/info` - Get API information
- `GET /api/swagger/{apiId}/requirements` - Get generated requirements
- `GET /api/swagger/{apiId}/test-cases` - Get generated test cases
- `GET /api/swagger/{apiId}/metrics` - Get API metrics
- `GET /health` - Server health check

## 🔧 Configuration

### Environment Variables

```bash
PORT=8888                          # Server port
OPENAPI_DIR=./openapi-specs        # OpenAPI specs directory
REQUIREMENTS_DIR=./requirements    # Output directory
ENABLE_CORS=true                   # Enable CORS
LOG_LEVEL=info                     # Logging level
```

### Configuration Object

```typescript
interface DashboardConfig {
  port?: number;                   // Default: 8888
  openApiDir?: string;            // Default: './openapi-specs'
  requirementsDir?: string;       // Default: './requirements'
  enableCors?: boolean;           // Default: true
  logLevel?: 'debug' | 'info' | 'warn' | 'error'; // Default: 'info'
}
```

## 🏗️ Enterprise Usage

### CI/CD Integration

```yaml
# GitHub Actions example
name: API Testing Requirements
on: [push]
jobs:
  generate-requirements:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g @anand4286/swagger-dashboard
      - run: swagger-batch ./openapi-specs ./requirements
      - run: swagger-dashboard start --no-process --port 8888 &
      - run: curl http://localhost:8888/health
```

### Docker Usage

```dockerfile
FROM node:16
WORKDIR /app
RUN npm install -g @anand4286/swagger-dashboard
COPY openapi-specs/ ./openapi-specs/
RUN swagger-batch ./openapi-specs ./requirements
EXPOSE 8888
CMD ["swagger-dashboard", "start", "--no-process"]
```

### Bulk Processing Script

```bash
#!/bin/bash
# Process multiple API directories
for dir in team-a team-b team-c; do
  swagger-batch ./specs/$dir ./requirements/$dir
done

# Start dashboard with all results
swagger-dashboard start --port 8888
```

## 🎯 Use Cases

### For Development Teams
1. **API-First Development**: Generate test requirements during API design
2. **Documentation Validation**: Ensure OpenAPI specs are complete
3. **Test Planning**: Get comprehensive test coverage plans automatically

### For QA Teams
1. **Automated Test Case Generation**: Create test scenarios from API specs
2. **Coverage Analysis**: Understand test coverage across API portfolios
3. **Requirement Traceability**: Map tests back to API specifications

### For DevOps Teams
1. **CI/CD Integration**: Automate requirement generation in pipelines
2. **API Portfolio Management**: Monitor testing coverage across all APIs
3. **Quality Gates**: Enforce testing standards before deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/anand4286/swagger-dashboard/issues)
- **Documentation**: [Full Documentation](https://github.com/anand4286/swagger-dashboard#readme)
- **Examples**: See `examples/` directory in the repository

---

## 🎉 Quick Examples

### Basic Usage
```bash
# Install globally
npm install -g @anand4286/swagger-dashboard

# Add your OpenAPI specs to ./openapi-specs/
# Run the dashboard
swagger-dashboard

# Open http://localhost:8888
```

### Advanced Usage
```typescript
import { SwaggerDashboard } from '@anand4286/swagger-dashboard';

// Custom configuration
const dashboard = await SwaggerDashboard.quickStart({
  openApiDir: './my-apis',
  outputDir: './generated-tests',
  port: 9000
});

console.log('Dashboard running on http://localhost:9000');
```

**Transform your OpenAPI specifications into comprehensive testing frameworks in seconds!** 🚀
