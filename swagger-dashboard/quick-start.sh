#!/bin/bash

echo "🚀 Swagger Dashboard Quick Start"
echo "================================"
echo ""

# Check if openapi-specs directory exists
if [ ! -d "openapi-specs" ]; then
    echo "📁 Creating openapi-specs directory..."
    mkdir -p openapi-specs
fi

# Check if there are any OpenAPI specs
SPEC_COUNT=$(find openapi-specs -name "*.json" -o -name "*.yaml" -o -name "*.yml" | wc -l)

if [ $SPEC_COUNT -eq 0 ]; then
    echo "⚠️  No OpenAPI specifications found in openapi-specs/ directory"
    echo ""
    echo "📋 To get started:"
    echo "1. Add your OpenAPI spec files (JSON, YAML, or YML) to the openapi-specs/ directory"
    echo "2. Run this script again"
    echo ""
    echo "📝 Example:"
    echo "   cp your-api.json openapi-specs/"
    echo "   cp another-api.yaml openapi-specs/"
    echo ""
    exit 1
fi

echo "🔍 Found $SPEC_COUNT OpenAPI specification(s)"
echo ""

# Process all OpenAPI specs
echo "🔄 Processing OpenAPI specifications..."
npm run swagger:batch

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All specifications processed successfully!"
    echo ""
    echo "🚀 Starting Swagger Dashboard..."
    echo "📊 Dashboard will be available at: http://localhost:8888"
    echo ""
    echo "🎯 What you can do next:"
    echo "• View generated requirements for each API"
    echo "• Analyze endpoint coverage and metrics"
    echo "• Export requirements for test implementation"
    echo "• Use the interactive dashboard to explore your APIs"
    echo ""
    
    # Start the dashboard
    npm run swagger-dashboard
else
    echo ""
    echo "❌ Error processing specifications. Please check the output above."
    exit 1
fi
