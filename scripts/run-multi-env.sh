#!/bin/bash

# Multi-Environment Cross-Testing Script
# Runs the same test suite across multiple environments for comparison

set -e

# Ensure we're using bash for associative arrays
if [ -z "$BASH_VERSION" ]; then
    echo "This script requires bash. Re-executing with bash..."
    exec bash "$0" "$@"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default configurations
ENVIRONMENTS=("dev" "staging" "qa")
TEST_SUITE="basic"
WORKERS=2
RETRIES=1
COMPARE_RESULTS=true

show_help() {
    echo "🌐 Multi-Environment Cross-Testing Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environments ENV1,ENV2,ENV3  Comma-separated list of environments"
    echo "  -s, --suite TEST_SUITE            Test suite to run across environments"
    echo "  -w, --workers NUM                 Number of parallel workers per environment"
    echo "  -r, --retries NUM                 Number of retries on failure"
    echo "  -c, --compare                     Compare results across environments"
    echo "  --parallel                        Run environments in parallel (faster but more resource intensive)"
    echo "  --help                           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev,staging,prod -s basic                    # Run basic tests across 3 environments"
    echo "  $0 -e dev,qa -s advanced --parallel               # Run advanced tests in parallel"
    echo "  $0 -e staging,prod -s performance -w 1 -r 0       # Conservative performance testing"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environments)
            IFS=',' read -ra ENVIRONMENTS <<< "$2"
            shift 2
            ;;
        -s|--suite)
            TEST_SUITE="$2"
            shift 2
            ;;
        -w|--workers)
            WORKERS="$2"
            shift 2
            ;;
        -r|--retries)
            RETRIES="$2"
            shift 2
            ;;
        -c|--compare)
            COMPARE_RESULTS=true
            shift
            ;;
        --parallel)
            PARALLEL_EXECUTION=true
            shift
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

echo -e "${CYAN}🌐 Multi-Environment Testing${NC}"
echo -e "${BLUE}Environments: ${ENVIRONMENTS[*]}${NC}"
echo -e "${BLUE}Test Suite: ${TEST_SUITE}${NC}"
echo -e "${BLUE}Workers: ${WORKERS}${NC}"
echo -e "${BLUE}Retries: ${RETRIES}${NC}"
echo ""

# Create summary directories
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUMMARY_DIR="reports/multi-env-${TIMESTAMP}"
mkdir -p "$SUMMARY_DIR"

# Results tracking using temporary files (more compatible)
RESULTS_FILE="$SUMMARY_DIR/results.tmp"
DURATIONS_FILE="$SUMMARY_DIR/durations.tmp"
> "$RESULTS_FILE"
> "$DURATIONS_FILE"

# Function to run tests for a single environment
run_environment_tests() {
    local env=$1
    echo -e "${YELLOW}🚀 Starting tests for ${env}...${NC}"
    
    local start_time=$(date +%s)
    
    if ./scripts/run-tests.sh -e "$env" -s "$TEST_SUITE" -w "$WORKERS" -r "$RETRIES"; then
        echo "${env}:✅ PASSED" >> "$RESULTS_FILE"
        echo -e "${GREEN}✅ ${env} tests completed successfully${NC}"
    else
        echo "${env}:❌ FAILED" >> "$RESULTS_FILE"
        echo -e "${RED}❌ ${env} tests failed${NC}"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo "${env}:${duration}s" >> "$DURATIONS_FILE"
    
    # Copy reports to summary directory
    if [[ -d "reports/${env}-html-report" ]]; then
        cp -r "reports/${env}-html-report" "${SUMMARY_DIR}/${env}-report"
    fi
}

# Execute tests
if [[ "${PARALLEL_EXECUTION:-false}" == "true" ]]; then
    echo -e "${CYAN}🔄 Running environments in parallel...${NC}"
    
    # Run in parallel
    for env in "${ENVIRONMENTS[@]}"; do
        run_environment_tests "$env" &
    done
    wait
else
    echo -e "${CYAN}🔄 Running environments sequentially...${NC}"
    
    # Run sequentially
    for env in "${ENVIRONMENTS[@]}"; do
        run_environment_tests "$env"
        echo ""
    done
fi

# Generate summary report
echo -e "${CYAN}📊 Generating summary report...${NC}"

SUMMARY_FILE="${SUMMARY_DIR}/summary.md"
cat > "$SUMMARY_FILE" << EOF
# Multi-Environment Test Results

**Execution Time:** $(date)
**Test Suite:** ${TEST_SUITE}
**Workers:** ${WORKERS}
**Retries:** ${RETRIES}

## Results Summary

| Environment | Result | Duration | Report |
|-------------|--------|----------|---------|
EOF

# Read results from temporary files and generate summary
while IFS=':' read -r env result; do
    echo "| ${env} | ${result} | $(grep "^${env}:" "$DURATIONS_FILE" | cut -d':' -f2) | [View Report](${env}-report/index.html) |" >> "$SUMMARY_FILE"
done < "$RESULTS_FILE"

cat >> "$SUMMARY_FILE" << EOF

## Environment Comparison

EOF

# Add detailed comparison if enabled
if [[ "$COMPARE_RESULTS" == "true" ]]; then
    echo -e "${CYAN}🔍 Analyzing results...${NC}"
    
    # Count passed/failed from results file
    passed_count=$(grep -c "✅ PASSED" "$RESULTS_FILE" || echo "0")
    failed_count=$(grep -c "❌ FAILED" "$RESULTS_FILE" || echo "0")
    total_envs=${#ENVIRONMENTS[@]}
    
    # Calculate success rate safely
    if [[ $total_envs -gt 0 ]]; then
        success_rate=$(( passed_count * 100 / total_envs ))
    else
        success_rate=0
    fi
    
    cat >> "$SUMMARY_FILE" << EOF
### Statistics
- **Total Environments Tested:** ${total_envs}
- **Passed:** ${passed_count}
- **Failed:** ${failed_count}
- **Success Rate:** ${success_rate}%

### Recommendations

EOF

    if [[ $failed_count -eq 0 ]]; then
        echo "🎉 **All environments passed!** The test suite is stable across all tested environments." >> "$SUMMARY_FILE"
    elif [[ $failed_count -eq $total_envs ]]; then
        echo "⚠️ **All environments failed!** There may be issues with the test suite itself or the application." >> "$SUMMARY_FILE"
    else
        echo "🔍 **Mixed results detected.** Environment-specific issues may exist. Review failed environments for:" >> "$SUMMARY_FILE"
        echo "- Configuration differences" >> "$SUMMARY_FILE"
        echo "- Data availability" >> "$SUMMARY_FILE"
        echo "- Service dependencies" >> "$SUMMARY_FILE"
        echo "- Network connectivity" >> "$SUMMARY_FILE"
    fi
fi

# Display results
echo ""
echo -e "${CYAN}📋 RESULTS SUMMARY${NC}"
echo "===================="

while IFS=':' read -r env result; do
    duration=$(grep "^${env}:" "$DURATIONS_FILE" | cut -d':' -f2)
    echo -e "${env}: ${result} (${duration})"
done < "$RESULTS_FILE"

echo ""
echo -e "${BLUE}📊 Full summary available at: ${SUMMARY_DIR}/summary.md${NC}"

# Offer to open summary
read -p "🔍 Open summary report? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "${SUMMARY_DIR}/summary.md"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "${SUMMARY_DIR}/summary.md"
    else
        echo "Please open: ${SUMMARY_DIR}/summary.md"
    fi
fi

# Cleanup temporary files
rm -f "$RESULTS_FILE" "$DURATIONS_FILE"

echo -e "${GREEN}🎉 Multi-environment testing completed!${NC}"
