#!/bin/bash

# Playwright API Testing Framework Setup Script
# This script sets up the complete TypeScript framework

echo "🎭 Setting up Playwright API Testing Framework with TypeScript..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! node -p "process.version.slice(1).split('.').map(x=>+x).reduce((a,b,i)=>a+b*Math.pow(1000,2-i),0) >= '${REQUIRED_VERSION}'.split('.').map(x=>+x).reduce((a,b,i)=>a+b*Math.pow(1000,2-i),0)" 2>/dev/null; then
    print_error "Node.js version ${NODE_VERSION} is too old. Please upgrade to Node.js 18 or higher."
    exit 1
fi

print_status "Node.js version ${NODE_VERSION} is compatible"

# Install dependencies
print_info "Installing project dependencies..."
if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Install Playwright browsers
print_info "Installing Playwright browsers..."
if npx playwright install; then
    print_status "Playwright browsers installed successfully"
else
    print_error "Failed to install Playwright browsers"
    exit 1
fi

# Build TypeScript
print_info "Building TypeScript..."
if npm run build; then
    print_status "TypeScript build completed successfully"
else
    print_warning "TypeScript build failed, but continuing with setup..."
fi

# Create necessary directories
print_info "Creating project directories..."
mkdir -p logs reports test-data test-results
print_status "Project directories created"

# Generate test data
print_info "Generating test data..."
if npm run generate:data; then
    print_status "Test data generated successfully"
else
    print_warning "Test data generation failed, but continuing..."
fi

# Run type checking
print_info "Running TypeScript type checking..."
if npm run type-check; then
    print_status "TypeScript type checking passed"
else
    print_warning "TypeScript type checking failed, but framework is ready to use"
fi

print_status "Framework setup completed! 🎉"

echo ""
echo "📋 Next steps:"
echo ""
echo "1. Run tests:"
echo "   npm test"
echo ""
echo "2. Start the dashboard:"
echo "   npm run start:dashboard"
echo "   Then open http://localhost:3000"
echo ""
echo "3. Run specific test suites:"
echo "   npm run test:smoke"
echo "   npm run test:regression"
echo "   npm run test:user-management"
echo ""
echo "4. View test reports:"
echo "   npm run test:report"
echo ""
echo "📖 For more information, see README.md"
echo ""
print_status "Happy testing! 🚀"
