# QStash Async Processing System Implementation Plan

**Created:** September 30, 2025
**Status:** Draft
**Priority:** High
**Estimated Effort:** 5-7 days
**Complexity:** Medium

## Executive Summary

This implementation plan outlines the development of a comprehensive async job processing system using Upstash QStash for the SaaS starter application. The system will provide reliable background job processing for email sending, webhook processing, data exports, report generation, and other async operations. The architecture is optimized for Next.js 15 serverless deployment with an extensible job worker pattern that allows easy addition of new job types.

## Current State Analysis

### ✅ Existing Infrastructure

- Next.js 15 with App Router (serverless-optimized)
- PostgreSQL database with Drizzle ORM
- BetterAuth session management
- Resend email integration with dispatchers
- Stripe webhook processing (synchronous)
- Activity logging system
- Winston logger
- Upstash Redis cache infrastructure

### ❌ Missing Critical Features

1. **Async Job Infrastructure:**
   - No background job queue system
   - Email sending is synchronous (blocks HTTP requests)
   - No retry mechanism for failed operations
   - No job monitoring or tracking
   - No scheduled/recurring job support

2. **Reliability & Resilience:**
   - No automatic retry for transient failures
   - No dead letter queue for permanently failed jobs
   - No job execution history
   - No failure notifications

3. **Operational Visibility:**
   - No job execution metrics
   - No job failure tracking
   - No performance monitoring
   - No job execution logs

## Technical Analysis

### Why QStash for Serverless?

QStash is purpose-built for serverless environments and addresses key limitations:

**✅ Serverless-Native Design:**

- No persistent connections required
- HTTP-based job delivery (works with all serverless platforms)
- Automatic scaling with request volume
- No infrastructure management

**✅ Built-In Reliability:**

- Automatic exponential backoff retry (up to 24h)
- At-least-once delivery guarantee
- Dead letter queue for permanently failed jobs
- Request signature verification

**✅ Advanced Features:**

- CRON-based scheduling for recurring jobs
- Callback URLs for long-running tasks
- Configurable retry policies
- Timezone-aware scheduling

**✅ Cost-Effective:**

- Pay per message (no idle costs)
- Included in Upstash Redis subscription
- No separate infrastructure needed

### Alternative Solutions Considered

| Solution        | Pros                                    | Cons                                                          | Verdict         |
| --------------- | --------------------------------------- | ------------------------------------------------------------- | --------------- |
| **BullMQ**      | Rich features, popular                  | Requires persistent Redis connection, not serverless-friendly | ❌ Rejected     |
| **Inngest**     | Great DX, type-safe                     | Additional service dependency, higher cost                    | ⚠️ Alternative  |
| **Vercel Cron** | Simple, built-in                        | Limited to scheduled jobs only, no queue                      | ❌ Too limited  |
| **QStash**      | Serverless-native, affordable, reliable | Simpler feature set than BullMQ                               | ✅ **Selected** |

### QStash Architecture Patterns

**1. Message Publishing (Enqueue)**

```typescript
await qstash.publishJSON({
  url: 'https://yourdomain.com/api/jobs/send-email',
  body: { to: 'user@example.com', template: 'welcome' },
  retries: 3,
  delay: 10, // seconds
});
```

**2. Worker Endpoint (Process)**

```typescript
export async function POST(request: Request) {
  await verifySignature(request); // Security
  const payload = await request.json();

  // Process job
  await sendEmail(payload);

  return Response.json({ success: true });
}
```

**3. Scheduling (CRON)**

```typescript
await qstash.schedules.create({
  destination: 'https://yourdomain.com/api/jobs/cleanup',
  cron: '0 2 * * *', // Daily at 2 AM UTC
});
```

## Architecture Design

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  (Server Actions, API Routes, Webhooks)                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Enqueue Job
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Job Dispatcher Service                      │
│  - Type-safe job payload validation                             │
│  - QStash client wrapper                                        │
│  - Job metadata tracking                                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTP POST
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Upstash QStash                             │
│  - Message queue                                                 │
│  - Retry logic                                                   │
│  - DLQ handling                                                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTP POST (with retries)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Job Worker API Routes                       │
│  /api/jobs/email                                                │
│  /api/jobs/webhook                                              │
│  /api/jobs/export                                               │
│  /api/jobs/report                                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Execute
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Job Handler Services                        │
│  - Business logic execution                                      │
│  - Error handling                                                │
│  - Result logging                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Job Type Registry Pattern

Extensible job type system using a registry pattern:

```typescript
// lib/jobs/types/job-registry.ts
export const JOB_TYPES = {
  SEND_EMAIL: 'send-email',
  PROCESS_WEBHOOK: 'process-webhook',
  EXPORT_DATA: 'export-data',
  GENERATE_REPORT: 'generate-report',
  CLEANUP_OLD_DATA: 'cleanup-old-data',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export interface JobConfig {
  type: JobType;
  endpoint: string;
  retries: number;
  timeout: number;
}

export const JOB_REGISTRY: Record<JobType, JobConfig> = {
  [JOB_TYPES.SEND_EMAIL]: {
    type: JOB_TYPES.SEND_EMAIL,
    endpoint: '/api/jobs/email',
    retries: 3,
    timeout: 30,
  },
  // ... other job types
};
```

### Job Payload Schema System

Type-safe job payloads using Zod:

```typescript
// lib/jobs/schemas/send-email-job.schema.ts
export const SendEmailJobSchema = z.object({
  jobId: z.string().uuid(),
  type: z.literal(JOB_TYPES.SEND_EMAIL),
  payload: z.object({
    to: z.string().email(),
    template: z.string(),
    data: z.record(z.any()),
  }),
  metadata: z.object({
    userId: z.number().optional(),
    organizationId: z.number().optional(),
    createdAt: z.string().datetime(),
  }),
});

export type SendEmailJob = z.infer<typeof SendEmailJobSchema>;
```

## Implementation Plan

### Phase 1: Core Infrastructure (Days 1-2)

**1.1 Install Dependencies**

```bash
pnpm add @upstash/qstash
```

**1.2 Environment Configuration**

File: `.env.example` (add)

```bash
# QStash Configuration
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key
```

File: `lib/env.ts` (add validation)

```typescript
QSTASH_URL: z.string().url().optional(),
QSTASH_TOKEN: z.string().optional(),
QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
```

**1.3 Create QStash Client**

File: `lib/jobs/qstash.client.ts`

```typescript
import 'server-only';
import { Client } from '@upstash/qstash';
import { env } from '@/lib/env';

export const qstash = new Client({
  token: env.QSTASH_TOKEN!,
});

export const getQStashReceiver = () => {
  return new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY!,
  });
};
```

**1.4 Create Job Types Registry**

File: `lib/jobs/types/job-type.enum.ts`

```typescript
export const JOB_TYPES = {
  SEND_EMAIL: 'send-email',
  PROCESS_WEBHOOK: 'process-webhook',
  EXPORT_DATA: 'export-data',
  GENERATE_REPORT: 'generate-report',
  CLEANUP_OLD_DATA: 'cleanup-old-data',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
```

File: `lib/jobs/types/job-config.type.ts`

```typescript
import type { JobType } from './job-type.enum';

export type JobConfig = {
  type: JobType;
  endpoint: string;
  retries: number;
  timeout: number;
  description: string;
};
```

File: `lib/jobs/types/job-registry.ts`

```typescript
import { JOB_TYPES } from './job-type.enum';
import type { JobConfig } from './job-config.type';
import type { JobType } from './job-type.enum';

export const JOB_REGISTRY: Record<JobType, JobConfig> = {
  [JOB_TYPES.SEND_EMAIL]: {
    type: JOB_TYPES.SEND_EMAIL,
    endpoint: '/api/jobs/email',
    retries: 3,
    timeout: 30,
    description: 'Send transactional emails via Resend',
  },
  [JOB_TYPES.PROCESS_WEBHOOK]: {
    type: JOB_TYPES.PROCESS_WEBHOOK,
    endpoint: '/api/jobs/webhook',
    retries: 5,
    timeout: 60,
    description: 'Process incoming webhooks from third-party services',
  },
  [JOB_TYPES.EXPORT_DATA]: {
    type: JOB_TYPES.EXPORT_DATA,
    endpoint: '/api/jobs/export',
    retries: 2,
    timeout: 300,
    description: 'Generate and export data files (CSV, Excel)',
  },
  [JOB_TYPES.GENERATE_REPORT]: {
    type: JOB_TYPES.GENERATE_REPORT,
    endpoint: '/api/jobs/report',
    retries: 2,
    timeout: 180,
    description: 'Generate analytics and business reports',
  },
  [JOB_TYPES.CLEANUP_OLD_DATA]: {
    type: JOB_TYPES.CLEANUP_OLD_DATA,
    endpoint: '/api/jobs/cleanup',
    retries: 1,
    timeout: 600,
    description: 'Clean up old data and temporary files',
  },
};

export const getJobConfig = (type: JobType): JobConfig => {
  const config = JOB_REGISTRY[type];
  if (!config) {
    throw new Error(`Unknown job type: ${type}`);
  }
  return config;
};
```

File: `lib/jobs/types/index.ts`

```typescript
export * from './job-type.enum';
export * from './job-config.type';
export * from './job-registry';
```

**1.5 Create Base Job Schema**

File: `lib/jobs/schemas/base-job.schema.ts`

```typescript
import { z } from 'zod';

export const BaseJobMetadataSchema = z.object({
  userId: z.number().optional(),
  organizationId: z.number().optional(),
  createdAt: z.string().datetime(),
  idempotencyKey: z.string().optional(),
});

export const BaseJobSchema = z.object({
  jobId: z.string().uuid(),
  type: z.string(),
  metadata: BaseJobMetadataSchema,
});

export type BaseJobMetadata = z.infer<typeof BaseJobMetadataSchema>;
export type BaseJob = z.infer<typeof BaseJobSchema>;
```

**1.6 Create Job Execution Tracking**

File: `lib/db/schemas/job-execution.table.ts`

```typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';

export const jobExecutions = pgTable('job_executions', {
  id: serial('id').primaryKey(),
  jobId: varchar('job_id', { length: 255 }).notNull().unique(),
  jobType: varchar('job_type', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // pending, processing, completed, failed
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

export type JobExecution = typeof jobExecutions.$inferSelect;
export type NewJobExecution = typeof jobExecutions.$inferInsert;
```

File: `lib/db/schemas/index.ts` (add export)

```typescript
export * from './job-execution.table';
```

**1.7 Create Job Execution Queries**

File: `lib/db/queries/job-execution.query.ts`

```typescript
import 'server-only';
import { db } from '@/lib/db/drizzle';
import { jobExecutions } from '@/lib/db/schemas';
import { eq } from 'drizzle-orm';
import type { NewJobExecution } from '@/lib/db/schemas';

export const createJobExecution = async (data: NewJobExecution) => {
  const [execution] = await db.insert(jobExecutions).values(data).returning();
  return execution;
};

export const updateJobExecution = async (
  jobId: string,
  data: Partial<NewJobExecution>
) => {
  const [execution] = await db
    .update(jobExecutions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(jobExecutions.jobId, jobId))
    .returning();
  return execution;
};

export const getJobExecutionByJobId = async (jobId: string) => {
  return db.query.jobExecutions.findFirst({
    where: eq(jobExecutions.jobId, jobId),
  });
};

export const getJobExecutionsByType = async (
  jobType: string,
  limit: number = 50
) => {
  return db.query.jobExecutions.findMany({
    where: eq(jobExecutions.jobType, jobType),
    orderBy: (executions, { desc }) => [desc(executions.createdAt)],
    limit,
  });
};

export const getFailedJobExecutions = async (limit: number = 50) => {
  return db.query.jobExecutions.findMany({
    where: eq(jobExecutions.status, 'failed'),
    orderBy: (executions, { desc }) => [desc(executions.createdAt)],
    limit,
  });
};
```

File: `lib/db/queries/index.ts` (add export)

```typescript
export * from './job-execution.query';
```

### Phase 2: Job Dispatcher Service (Days 2-3)

**2.1 Create Job Dispatcher**

File: `lib/jobs/job-dispatcher.service.ts`

```typescript
import 'server-only';
import { qstash } from './qstash.client';
import { getJobConfig } from './types';
import { env } from '@/lib/env';
import logger from '@/lib/logger/logger.service';
import { createJobExecution } from '@/lib/db/queries';
import type { JobType } from './types';
import type { BaseJob, BaseJobMetadata } from './schemas/base-job.schema';
import { randomUUID } from 'crypto';

export interface EnqueueJobOptions {
  delay?: number; // seconds
  retries?: number;
  callback?: string;
  failureCallback?: string;
  headers?: Record<string, string>;
}

export class JobDispatcher {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.BASE_URL;
  }

  async enqueue<T extends Record<string, unknown>>(
    type: JobType,
    payload: T,
    metadata: Omit<BaseJobMetadata, 'createdAt'>,
    options?: EnqueueJobOptions
  ): Promise<string> {
    const config = getJobConfig(type);
    const jobId = randomUUID();

    const job: BaseJob & { payload: T } = {
      jobId,
      type,
      payload,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };

    // Create job execution record
    await createJobExecution({
      jobId,
      jobType: type,
      status: 'pending',
      payload: job,
      userId: metadata.userId,
      organizationId: metadata.organizationId,
    });

    try {
      const url = `${this.baseUrl}${config.endpoint}`;

      logger.info(`[jobs] Enqueueing job: ${type}`, {
        jobId,
        type,
        url,
      });

      await qstash.publishJSON({
        url,
        body: job,
        retries: options?.retries ?? config.retries,
        delay: options?.delay,
        callback: options?.callback,
        failureCallback: options?.failureCallback,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      logger.info(`[jobs] Job enqueued successfully: ${type}`, {
        jobId,
      });

      return jobId;
    } catch (error) {
      logger.error(`[jobs] Failed to enqueue job: ${type}`, {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  async schedule(
    type: JobType,
    cron: string,
    payload: Record<string, unknown>,
    metadata: Omit<BaseJobMetadata, 'createdAt'>
  ): Promise<string> {
    const config = getJobConfig(type);
    const url = `${this.baseUrl}${config.endpoint}`;

    const job: BaseJob & { payload: Record<string, unknown> } = {
      jobId: randomUUID(),
      type,
      payload,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };

    logger.info(`[jobs] Scheduling job: ${type}`, {
      type,
      cron,
      url,
    });

    const schedule = await qstash.schedules.create({
      destination: url,
      cron,
      body: JSON.stringify(job),
    });

    logger.info(`[jobs] Job scheduled successfully: ${type}`, {
      scheduleId: schedule.scheduleId,
    });

    return schedule.scheduleId;
  }
}

export const jobDispatcher = new JobDispatcher();
```

**2.2 Create Job Worker Base Handler**

File: `lib/jobs/job-worker.handler.ts`

```typescript
import 'server-only';
import { getQStashReceiver } from './qstash.client';
import logger from '@/lib/logger/logger.service';
import { updateJobExecution, getJobExecutionByJobId } from '@/lib/db/queries';
import type { BaseJob } from './schemas/base-job.schema';
import { NextRequest } from 'next/server';

export interface JobWorkerHandler<T = unknown> {
  (payload: T, job: BaseJob): Promise<void>;
}

export const createJobWorker = <T = unknown>(handler: JobWorkerHandler<T>) => {
  return async (request: NextRequest) => {
    // Verify QStash signature
    const receiver = getQStashReceiver();
    const body = await request.text();

    try {
      await receiver.verify({
        signature: request.headers.get('Upstash-Signature') || '',
        body,
      });
    } catch (error) {
      logger.error('[jobs] Invalid QStash signature', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse job
    const job = JSON.parse(body) as BaseJob & { payload: T };

    logger.info(`[jobs] Processing job: ${job.type}`, {
      jobId: job.jobId,
      type: job.type,
    });

    // Update job status to processing
    const execution = await getJobExecutionByJobId(job.jobId);
    if (execution) {
      await updateJobExecution(job.jobId, {
        status: 'processing',
        startedAt: new Date(),
        retryCount: (execution.retryCount || 0) + 1,
      });
    }

    try {
      // Execute handler
      await handler(job.payload, job);

      // Update job status to completed
      await updateJobExecution(job.jobId, {
        status: 'completed',
        completedAt: new Date(),
      });

      logger.info(`[jobs] Job completed successfully: ${job.type}`, {
        jobId: job.jobId,
      });

      return Response.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(`[jobs] Job failed: ${job.type}`, {
        jobId: job.jobId,
        error: errorMessage,
        stack: errorStack,
      });

      // Update job status to failed
      await updateJobExecution(job.jobId, {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date(),
      });

      // Return 5xx to trigger QStash retry
      return Response.json({ error: errorMessage }, { status: 500 });
    }
  };
};
```

### Phase 3: Email Job Worker (Day 3)

**3.1 Create Email Job Schema**

File: `lib/jobs/schemas/send-email-job.schema.ts`

```typescript
import { z } from 'zod';
import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '../types';

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
  data: z.record(z.any()),
});

export const SendEmailJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.SEND_EMAIL),
  payload: SendEmailJobPayloadSchema,
});

export type SendEmailJobPayload = z.infer<typeof SendEmailJobPayloadSchema>;
export type SendEmailJob = z.infer<typeof SendEmailJobSchema>;
```

**3.2 Create Email Job Worker Route**

File: `app/api/jobs/email/route.ts`

```typescript
import { createJobWorker } from '@/lib/jobs/job-worker.handler';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendEmailChangeConfirmationEmail,
  sendTeamInvitationEmail,
  sendSubscriptionCreatedEmail,
  sendPaymentFailedEmail,
} from '@/lib/emails/dispatchers';
import logger from '@/lib/logger/logger.service';
import type { SendEmailJobPayload } from '@/lib/jobs/schemas/send-email-job.schema';
import type { BaseJob } from '@/lib/jobs/schemas/base-job.schema';

const emailJobHandler = async (payload: SendEmailJobPayload, job: BaseJob) => {
  const { template, to, data } = payload;

  logger.info('[jobs] Processing email job', {
    jobId: job.jobId,
    template,
    to,
  });

  switch (template) {
    case 'welcome':
      await sendWelcomeEmail({ to, ...data });
      break;
    case 'passwordReset':
      await sendPasswordResetEmail({ to, ...data });
      break;
    case 'passwordChanged':
      await sendPasswordChangedEmail({ to, ...data });
      break;
    case 'emailChange':
      await sendEmailChangeConfirmationEmail({ to, ...data });
      break;
    case 'teamInvitation':
      await sendTeamInvitationEmail({ to, ...data });
      break;
    case 'subscriptionCreated':
      await sendSubscriptionCreatedEmail({ to, ...data });
      break;
    case 'paymentFailed':
      await sendPaymentFailedEmail({ to, ...data });
      break;
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
};

export const POST = createJobWorker<SendEmailJobPayload>(emailJobHandler);
```

**3.3 Create Email Job Service**

File: `lib/jobs/services/email-job.service.ts`

```typescript
import 'server-only';
import { jobDispatcher } from '../job-dispatcher.service';
import { JOB_TYPES } from '../types';
import type { SendEmailJobPayload } from '../schemas/send-email-job.schema';

export const enqueueEmailJob = async (
  payload: SendEmailJobPayload,
  metadata: {
    userId?: number;
    organizationId?: number;
  }
) => {
  return jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, payload, metadata, {
    retries: 3,
    delay: 0,
  });
};
```

File: `lib/jobs/services/index.ts`

```typescript
export * from './email-job.service';
```

**3.4 Migrate Email Dispatchers to Use Jobs**

File: `lib/emails/dispatchers.ts` (update to enqueue jobs instead of direct sending)

This will be a gradual migration. For now, we'll keep both direct sending and async job options:

```typescript
// Add at the top
import { enqueueEmailJob } from '@/lib/jobs/services';

// Add async variant for each dispatcher
export const sendWelcomeEmailAsync = async ({
  to,
  supportEmail,
  ...props
}: WelcomeEmailParams) => {
  const recipientEmail = Array.isArray(to) ? to[0] : to;

  await enqueueEmailJob(
    {
      template: 'welcome',
      to:
        typeof recipientEmail === 'string'
          ? recipientEmail
          : recipientEmail.email,
      data: { supportEmail, ...props },
    },
    {}
  );
};

// Repeat for other email types...
```

### Phase 4: Additional Job Workers (Days 4-5)

**4.1 Webhook Processing Job**

File: `lib/jobs/schemas/process-webhook-job.schema.ts`

```typescript
import { z } from 'zod';
import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '../types';

export const ProcessWebhookJobPayloadSchema = z.object({
  source: z.enum(['stripe', 'resend', 'custom']),
  event: z.string(),
  data: z.record(z.any()),
  signature: z.string().optional(),
});

export const ProcessWebhookJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.PROCESS_WEBHOOK),
  payload: ProcessWebhookJobPayloadSchema,
});

export type ProcessWebhookJobPayload = z.infer<
  typeof ProcessWebhookJobPayloadSchema
>;
export type ProcessWebhookJob = z.infer<typeof ProcessWebhookJobSchema>;
```

File: `app/api/jobs/webhook/route.ts`

```typescript
import { createJobWorker } from '@/lib/jobs/job-worker.handler';
import logger from '@/lib/logger/logger.service';
import type { ProcessWebhookJobPayload } from '@/lib/jobs/schemas/process-webhook-job.schema';
import type { BaseJob } from '@/lib/jobs/schemas/base-job.schema';

const webhookJobHandler = async (
  payload: ProcessWebhookJobPayload,
  job: BaseJob
) => {
  const { source, event, data } = payload;

  logger.info('[jobs] Processing webhook job', {
    jobId: job.jobId,
    source,
    event,
  });

  switch (source) {
    case 'stripe':
      // Handle Stripe webhooks that need async processing
      // (e.g., complex subscription changes, invoice processing)
      break;
    case 'resend':
      // Handle Resend webhooks (email delivery status)
      break;
    case 'custom':
      // Handle custom webhooks
      break;
    default:
      throw new Error(`Unknown webhook source: ${source}`);
  }
};

export const POST =
  createJobWorker<ProcessWebhookJobPayload>(webhookJobHandler);
```

### Phase 5: Scheduled Jobs Setup (Day 5)

**5.1 Create Scheduled Jobs Manager**

**5.2 Create Setup when the app start**

## Phase 6: Testing & Documentation (Days 6-7)

- Create unit tests for the new functionalities we implemented

**6.3 Create Documentation**

- Follow the documentation guidelines to craft the documentation of the async operations

### Phase 7: Migration Database (Day 7)

**7.1 Generate Migration**

```bash
pnpm db:generate
```

**7.2 Run Migration**

```bash
pnpm db:migrate
```

**7.3 Setup Scheduled Jobs**

```bash
pnpm jobs:setup
```

## Testing Strategy

### Unit Tests

- ✅ Job dispatcher enqueue logic
- ✅ Job schema validation
- ✅ Job registry configuration
- ✅ Job execution tracking

### Integration Tests

- ✅ Email job end-to-end flow
- ✅ Webhook job processing
- ✅ Job retry behavior
- ✅ Job failure handling

### Manual Testing

- ✅ Enqueue test jobs via API
- ✅ Monitor QStash dashboard
- ✅ Verify job execution logs
- ✅ Test scheduled jobs
- ✅ Test failure scenarios

## Deployment Checklist

### Environment Setup

- [ ] Create QStash account at https://upstash.com
- [ ] Generate QStash token and signing keys
- [ ] Add QStash environment variables to deployment
- [ ] Verify BASE_URL is set correctly

### Database Setup

- [ ] Run database migrations
- [ ] Verify `job_executions` table created

### QStash Configuration

- [ ] Run scheduled jobs setup script
- [ ] Verify endpoints are publicly accessible
- [ ] Test signature verification

### Monitoring Setup

- [ ] Configure QStash webhook alerts
- [ ] Set up logging aggregation
- [ ] Create dashboards for job metrics

## Monitoring & Observability

### Key Metrics to Track

1. **Job Execution Metrics:**
   - Jobs enqueued per hour/day
   - Jobs completed successfully
   - Jobs failed (by type)
   - Average execution time
   - Retry rate

2. **Performance Metrics:**
   - Queue depth
   - Processing latency
   - Time to first retry
   - Dead letter queue size

3. **Error Metrics:**
   - Failed job rate by type
   - Common error messages
   - Jobs in DLQ
   - Signature verification failures

### Logging Strategy

**Job Lifecycle Events:**

```
[jobs] Enqueueing job: {type} (jobId: {id})
[jobs] Job enqueued successfully: {type} (jobId: {id})
[jobs] Processing job: {type} (jobId: {id})
[jobs] Job completed successfully: {type} (jobId: {id})
[jobs] Job failed: {type} (jobId: {id}, error: {message})
```

### QStash Dashboard

Access at: https://console.upstash.com/qstash

Monitor:

- Message throughput
- Delivery success rate
- Retry statistics
- DLQ items
- Scheduled jobs

## Security Considerations

### Request Signature Verification

All job worker endpoints MUST verify QStash signatures:

```typescript
const receiver = getQStashReceiver();
await receiver.verify({
  signature: request.headers.get('Upstash-Signature') || '',
  body,
});
```

### Payload Validation

All job payloads MUST be validated using Zod schemas:

```typescript
const validatedPayload = SendEmailJobSchema.parse(job);
```

### Environment Variables

- Store QStash credentials in environment variables
- Never commit secrets to version control
- Rotate signing keys periodically
- Use different QStash projects for staging/production

## Cost Optimization

### QStash Pricing (as of 2025)

- First 500 messages/day: Free
- $1 per 100,000 messages after free tier
- Included with Upstash Redis paid plans

### Optimization Strategies

1. **Batch Operations:**
   - Group related operations when possible
   - Use single job for multiple emails (with caution)

2. **Smart Retries:**
   - Don't retry user errors (4xx)
   - Use exponential backoff
   - Set max retry limits

3. **Efficient Scheduling:**
   - Use appropriate CRON intervals
   - Avoid overlapping scheduled jobs
   - Monitor scheduled job execution time

## Future Enhancements

## Migration Guide

### Migrating Existing Sync Operations to Async

**Before (Synchronous):**

```typescript
export async function createUser(data: NewUser) {
  const user = await db.insert(users).values(data).returning();

  // Blocks HTTP request
  await sendWelcomeEmail({ to: user.email, ... });

  return user;
}
```

**After (Asynchronous):**

```typescript
export async function createUser(data: NewUser) {
  const user = await db.insert(users).values(data).returning();

  // Non-blocking (fire and forget)
  await enqueueEmailJob({
    template: 'welcome',
    to: user.email,
    data: { ... }
  }, { userId: user.id });

  return user;
}
```

### Gradual Migration Strategy

1. **Phase 1:** Create async variants (keep sync versions)
   - `sendWelcomeEmail()` - existing sync
   - `sendWelcomeEmailAsync()` - new async variant

2. **Phase 2:** Update non-critical paths to use async
   - Background notifications
   - Audit emails
   - Analytics updates

3. **Phase 3:** Update critical paths after validation
   - User onboarding emails
   - Payment notifications
   - Security alerts

4. **Phase 4:** Remove sync variants
   - Deprecated sync functions
   - Update all call sites
   - Remove old code

## Conclusion

This implementation provides a production-ready async job processing system optimized for serverless deployment. The extensible architecture allows easy addition of new job types, and the QStash integration ensures reliable delivery with automatic retries.

## Appendix

### QStash Resources

- [QStash Documentation](https://upstash.com/docs/qstash)
- [QStash Console](https://console.upstash.com/qstash)
- [QStash SDK Reference](https://upstash.com/docs/qstash/sdks/typescript)

### Related Documentation

- [Email System Documentation](./emails.md)
- [Stripe Webhooks](./stripe/webhooks-configuration.md)
- [Logging System](./logging.md)

---

**Next Steps After Implementation:**

1. Run database migrations
2. Set up QStash account and credentials
3. Configure environment variables
4. Run scheduled jobs setup
5. Test with sample jobs
6. Monitor QStash dashboard
7. Gradually migrate existing operations
