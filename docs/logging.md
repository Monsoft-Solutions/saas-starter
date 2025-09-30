---
title: Logging System
description: Comprehensive guide to using the Winston logging service for structured, environment-aware logging in the SaaS Starter application
---

# Logging System

A centralized, structured logging system built on Winston that provides environment-aware logging, file rotation, and comprehensive debugging capabilities throughout the application.

## Overview

The SaaS Starter uses Winston as its logging framework, replacing scattered `console.log` statements with a professional-grade logging solution. The system provides:

- **Structured logging** with JSON formatting and metadata
- **Environment-aware configuration** (development vs. production)
- **Daily rotating file storage** in production
- **Multiple log levels** for different severity types
- **Automatic request/response logging** via middleware

::: tip Prerequisites

- Node.js environment with `NODE_ENV` variable set
- Write permissions to the `logs/` directory in production
- Basic understanding of [Server Actions](/auth/server-actions-and-hooks) and [API routes](/README#architecture-overview)
  :::

## Quick Start

```typescript
import { logger } from '@/lib/logger/logger.service';

// Log informational messages
logger.info('User logged in successfully', { userId: user.id });

// Log errors
logger.error('Failed to process payment', { error: error.message, orderId });

// Log warnings
logger.warn('API rate limit approaching', { remaining: 10, limit: 100 });

// Log debug information
logger.debug('Cache hit', { key: 'user:123', ttl: 3600 });
```

## Core Concepts

### Architecture

The logging system follows a centralized architecture:

```
Application Layer
       ↓
Logger Service (lib/logger/logger.service.ts)
       ↓
Winston Core
       ↓
    Transports
    ├── Console (Development)
    └── Daily Rotate File (Production)
       ↓
    logs/ directory
```

**Key Components:**

1. **Logger Service** (`lib/logger/logger.service.ts`) - Singleton Winston instance with environment-aware configuration
2. **Transports** - Output destinations (console for dev, files for production)
3. **Formatters** - JSON structure, timestamps, colorization
4. **Log Rotation** - Daily file rotation with 14-day retention

### Importing the Logger

The logger is a centralized service exported from `lib/logger/logger.service.ts`:

```typescript
import { logger } from '@/lib/logger/logger.service';
```

Import this logger anywhere in your application - Server Components, API routes, Server Actions, middleware, or utility functions.

## Configuration Reference

### Log Levels

Winston supports multiple log levels, listed here from highest to lowest priority:

| Level   | Priority | When to Use                                                          | Example Use Cases                                                             |
| ------- | -------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `error` | Highest  | System errors, exceptions, failures that require immediate attention | Database connection failures, unhandled exceptions, payment processing errors |
| `warn`  | High     | Potentially harmful situations that don't stop execution             | Deprecated API usage, rate limiting warnings, configuration issues            |
| `info`  | Normal   | General informational messages about application flow                | User authentication events, API requests, important state changes             |
| `http`  | Low      | HTTP request/response logging                                        | Request method, URL, status code, response time                               |
| `debug` | Lowest   | Detailed diagnostic information for debugging                        | Cache hits/misses, query execution details, intermediate processing steps     |

### Environment Configuration

| Setting            | Development               | Production                             |
| ------------------ | ------------------------- | -------------------------------------- |
| **Console Output** | All levels with colors    | `error` and `warn` only                |
| **File Output**    | None                      | All levels to `logs/` directory        |
| **Default Level**  | `debug`                   | `info`                                 |
| **Format**         | Pretty-printed, colorized | JSON with timestamps                   |
| **Rotation**       | N/A                       | Daily, 14-day retention, 20MB max size |

::: tip Environment Setup
Ensure your `NODE_ENV` is set correctly in your [environment configuration](/environment-configuration). The logger automatically adapts its behavior based on this variable.
:::

::: warning Production File Permissions
In production, ensure the application has write permissions to the `logs/` directory. Missing permissions will cause silent logging failures.
:::

## Examples

### Basic Logging

Simple messages without metadata:

```typescript
// lib/services/cache.service.ts
import { logger } from '@/lib/logger/logger.service';

export function initializeCache() {
  logger.info('Cache service initialized');
}

export function handleCacheFailure() {
  logger.warn('Cache service unavailable, using fallback');
}
```

### Logging with Metadata

Always include contextual metadata for debugging:

```typescript
// app/(app)/actions.ts
import { logger } from '@/lib/logger/logger.service';

export async function createUser(data: CreateUserData) {
  logger.info('Creating new user account', {
    email: data.email,
    provider: data.provider,
    timestamp: new Date().toISOString(),
  });

  // ... user creation logic

  logger.info('User account created successfully', {
    userId: user.id,
    email: user.email,
    provider: data.provider,
  });
}
```

### Error Logging

Always include error messages, stack traces, and context:

```typescript
// lib/payments/actions.ts
import { logger } from '@/lib/logger/logger.service';

export async function processPayment(orderId: string) {
  try {
    const result = await stripe.charges.create({...});

    logger.info('Payment processed successfully', {
      orderId,
      chargeId: result.id,
      amount: result.amount
    });

    return result;
  } catch (error) {
    logger.error('Payment processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orderId,
      userId: user.id,
      amount: order.total
    });
    throw error;
  }
}
```

### Server Actions

Log user actions with full context:

```typescript
// app/(app)/actions.ts
'use server';

import { logger } from '@/lib/logger/logger.service';
import { withOrganization } from '@/lib/auth/middleware';

export const createOrganization = withOrganization(
  async (formData: FormData, { user }) => {
    const name = formData.get('name') as string;

    logger.info('Creating organization', {
      name,
      userId: user.id,
      userEmail: user.email,
    });

    try {
      const org = await db.insert(organizations).values({ name });

      logger.info('Organization created successfully', {
        organizationId: org.id,
        name,
        userId: user.id,
      });

      return { success: true, organizationId: org.id };
    } catch (error) {
      logger.error('Failed to create organization', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name,
        userId: user.id,
      });

      return { success: false, error: 'Failed to create organization' };
    }
  }
);
```

::: tip Server Actions Best Practice
Always log both the initiation and completion (success/failure) of important server actions. This creates an audit trail for debugging and compliance. Learn more about [Server Actions](/auth/server-actions-and-hooks).
:::

### API Routes

Log incoming requests and their outcomes:

```typescript
// app/api/webhooks/route.ts
import { logger } from '@/lib/logger/logger.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  logger.http('Webhook request received', {
    method: req.method,
    url: req.url,
    contentType: req.headers.get('content-type'),
  });

  try {
    const body = await req.json();
    const result = await processWebhook(body);

    const duration = Date.now() - startTime;

    logger.info('Webhook processed successfully', {
      url: req.url,
      webhookId: result.id,
      duration: `${duration}ms`,
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      duration: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Middleware Integration

Log requests and measure response times:

```typescript
// middleware.ts
import { logger } from '@/lib/logger/logger.service';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const startTime = Date.now();

  logger.http('Request started', {
    method: req.method,
    path: req.nextUrl.pathname,
    userAgent: req.headers.get('user-agent'),
    ip: req.ip || 'unknown',
  });

  const response = NextResponse.next();

  const duration = Date.now() - startTime;

  logger.http('Request completed', {
    method: req.method,
    path: req.nextUrl.pathname,
    status: response.status,
    duration: `${duration}ms`,
  });

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/app/:path*'],
};
```

## Best Practices

### DO:

✅ **Use appropriate log levels** based on the severity and purpose of the message

✅ **Include contextual metadata** to make logs searchable and actionable:

```typescript
logger.info('User action completed', {
  userId,
  action: 'profile_update',
  timestamp: new Date(),
});
```

✅ **Log errors with full context** including error messages, stack traces, and relevant IDs:

```typescript
logger.error('Operation failed', {
  error: error.message,
  stack: error.stack,
  userId,
  operationId,
});
```

✅ **Use structured logging** with key-value pairs instead of string interpolation:

```typescript
// Good
logger.info('User logged in', { userId: user.id, email: user.email });

// Avoid
logger.info(`User ${user.id} with email ${user.email} logged in`);
```

✅ **Log important state changes** and business events:

```typescript
logger.info('Subscription upgraded', {
  organizationId,
  oldPlan: 'basic',
  newPlan: 'pro',
  userId,
});
```

### DON'T:

❌ **Never log sensitive information** such as passwords, API keys, tokens, or credit card numbers:

```typescript
// NEVER do this
logger.info('User credentials', { password: user.password }); // ❌
logger.debug('API call', { apiKey: process.env.SECRET_KEY }); // ❌
```

❌ **Avoid excessive logging** in tight loops or high-frequency operations:

```typescript
// Avoid in production
items.forEach((item) => {
  logger.debug('Processing item', { item }); // This could generate thousands of logs
});
```

❌ **Don't use console.log** - always use the logger instead:

```typescript
// Bad
console.log('User logged in');

// Good
logger.info('User logged in', { userId });
```

❌ **Avoid logging entire objects** with potentially large or circular references:

```typescript
// Risky
logger.debug('Request object', { req }); // Could be massive

// Better - log specific properties
logger.debug('Request details', {
  method: req.method,
  url: req.url,
  headers: req.headers,
});
```

## Log Files

In production, logs are written to the `logs/` directory with daily rotation:

```
logs/
├── application-2025-09-30.log      # Combined logs for the day
├── error-2025-09-30.log            # Error logs only
├── application-2025-09-29.log      # Previous day
└── error-2025-09-29.log
```

**Log Rotation Configuration**:

- New log file created daily at midnight
- Maximum of 14 days of logs retained (configurable in `logger.service.ts`)
- Old logs automatically deleted to prevent disk space issues
- Maximum file size: 20MB per log file before rotation

## Troubleshooting

### Logs Not Appearing in Console

**Issue**: Logs not showing in development console
**Solution**:

- Verify `NODE_ENV=development` in your `.env.local`
- Check that the logger is imported correctly: `import { logger } from '@/lib/logger/logger.service'`
- Ensure you're not filtering console output in your terminal

### Logs Not Written to Files in Production

**Issue**: Log files not being created in production
**Solution**:

- Verify `NODE_ENV=production`
- Ensure the `logs/` directory exists and has write permissions
- Check disk space availability
- Review application logs for Winston-related errors

### Too Many Log Files

**Issue**: `logs/` directory growing too large
**Solution**:

- Adjust `maxFiles` setting in `lib/logger/logger.service.ts` (default: '14d')
- Reduce log verbosity in production by adjusting log level
- Implement log archiving or external log aggregation

### Performance Impact

**Issue**: Logging causing performance degradation
**Solution**:

- Reduce log level in production (set to `warn` or `error` only)
- Avoid logging in high-frequency loops
- Use asynchronous transports (already configured)
- Consider sampling logs for high-traffic endpoints

## Advanced Configuration

To modify logger configuration, edit `lib/logger/logger.service.ts`:

```typescript
// Change log retention period
maxFiles: '30d', // Keep logs for 30 days

// Adjust maximum file size
maxSize: '50m', // Rotate when file reaches 50MB

// Change production log level
level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
```

## Integration with External Services

For production monitoring, consider integrating with external logging services:

- **DataDog**: Add DataDog Winston transport
- **LogRocket**: For frontend error tracking
- **Sentry**: For error monitoring and alerting
- **CloudWatch**: For AWS-hosted applications
- **ELK Stack**: For self-hosted log aggregation

Add custom transports in `lib/logger/logger.service.ts` as needed.

## Related Documentation

### Internal Links

- [Environment Configuration](/environment-configuration) - Setting up `NODE_ENV` and other environment variables
- [Server Actions & Hooks](/auth/server-actions-and-hooks) - Using logging in server actions
- [Stripe Integration](/stripe/stripe-integration) - Payment logging patterns
- [Email System](/emails) - Email delivery logging

### External Resources

- [Winston GitHub Repository](https://github.com/winstonjs/winston) - Official Winston documentation
- [winston-daily-rotate-file](https://www.npmjs.com/package/winston-daily-rotate-file) - File rotation transport
- [Winston Best Practices](https://blog.logrocket.com/logging-node-js-using-winston/) - Community guide

---

**Last Updated:** 2025-09-30
**Status:** ✅ Complete
