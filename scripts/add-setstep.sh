#!/bin/bash

# Script to add setStep calls to all TestActions methods

# This script will add setStep calls to all async methods in test-actions.ts
# that don't already have them

FILE="utils/test-actions.ts"

echo "🔧 Adding setStep calls to all TestActions methods..."

# Create a backup
cp "$FILE" "${FILE}.backup"

# Add setStep to remaining methods (we'll do this manually for precision)
echo "✅ Backup created: ${FILE}.backup"
echo "📝 Please manually add setStep calls to remaining methods:"

# Show methods that likely need setStep
grep -n "async.*(" "$FILE" | grep -v "setStep" | while read line; do
    echo "   $line"
done

echo ""
echo "🔍 Pattern to add after method signature:"
echo "    // Set test step for logging"
echo "    if (this.apiHelper?.setStep) {"
echo "      this.apiHelper.setStep('Method Name Here');"
echo "    }"
echo "    "
