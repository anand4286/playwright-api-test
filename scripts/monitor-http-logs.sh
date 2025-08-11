#!/bin/bash

# Live HTTP Log Monitor Script
# Usage: ./scripts/monitor-http-logs.sh [environment] [test-options...]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 HTTP Live Log Monitor${NC}"
echo -e "${YELLOW}Monitoring HTTP requests and responses in real-time...${NC}"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Clear previous live log file
> logs/http-live.log

# Start monitoring in background
echo -e "${GREEN}📡 Starting live log monitor...${NC}"
tail -f logs/http-live.log &
TAIL_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping log monitor...${NC}"
    kill $TAIL_PID 2>/dev/null || true
    exit 0
}

# Trap cleanup on script exit
trap cleanup EXIT INT TERM

# Show instructions
echo -e "${BLUE}Instructions:${NC}"
echo "1. Keep this terminal open to monitor HTTP logs"
echo "2. In another terminal, run your tests with full logging:"
echo "   ${YELLOW}npm run test:dev:verbose${NC}"
echo "   ${YELLOW}./scripts/run-tests.sh -e dev --full-logs${NC}"
echo ""
echo -e "${GREEN}📝 HTTP logs will appear below in real-time...${NC}"
echo -e "${BLUE}Press Ctrl+C to stop monitoring${NC}"
echo ""

# Wait for the tail process
wait $TAIL_PID
