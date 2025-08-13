#!/bin/bash

echo "🔗 Setting up Swagger Dashboard Standalone Package"
echo "=================================================="

# Navigate to standalone directory
cd swagger-dashboard-standalone

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the TypeScript code
echo "🔨 Building TypeScript..."
npm run build

# Create symlink for global testing
echo "🔗 Creating global symlink for testing..."
npm link

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Available commands:"
echo "  swagger-dashboard          - Start dashboard"
echo "  swagger-batch              - Batch process APIs"
echo "  swagger-generate           - Generate single API"
echo ""
echo "📝 Test the installation:"
echo "  swagger-dashboard --help"
echo "  swagger-batch --help"
echo ""
echo "🚀 To use in other projects:"
echo "  npm install -g @anand4286/swagger-dashboard"
echo "  # or link for local testing:"
echo "  npm link @anand4286/swagger-dashboard"
