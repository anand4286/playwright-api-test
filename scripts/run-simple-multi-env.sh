#!/bin/bash

# Simple Multi-Environment Test Runner
# Usage: ./scripts/run-simple-multi-env.sh [environment1] [environment2] [environment3]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default environments if none provided
if [ $# -eq 0 ]; then
    ENVIRONMENTS=("dev" "staging")
else
    ENVIRONMENTS=("$@")
fi

echo -e "${CYAN}🌐 Simple Multi-Environment Testing${NC}"
echo -e "${BLUE}Environments: ${ENVIRONMENTS[*]}${NC}"
echo ""

# Create reports directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUMMARY_DIR="reports/simple-multi-env-${TIMESTAMP}"
mkdir -p "$SUMMARY_DIR"

PASSED_ENVS=()
FAILED_ENVS=()

# Run tests for each environment
for env in "${ENVIRONMENTS[@]}"; do
    echo -e "${YELLOW}🚀 Testing environment: ${env}${NC}"
    
    if TEST_ENV="$env" npx playwright test --project="${env}-api-tests" --workers=1; then
        PASSED_ENVS+=("$env")
        echo -e "${GREEN}✅ ${env} - PASSED${NC}"
    else
        FAILED_ENVS+=("$env")
        echo -e "${RED}❌ ${env} - FAILED${NC}"
    fi
    
    # Copy report if it exists
    if [[ -d "reports/${env}-html-report" ]]; then
        cp -r "reports/${env}-html-report" "${SUMMARY_DIR}/${env}-report"
    fi
    
    echo ""
done

# Summary
echo -e "${CYAN}📋 SUMMARY${NC}"
echo "============"
echo -e "${GREEN}Passed (${#PASSED_ENVS[@]}): ${PASSED_ENVS[*]}${NC}"
echo -e "${RED}Failed (${#FAILED_ENVS[@]}): ${FAILED_ENVS[*]}${NC}"

# Create simple summary file
cat > "${SUMMARY_DIR}/summary.txt" << EOF
Multi-Environment Test Summary
Generated: $(date)

Environments Tested: ${ENVIRONMENTS[*]}
Total: ${#ENVIRONMENTS[@]}
Passed: ${#PASSED_ENVS[@]} (${PASSED_ENVS[*]})
Failed: ${#FAILED_ENVS[@]} (${FAILED_ENVS[*]})

Reports Location: ${SUMMARY_DIR}
EOF

echo ""
echo -e "${BLUE}📊 Summary saved to: ${SUMMARY_DIR}/summary.txt${NC}"

if [ ${#FAILED_ENVS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All environments passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some environments failed. Check reports for details.${NC}"
    exit 1
fi
