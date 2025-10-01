---
title: Async Job Processing with QStash
description: Complete guide to the asynchronous job processing system using Upstash QStash for background tasks, email delivery, and webhook processing
---

# Async Job Processing with QStash

Complete guide to the asynchronous job processing system using Upstash QStash for background tasks, email delivery, and webhook processing.

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

### Architecture Overview

```
┌─────────────────┐
│  Application    │
│  (Enqueue Job)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  JobDispatcher  │─────▶│  PostgreSQL      │
│  (Record Job)   │      │  (job_executions)│
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  QStash Cloud   │
│  (Queue & Route)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Job Worker     │
│  (Process Job)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Update Status  │
│  (completed/    │
│   failed)       │
└─────────────────┘
```

## Getting Started

### Local Development Setup

The local development setup is streamlined with automatic QStash server initialization.

#### Step 1: Start Development Server

```bash
pnpm dev
```

This command automatically starts:
- Next.js development server (Turbopack)
- Stripe webhook listener
- **QStash local server** (`npx qstash dev`)

#### Step 2: Copy QStash Environment Variables

**CRITICAL**: When the QStash CLI starts, it outputs environment variables that must be copied to your `.env.local` file:

```bash
# QStash CLI output (example):
QStash is now listening on http://localhost:8080

Use these environment variables:
QSTASH_URL=http://localhost:8080
QSTASH_TOKEN=local_test_token_abc123
QSTASH_CURRENT_SIGNING_KEY=local_signing_key_xyz789
QSTASH_NEXT_SIGNING_KEY=local_next_key_def456
```

**Copy these values to your `.env.local` file:**

```bash
# QStash Configuration (Local Development)
QSTASH_URL=http://localhost:8080
QSTASH_TOKEN=local_test_token_abc123
QSTASH_CURRENT_SIGNING_KEY=local_signing_key_xyz789
QSTASH_NEXT_SIGNING_KEY=local_next_key_def456
```

::: warning IMPORTANT
The local QStash server generates new keys each time it starts. You must update `.env.local` with the new values after every restart of the development server.
:::

#### Step 3: Verify Setup

Test that jobs are working:

```typescript
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';

// Enqueue a test email job
await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  {
    template: 'welcome',
    to: 'test@example.com',
    data: { recipientName: 'Test User' }
  },
  { userId: 1 }
);
```

Check the logs to see job processing:
```
[jobs] Enqueueing job
[jobs] Job enqueued successfully
[jobs] Processing job
[jobs] Job processed successfully
```

### Production Setup

For production deployment, use Upstash's cloud-hosted QStash service.

#### Step 1: Create Upstash Account

1. Sign up at [https://console.upstash.com](https://console.upstash.com)
2. Navigate to the QStash section
3. Create a new QStash instance

#### Step 2: Get Credentials

From the QStash dashboard, copy:
- QStash URL (usually `https://qstash.upstash.io`)
- QStash Token
- Current Signing Key
- Next Signing Key

#### Step 3: Configure Environment Variables

Add to your production environment (`.env.production` or hosting platform):

```bash
# QStash Configuration (Production)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_production_token
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key
```

::: tip
Never commit actual production credentials to version control. Use your hosting platform's environment variable management (Vercel, AWS, etc.).
:::

#### Step 4: Run Database Migrations

Ensure the `job_executions` table exists:

```bash
pnpm db:migrate:prod
```

## Core Concepts

### Job Types and Registry

All job types are centrally defined in the **Job Registry** (`/lib/jobs/job-registry.ts`), which maps job types to their configuration:

```typescript
// Available job types
export const JOB_TYPES = {
  SEND_EMAIL: 'send-email',
  PROCESS_WEBHOOK: 'process-webhook',
  PROCESS_STRIPE_WEBHOOK: 'process-stripe-webhook',
  EXPORT_DATA: 'export-data',
  GENERATE_REPORT: 'generate-report',
  CLEANUP_OLD_DATA: 'cleanup-old-data',
} as const;

// Job configuration
export const JOB_REGISTRY: Record<JobType, JobConfig> = {
  [JOB_TYPES.SEND_EMAIL]: {
    type: JOB_TYPES.SEND_EMAIL,
    endpoint: '/api/jobs/email',
    retries: 3,
    timeout: 30,
    description: 'Send transactional emails via Resend',
  },
  // ... other job types
};
```

**Configuration Properties:**
- `type` - Unique job type identifier
- `endpoint` - API route that processes the job
- `retries` - Number of retry attempts on failure
- `timeout` - Maximum execution time in seconds
- `description` - Human-readable description

### Job Schemas and Validation

Every job type has a corresponding Zod schema for type-safe validation:

```typescript
// Example: Send Email Job Schema
export const SendEmailJobPayloadSchema = z.object({
  template: z.enum([
    'welcome',
    'passwordReset',
    'passwordChanged',
    'emailChange',
    'teamInvitation',
    'subscriptionCreated',
    'paymentFailed',
  ]),
  to: z.string().email(),
  data: z.record(z.unknown()),
});

export const SendEmailJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.SEND_EMAIL),
  payload: SendEmailJobPayloadSchema,
});
```

**Base Job Schema:**

All jobs extend the base schema which includes:

```typescript
export const BaseJobMetadataSchema = z.object({
  userId: z.number().optional(),
  organizationId: z.number().optional(),
  idempotencyKey: z.string().optional(),
  createdAt: z.string(),
});

export const BaseJobSchema = z.object({
  jobId: z.string().uuid(),
  type: z.string(),
  payload: z.record(z.unknown()),
  metadata: BaseJobMetadataSchema,
});
```

### Job Lifecycle

Jobs progress through the following states:

1. **Pending** - Job created and queued in QStash
2. **Processing** - Job received by worker and executing
3. **Completed** - Job finished successfully
4. **Failed** - Job encountered an error (may retry)

The lifecycle is tracked in the `job_executions` table:

```typescript
export const jobExecutions = pgTable('job_executions', {
  id: serial('id').primaryKey(),
  jobId: varchar('job_id', { length: 255 }).notNull().unique(),
  jobType: varchar('job_type', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  payload: jsonb('payload').notNull(),
  result: jsonb('result'),
  error: text('error'),
  retryCount: integer('retry_count').default(0).notNull(),
  userId: integer('user_id'),
  organizationId: integer('organization_id'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Retry Policies

QStash automatically handles retries based on the job configuration:

```typescript
// Default retries from registry
await jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, payload);

// Custom retries per job
await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  payload,
  {},
  { retries: 5 } // Override default
);
```

**Retry Behavior:**
- Exponential backoff between retries
- Each retry increments `retryCount` in the database
- After all retries exhausted, job status set to `failed`
- Failed jobs can be manually retried via the database

## Using Jobs

### Enqueueing Jobs

The `JobDispatcher` provides a unified interface for enqueueing all job types:

```typescript
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';

// Basic enqueueing
const jobId = await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  {
    template: 'welcome',
    to: 'user@example.com',
    data: { recipientName: 'John Doe' }
  }
);

// With metadata for tracking
await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  payload,
  {
    userId: 123,
    organizationId: 456,
    idempotencyKey: 'unique-operation-id'
  }
);

// With custom options
await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  payload,
  { userId: 123 },
  {
    delay: 60000, // Delay 60 seconds
    retries: 5,
    callback: 'https://example.com/callback',
    headers: { 'X-Custom': 'value' }
  }
);
```

### Available Job Types

#### Email Jobs

Send transactional emails asynchronously:

```typescript
import { sendWelcomeEmailAsync } from '@/lib/emails/enqueue';

// Welcome email
await sendWelcomeEmailAsync({
  to: 'user@example.com',
  recipientName: 'John Doe',
}, { userId: 123 });

// Password reset
await sendPasswordResetEmailAsync({
  to: 'user@example.com',
  recipientName: 'John Doe',
  resetUrl: 'https://example.com/reset/token',
}, { userId: 123 });

// Team invitation
await sendTeamInvitationEmailAsync({
  to: 'invited@example.com',
  recipientName: 'Jane Doe',
  inviterName: 'John Doe',
  organizationName: 'Acme Corp',
  invitationUrl: 'https://example.com/invite/token',
}, { userId: 123, organizationId: 456 });

// Subscription notifications
await sendSubscriptionCreatedEmailAsync({
  to: 'user@example.com',
  recipientName: 'John Doe',
  planName: 'Pro Plan',
  amount: '29.99',
  dashboardUrl: 'https://example.com/app/general',
}, { userId: 123, organizationId: 456 });

await sendPaymentFailedEmailAsync({
  to: 'user@example.com',
  recipientName: 'John Doe',
  amountDue: '29.99',
  paymentDetailsUrl: 'https://example.com/app/settings/billing',
}, { userId: 123, organizationId: 456 });
```

**Supported Email Templates:**
- `welcome` - Welcome new users
- `passwordReset` - Password reset link
- `passwordChanged` - Password change confirmation
- `emailChange` - Email change confirmation
- `teamInvitation` - Team member invitation
- `subscriptionCreated` - Subscription confirmation
- `paymentFailed` - Payment failure notification

#### Webhook Jobs

Process webhooks asynchronously to avoid timeouts:

```typescript
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';

// Generic webhook processing
await jobDispatcher.enqueue(
  JOB_TYPES.PROCESS_WEBHOOK,
  {
    source: 'github',
    event: 'pull_request',
    data: webhookPayload,
  }
);

// Stripe webhook processing
await jobDispatcher.enqueue(
  JOB_TYPES.PROCESS_STRIPE_WEBHOOK,
  {
    eventType: 'customer.subscription.updated',
    eventData: stripeEvent.data.object,
    ipAddress: request.headers.get('x-forwarded-for'),
  }
);
```

#### Report Generation Jobs

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

#### Data Export Jobs

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

#### Scheduled Jobs

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

## Creating New Job Types

Follow these steps to add a new job type to the system:

### Step 1: Define Job Type

Add to `/lib/types/jobs/enums/job-type.enum.ts`:

```typescript
export const JOB_TYPES = {
  // ... existing types
  SEND_SMS: 'send-sms', // New type
} as const;
```

### Step 2: Create Job Schema

Create `/lib/types/jobs/schemas/send-sms-job.schema.ts`:

```typescript
import { z } from 'zod';
import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '..';

export const SendSmsJobPayloadSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164 format
  message: z.string().max(160),
  metadata: z.record(z.unknown()).optional(),
});

export const SendSmsJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.SEND_SMS),
  payload: SendSmsJobPayloadSchema,
});

export type SendSmsJobPayload = z.infer<typeof SendSmsJobPayloadSchema>;
export type SendSmsJob = z.infer<typeof SendSmsJobSchema>;
```

### Step 3: Register Job Configuration

Add to `/lib/jobs/job-registry.ts`:

```typescript
export const JOB_REGISTRY: Record<JobType, JobConfig> = {
  // ... existing configs
  [JOB_TYPES.SEND_SMS]: {
    type: JOB_TYPES.SEND_SMS,
    endpoint: '/api/jobs/sms',
    retries: 3,
    timeout: 30,
    description: 'Send SMS notifications via Twilio',
  },
};
```

### Step 4: Create Job Worker

Create `/app/api/jobs/sms/route.ts`:

```typescript
import { createJobWorker } from '@/lib/jobs/job-worker.handler';
import type { BaseJob } from '@/lib/types/jobs/schemas/base-job.schema';
import type { SendSmsJobPayload } from '@/lib/types/jobs/schemas/send-sms-job.schema';
import logger from '@/lib/logger/logger.service';

const smsJobHandler = async (
  payload: SendSmsJobPayload,
  job: BaseJob & { payload: SendSmsJobPayload }
) => {
  const { to, message } = payload;

  logger.info('[jobs] Processing SMS job', {
    jobId: job.jobId,
    to,
  });

  // Your SMS sending logic here
  // await twilioClient.messages.create({ to, body: message });

  logger.info('[jobs] SMS sent successfully', {
    jobId: job.jobId,
    to,
  });
};

export const POST = createJobWorker<SendSmsJobPayload>(smsJobHandler);
```

### Step 5: Create Service Function (Optional)

Create `/lib/jobs/services/sms-job.service.ts`:

```typescript
import 'server-only';
import { jobDispatcher } from '../job-dispatcher.service';
import { JOB_TYPES } from '../../types/jobs';
import type { SendSmsJobPayload } from '../../types/jobs/schemas/send-sms-job.schema';
import type { BaseJobMetadata } from '../../types/jobs/schemas/base-job.schema';

export const enqueueSmsJob = async (
  payload: SendSmsJobPayload,
  metadata: Pick<BaseJobMetadata, 'userId' | 'organizationId'> = {}
) => {
  return jobDispatcher.enqueue(JOB_TYPES.SEND_SMS, payload, metadata, {
    retries: 3,
    delay: 0,
  });
};
```

### Step 6: Write Tests

Create `/tests/jobs/sms-job.worker.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('SMS Job Worker', () => {
  it('should send SMS successfully', async () => {
    // Test implementation
  });

  it('should handle SMS sending errors', async () => {
    // Test implementation
  });

  it('should validate phone number format', async () => {
    // Test implementation
  });
});
```

### Step 7: Use Your New Job

```typescript
import { enqueueSmsJob } from '@/lib/jobs/services/sms-job.service';

await enqueueSmsJob(
  {
    to: '+12025551234',
    message: 'Your verification code is: 123456',
  },
  { userId: 123 }
);
```

## Email Jobs Deep Dive

### Async vs Sync Email Sending

The application provides two approaches for sending emails:

**Synchronous (Direct):**
```typescript
import { sendWelcomeEmail } from '@/lib/emails/dispatchers';

// Blocks until email is sent
await sendWelcomeEmail({
  to: 'user@example.com',
  recipientName: 'John Doe',
});
```

**Asynchronous (Job Queue):**
```typescript
import { sendWelcomeEmailAsync } from '@/lib/emails/enqueue';

// Returns immediately, email sent in background
await sendWelcomeEmailAsync({
  to: 'user@example.com',
  recipientName: 'John Doe',
}, { userId: 123 });
```

### When to Use Async Email Jobs

Use async email jobs when:
- Sending emails from API routes that need fast response times
- Sending multiple emails in a batch operation
- Email delivery is not critical to the user experience
- You want automatic retries on failure

Use sync email sending when:
- Email delivery needs to be confirmed before proceeding
- Debugging email issues in development
- Sending critical security-related emails where immediate feedback is needed

### Email Job Implementation

The email job worker routes to existing email dispatchers:

```typescript
// Email job handler (simplified)
const emailJobHandler = async (payload: SendEmailJobPayload, job: BaseJob) => {
  const { template, to, data } = payload;

  switch (template) {
    case 'welcome':
      await sendWelcomeEmail({ to, ...data });
      return;
    case 'passwordReset':
      await sendPasswordResetEmail({ to, ...data });
      return;
    // ... other templates
  }
};
```

### Migration Guide: Converting to Async Emails

To migrate existing synchronous email calls to asynchronous:

**Before:**
```typescript
import { sendTeamInvitationEmail } from '@/lib/emails/dispatchers';

await sendTeamInvitationEmail({
  to: invitedUserEmail,
  recipientName: invitedUser.name,
  inviterName: currentUser.name,
  organizationName: org.name,
  invitationUrl: inviteLink,
});
```

**After:**
```typescript
import { sendTeamInvitationEmailAsync } from '@/lib/emails/enqueue';

await sendTeamInvitationEmailAsync(
  {
    to: invitedUserEmail,
    recipientName: invitedUser.name,
    inviterName: currentUser.name,
    organizationName: org.name,
    invitationUrl: inviteLink,
  },
  {
    userId: currentUser.id,
    organizationId: org.id
  }
);
```

## Webhook Jobs Deep Dive

### Stripe Webhook Processing

Stripe webhooks are processed asynchronously to ensure fast webhook endpoint responses (required by Stripe):

```typescript
// app/api/stripe/webhook/route.ts
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';

export async function POST(request: Request) {
  // Verify webhook signature
  const event = await stripe.webhooks.constructEvent(
    body,
    signature,
    webhookSecret
  );

  // Enqueue job for async processing
  await jobDispatcher.enqueue(
    JOB_TYPES.PROCESS_STRIPE_WEBHOOK,
    {
      eventType: event.type,
      eventData: event.data.object,
      ipAddress: request.headers.get('x-forwarded-for'),
    }
  );

  // Return 200 immediately to Stripe
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
  });
}
```

**Handled Stripe Events:**
- `checkout.session.completed` - Subscription created
- `invoice.payment_failed` - Payment failure
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancellation

### Generic Webhook Processing

For other webhook sources:

```typescript
await jobDispatcher.enqueue(
  JOB_TYPES.PROCESS_WEBHOOK,
  {
    source: 'github',
    event: 'push',
    data: webhookPayload,
  }
);
```

## Monitoring & Debugging

### Viewing Job Executions

Query the database to see job history:

```sql
-- Recent jobs
SELECT
  job_id,
  job_type,
  status,
  retry_count,
  created_at,
  completed_at
FROM job_executions
ORDER BY created_at DESC
LIMIT 50;

-- Failed jobs
SELECT
  job_id,
  job_type,
  error,
  retry_count,
  payload
FROM job_executions
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Job statistics by type
SELECT
  job_type,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM job_executions
WHERE completed_at IS NOT NULL
GROUP BY job_type, status;
```

### Using Database Queries

The application provides helper functions for querying job executions:

```typescript
import {
  getJobExecutionByJobId,
  updateJobExecution
} from '@/lib/db/queries';

// Get job status
const execution = await getJobExecutionByJobId(jobId);
console.log(execution.status, execution.error);

// Manually retry a failed job
await updateJobExecution(jobId, {
  status: 'pending',
  error: null,
  retryCount: 0,
});
```

### QStash Dashboard

Access the QStash dashboard for real-time monitoring:

**Local Development:**
- QStash CLI runs at `http://localhost:8080`
- No web dashboard for local server

**Production:**
- Log in to [Upstash Console](https://console.upstash.com)
- Navigate to QStash section
- View messages, schedules, and delivery logs

### Application Logs

The job system integrates with the Winston logging system:

```typescript
import logger from '@/lib/logger/logger.service';

// View logs in console or log files
// Logs are located in: /logs/
```

**Key Log Patterns:**
```
[jobs] Enqueueing job { jobId, type, url }
[jobs] Job enqueued successfully { jobId, type }
[jobs] Processing job { jobId, type }
[jobs] Job processed successfully { jobId, type }
[jobs] Job processing failed { jobId, type, error }
```

### Common Failure Scenarios

#### 1. Signature Verification Failed

**Error:** `Invalid QStash signature`

**Causes:**
- Incorrect signing keys in environment variables
- Request URL mismatch (check BASE_URL)
- Local QStash server restarted with new keys

**Solution:**
```bash
# Ensure environment variables match QStash CLI output
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...

# Verify BASE_URL matches exactly
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### 2. Job Not Processing

**Error:** Job stuck in `pending` status

**Causes:**
- QStash can't reach your endpoint
- Firewall blocking QStash IP addresses
- Incorrect endpoint URL in job registry

**Solution:**
```typescript
// Verify endpoint is correct in job registry
export const JOB_REGISTRY = {
  [JOB_TYPES.SEND_EMAIL]: {
    endpoint: '/api/jobs/email', // Correct path
    // ...
  },
};

// Check endpoint is accessible
curl http://localhost:3000/api/jobs/email
```

#### 3. Payload Validation Failed

**Error:** `Invalid job payload`

**Causes:**
- Payload doesn't match Zod schema
- Missing required fields
- Incorrect data types

**Solution:**
```typescript
// Validate payload before enqueueing
import { SendEmailJobPayloadSchema } from '@/lib/types/jobs/schemas/send-email-job.schema';

const result = SendEmailJobPayloadSchema.safeParse(payload);
if (!result.success) {
  console.error('Validation errors:', result.error.errors);
}
```

#### 4. Job Execution Timeout

**Error:** Job fails after timeout period

**Causes:**
- Job takes longer than configured timeout
- External API not responding
- Database query too slow

**Solution:**
```typescript
// Increase timeout in job registry
export const JOB_REGISTRY = {
  [JOB_TYPES.GENERATE_REPORT]: {
    timeout: 300, // Increase from 180 to 300 seconds
    // ...
  },
};
```

### Debugging Failed Jobs

#### Step 1: Check Job Execution Record

```typescript
import { getJobExecutionByJobId } from '@/lib/db/queries';

const execution = await getJobExecutionByJobId('job-uuid');
console.log({
  status: execution.status,
  error: execution.error,
  retryCount: execution.retryCount,
  payload: execution.payload,
});
```

#### Step 2: Review Application Logs

```bash
# View recent job logs
tail -f logs/application-*.log | grep '\[jobs\]'
```

#### Step 3: Test Job Handler Directly

```typescript
// Create a test route to bypass QStash
// app/api/test/job/route.ts
import { emailJobHandler } from '@/app/api/jobs/email/route';

export async function POST(request: Request) {
  const payload = await request.json();

  await emailJobHandler(payload, {
    jobId: 'test-job',
    type: 'send-email',
    payload,
    metadata: { createdAt: new Date().toISOString() },
  });

  return Response.json({ success: true });
}
```

#### Step 4: Manually Retry Failed Job

```typescript
import { updateJobExecution } from '@/lib/db/queries';
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';

// Get failed job
const execution = await getJobExecutionByJobId(failedJobId);

// Reset and retry
await updateJobExecution(failedJobId, {
  status: 'pending',
  error: null,
  retryCount: 0,
});

// Re-enqueue
await jobDispatcher.enqueue(
  execution.jobType,
  execution.payload.payload,
  execution.payload.metadata
);
```

## Testing

### Unit Testing Job Services

Test job enqueueing logic:

```typescript
// tests/jobs/job-dispatcher.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobDispatcher } from '@/lib/jobs/job-dispatcher.service';

describe('Job Dispatcher Service', () => {
  let mockQStash: any;
  let mockCreateJobExecution: any;

  beforeEach(() => {
    mockQStash = {
      publishJSON: vi.fn().mockResolvedValue({ messageId: 'msg_123' }),
    };

    mockCreateJobExecution = vi.fn().mockResolvedValue({
      id: 1,
      jobId: 'test-job-id',
      status: 'pending',
    });

    // Setup mocks
    vi.doMock('@/lib/jobs/qstash.client', () => ({ qstash: mockQStash }));
    vi.doMock('@/lib/db/queries', () => ({
      createJobExecution: mockCreateJobExecution
    }));
  });

  it('should enqueue a job successfully', async () => {
    const dispatcher = new JobDispatcher();

    const jobId = await dispatcher.enqueue(
      'send-email' as any,
      { to: 'test@example.com', template: 'welcome' },
      { userId: 1 }
    );

    expect(jobId).toBeTruthy();
    expect(mockCreateJobExecution).toHaveBeenCalled();
    expect(mockQStash.publishJSON).toHaveBeenCalled();
  });

  it('should handle QStash publish errors', async () => {
    mockQStash.publishJSON.mockRejectedValueOnce(
      new Error('QStash publish failed')
    );

    const dispatcher = new JobDispatcher();

    await expect(
      dispatcher.enqueue('send-email' as any, { to: 'test@example.com' }, {})
    ).rejects.toThrow('QStash publish failed');
  });
});
```

### Integration Testing Job Workers

Test complete job processing flow:

```typescript
// tests/jobs/email-job.worker.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/jobs/email/route';

describe('Email Job Worker', () => {
  it('should process welcome email job', async () => {
    const mockRequest = {
      text: () => Promise.resolve(JSON.stringify({
        jobId: 'test-job-id',
        type: 'send-email',
        payload: {
          template: 'welcome',
          to: 'test@example.com',
          data: { recipientName: 'Test User' },
        },
        metadata: {
          userId: 1,
          createdAt: new Date().toISOString(),
        },
      })),
      headers: {
        get: (name: string) =>
          name === 'Upstash-Signature' ? 'valid-signature' : null,
      },
      url: 'http://localhost:3000/api/jobs/email',
    };

    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const mockRequest = {
      text: () => Promise.resolve('{}'),
      headers: {
        get: () => null, // No signature
      },
      url: 'http://localhost:3000/api/jobs/email',
    };

    const response = await POST(mockRequest as any);

    expect(response.status).toBe(401);
  });
});
```

### Mocking QStash in Tests

For unit tests, mock the QStash client:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
  },
});

// tests/setup.ts
import { vi } from 'vitest';

vi.mock('@/lib/jobs/qstash.client', () => ({
  qstash: {
    publishJSON: vi.fn(),
    schedules: {
      create: vi.fn(),
    },
  },
  getQStashReceiver: vi.fn(() => ({
    verify: vi.fn(),
  })),
}));
```

### Test Coverage

Run tests with coverage:

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run specific test file
pnpm vitest tests/jobs/job-dispatcher.service.test.ts
```

## Production Deployment

### Environment Variables Checklist

Ensure these variables are set in production:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://yourapp.com
POSTGRES_URL=your_production_db_url

# QStash (from Upstash Console)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_production_token
QSTASH_CURRENT_SIGNING_KEY=your_current_key
QSTASH_NEXT_SIGNING_KEY=your_next_key

# Email (Resend)
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=your_verified_email

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database Migrations

Run migrations before deploying:

```bash
# Staging
pnpm db:migrate:staging

# Production
pnpm db:migrate:prod
```

Verify the `job_executions` table exists:

```sql
\d job_executions
```

### Deployment Checklist

1. **Set Environment Variables**
   - [ ] QStash credentials configured
   - [ ] Database connection string set
   - [ ] BASE_URL matches production domain
   - [ ] All secrets properly secured

2. **Run Database Migrations**
   - [ ] `job_executions` table created
   - [ ] Indexes created for performance
   - [ ] Test queries run successfully

3. **Test Job Processing**
   - [ ] Enqueue a test job in staging
   - [ ] Verify job processes successfully
   - [ ] Check QStash dashboard for deliveries
   - [ ] Confirm logs are written

4. **Configure Monitoring**
   - [ ] Set up alerts for failed jobs
   - [ ] Monitor QStash dashboard
   - [ ] Track job execution times
   - [ ] Set up log aggregation

5. **Security Considerations**
   - [ ] QStash signature verification enabled
   - [ ] Job endpoints not publicly accessible
   - [ ] Sensitive data encrypted in payloads
   - [ ] Rate limiting configured

### Monitoring and Alerting

Set up monitoring for production:

```typescript
// Create a monitoring endpoint
// app/api/admin/job-health/route.ts
import { db } from '@/lib/db';
import { jobExecutions } from '@/lib/db/schemas/job-execution.table';
import { sql } from 'drizzle-orm';

export async function GET() {
  const stats = await db
    .select({
      status: jobExecutions.status,
      count: sql<number>`count(*)::int`,
    })
    .from(jobExecutions)
    .where(sql`created_at > NOW() - INTERVAL '1 hour'`)
    .groupBy(jobExecutions.status);

  const failureRate = stats.find(s => s.status === 'failed')?.count || 0;
  const totalJobs = stats.reduce((sum, s) => sum + s.count, 0);

  return Response.json({
    stats,
    failureRate,
    totalJobs,
    health: failureRate / totalJobs < 0.05 ? 'healthy' : 'unhealthy',
  });
}
```

**Alert on:**
- Failed job rate > 5%
- Jobs stuck in `processing` > 10 minutes
- No jobs processed in last hour (if expected)

### Performance Optimization

**Database Indexes:**

```sql
-- Index for job queries
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_created_at ON job_executions(created_at DESC);
CREATE INDEX idx_job_executions_user_id ON job_executions(user_id);
CREATE INDEX idx_job_executions_organization_id ON job_executions(organization_id);

-- Composite index for common queries
CREATE INDEX idx_job_executions_status_created ON job_executions(status, created_at DESC);
```

**Job Cleanup:**

Schedule a cleanup job to remove old executions:

```typescript
// Schedule daily at 3 AM
await jobDispatcher.schedule(
  JOB_TYPES.CLEANUP_OLD_DATA,
  '0 3 * * *',
  { retention: 90 } // Keep 90 days of history
);
```

## API Reference

### JobDispatcher

Primary interface for enqueueing and scheduling jobs.

#### `enqueue<T>(type, payload, metadata, options): Promise<string>`

Enqueues a job for processing.

**Parameters:**
- `type: JobType` - Job type from JOB_TYPES
- `payload: T` - Job-specific payload
- `metadata?: BaseJobMetadata` - Optional metadata (userId, organizationId, etc.)
- `options?: EnqueueJobOptions` - Optional overrides (retries, delay, etc.)

**Returns:** `Promise<string>` - The generated job ID

**Example:**
```typescript
const jobId = await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  { template: 'welcome', to: 'user@example.com', data: {} },
  { userId: 123 },
  { retries: 5, delay: 60000 }
);
```

#### `schedule(type, cron, payload, metadata): Promise<string>`

Schedules a recurring job.

**Parameters:**
- `type: JobType` - Job type from JOB_TYPES
- `cron: string` - Cron expression
- `payload: Record<string, unknown>` - Job payload
- `metadata?: BaseJobMetadata` - Optional metadata

**Returns:** `Promise<string>` - The QStash schedule ID

**Example:**
```typescript
const scheduleId = await jobDispatcher.schedule(
  JOB_TYPES.CLEANUP_OLD_DATA,
  '0 2 * * *',
  { retention: 30 },
  { organizationId: 456 }
);
```

### createJobWorker

Factory function for creating job worker handlers.

#### `createJobWorker<T>(handler): NextRequestHandler`

Wraps a job handler with QStash verification and execution tracking.

**Parameters:**
- `handler: JobWorkerHandler<T>` - Function that processes the job payload

**Returns:** Next.js API route handler

**Example:**
```typescript
import { createJobWorker } from '@/lib/jobs/job-worker.handler';

const myJobHandler = async (payload: MyPayload, job: BaseJob) => {
  // Process job
};

export const POST = createJobWorker<MyPayload>(myJobHandler);
```

### Job Registry Functions

#### `getJobConfig(type: JobType): JobConfig`

Retrieves job configuration from the registry.

**Parameters:**
- `type: JobType` - Job type

**Returns:** `JobConfig` - Job configuration object

**Throws:** `Error` if job type not found

**Example:**
```typescript
import { getJobConfig } from '@/lib/jobs/job-registry';

const config = getJobConfig(JOB_TYPES.SEND_EMAIL);
console.log(config.retries, config.timeout);
```

### Database Queries

#### `createJobExecution(data): Promise<JobExecution>`

Creates a new job execution record.

**Parameters:**
- `data: NewJobExecution` - Job execution data

**Returns:** `Promise<JobExecution>` - Created job execution

**Example:**
```typescript
import { createJobExecution } from '@/lib/db/queries';

const execution = await createJobExecution({
  jobId: 'uuid',
  jobType: 'send-email',
  status: 'pending',
  payload: jobData,
  userId: 123,
});
```

#### `getJobExecutionByJobId(jobId): Promise<JobExecution | undefined>`

Retrieves a job execution by job ID.

**Parameters:**
- `jobId: string` - Job ID

**Returns:** `Promise<JobExecution | undefined>` - Job execution or undefined

**Example:**
```typescript
const execution = await getJobExecutionByJobId('job-uuid');
if (execution) {
  console.log(execution.status, execution.error);
}
```

#### `updateJobExecution(jobId, updates): Promise<void>`

Updates a job execution record.

**Parameters:**
- `jobId: string` - Job ID
- `updates: Partial<JobExecution>` - Fields to update

**Returns:** `Promise<void>`

**Example:**
```typescript
await updateJobExecution('job-uuid', {
  status: 'completed',
  completedAt: new Date(),
});
```

### Type Definitions

#### `JobType`

Union type of all supported job types.

```typescript
type JobType =
  | 'send-email'
  | 'process-webhook'
  | 'process-stripe-webhook'
  | 'export-data'
  | 'generate-report'
  | 'cleanup-old-data';
```

#### `JobConfig`

Configuration for a job type.

```typescript
interface JobConfig {
  type: JobType;
  endpoint: string;
  retries: number;
  timeout: number;
  description: string;
}
```

#### `BaseJobMetadata`

Metadata attached to all jobs.

```typescript
interface BaseJobMetadata {
  userId?: number;
  organizationId?: number;
  idempotencyKey?: string;
  createdAt: string;
}
```

#### `EnqueueJobOptions`

Options for enqueueing a job.

```typescript
interface EnqueueJobOptions {
  delay?: number;
  retries?: number;
  callback?: string;
  failureCallback?: string;
  headers?: Record<string, string>;
}
```

---

**Last Updated:** 2025-10-01
**Status:** ✅ Complete

## Related Documentation

- [Email System](/emails) - Email templates and dispatchers
- [Stripe Integration](/stripe/stripe-integration) - Stripe webhook handling
- [Logging System](/logging) - Application logging
- [Environment Configuration](/environment-configuration) - Environment setup
- [Unit Testing](/unit-testing) - Testing guide

## External Resources

- [Upstash QStash Documentation](https://upstash.com/docs/qstash)
- [QStash REST API Reference](https://upstash.com/docs/qstash/api/messages/create)
- [Zod Documentation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
