---
title: Async Job Processing with QStash
description: Complete guide to the asynchronous job processing system using Upstash QStash for background tasks, email delivery, and webhook processing
---

# Async Job Processing with QStash

Complete guide to the asynchronous job processing system using Upstash QStash for background tasks, email delivery, and webhook processing.

> **📚 Documentation Structure**
>
> This documentation has been split into multiple focused guides for better navigation:
>
> - **[Setup Guide](./async-job-processing/setup.md)** - Local development and production setup
> - **[Core Concepts](./async-job-processing/core-concepts.md)** - Job types, schemas, lifecycle, and retry policies
> - **[Usage Guide](./async-job-processing/usage.md)** - How to enqueue jobs and available job types
> - **[Creating Jobs](./async-job-processing/creating-jobs.md)** - Step-by-step guide for adding new job types
> - **[Email Jobs](./async-job-processing/email-jobs.md)** - Email-specific deep dive and best practices
> - **[Webhook Jobs](./async-job-processing/webhook-jobs.md)** - Webhook processing details and examples
> - **[Monitoring](./async-job-processing/monitoring.md)** - Debugging, monitoring, and troubleshooting
> - **[Testing](./async-job-processing/testing.md)** - Testing strategies and examples
> - **[Deployment](./async-job-processing/deployment.md)** - Production deployment guide
> - **[API Reference](./async-job-processing/api-reference.md)** - Complete API documentation

## Overview

The SaaS starter application includes a robust asynchronous job processing system built on [Upstash QStash](https://upstash.com/docs/qstash/overall/getstarted). This system enables non-blocking background task execution with automatic retries, monitoring, and error handling.

### Key Benefits

- **Non-blocking Operations** - API endpoints respond immediately without waiting for long-running tasks
- **Automatic Retries** - Failed jobs are automatically retried with configurable backoff strategies
- **Reliability** - Jobs are persisted in PostgreSQL for tracking and observability
- **Scalability** - QStash handles job distribution and execution across multiple workers
- **Monitoring** - Track job lifecycle (pending → processing → completed/failed) in the database
- **Type Safety** - Full TypeScript support with Zod schema validation
- **Local Development** - Built-in local QStash server for testing without cloud credentials

## Documentation Structure

This documentation is organized into focused guides for better navigation:

| Guide                                                        | Description                                         |
| ------------------------------------------------------------ | --------------------------------------------------- |
| **[Setup Guide](./async-job-processing/setup.md)**           | Local development and production setup instructions |
| **[Core Concepts](./async-job-processing/core-concepts.md)** | Job types, schemas, lifecycle, and retry policies   |
| **[Usage Guide](./async-job-processing/usage.md)**           | How to enqueue jobs and available job types         |
| **[Creating Jobs](./async-job-processing/creating-jobs.md)** | Step-by-step guide for adding new job types         |
| **[Email Jobs](./async-job-processing/email-jobs.md)**       | Email-specific deep dive and best practices         |
| **[Webhook Jobs](./async-job-processing/webhook-jobs.md)**   | Webhook processing details and examples             |
| **[Monitoring](./async-job-processing/monitoring.md)**       | Debugging, monitoring, and troubleshooting          |
| **[Testing](./async-job-processing/testing.md)**             | Testing strategies and examples                     |
| **[Deployment](./async-job-processing/deployment.md)**       | Production deployment guide                         |
| **[API Reference](./async-job-processing/api-reference.md)** | Complete API documentation                          |

## Quick Start

### Local Development

1. **Start the development server:**

   ```bash
   pnpm dev
   ```

2. **Copy QStash environment variables** from CLI output to `.env.local`

3. **Test job processing:**

   ```typescript
   import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
   import { JOB_TYPES } from '@/lib/types/jobs';

   await jobDispatcher.enqueue(
     JOB_TYPES.SEND_EMAIL,
     {
       template: 'welcome',
       to: 'test@example.com',
       data: { recipientName: 'Test User' },
     },
     { userId: 1 }
   );
   ```

### Production Setup

1. Create Upstash account and QStash instance
2. Configure production environment variables
3. Run database migrations
4. Monitor via QStash dashboard

See the **[Setup Guide](./async-job-processing/setup.md)** for complete instructions.

## Common Job Operations

### Send Email Asynchronously

```typescript
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';

await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  {
    template: 'welcome',
    to: 'user@example.com',
    data: { recipientName: 'John Doe' },
  },
  { userId: 123 }
);
```

### Process Webhook

```typescript
await jobDispatcher.enqueue(JOB_TYPES.PROCESS_WEBHOOK, {
  source: 'github',
  event: 'push',
  data: webhookPayload,
});
```

### Schedule Recurring Job

```typescript
await jobDispatcher.schedule(
  JOB_TYPES.CLEANUP_OLD_DATA,
  '0 2 * * *', // Daily at 2 AM
  { retention: 30 }
);
```

## Email Jobs

```typescript
import { sendWelcomeEmailAsync } from '@/lib/emails/enqueue';

await sendWelcomeEmailAsync(
  {
    to: 'user@example.com',
    recipientName: 'John Doe',
  },
  { userId: 123 }
);
```

## Webhook Processing

```typescript
// In webhook handler
await jobDispatcher.enqueue(JOB_TYPES.PROCESS_STRIPE_WEBHOOK, {
  eventType: event.type,
  eventData: event.data.object,
  ipAddress: request.headers.get('x-forwarded-for'),
});
```

## External Resources

- [Upstash QStash Documentation](https://upstash.com/docs/qstash)
- [QStash REST API Reference](https://upstash.com/docs/qstash/api/messages/create)
- [Zod Documentation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Status:** ✅ Complete - Documentation split into focused guides for better navigation
