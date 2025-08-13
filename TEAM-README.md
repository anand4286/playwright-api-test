# 🚀 Swagger Dashboard - Universal OpenAPI Testing Framework

> **Transform any OpenAPI specification into comprehensive test requirements in seconds!**

A powerful, enterprise-ready tool that automatically generates test requirements, test cases, and provides an interactive dashboard for managing API portfolios of any size.

## 🎯 What This Does for Your Team

- **📋 Instant Test Requirements**: Upload OpenAPI specs → Get comprehensive test requirements automatically
- **🧪 Test Case Generation**: Automatically creates positive, negative, and edge case scenarios
- **📊 Interactive Dashboard**: Beautiful web interface to explore APIs and requirements
- **⚡ Batch Processing**: Handle 100+ API specifications at once
- **🔗 Team Collaboration**: Share requirements across development and QA teams

## 🚀 Quick Start (2 Minutes)

### Option 1: Use the Standalone Package (Recommended)

```bash
# 1. Navigate to the standalone package
cd swagger-dashboard-standalone

# 2. Install and setup (one-time)
./setup.sh

# 3. Add your OpenAPI specs
mkdir openapi-specs
cp your-api.json openapi-specs/

# 4. Generate requirements and start dashboard
swagger-dashboard quick-start

# 5. Open your browser
# http://localhost:8888
```

### Option 2: Use the Integrated Version

```bash
# 1. Clone this repository
git clone <this-repo>
cd playwright-api-test

# 2. Install dependencies
npm install

# 3. Add your OpenAPI specs to openapi-specs/ directory
cp your-api.json openapi-specs/

# 4. Process all APIs and start dashboard
npm run swagger:process-all

# 5. Open http://localhost:8888
```

## 📁 Where to Put Your API Specs

```
openapi-specs/
├── user-api.json          # ✅ Supported
├── product-api.yaml       # ✅ Supported  
├── payment-api.yml        # ✅ Supported
├── auth-service.json      # ✅ Supported
└── team-folder/
    ├── internal-api.yaml  # ✅ Supported
    └── legacy-api.json    # ✅ Supported
```

**Supported Formats**: JSON, YAML, YML (OpenAPI 2.0/3.0)

## 🎯 What You'll Get

### 📋 Automatic Test Requirements
- **CRUD Operations**: Create, Read, Update, Delete scenarios
- **Authentication**: Login, token validation, authorization checks
- **Data Validation**: Input validation, error handling, edge cases
- **Security Testing**: Unauthorized access, invalid tokens
- **Performance**: Load testing scenarios

### 🧪 Generated Test Cases
- **Positive Tests**: Valid data, expected success scenarios
- **Negative Tests**: Invalid data, error conditions
- **Security Tests**: Authentication failures, unauthorized access
- **Edge Cases**: Boundary values, null data, malformed requests

### 📊 Interactive Dashboard
- **API Selection**: Choose from all your uploaded APIs
- **Visual Metrics**: Charts showing coverage and distribution
- **Requirements Matrix**: Detailed breakdown of all test scenarios
- **Export Options**: Download requirements for implementation

## 📊 Example Output

For a simple User API, you'll get:

**✅ 6 Requirements Generated**
- REQ-001: Create user with valid data (HIGH priority)
- REQ-002: Retrieve user by ID (MEDIUM priority)  
- REQ-003: Update user information (MEDIUM priority)
- REQ-004: Delete user account (HIGH priority)
- REQ-005: Handle authentication (HIGH priority)
- REQ-006: Validate input data (MEDIUM priority)

**✅ 18 Test Cases Generated**
- 6 Positive test scenarios
- 8 Negative test scenarios  
- 4 Security test scenarios

## 🛠️ Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run swagger:process-all` | Process all APIs + start dashboard | First time setup |
| `npm run swagger:batch` | Process APIs only | Generate requirements only |
| `npm run swagger-dashboard` | Start dashboard only | View existing requirements |
| `swagger-dashboard quick-start` | One-command setup (standalone) | Easiest option |

## 👥 Team Workflows

### For **Developers**
1. **API Design**: Upload OpenAPI spec during development
2. **Review Requirements**: Use dashboard to validate API coverage
3. **Share with QA**: Export requirements for test implementation

### For **QA Engineers**  
1. **Import Specs**: Add OpenAPI specifications to the system
2. **Review Test Requirements**: Analyze generated test scenarios
3. **Implement Tests**: Use generated test cases as implementation guide
4. **Track Coverage**: Monitor testing across API portfolio

### For **Product Managers**
1. **Portfolio Overview**: See all APIs in one dashboard
2. **Coverage Analysis**: Understand testing scope across products
3. **Quality Metrics**: Track test requirement completeness

## 🔧 Customization Options

### Change Server Port
```bash
# Standalone version
swagger-dashboard start --port 9000

# Integrated version  
PORT=9000 npm run swagger-dashboard
```

### Custom Directories
```bash
# Standalone version
swagger-dashboard quick-start --input ./my-specs --output ./my-requirements

# Integrated version
swagger-batch ./my-specs ./my-requirements
```

## 📊 Real Examples (Included)

The repository includes 3 working examples:

1. **Blog Management API** (Swagger 2.0) - 8 requirements, 24 test cases
2. **E-commerce API** (OpenAPI 3.0 YAML) - 7 requirements, 21 test cases  
3. **User Management API** (OpenAPI 3.0 JSON) - 6 requirements, 18 test cases

**Total**: 21 requirements, 63 test cases generated automatically!

## 🚨 Troubleshooting

### "No APIs found"
- ✅ Check that OpenAPI specs are in `openapi-specs/` directory
- ✅ Verify file formats are .json, .yaml, or .yml
- ✅ Ensure files are valid OpenAPI format

### "Dashboard shows empty"
- ✅ Run batch processing first: `npm run swagger:batch`
- ✅ Check that requirements were generated in `requirements/` directory
- ✅ Refresh the browser page

### "Port already in use"
- ✅ Change port: `PORT=9000 npm run swagger-dashboard`
- ✅ Or kill existing process: `lsof -ti:8888 | xargs kill`

### "Cannot find module"
- ✅ Run `npm install` in project root
- ✅ For standalone: run `./setup.sh` in `swagger-dashboard-standalone/`

## 🎯 Next Steps After Setup

1. **✅ Verify Dashboard**: Open http://localhost:8888 and select an API
2. **📋 Review Requirements**: Check generated requirements for completeness  
3. **🧪 Implement Tests**: Use generated test cases in your testing framework
4. **👥 Share with Team**: Show dashboard to stakeholders
5. **🔄 Iterate**: Add more APIs and regenerate requirements

## 🏢 Enterprise Features

- **📈 Scalable**: Tested with 100+ API specifications
- **🔗 CI/CD Ready**: CLI tools for automation pipelines
- **👥 Multi-team**: Separate directories for different teams
- **📊 Analytics**: Comprehensive metrics and reporting
- **🔒 Secure**: No external dependencies, runs locally

## 🤝 Getting Help

### Quick Questions
- Check the troubleshooting section above
- Review the generated example APIs for reference patterns

### Issues or Suggestions  
- Create an issue in this repository
- Include your OpenAPI spec (sanitized) if there are processing errors
- Mention which command you were running

### Team Training
- Schedule a demo session using the included examples
- Walk through the dashboard features together
- Review generated requirements for your actual APIs

---

## 🎉 Ready to Try?

**Choose your preferred method:**

### 🚀 **Quick & Easy (Standalone)**
```bash
cd swagger-dashboard-standalone
./setup.sh
cp your-api.json openapi-specs/
swagger-dashboard quick-start
```

### 🔧 **Full Integration**  
```bash
npm install
cp your-api.json openapi-specs/
npm run swagger:process-all
```

### 🧪 **Just Testing**
```bash
npm run swagger-dashboard
# Uses the included example APIs
```

**Open http://localhost:8888 and explore your API requirements!** 🎯

---

*Transform your API specifications into comprehensive testing frameworks in under 2 minutes!* ⚡
