#!/bin/bash

# Generated Test Suite Runner
# Supports multi-environment execution

set -e

ENVIRONMENTS="{{ENVIRONMENTS}}"
SUITE=""
PARALLEL=false

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  -e, --environments  Environments to run (default: all)"
  echo "  -s, --suite        Test suite to run"
  echo "  -p, --parallel     Run environments in parallel"
  echo "  -h, --help         Show this help"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environments)
      ENVIRONMENTS="$2"
      shift 2
      ;;
    -s|--suite)
      SUITE="$2"
      shift 2
      ;;
    -p|--parallel)
      PARALLEL=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

echo "🚀 Running generated test suite..."
echo "📦 Environments: $ENVIRONMENTS"
echo "🧪 Suite: ${SUITE:-"All"}"
echo "⚡ Parallel: $PARALLEL"

for env in $ENVIRONMENTS; do
  echo ""
  echo "🌍 Running tests in $env environment..."
  
  if [ -n "$SUITE" ]; then
    TEST_ENV=$env npx playwright test --grep "$SUITE"
  else
    TEST_ENV=$env npx playwright test
  fi
  
  if [ $? -ne 0 ]; then
    echo "❌ Tests failed in $env environment"
    exit 1
  fi
done

echo ""
echo "✅ All tests completed successfully!"
