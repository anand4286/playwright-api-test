#!/bin/bash

# 🎭 Playwright API Test Generator Setup Script
# This script helps you integrate the API Test Generator into your project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log_error "This script must be run from the root of a git repository"
    exit 1
fi

# Get the current directory
PROJECT_ROOT=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_ROOT")

log_info "Setting up Playwright API Test Generator for: $PROJECT_NAME"

# Ask user for setup method
echo
echo "Choose setup method:"
echo "1) Copy tool to your project (recommended for customization)"
echo "2) Add as git submodule (recommended for updates)"
echo "3) Create integration scripts only"
echo
read -p "Enter choice (1-3): " SETUP_METHOD

case $SETUP_METHOD in
    1)
        log_info "Setting up using copy method..."
        
        # Create tools directory
        mkdir -p tools
        
        # Ask for source path
        echo
        read -p "Enter path to playwright repository (or press Enter for default): " PLAYWRIGHT_PATH
        if [ -z "$PLAYWRIGHT_PATH" ]; then
            PLAYWRIGHT_PATH="$HOME/github/playwright"
        fi
        
        if [ ! -d "$PLAYWRIGHT_PATH/tools/api-test-generator" ]; then
            log_error "API Test Generator not found at: $PLAYWRIGHT_PATH/tools/api-test-generator"
            log_info "Please clone the playwright repository first or provide correct path"
            exit 1
        fi
        
        # Copy the tool
        log_info "Copying API Test Generator..."
        cp -r "$PLAYWRIGHT_PATH/tools/api-test-generator" tools/
        
        # Install dependencies
        log_info "Installing dependencies..."
        cd tools/api-test-generator
        npm install
        npm run build
        cd "$PROJECT_ROOT"
        
        log_success "Tool copied and built successfully!"
        ;;
        
    2)
        log_info "Setting up using git submodule method..."
        
        # Add submodule
        log_info "Adding playwright as submodule..."
        git submodule add https://github.com/microsoft/playwright.git vendor/playwright
        git submodule update --init --recursive
        
        # Install dependencies
        log_info "Installing dependencies..."
        cd vendor/playwright/tools/api-test-generator
        npm install
        npm run build
        cd "$PROJECT_ROOT"
        
        # Create wrapper script
        mkdir -p scripts
        cat > scripts/api-gen.sh << 'EOF'
#!/bin/bash
cd vendor/playwright/tools/api-test-generator
npm run build 2>/dev/null || true
node dist/cli.js "$@"
EOF
        chmod +x scripts/api-gen.sh
        
        log_success "Submodule setup complete!"
        ;;
        
    3)
        log_info "Creating integration scripts only..."
        mkdir -p scripts
        ;;
        
    *)
        log_error "Invalid choice"
        exit 1
        ;;
esac

# Create package.json scripts
if [ -f "package.json" ]; then
    log_info "Adding npm scripts to package.json..."
    
    # Backup package.json
    cp package.json package.json.backup
    
    # Add scripts based on setup method
    case $SETUP_METHOD in
        1)
            # Copy method scripts
            cat > temp_scripts.json << 'EOF'
{
  "api-gen": "cd tools/api-test-generator && node dist/cli.js",
  "api-gen:build": "cd tools/api-test-generator && npm install && npm run build",
  "api-gen:demo": "npm run api-gen demo -o docs/api-demo",
  "api-gen:tests": "npm run api-gen generate -s api-spec.json -o tests/generated",
  "api-gen:serve": "npm run api-gen serve -d tests/generated"
}
EOF
            ;;
        2|3)
            # Submodule method scripts
            cat > temp_scripts.json << 'EOF'
{
  "api-gen": "./scripts/api-gen.sh",
  "api-gen:demo": "./scripts/api-gen.sh demo -o docs/api-demo",
  "api-gen:tests": "./scripts/api-gen.sh generate -s api-spec.json -o tests/generated",
  "api-gen:serve": "./scripts/api-gen.sh serve -d tests/generated"
}
EOF
            ;;
    esac
    
    log_warning "Package.json backup created as package.json.backup"
    log_info "Please manually add the scripts from temp_scripts.json to your package.json"
    log_info "Scripts file created: temp_scripts.json"
else
    log_warning "No package.json found. You can run the tool directly."
fi

# Create example API spec if none exists
if [ ! -f "api-spec.json" ] && [ ! -f "api-spec.yaml" ]; then
    log_info "Creating example API specification..."
    cat > api-spec.json << 'EOF'
{
  "openapi": "3.0.0",
  "info": {
    "title": "Example API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "Get all users",
        "responses": {
          "200": {
            "description": "List of users"
          }
        }
      }
    }
  }
}
EOF
    log_success "Example API spec created: api-spec.json"
fi

# Create directories
mkdir -p tests/generated
mkdir -p docs/api-flows

# Create .gitignore entries
if [ -f ".gitignore" ]; then
    if ! grep -q "tests/generated" .gitignore; then
        echo -e "\n# Generated API tests\ntests/generated/\ndocs/api-flows/" >> .gitignore
        log_success "Added generated files to .gitignore"
    fi
fi

# Create usage instructions
cat > API_TEST_GENERATOR_USAGE.md << EOF
# 🎭 API Test Generator Usage

This project is set up with the Playwright API Test Generator.

## Quick Start

### Generate Tests
\`\`\`bash
$(case $SETUP_METHOD in
    1) echo "npm run api-gen:tests" ;;
    2|3) echo "./scripts/api-gen.sh generate -s api-spec.json -o tests/generated" ;;
esac)
\`\`\`

### Run Demo
\`\`\`bash
$(case $SETUP_METHOD in
    1) echo "npm run api-gen:demo" ;;
    2|3) echo "./scripts/api-gen.sh demo -o docs/api-demo" ;;
esac)
\`\`\`

### View Generated Documentation
\`\`\`bash
$(case $SETUP_METHOD in
    1) echo "npm run api-gen:serve" ;;
    2|3) echo "./scripts/api-gen.sh serve -d tests/generated" ;;
esac)
\`\`\`

## Files Generated
- \`tests/generated/\` - Playwright test files
- \`tests/generated/flow-diagrams.html\` - Interactive flow diagrams
- \`tests/generated/traceability-matrix.html\` - Requirement tracking

## Custom Usage
\`\`\`bash
$(case $SETUP_METHOD in
    1) echo "tools/api-test-generator/dist/cli.js generate --help" ;;
    2|3) echo "./scripts/api-gen.sh generate --help" ;;
esac)
\`\`\`
EOF

echo
log_success "🎉 Setup complete!"
echo
log_info "Next steps:"
echo "1. Update api-spec.json with your API specification"
case $SETUP_METHOD in
    1) echo "2. Run: npm run api-gen:tests" ;;
    2|3) echo "2. Run: ./scripts/api-gen.sh generate -s api-spec.json -o tests/generated" ;;
esac
echo "3. Open the generated flow diagrams in your browser"
echo "4. Check API_TEST_GENERATOR_USAGE.md for detailed usage"
echo
log_info "Tool location: $(case $SETUP_METHOD in
    1) echo "tools/api-test-generator/" ;;
    2|3) echo "vendor/playwright/tools/api-test-generator/" ;;
esac)"
