#!/bin/bash

# Multi-Environment Test Execution Script
# Usage: ./scripts/run-tests.sh [environment] [test-suite] [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
TEST_SUITE="all"
PROJECT=""
DEBUG=false
HEADED=false
WORKERS=""
RETRIES=""
VERBOSE=false
FULL_LOGS=false
GREP_PATTERN=""

# Help function
show_help() {
    echo "🚀 Multi-Environment Test Execution Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT     Target environment (dev, staging, qa, prod)"
    echo "  -s, --suite TEST_SUITE    Test suite to run (all, basic, advanced, performance, security)"
    echo "  -p, --project PROJECT     Specific project to run (optional)"
    echo "  -d, --debug              Enable debug mode with enhanced tracing"
    echo "  -v, --verbose            Enable verbose output (same as --full-logs)"
    echo "  -f, --full-logs          Enable detailed HTTP logging (method, URL, headers, body)"
    echo "  -h, --headed             Run tests in headed mode"
    echo "  -w, --workers NUM        Number of parallel workers"
    echo "  -r, --retries NUM        Number of retries on failure"
    echo "  -g, --grep PATTERN       Filter tests by pattern"
    echo "  --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev -s all                    # Run all tests in dev environment"
    echo "  $0 -e staging -s advanced -d        # Run advanced tests in staging with debug"
    echo "  $0 -e dev -s basic -v               # Run basic tests with verbose HTTP logging"
    echo "  $0 -e qa -s performance --full-logs # Run performance tests with full HTTP details"
    echo "  $0 -e prod -s basic -w 1            # Run basic tests in prod with 1 worker"
    echo ""
    echo "HTTP Logging Options:"
    echo "  --verbose/-v    : Enable detailed console output with HTTP requests/responses"
    echo "  --full-logs/-f  : Enable comprehensive logging including headers and body content"
    echo "  (Default logging behavior is controlled by environment configuration)"
    echo ""
    echo "Available Environments: dev, staging, qa, prod"
    echo "Available Test Suites: all, basic, advanced, performance, security"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--suite)
            TEST_SUITE="$2"
            shift 2
            ;;
        -p|--project)
            PROJECT="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            FULL_LOGS=true
            shift
            ;;
        -f|--full-logs)
            FULL_LOGS=true
            shift
            ;;
        -h|--headed)
            HEADED=true
            shift
            ;;
        -w|--workers)
            WORKERS="$2"
            shift 2
            ;;
        -r|--retries)
            RETRIES="$2"
            shift 2
            ;;
        -g|--grep)
            GREP_PATTERN="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|qa|prod)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo -e "${YELLOW}Available environments: dev, staging, qa, prod${NC}"
    exit 1
fi

# Check if environment file exists
ENV_FILE="environments/${ENVIRONMENT}.env"
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}🌍 Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}📋 Test Suite: ${TEST_SUITE}${NC}"

# Set environment variable
export TEST_ENV="$ENVIRONMENT"

# Set logging options
if [[ "$FULL_LOGS" == "true" ]]; then
    export ENABLE_FULL_LOGS=true
    export ENABLE_CONSOLE_LOGGING=true
    export LOG_HEADERS=true
    export LOG_REQUEST_BODY=true
    export LOG_RESPONSE_BODY=true
    export VERBOSE=true
    echo -e "${YELLOW}🔍 Full HTTP logging enabled${NC}"
elif [[ "$VERBOSE" == "true" ]]; then
    export ENABLE_CONSOLE_LOGGING=true
    export VERBOSE=true
    echo -e "${YELLOW}📝 Verbose console logging enabled${NC}"
fi

# Build Playwright command
PLAYWRIGHT_CMD="npx playwright test"

# Add test suite selection
case $TEST_SUITE in
    "basic")
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD tests/basic/"
        ;;
    "advanced")
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD tests/advanced/"
        ;;
    "performance")
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --grep @performance"
        ;;
    "security")
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --grep @security"
        ;;
    "all")
        # Run all tests
        ;;
    *)
        echo -e "${RED}❌ Invalid test suite: $TEST_SUITE${NC}"
        echo -e "${YELLOW}Available suites: all, basic, advanced, performance, security${NC}"
        exit 1
        ;;
esac

# Add project selection
if [[ -n "$PROJECT" ]]; then
    if $DEBUG; then
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=${ENVIRONMENT}-${PROJECT}-debug"
    else
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=${ENVIRONMENT}-${PROJECT}"
    fi
elif $DEBUG; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=${ENVIRONMENT}-api-tests-debug"
else
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=${ENVIRONMENT}-api-tests"
fi

# Add headed mode
if $HEADED; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --headed"
fi

# Add workers
if [[ -n "$WORKERS" ]]; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --workers=$WORKERS"
fi

# Add retries
if [[ -n "$RETRIES" ]]; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --retries=$RETRIES"
fi

# Add grep pattern
if [[ -n "$GREP_PATTERN" ]]; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --grep=\"$GREP_PATTERN\""
fi

# Create reports directory for this environment
mkdir -p "reports/${ENVIRONMENT}"
mkdir -p "test-results/${ENVIRONMENT}"

echo -e "${GREEN}🚀 Starting test execution...${NC}"
echo -e "${YELLOW}Command: $PLAYWRIGHT_CMD${NC}"
echo ""

# Execute tests
if eval "$PLAYWRIGHT_CMD"; then
    echo ""
    echo -e "${GREEN}✅ Tests completed successfully!${NC}"
    echo -e "${BLUE}📊 Reports available at: reports/${ENVIRONMENT}-html-report${NC}"
    
    # Archive logs if verbose mode was enabled
    if [[ "$FULL_LOGS" == "true" ]]; then
        echo ""
        echo -e "${YELLOW}📁 Archiving test logs for future reference...${NC}"
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        "$SCRIPT_DIR/manage-logs.sh" archive "$ENVIRONMENT" "$TEST_SUITE"
        echo -e "${GREEN}✅ Logs archived successfully!${NC}"
    fi
    
    # Offer to open report
    read -p "🔍 Open HTML report? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx playwright show-report "reports/${ENVIRONMENT}-html-report"
    fi
else
    echo ""
    echo -e "${RED}❌ Tests failed!${NC}"
    echo -e "${YELLOW}📊 Check reports at: reports/${ENVIRONMENT}-html-report${NC}"
    
    # Archive logs even if tests failed (for debugging)
    if [[ "$FULL_LOGS" == "true" ]]; then
        echo ""
        echo -e "${YELLOW}📁 Archiving failed test logs for debugging...${NC}"
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        "$SCRIPT_DIR/manage-logs.sh" archive "$ENVIRONMENT" "${TEST_SUITE}_FAILED"
        echo -e "${GREEN}✅ Failed test logs archived for analysis!${NC}"
    fi
    
    exit 1
fi
