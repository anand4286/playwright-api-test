# 🎭 Playwright API Test Generator

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/microsoft/playwright/tree/main/tools/api-test-generator)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A comprehensive tool for generating **Playwright API tests**, **requirement traceability matrices**, and **interactive visual flow diagrams** from OpenAPI specifications. Perfect for bridging the gap between business requirements and technical implementation.

## 🌟 Features

### 🧪 **Automated Test Generation**
- Generate complete Playwright test suites from OpenAPI specs
- Support for JSON and YAML OpenAPI formats
- Comprehensive test coverage for all endpoints
- Authentication and parameter handling
- Response validation and error handling

### 📊 **Requirement Traceability Matrix**
- Interactive HTML matrix linking business requirements to technical implementation
- Real-time coverage tracking
- Stakeholder-friendly documentation
- VS Code integration with clickable file links

### 🌊 **Interactive Flow Diagrams**
- **HTML step-based visual workflows** (not Mermaid diagrams)
- Professional glassmorphism design
- Left sidebar navigation
- Responsive mobile-friendly layout
- Module-based flow organization
- CRUD operation visualization

### 🎯 **Business-Technical Bridge**
- Convert technical API specs into business-friendly documentation
- Visual process flows for stakeholders
- Professional reporting for technical and non-technical teams
- Dynamic workspace path detection for portability

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Installation & Setup

#### **🚀 Quick Setup (Automated)**
```bash
# Copy the setup script to your project
curl -O https://raw.githubusercontent.com/microsoft/playwright/main/tools/api-test-generator/setup.sh
chmod +x setup.sh
./setup.sh

# Follow the interactive prompts to choose your preferred setup method
```

#### **Option 1: Copy to Your Project (Recommended for Customization)**
```bash
# Copy the tool to your project
cp -r /path/to/playwright/tools/api-test-generator /your-project/tools/

# Navigate and install dependencies
cd /your-project/tools/api-test-generator
npm install
npm run build

# Generate tests for your API
node dist/cli.js generate -s /your-project/api-spec.json -o /your-project/generated-tests
```

#### **Option 2: Use as Git Submodule (Recommended for Updates)**
```bash
# Add Playwright repo as submodule
cd /your-project
git submodule add https://github.com/microsoft/playwright.git external/playwright
git submodule update --init --recursive

# Setup the tool
cd external/playwright/tools/api-test-generator
npm install
npm run build

# Create symlink for easy access (optional)
ln -s external/playwright/tools/api-test-generator/dist/cli.js bin/api-gen

# Generate tests
./external/playwright/tools/api-test-generator/dist/cli.js generate -s api-spec.json -o generated-tests
```

#### **Option 3: Global Installation (NPM Package)**
```bash
# Install globally (when published to NPM)
npm install -g playwright-api-test-generator

# Use anywhere
playwright-api-gen generate -s api-spec.json -o output
# or
pwtgen generate -s api-spec.json -o output
```

#### **Option 4: Local Development Setup**
```bash
# For development and testing
cd tools/api-test-generator
npm install
npm run build
```

## � Integration with Other Projects

### **Standalone Project Setup**

#### **1. Copy Method (Full Control)**
```bash
# In your project root
mkdir -p tools
cp -r /path/to/playwright/tools/api-test-generator tools/

# Create package.json scripts (add to your existing package.json)
{
  "scripts": {
    "api-gen": "cd tools/api-test-generator && npm run build && node dist/cli.js",
    "api-gen:build": "cd tools/api-test-generator && npm install && npm run build",
    "api-gen:demo": "npm run api-gen demo -o docs/api-demo",
    "api-gen:tests": "npm run api-gen generate -s api-spec.json -o tests/generated"
  }
}

# Usage in your project
npm run api-gen:build     # First time setup
npm run api-gen:tests     # Generate tests
npm run api-gen:demo      # Run demo
```

#### **2. Submodule Method (Stay Updated)**
```bash
# Add submodule
git submodule add https://github.com/microsoft/playwright.git vendor/playwright

# Create wrapper script
cat > scripts/api-gen.sh << 'EOF'
#!/bin/bash
cd vendor/playwright/tools/api-test-generator
npm run build
node dist/cli.js "$@"
EOF

chmod +x scripts/api-gen.sh

# Usage
./scripts/api-gen.sh generate -s api-spec.json -o generated-tests
```

#### **3. Docker Integration**
```dockerfile
# Dockerfile.api-gen
FROM node:18-alpine

WORKDIR /app
COPY tools/api-test-generator/ .
RUN npm install && npm run build

ENTRYPOINT ["node", "dist/cli.js"]
```

```bash
# Build and use
docker build -f Dockerfile.api-gen -t api-test-gen .
docker run -v $(pwd):/workspace api-test-gen generate -s /workspace/api-spec.json -o /workspace/generated
```

### **CI/CD Integration**

#### **GitHub Actions**
```yaml
# .github/workflows/api-tests.yml
name: Generate API Tests
on:
  push:
    paths: ['api-spec.json']

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive  # If using submodule method
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Setup API Test Generator
        run: |
          cd tools/api-test-generator  # or vendor/playwright/tools/api-test-generator
          npm install
          npm run build
      
      - name: Generate Tests
        run: |
          tools/api-test-generator/dist/cli.js generate -s api-spec.json -o tests/generated
      
      - name: Commit Generated Tests
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add tests/generated/
          git commit -m "Auto-generate API tests" || exit 0
          git push
```

#### **GitLab CI**
```yaml
# .gitlab-ci.yml
generate-api-tests:
  stage: test
  image: node:18-alpine
  script:
    - cd tools/api-test-generator
    - npm install
    - npm run build
    - node dist/cli.js generate -s ../../api-spec.json -o ../../tests/generated
  artifacts:
    paths:
      - tests/generated/
    expire_in: 1 week
  only:
    changes:
      - api-spec.json
```

### **Project Structure Examples**

#### **Microservice Project**
```
my-api-project/
├── tools/
│   └── api-test-generator/     # Copied tool
├── specs/
│   ├── user-service.yaml
│   ├── payment-service.json
│   └── notification-service.yaml
├── generated-tests/
│   ├── user-service/
│   ├── payment-service/
│   └── notification-service/
├── docs/
│   ├── api-flows/
│   └── traceability/
└── package.json
```

#### **Monorepo Structure**
```
company-apis/
├── tools/
│   └── api-test-generator/
├── services/
│   ├── user-api/
│   │   ├── spec.yaml
│   │   └── generated-tests/
│   ├── payment-api/
│   │   ├── spec.json
│   │   └── generated-tests/
│   └── shared/
│       └── test-utils/
└── scripts/
    └── generate-all-tests.sh
```

### **Multi-API Generation Script**
```bash
#!/bin/bash
# scripts/generate-all-apis.sh

APIs=(
  "user-service:specs/user-api.yaml:tests/user"
  "payment-service:specs/payment-api.json:tests/payment"
  "notification-service:specs/notification-api.yaml:tests/notification"
)

for api in "${APIs[@]}"; do
  IFS=':' read -r name spec output <<< "$api"
  echo "Generating tests for $name..."
  
  tools/api-test-generator/dist/cli.js generate \
    -s "$spec" \
    -o "$output" \
    --open
done

echo "All API tests generated successfully!"
```

### Basic Commands

#### **Generate from OpenAPI Spec File**
```bash
# JSON format
node dist/cli.js generate -s path/to/spec.json -o output/directory

# YAML format  
node dist/cli.js generate -s path/to/spec.yaml -o output/directory
```

#### **Generate from OpenAPI URL**
```bash
node dist/cli.js generate -u https://api.example.com/openapi.json -o output/directory
```

#### **Quick Demo with Petstore API**
```bash
node dist/cli.js demo -o output/petstore-demo
```

### Advanced Options

#### **Skip Specific Generations**
```bash
# Skip test generation
node dist/cli.js generate -s spec.json -o output --no-tests

# Skip documentation generation
node dist/cli.js generate -s spec.json -o output --no-docs

# Generate only flow diagrams
node dist/cli.js generate -s spec.json -o output --no-tests --no-docs
```

#### **Auto-open Documentation**
```bash
node dist/cli.js generate -s spec.json -o output --open
```

#### **Development Server**
```bash
# Start development server on http://localhost:3000
node dist/cli.js serve -p 3000 -d output/directory
```

### NPM Scripts
```bash
# Build the project
npm run build

# Generate with default Petstore demo
npm run generate

# Start development mode (watch for changes)
npm run dev

# Run tests
npm run test

# Serve generated documentation
npm run serve
```

## 📁 Project Structure

```
api-test-generator/
├── src/
│   ├── generators/           # Code generators
│   │   ├── testGenerator.ts     # Playwright test generation
│   │   ├── flowGenerator.ts     # HTML flow diagrams
│   │   ├── traceabilityGenerator.ts # Requirement matrix
│   │   └── docGenerator.ts      # Documentation
│   ├── types.ts             # TypeScript interfaces
│   ├── generator.ts         # Main orchestration
│   ├── cli.ts              # Command-line interface
│   └── server.ts           # Development server
├── test-specs/             # Sample OpenAPI specifications
├── output/                 # Generated files
├── demo-output/           # Demo examples
└── README.md
```

## 🎯 Generated Output

For each OpenAPI specification, the tool generates:

### **📂 Generated Directory Structure**
```
output/
├── tests/                    # Playwright test files
│   ├── users.spec.ts
│   ├── posts.spec.ts
│   └── ...
├── flow-diagrams.html       # Interactive visual workflows
├── traceability-matrix.html # Requirement tracking
├── documentation.html       # API documentation
└── reports/                 # Additional reports
```

### **🧪 Test Files**
- Complete Playwright test suites
- Authentication handling
- Parameter validation
- Response assertions
- Error scenario coverage

### **📊 Flow Diagrams**
- Interactive HTML step-based workflows
- Left sidebar navigation
- Professional glassmorphism design
- Module-based organization
- CRUD operation flows
- Mobile-responsive layout

### **📋 Traceability Matrix**
- Business requirement to implementation mapping
- Real-time coverage tracking
- VS Code integration links
- Stakeholder-friendly format

## 🔧 Supported APIs

The tool has been validated with diverse API types:

### **🐾 E-commerce (Petstore)**
```bash
node dist/cli.js generate -u https://petstore.swagger.io/v2/swagger.json -o output/petstore
```

### **🤝 Social Media Platform**
```bash
node dist/cli.js generate -s test-specs/social-media-api.json -o output/social
```

### **🏦 Digital Banking**
```bash
node dist/cli.js generate -s test-specs/banking-api.yaml -o output/banking
```

### **📱 IoT Device Management**
```bash
node dist/cli.js generate -s test-specs/iot-device-api.yaml -o output/iot
```

## 🎨 Flow Diagram Features

### **Visual Step Boxes**
- **Step Icons:** Dynamic icons based on HTTP methods
- **Step Titles:** Clear endpoint descriptions
- **Step Descriptions:** Business-friendly explanations
- **API Badges:** Method type indicators
- **Parameter Lists:** Required/optional parameter details

### **Interactive Navigation**
- **API Overview:** System-wide module view
- **Module Flows:** Individual workflow sections
- **CRUD Operations:** Organized by operation type
- **Statistics Panel:** Real-time API metrics

### **Professional Design**
- Glassmorphism UI with backdrop blur effects
- Smooth animations and hover transitions
- Color-coded step types (Start/Process/End)
- Responsive grid layout
- Mobile-friendly navigation

## 🔍 Command Reference

### **Generate Command**
```bash
node dist/cli.js generate [options]

Options:
  -s, --spec <path>    Path to OpenAPI spec file (JSON or YAML)
  -u, --url <url>      URL to OpenAPI spec
  -o, --output <path>  Output directory (default: "./generated")
  --no-tests           Skip test generation
  --no-docs            Skip documentation generation
  --open               Open generated documentation in browser
  -h, --help           Display help for command
```

### **Demo Command**
```bash
node dist/cli.js demo [options]

Options:
  -o, --output <path>  Output directory (default: "./demo-output")
  --open               Open generated documentation in browser
  -h, --help           Display help for command
```

### **Serve Command**
```bash
node dist/cli.js serve [options]

Options:
  -p, --port <number>  Port number (default: 3000)
  -d, --dir <path>     Directory to serve (default: "./generated")
  --open               Open browser automatically
  -h, --help           Display help for command
```

## 🛠️ Development

### **Building the Project**
```bash
npm run build
```

### **Development Mode**
```bash
npm run dev  # Watch mode with auto-rebuild
```

### **Testing**
```bash
npm run test  # Run with Petstore API
```

### **Custom API Testing**
```bash
# Test with your own API
node dist/cli.js generate -s your-api-spec.json -o test-output --open
```

## 🎯 Use Cases

### **For QA Teams**
- Generate comprehensive test suites automatically
- Ensure API endpoint coverage
- Validate request/response schemas
- Test error scenarios and edge cases

### **For Business Analysts**
- Visual workflow documentation
- Requirement traceability tracking
- Stakeholder-friendly API documentation
- Business process flow visualization

### **For Development Teams**
- API specification validation
- Automated test generation
- Documentation generation
- Integration testing setup

### **For Technical Writers**
- Professional API documentation
- Visual flow diagrams
- Interactive specification browsers
- Requirement mapping documents

## 📈 Example Outputs

### **Flow Diagrams Preview**
The generated flow diagrams feature:
- 🎨 Professional glassmorphism design
- 📱 Mobile-responsive layout
- 🔄 Interactive step-based workflows
- 📊 Real-time statistics
- 🎯 Business-friendly descriptions

### **Test Coverage**
Generated tests include:
- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ Authentication handling
- ✅ Parameter validation (path, query, header, body)
- ✅ Response validation (status codes, schemas)
- ✅ Error scenario testing
- ✅ Edge case coverage

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of [Microsoft Playwright](https://playwright.dev/)
- OpenAPI specification parsing via [@apidevtools/swagger-parser](https://github.com/APIDevTools/swagger-parser)
- Professional UI design with modern web standards
- Comprehensive API testing methodology

---

**🎭 Playwright API Test Generator** - Bridging the gap between business requirements and technical implementation through automated testing, visual workflows, and comprehensive documentation.
