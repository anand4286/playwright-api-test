# Swagger Dashboard - Universal OpenAPI Testing Framework

A comprehensive, scalable testing framework that can automatically generate test requirements and run API tests for any OpenAPI specification. Designed to handle 100+ APIs with an intuitive dashboard interface.

## 🚀 Features

- **Universal OpenAPI Support**: Works with any valid OpenAPI 2.0/3.0 specification
- **Automatic Requirement Generation**: Creates comprehensive test requirements from API specs
- **Multi-API Dashboard**: Interactive web interface to manage multiple APIs
- **Batch Processing**: Process hundreds of OpenAPI specs at once
- **Comprehensive Reporting**: Detailed metrics and test coverage analysis
- **Enterprise Ready**: Scalable architecture for large API portfolios

## 📁 Directory Structure

```
swagger-dashboard/
├── swagger-dashboard.html      # Multi-API dashboard interface
├── swagger-server.ts          # Express server for API management
├── swagger-requirement-generator.ts  # Universal requirement generator
├── batch-processor.ts         # Batch processing tool
└── README.md                  # This documentation

openapi-specs/                 # Place your OpenAPI specs here
├── api1.json
├── api2.yaml
└── api3.yml

requirements/                  # Generated requirements output
├── api1-requirements.json
├── api2-requirements.json
└── batch-processing-summary.json
```

## 🛠️ Quick Start

### 1. Add OpenAPI Specifications

Place your OpenAPI specification files (JSON, YAML, or YML) in the `openapi-specs/` directory:

```bash
# Create the openapi-specs directory if it doesn't exist
mkdir -p openapi-specs

# Add your OpenAPI specs
cp your-api.json openapi-specs/
cp another-api.yaml openapi-specs/
```

### 2. Generate Requirements for All APIs

Process all OpenAPI specs and generate requirements:

```bash
npm run swagger:batch
```

This will:
- Scan the `openapi-specs/` directory for all OpenAPI files
- Generate comprehensive test requirements for each API
- Create a batch processing summary report
- Save all requirements to the `requirements/` directory

### 3. Start the Dashboard

Launch the multi-API dashboard:

```bash
npm run swagger-dashboard
```

The dashboard will be available at: **http://localhost:8888**

### 4. Use the Dashboard

1. Open http://localhost:8888 in your browser
2. Select an API from the dropdown menu
3. View generated requirements and metrics
4. Analyze test coverage and endpoint categorization
5. Download requirements for test implementation

## 🎯 Available Commands

| Command | Description |
|---------|-------------|
| `npm run swagger-dashboard` | Start the multi-API dashboard server |
| `npm run swagger:generate [spec-file]` | Generate requirements for a single API |
| `npm run swagger:batch [input-dir] [output-dir]` | Process all APIs in bulk |
| `npm run swagger:process-all` | Run batch processing + start dashboard |

## 📊 Dashboard Features

### API Selection
- Dropdown menu with all available APIs
- Real-time API discovery from `openapi-specs/` directory
- Support for JSON, YAML, and YML formats

### Metrics Overview
- Total endpoints count
- Test requirements generated
- Coverage by HTTP method
- Security requirements analysis

### Interactive Visualizations
- Endpoint distribution by category
- HTTP method coverage charts
- Security scheme analysis
- Response code coverage

### Requirements Matrix
- Detailed test case breakdown
- Requirement categorization (CRUD, Auth, Validation, etc.)
- Priority-based test planning
- Export capabilities

## 🔧 Advanced Usage

### Custom OpenAPI Directory

Process specs from a custom directory:

```bash
npx tsx swagger-dashboard/batch-processor.ts ./my-custom-specs ./my-requirements
```

### Single API Processing

Generate requirements for a specific API:

```bash
npx tsx swagger-dashboard/swagger-requirement-generator.ts ./openapi-specs/petstore.json
```

### Environment Configuration

The server supports environment-based configuration:

```bash
PORT=9000 npm run swagger-dashboard  # Run on port 9000
DEBUG=true npm run swagger-dashboard # Enable debug logging
```

## 📋 Generated Requirements Format

Each API generates comprehensive requirements including:

### Functional Requirements
- CRUD operations for all endpoints
- Authentication and authorization
- Input validation and error handling
- Business logic verification

### Non-Functional Requirements
- Performance testing scenarios
- Security testing requirements
- Data validation rules
- Edge case handling

### Test Cases
- Positive test scenarios
- Negative test scenarios
- Boundary value testing
- Security test cases

### Example Output Structure

```json
{
  "apiInfo": {
    "title": "Petstore API",
    "version": "1.0.0",
    "baseUrl": "https://petstore.swagger.io/v2"
  },
  "requirements": [
    {
      "id": "REQ-001",
      "category": "CRUD Operations",
      "priority": "HIGH",
      "description": "Should create a new pet with valid data",
      "endpoint": "POST /pet",
      "testCases": [...]
    }
  ],
  "testCases": [...],
  "metrics": {
    "totalEndpoints": 20,
    "totalRequirements": 45,
    "totalTestCases": 120
  }
}
```

## 🏗️ Architecture

### Component Overview

1. **SwaggerRequirementGenerator**: Core class for processing OpenAPI specs
2. **Express Server**: REST API for dashboard integration
3. **Batch Processor**: CLI tool for bulk operations
4. **Dashboard Interface**: Web UI for multi-API management

### API Endpoints

The dashboard server provides these REST endpoints:

- `GET /api/swagger/available` - List all available APIs
- `GET /api/swagger/{apiId}/info` - Get API information
- `GET /api/swagger/{apiId}/requirements` - Get generated requirements
- `GET /api/swagger/{apiId}/metrics` - Get API metrics
- `GET /health` - Server health check

### Data Flow

1. OpenAPI specs placed in `openapi-specs/`
2. Batch processor generates requirements
3. Dashboard server serves requirements via REST API
4. Web interface displays interactive analytics

## 🔍 Troubleshooting

### Common Issues

**No APIs found in dashboard:**
- Ensure OpenAPI specs are in `openapi-specs/` directory
- Check file formats (JSON, YAML, YML only)
- Verify spec files are valid OpenAPI format

**Server won't start:**
- Check if port 8888 is available
- Try a different port: `PORT=9000 npm run swagger-dashboard`
- Verify Node.js and npm dependencies

**Batch processing fails:**
- Check OpenAPI spec validity
- Ensure write permissions to `requirements/` directory
- Review error messages in console output

### Debug Mode

Enable detailed logging:

```bash
DEBUG=true npm run swagger-dashboard
```

## 🚀 Enterprise Deployment

### Scaling for 100+ APIs

1. **Directory Organization**:
   ```
   openapi-specs/
   ├── team-a/
   ├── team-b/
   └── legacy/
   ```

2. **Batch Processing Strategy**:
   ```bash
   # Process by team
   npm run swagger:batch ./openapi-specs/team-a ./requirements/team-a
   npm run swagger:batch ./openapi-specs/team-b ./requirements/team-b
   ```

3. **Automated Pipeline Integration**:
   ```bash
   # In CI/CD pipeline
   npm run swagger:process-all
   npm run test  # Run generated tests
   ```

### Performance Optimization

- Use SSD storage for large spec collections
- Implement spec caching for faster startup
- Consider containerization for distributed deployment

## 🤝 Contributing

1. Add your OpenAPI specs to `openapi-specs/`
2. Run batch processing to generate requirements
3. Use the dashboard to verify output
4. Submit feedback or improvements

## 📝 License

MIT License - see LICENSE file for details

---

## 🎯 Next Steps After Setup

1. **Add Your APIs**: Copy OpenAPI specs to `openapi-specs/`
2. **Generate Requirements**: Run `npm run swagger:batch`
3. **Start Dashboard**: Run `npm run swagger-dashboard`
4. **Explore APIs**: Open http://localhost:8888
5. **Generate Tests**: Use requirements to create actual test implementations

The Swagger Dashboard provides a foundation for comprehensive API testing across your entire API portfolio!
