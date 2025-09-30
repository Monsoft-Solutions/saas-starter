# Winston Logger Service

This module provides centralized, structured logging for the application using Winston.

## Features

- **Environment-aware**: Different configurations for development and production
- **Structured logging**: JSON format with timestamps and metadata
- **File rotation**: Daily rotating log files in production
- **Multiple log levels**: error, warn, info, http, debug
- **Exception handling**: Automatic logging of uncaught exceptions and unhandled rejections

## Usage

### Basic Import

```typescript
import {
  logger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logHttp,
} from '@/lib/logger';
```

### Logging Messages

```typescript
// Simple messages
logInfo('User logged in successfully');
logWarn('Rate limit approaching');
logError('Database connection failed');

// With metadata
logInfo('User action completed', {
  userId: '123',
  action: 'update_profile',
  duration: 150,
});

// Error logging with stack trace
try {
  // some operation
} catch (error) {
  logError('Operation failed', error, { context: 'user_update' });
}
```

### Direct Logger Usage

```typescript
import { logger } from '@/lib/logger';

logger.info('Direct logger usage');
logger.warn('Warning message', { warning: 'details' });
logger.error('Error message', { error: 'details' });
```

## Log Levels

- **error**: System errors, exceptions, failures
- **warn**: Warnings, deprecated usage, potential issues
- **info**: General information, user actions, system events
- **http**: HTTP requests and responses
- **debug**: Debug information, detailed flow (development only)

## Environment Behavior

### Development

- All log levels displayed in console with colors
- No file logging
- Debug level enabled

### Production

- Only warnings and errors shown in console
- All logs written to rotating files in `logs/` directory
- Info level and above logged to files
- Automatic log rotation (daily, 20MB max, 14 days retention)

## File Structure

```
logs/
├── application-YYYY-MM-DD.log    # General application logs
├── error-YYYY-MM-DD.log          # Error-level logs only
├── exceptions.log                # Uncaught exceptions
└── rejections.log                # Unhandled promise rejections
```

## Best Practices

1. **Use appropriate log levels**: Don't log everything as info
2. **Include context**: Add relevant metadata to help with debugging
3. **Don't log sensitive data**: Avoid logging passwords, tokens, or personal information
4. **Use structured logging**: Include objects and metadata for better searchability
5. **Handle errors properly**: Use the `logError` helper for proper error logging with stack traces

## Examples

```typescript
// Good: Structured logging with context
logInfo('Payment processed', {
  userId: '123',
  amount: 29.99,
  currency: 'USD',
  paymentMethod: 'stripe',
});

// Good: Error logging with stack trace
logError('Payment failed', error, {
  userId: '123',
  amount: 29.99,
  paymentMethod: 'stripe',
});

// Avoid: Logging sensitive information
logInfo('User login', {
  email: 'user@example.com', // OK
  password: 'secret123', // BAD - never log passwords
});
```
