#!/bin/bash
TEST_NAME=${1}
if [ -z "$TEST_NAME" ]; then
  echo "Usage: ./run-specific-real.sh <test-name>"
  echo "Available REAL tests:"
  echo "  - user-registration-and-profile-flow"
  echo "  - authentication-and-session-management"
  echo "  - profile-management-operations"
  echo "  - user-list-and-bulk-operations"
  echo "  - error-handling-and-edge-cases"
  echo "  - avatar-and-file-operations"
  exit 1
fi
echo "🎯 Running specific REAL test: $TEST_NAME"
npx playwright test tests/real-working/$TEST_NAME.spec.ts
