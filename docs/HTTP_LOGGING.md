# HTTP Logging Documentation

## Overview
This guide explains how to enable and use detailed HTTP logging for your API tests, providing comprehensive visibility into all HTTP requests and responses.

## Features
- **Request Logging**: HTTP method, URL, headers, body
- **Response Logging**: Status code, headers, body, timing
- **Environment-Specific Configuration**: Different logging levels per environment
- **Command-Line Control**: Enable/disable logging via CLI flags
- **Configurable Detail Level**: Control what gets logged (headers, bodies, etc.)

## Quick Start

### Enable Full HTTP Logging
```bash
# Using npm scripts (recommended)
npm run test:dev:verbose

# Using shell scripts
./scripts/run-tests.sh dev --full-logs

# Using environment variables
ENABLE_FULL_LOGS=true ENABLE_CONSOLE_LOGGING=true npm run test:dev
```

## Configuration Options

### Environment Variables
Configure logging behavior in your environment files (`environments/*.env`):

```bash
# Enable comprehensive HTTP logging
ENABLE_FULL_LOGS=true
ENABLE_CONSOLE_LOGGING=true

# Fine-grained control
LOG_HEADERS=true
LOG_REQUEST_BODY=true
LOG_RESPONSE_BODY=true
MAX_BODY_LENGTH=1000
```

### Variable Reference
| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_FULL_LOGS` | `false` | Enable comprehensive HTTP request/response logging |
| `ENABLE_CONSOLE_LOGGING` | `false` | Output logs to console during test execution |
| `LOG_HEADERS` | `true` | Include request/response headers in logs |
| `LOG_REQUEST_BODY` | `true` | Include request body in logs |
| `LOG_RESPONSE_BODY` | `true` | Include response body in logs |
| `MAX_BODY_LENGTH` | `1000` | Maximum characters to log for request/response bodies |

## Usage Examples

### 1. Basic HTTP Logging
```bash
# Enable basic HTTP logging for development environment
npm run test:dev:verbose
```

### 2. Multi-Environment with Logging
```bash
# Run tests on all environments with full HTTP logging
./scripts/run-multi-env-tests.sh --verbose

# Run on specific environments with logging
./scripts/run-multi-env-tests.sh dev staging --full-logs
```

### 3. Script-Based Execution
```bash
# Single environment with full logs
./scripts/run-tests.sh dev --full-logs

# With custom test filter
./scripts/run-tests.sh qa --verbose --grep "user-management"

# Help and available options
./scripts/run-tests.sh --help
```

## Log Output Format

### Request Logging
```
📤 HTTP Request:
   Method: POST
   URL: https://api.dev.example.com/users
   Headers:
     Content-Type: application/json
     Authorization: Bearer eyJ0eXAiOiJKV1QiLCJ...
   Body: {"name":"John Doe","email":"john@example.com"}
```

### Response Logging
```
📥 HTTP Response:
   Status: 201 Created
   Duration: 245ms
   Headers:
     Content-Type: application/json
     Location: /users/12345
   Body: {"id":12345,"name":"John Doe","email":"john@example.com","created_at":"2024-01-01T00:00:00Z"}
```

## Integration with Tests

### Automatic Setup
HTTP logging is automatically enabled when you use the enhanced `TestActions` class:

```typescript
import { test } from '@playwright/test';
import { TestActions } from '../utils/test-actions';

test('Create user with HTTP logging', async ({ page }) => {
  const actions = new TestActions(page);
  
  // HTTP logging is automatically initialized
  await actions.initializeHTTPLogging();
  
  // All API calls will be logged
  const user = await actions.createTestUser({
    name: 'John Doe',
    email: 'john@example.com'
  });
});
```

### Manual HTTP Logger Setup
For custom logging setup:

```typescript
import { HTTPLogger } from '../utils/httpLogger';

test('Custom HTTP logging setup', async ({ page }) => {
  const httpLogger = new HTTPLogger(page);
  await httpLogger.setupHTTPLogging();
  
  // Your test code here
  // All HTTP requests/responses will be logged
});
```

## Troubleshooting

### Common Issues

1. **No logs appearing**
   - Ensure `ENABLE_CONSOLE_LOGGING=true` is set
   - Check that logging is enabled in your environment file

2. **Truncated request/response bodies**
   - Increase `MAX_BODY_LENGTH` in your environment configuration
   - Bodies longer than the limit are automatically truncated

3. **Too much log output**
   - Set `LOG_REQUEST_BODY=false` or `LOG_RESPONSE_BODY=false`
   - Use `LOG_HEADERS=false` to reduce header logging

### Performance Considerations
- HTTP logging adds minimal overhead to test execution
- Large response bodies are automatically truncated
- Logging can be disabled per environment for production testing

## Environment-Specific Examples

### Development (Full Logging)
```bash
# environments/dev.env
ENABLE_FULL_LOGS=true
ENABLE_CONSOLE_LOGGING=true
LOG_HEADERS=true
LOG_REQUEST_BODY=true
LOG_RESPONSE_BODY=true
MAX_BODY_LENGTH=2000
```

### Production (Minimal Logging)
```bash
# environments/prod.env
ENABLE_FULL_LOGS=false
ENABLE_CONSOLE_LOGGING=false
LOG_HEADERS=false
LOG_REQUEST_BODY=false
LOG_RESPONSE_BODY=false
```

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run API Tests with HTTP Logging
  run: |
    npm run test:staging:verbose
  env:
    ENABLE_FULL_LOGS: true
    ENABLE_CONSOLE_LOGGING: true
```

## Advanced Configuration

### Custom Log Filtering
Modify `utils/httpLogger.ts` to add custom filtering logic:

```typescript
// Example: Only log failed requests
private shouldLogRequest(response: Response): boolean {
  return response.status() >= 400;
}
```

### Integration with External Tools
HTTP logs can be exported to external monitoring tools by modifying the logger configuration in `utils/logger.ts`.

## Best Practices

1. **Use Environment-Specific Settings**: Configure different logging levels for dev/staging/production
2. **Monitor Log Volume**: Use body length limits to prevent excessive logging
3. **Security**: Avoid logging sensitive data like passwords or tokens in production
4. **Performance**: Disable detailed logging in performance tests unless debugging
5. **CI/CD**: Enable logging in CI for debugging failed tests

## See Also
- [Multi-Environment Testing Guide](./MULTI_ENVIRONMENT.md)
- [Test Utils Documentation](./TEST_UTILS.md)
- [Environment Configuration](../environments/README.md)
