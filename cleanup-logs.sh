#!/bin/bash

# 🧹 Log Cleanup Script
# Cleans up old logs and prepares for Supertest execution

echo "🧹 PLAYWRIGHT API TEST - LOG CLEANUP"
echo "===================================="

# Current status
echo "📊 Current status:"
echo "  Playwright logs: $(ls logs/ | wc -l | tr -d ' ') files ($(du -sh logs/ | cut -f1))"
echo "  Supertest logs: $(ls logs-supertest/ | wc -l | tr -d ' ') files ($(du -sh logs-supertest/ | cut -f1))"

# Backup important logs
echo ""
echo "💾 Creating backup of important logs..."
mkdir -p logs-backup/$(date +%Y%m%d)
cp logs/sample_supertest_iblogin.log logs-backup/$(date +%Y%m%d)/ 2>/dev/null || echo "  No sample Supertest log found"
cp logs-supertest/iblogin_sample.log logs-backup/$(date +%Y%m%d)/ 2>/dev/null || echo "  No iblogin sample found"

# Clean old Playwright logs (keep recent ones)
echo ""
echo "🗑️  Cleaning old Playwright logs..."
find logs/ -name "*http-live.log" -type f -mtime +1 -delete
echo "  Removed logs older than 1 day"

# Keep logs-supertest for tomorrow's execution
echo ""
echo "✅ Keeping logs-supertest/ for tomorrow's Supertest execution"

# Summary
echo ""
echo "📈 After cleanup:"
echo "  Playwright logs: $(ls logs/ | wc -l | tr -d ' ') files ($(du -sh logs/ | cut -f1))"
echo "  Supertest logs: $(ls logs-supertest/ | wc -l | tr -d ' ') files ($(du -sh logs-supertest/ | cut -f1))"
echo "  Backup created: logs-backup/$(date +%Y%m%d)/"

echo ""
echo "🎯 READY FOR TOMORROW'S SUPERTEST EXECUTION"
echo "==========================================="
echo "Folder to use: logs-supertest/"
echo "Command to run: npm run test:dev:supertest"
echo "Conversion command: npm run convert:supertest"
