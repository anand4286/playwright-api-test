#!/bin/bash

echo "🚀 Swagger Dashboard - Team Quick Start"
echo "======================================"
echo ""

# Function to print colored output
print_step() {
    echo "🔄 $1"
}

print_success() {
    echo "✅ $1"
}

print_info() {
    echo "📋 $1"
}

print_warning() {
    echo "⚠️  $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_warning "Please run this script from the project root directory"
    exit 1
fi

print_step "Setting up Swagger Dashboard for your team..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_step "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Check if openapi-specs directory exists
if [ ! -d "openapi-specs" ]; then
    print_step "Creating openapi-specs directory..."
    mkdir openapi-specs
    print_success "Created openapi-specs/ directory"
fi

# Count existing OpenAPI specs
SPEC_COUNT=$(find openapi-specs -name "*.json" -o -name "*.yaml" -o -name "*.yml" 2>/dev/null | wc -l)

if [ $SPEC_COUNT -eq 0 ]; then
    print_info "No OpenAPI specs found. The system includes 3 example APIs for testing:"
    print_info "  • Blog Management API (Swagger 2.0)"
    print_info "  • E-commerce API (OpenAPI 3.0 YAML)"  
    print_info "  • User Management API (OpenAPI 3.0 JSON)"
    echo ""
    print_info "To add your own APIs:"
    print_info "  1. Copy your OpenAPI spec files to: openapi-specs/"
    print_info "  2. Supported formats: .json, .yaml, .yml"
    print_info "  3. Re-run this script to process them"
    echo ""
else
    print_success "Found $SPEC_COUNT OpenAPI specification(s) in openapi-specs/"
fi

# Process existing specs
if [ $SPEC_COUNT -gt 0 ]; then
    print_step "Processing your OpenAPI specifications..."
    npm run swagger:batch
    
    if [ $? -eq 0 ]; then
        print_success "All specifications processed successfully!"
    else
        print_warning "Some specifications failed to process. Check the output above."
    fi
fi

echo ""
print_step "Starting Swagger Dashboard..."
echo ""
print_info "🎯 What you can do next:"
print_info "  • Dashboard will open at: http://localhost:8888"
print_info "  • Select an API from the dropdown to explore requirements"
print_info "  • View generated test cases and metrics"
print_info "  • Export requirements for your testing framework"
echo ""

if [ $SPEC_COUNT -eq 0 ]; then
    print_info "🧪 Since no custom APIs were found, you'll see our example APIs"
    print_info "   This is perfect for exploring the features!"
fi

echo ""
print_info "🛑 To stop the dashboard: Press Ctrl+C"
echo ""

# Check if port is available
if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 8888 is already in use. Trying port 8889..."
    PORT=8889 npm run swagger-dashboard
else
    npm run swagger-dashboard
fi
