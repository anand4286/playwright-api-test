# 🚀 API Test Generator - Quick Usage Guide

## 🎉 **NEW: Auto-Detection Features!**

### ⚡ **Simplest Usage - Zero Configuration**
```bash
# 🎯 Auto-detect and process ALL OpenAPI specs in current folder
node dist/cli.js auto

# 🎯 Same result with generate command
node dist/cli.js generate

# 🎯 With custom output folder
node dist/cli.js auto -o my-tests

# 🎯 Open results in browser
node dist/cli.js auto --open
```

### 🔍 **How Auto-Detection Works**
- Scans current folder for `*.json`, `*.yaml`, `*.yml` files
- Intelligently identifies OpenAPI/Swagger specs
- Excludes `package.json`, `tsconfig.json`, etc.
- Processes all detected specs automatically

## ✅ Traditional Commands (Still Work)

Your API Test Generator is working perfectly! Here are all the commands:

### 📋 Specific File Commands

```bash
# Petstore API (existing)
node dist/cli.js generate -s petstore.json -o generated-tests

# User Management API (copied from main project)
node dist/cli.js generate -s user-api.json -o user-tests

# Add your own API spec
cp /path/to/your-api.json ./my-api.json
node dist/cli.js generate -s my-api.json -o my-tests

# From URL
node dist/cli.js generate -u https://petstore.swagger.io/v2/swagger.json -o url-tests
```

### 🎯 What Gets Generated

For each API spec, you get:

```
output-directory/
├── tests/                    # 🧪 Playwright test files
│   ├── pet.spec.ts          # Generated test suites
│   ├── user.spec.ts
│   └── setup.ts             # Test configuration
├── playwright.config.ts      # 🔧 Playwright configuration
├── traceability-matrix.html  # 📊 Requirements coverage
├── traceability-coverage.json # 📈 Coverage data
├── flow-diagrams.html        # 🌊 API flow visualization
└── coverage-report.md        # 📋 Summary report
```

### 🚀 Quick Commands

```bash
# 🎯 EASIEST: Auto-detect everything
node dist/cli.js auto

# Generate tests for Petstore API specifically
npm run build
node dist/cli.js generate -s petstore.json -o petstore-tests

# Generate tests for User API specifically
node dist/cli.js generate -s user-api.json -o user-tests

# Run the generated tests
cd petstore-tests  # or any generated folder
npm install
npx playwright test

# View generated reports
open traceability-matrix.html
open flow-diagrams.html
```

### 📁 Adding Your Own API Specs

```bash
# Copy your OpenAPI spec to this directory
cp /path/to/your-openapi-spec.json ./my-api.json

# Or create a symbolic link
ln -s /path/to/your-spec.json ./my-api.json

# Generate tests
node dist/cli.js generate -s my-api.json -o my-api-tests
```

### 🔧 CLI Options

```bash
# Basic usage
node dist/cli.js generate -s <spec-file> -o <output-dir>

# Help
node dist/cli.js --help
node dist/cli.js generate --help
```

### 📊 Generated Test Results

**Petstore API:**
- ✅ Generated 3 test files
- ✅ Generated traceability matrix
- ✅ Generated 1 flow diagram
- ✅ Generated documentation

**User Management API:**
- ✅ Generated 2 test files  
- ✅ Generated traceability matrix
- ✅ Generated 1 flow diagram
- ✅ Generated documentation

### 🎯 Next Steps

1. **Explore Generated Tests**: Check `generated-tests/tests/` directory
2. **View Coverage Reports**: Open `traceability-matrix.html` in browser
3. **See API Flows**: Open `flow-diagrams.html` for visual documentation
4. **Run Tests**: Follow Playwright test execution in generated directories
5. **Add Your APIs**: Copy your OpenAPI specs and generate custom tests

### 🔍 Troubleshooting

**"OpenAPI spec file not found"**
- ✅ Ensure the file exists in current directory
- ✅ Use relative or absolute path to spec file
- ✅ Check file extension (.json, .yaml, .yml)

**"Generation failed"**
- ✅ Validate OpenAPI spec format
- ✅ Check file permissions
- ✅ Ensure output directory is writable

### 📋 Available Specs in This Directory

```bash
ls -la *.json
# petstore.json      - Swagger Petstore API (13KB)
# user-api.json      - User Management API (copied)
# package.json       - Project configuration
```

Ready to generate comprehensive API tests from any OpenAPI specification! 🎉
