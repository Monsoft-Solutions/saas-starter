---
title: Usage Guide - Async Job Processing with QStash
description: How to enqueue jobs and use available job types in the QStash job processing system
---

# Usage Guide

How to enqueue jobs and use available job types in the QStash job processing system.

## Enqueueing Jobs

The `JobDispatcher` provides a unified interface for enqueueing all job types:

```typescript
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';

// Basic enqueueing
const jobId = await jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, {
  template: 'welcome',
  to: 'user@example.com',
  data: { recipientName: 'John Doe' },
});

// With metadata for tracking
await jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, payload, {
  userId: 123,
  organizationId: 456,
  idempotencyKey: 'unique-operation-id',
});

// With custom options
await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  payload,
  { userId: 123 },
  {
    delay: 60000, // Delay 60 seconds
    retries: 5,
    callback: 'https://example.com/callback',
    headers: { 'X-Custom': 'value' },
  }
);
```

### Enqueue Options

```typescript
interface EnqueueJobOptions {
  delay?: number; // Delay in milliseconds
  retries?: number; // Override default retries
  callback?: string; // Success callback URL
  failureCallback?: string; // Failure callback URL
  headers?: Record<string, string>; // Custom headers
}
```

## Available Job Types

### Email Jobs

Send transactional emails asynchronously:

```typescript
import { sendWelcomeEmailAsync } from '@/lib/emails/enqueue';

// Welcome email
await sendWelcomeEmailAsync(
  {
    to: 'user@example.com',
    recipientName: 'John Doe',
  },
  { userId: 123 }
);

// Password reset
await sendPasswordResetEmailAsync(
  {
    to: 'user@example.com',
    recipientName: 'John Doe',
    resetUrl: 'https://example.com/reset/token',
  },
  { userId: 123 }
);

// Team invitation
await sendTeamInvitationEmailAsync(
  {
    to: 'invited@example.com',
    recipientName: 'Jane Doe',
    inviterName: 'John Doe',
    organizationName: 'Acme Corp',
    invitationUrl: 'https://example.com/invite/token',
  },
  { userId: 123, organizationId: 456 }
);

// Subscription notifications
await sendSubscriptionCreatedEmailAsync(
  {
    to: 'user@example.com',
    recipientName: 'John Doe',
    planName: 'Pro Plan',
    amount: '29.99',
    dashboardUrl: 'https://example.com/app/general',
  },
  { userId: 123, organizationId: 456 }
);

await sendPaymentFailedEmailAsync(
  {
    to: 'user@example.com',
    recipientName: 'John Doe',
    amountDue: '29.99',
    paymentDetailsUrl: 'https://example.com/app/settings/billing',
  },
  { userId: 123, organizationId: 456 }
);
```

#### Supported Email Templates

- `welcome` - Welcome new users
- `passwordReset` - Password reset link
- `passwordChanged` - Password change confirmation
- `emailChange` - Email change confirmation
- `teamInvitation` - Team member invitation
- `subscriptionCreated` - Subscription confirmation
- `paymentFailed` - Payment failure notification

### Webhook Jobs

Process webhooks asynchronously to avoid timeouts:

```typescript
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';

// Generic webhook processing
await jobDispatcher.enqueue(JOB_TYPES.PROCESS_WEBHOOK, {
  source: 'github',
  event: 'pull_request',
  data: webhookPayload,
});

// Stripe webhook processing
await jobDispatcher.enqueue(JOB_TYPES.PROCESS_STRIPE_WEBHOOK, {
  eventType: 'customer.subscription.updated',
  eventData: stripeEvent.data.object,
  ipAddress: request.headers.get('x-forwarded-for'),
});
```

### Report Generation Jobs

Generate reports without blocking the request:

```typescript
await jobDispatcher.enqueue(
  JOB_TYPES.GENERATE_REPORT,
  {
    reportType: 'monthly-analytics',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    format: 'pdf',
  },
  { userId: 123, organizationId: 456 }
);
```

### Data Export Jobs

Export large datasets asynchronously:

```typescript
await jobDispatcher.enqueue(
  JOB_TYPES.EXPORT_DATA,
  {
    entityType: 'users',
    format: 'csv',
    filters: { createdAfter: '2025-01-01' },
  },
  { userId: 123, organizationId: 456 }
);
```

### Scheduled Jobs

Schedule recurring jobs with cron expressions:

```typescript
// Run cleanup every day at 2 AM
const scheduleId = await jobDispatcher.schedule(
  JOB_TYPES.CLEANUP_OLD_DATA,
  '0 2 * * *',
  { retention: 30 },
  { organizationId: 456 }
);
```

#### Cron Expression Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, 0 or 7 = Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

## Job Patterns and Best Practices

### Error Handling

Always handle potential job failures:

```typescript
try {
  const jobId = await jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, payload);
  console.log('Job enqueued:', jobId);
} catch (error) {
  console.error('Failed to enqueue job:', error);
  // Fallback to synchronous processing or show error to user
}
```

### Idempotency

Use idempotency keys for operations that might be retried:

```typescript
await jobDispatcher.enqueue(JOB_TYPES.PROCESS_WEBHOOK, webhookPayload, {
  userId: user.id,
  idempotencyKey: `webhook-${webhookId}`, // Unique per webhook
});
```

### Batch Operations

For multiple related operations, consider batching:

```typescript
// Instead of multiple separate jobs
await Promise.all([
  jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, email1Payload),
  jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, email2Payload),
  jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, email3Payload),
]);

// Use a single batch job
await jobDispatcher.enqueue(JOB_TYPES.SEND_BATCH_EMAILS, {
  emails: [email1Payload, email2Payload, email3Payload],
});
```

### Monitoring Job Status

Track job completion for user feedback:

```typescript
import { getJobExecutionByJobId } from '@/lib/db/queries';

const jobId = await jobDispatcher.enqueue(JOB_TYPES.EXPORT_DATA, payload);

// Poll for completion (in a real app, use WebSockets or Server-Sent Events)
const checkJobStatus = async () => {
  const execution = await getJobExecutionByJobId(jobId);
  if (execution?.status === 'completed') {
    // Show success message
  } else if (execution?.status === 'failed') {
    // Show error message
  }
};
```

## Next Steps

- **[Core Concepts](../core-concepts)** - Understand job types and schemas
- **[Email Jobs](../email-jobs)** - Deep dive into email job specifics
- **[Webhook Jobs](../webhook-jobs)** - Webhook processing details
- **[Creating Jobs](../creating-jobs)** - Learn how to add new job types
