# Log Storage System Documentation

The Playwright API Testing Framework includes a comprehensive log storage and archiving system that automatically preserves your test logs for future reference, debugging, and analysis.

## 🎯 Features

- **Automatic Archiving**: Beautiful HTTP live logs are automatically archived after verbose test runs
- **Optimized Storage**: Only the essential HTTP live logs are preserved (contains all request/response info with beautiful formatting)
- **Organized Storage**: Logs are stored by date and environment for easy retrieval
- **Powerful Search**: Full-text search across all archived HTTP logs
- **Size Management**: Automatic cleanup of old logs with configurable retention
- **Multiple Access Methods**: CLI scripts, npm commands, and TypeScript API

## 📁 Directory Structure

```
logs/
├── archive/
│   ├── daily/
│   │   └── 2025-08-11/           # Logs organized by date
│   │       ├── dev_2025-08-11_11-52-39_smoke_http-live.log
│   │       └── dev_2025-08-11_11-52-39_smoke_metadata.json
│   ├── by-environment/
│   │   ├── dev/                  # Logs organized by environment
│   │   ├── staging/
│   │   ├── qa/
│   │   └── prod/
│   └── by-test-suite/           # Logs organized by test suite
├── http-live.log                # Current live logs (beautiful formatted)
├── http-detailed.log            # Current detailed logs (JSON format)
├── api-requests.log             # Current API request logs
├── combined.log                 # Current combined logs
└── error.log                    # Current error logs
```

## 🚀 Quick Start

### Automatic Archiving

When you run tests with verbose logging, logs are automatically archived:

```bash
# These commands automatically archive logs after test completion
npm run test:dev:verbose
npm run test:staging:verbose
npm run test:qa:verbose

# Using the advanced test runner with --full-logs flag
./scripts/run-tests.sh -e dev -s smoke --full-logs
```

### Manual Log Management

```bash
# Archive current logs manually
npm run logs:archive dev smoke

# List archived logs
npm run logs:list 2025-08-11      # By date
npm run logs:list dev             # By environment

# Search archived logs
npm run logs:search "API Request"
npm run logs:search "error" env=dev

# Show archive statistics
npm run logs:summary

# Cleanup old logs (older than 30 days)
npm run logs:cleanup

# Show help
npm run logs:help
```

## 📋 Available Commands

> **Note**: The system archives only `http-live.log` files as they contain all essential HTTP request/response information with beautiful formatting. This approach significantly reduces storage space while preserving all critical debugging information.

### NPM Scripts

| Command | Description | Example |
|---------|-------------|---------|
| `npm run logs:archive` | Archive current logs | `npm run logs:archive dev smoke` |
| `npm run logs:archive:dev` | Archive for dev environment | `npm run logs:archive:dev` |
| `npm run logs:archive:staging` | Archive for staging environment | `npm run logs:archive:staging` |
| `npm run logs:list` | List archived logs | `npm run logs:list 2025-08-11` |
| `npm run logs:search` | Search archived logs | `npm run logs:search "API Request"` |
| `npm run logs:cleanup` | Clean up old logs | `npm run logs:cleanup` |
| `npm run logs:summary` | Show archive summary | `npm run logs:summary` |
| `npm run logs:help` | Show help information | `npm run logs:help` |

### Direct Script Usage

```bash
# Archive logs
./scripts/manage-logs.sh archive dev smoke
./scripts/manage-logs.sh archive staging regression

# List logs
./scripts/manage-logs.sh list 2025-08-11
./scripts/manage-logs.sh list dev

# Search logs
./scripts/manage-logs.sh search "API Request"
./scripts/manage-logs.sh search "error" env=dev date=2025-08-11
./scripts/manage-logs.sh search "POST" type=http-live

# Cleanup
./scripts/manage-logs.sh cleanup 14  # Keep logs for 14 days
./scripts/manage-logs.sh cleanup 60  # Keep logs for 60 days

# Summary
./scripts/manage-logs.sh summary
```

## 🔍 Search Examples

### Basic Search
```bash
# Search for all API requests
npm run logs:search "API Request"

# Search for errors
npm run logs:search "error"

# Search for specific HTTP methods
npm run logs:search "POST"
```

### Advanced Search with Filters
```bash
# Search in specific environment
./scripts/manage-logs.sh search "authentication" env=dev

# Search in specific date
./scripts/manage-logs.sh search "timeout" date=2025-08-11

# Search in specific log type
./scripts/manage-logs.sh search "response" type=http-live

# Combined filters
./scripts/manage-logs.sh search "failed" env=staging date=2025-08-11
```

## 📊 Archive Naming Convention

Archive files follow this naming pattern:
```
{environment}_{date}_{time}_{testSuite}_{logType}.log
```

Examples:
- `dev_2025-08-11_11-52-39_smoke_http-live.log`
- `staging_2025-08-11_14-30-15_regression_api-requests.log`
- `qa_2025-08-11_09-15-42_performance_error.log`

## 🧹 Log Retention and Cleanup

### Automatic Cleanup
The system can automatically clean up old logs to save disk space:

```bash
# Clean up logs older than 30 days (default)
npm run logs:cleanup

# Clean up logs older than specific number of days
./scripts/manage-logs.sh cleanup 14   # 14 days
./scripts/manage-logs.sh cleanup 60   # 60 days
```

### Storage Size Management
Monitor your log storage size:

```bash
# Show storage statistics
npm run logs:summary
```

Sample output:
```
📊 Archive Summary

Total Archives: 45
Environments: dev, staging, qa, prod
Date Range: 2025-07-15 to 2025-08-11
Total Size: 234.56 MB
```

## 🔧 Configuration

### Environment Variables

The log storage system respects these environment variables:

```bash
# Enable verbose logging (automatically archives logs)
ENABLE_FULL_LOGS=true

# Enable console logging alongside file logging
ENABLE_CONSOLE_LOGGING=true

# Custom log retention days (used by cleanup)
LOG_RETENTION_DAYS=30
```

### Customizing Archive Location

You can customize the archive location by modifying `utils/logStorage.ts`:

```typescript
private static archiveDir = path.join(process.cwd(), 'custom-log-archive');
```

## 🎯 Use Cases

### Development Debugging
```bash
# Run tests with full logging and archive results
npm run test:dev:verbose

# Search for specific errors in dev environment
./scripts/manage-logs.sh search "authentication failed" env=dev

# Compare API responses between test runs
npm run logs:list dev
```

### CI/CD Integration
```bash
# Archive logs with build information
./scripts/manage-logs.sh archive staging "build-${BUILD_NUMBER}"

# Search for deployment-related issues
./scripts/manage-logs.sh search "deployment" env=staging
```

### Performance Analysis
```bash
# Archive performance test logs
npm run test:qa:verbose -- --grep @performance

# Search for slow API calls
./scripts/manage-logs.sh search "responseTime.*[5-9][0-9][0-9][0-9]" type=http-live
```

### Incident Investigation
```bash
# Search for specific error patterns
./scripts/manage-logs.sh search "500 Internal Server Error" date=2025-08-11

# Find all failed authentication attempts
./scripts/manage-logs.sh search "authentication.*failed" env=prod
```

## 🚨 Best Practices

### 1. Regular Archiving
- Always run tests with `--full-logs` or use verbose commands for important test runs
- Archive logs immediately after critical test executions
- Use descriptive test suite names for better organization

### 2. Consistent Naming
- Use standard environment names: `dev`, `staging`, `qa`, `prod`
- Use descriptive test suite names: `smoke`, `regression`, `performance`, `security`
- Include version or build numbers when relevant

### 3. Storage Management
- Set up automated cleanup in CI/CD pipelines
- Monitor archive size regularly with `npm run logs:summary`
- Keep longer retention for production logs (60+ days)

### 4. Search Optimization
- Use specific search terms to reduce noise
- Combine filters (environment, date, type) for precise results
- Save frequently used search commands as shell aliases

## 🔗 Integration with Test Execution

The log storage system is fully integrated with the test execution framework:

### Automatic Integration
- Logs are automatically archived when using verbose test commands
- Archive names include environment and test suite information
- Failed test logs are marked with "_FAILED" suffix for easy identification

### Manual Integration
```typescript
import { LogStorage } from './utils/logStorage';

// Archive logs programmatically
const archiveName = await LogStorage.archiveLogs({
  environment: 'dev',
  testSuite: 'smoke',
  preserveOriginal: false
});
```

## 📈 Monitoring and Analytics

### Log Statistics
Use the summary command to monitor your testing activities:

```bash
npm run logs:summary
```

### Trend Analysis
Track your testing patterns:
- Number of test runs per environment
- Storage growth over time
- Most active testing periods

### Error Pattern Detection
Use search to identify recurring issues:
```bash
# Find recurring authentication issues
./scripts/manage-logs.sh search "authentication.*error"

# Track API timeout patterns
./scripts/manage-logs.sh search "timeout"
```

## 🛠️ Troubleshooting

### Common Issues

**Archive directory not found:**
```bash
# Initialize storage directories
./scripts/manage-logs.sh init
```

**No logs found:**
- Ensure you're running tests with `ENABLE_FULL_LOGS=true`
- Check that logs are being generated in the `logs/` directory
- Verify environment names match exactly

**Search returns no results:**
- Check the search term spelling
- Verify the date format (YYYY-MM-DD)
- Ensure the logs exist for the specified filters

**Storage space issues:**
```bash
# Check current storage size
npm run logs:summary

# Clean up old logs
npm run logs:cleanup 14
```

## 🎉 Summary

The log storage system provides a robust foundation for:
- **Debugging**: Quick access to historical test logs
- **Monitoring**: Track API performance and reliability over time
- **Compliance**: Maintain audit trails of test executions
- **Analysis**: Identify patterns and trends in test results

Start using the system today by running your tests with verbose logging:
```bash
npm run test:dev:verbose
```

Your logs will be automatically archived and ready for future analysis! 🚀
