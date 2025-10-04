---
title: Core Concepts - Async Job Processing with QStash
description: Understanding job types, schemas, lifecycle, and retry policies in the QStash job processing system
---

# Core Concepts

Understanding job types, schemas, lifecycle, and retry policies in the QStash job processing system.

## Job Types and Registry

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

### Configuration Properties

- `type` - Unique job type identifier
- `endpoint` - API route that processes the job
- `retries` - Number of retry attempts on failure
- `timeout` - Maximum execution time in seconds
- `description` - Human-readable description

## Job Schemas and Validation

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

### Base Job Schema

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

## Job Lifecycle

Jobs progress through the following states:

1. **Pending** - Job created and queued in QStash
2. **Processing** - Job received by worker and executing
3. **Completed** - Job finished successfully
4. **Failed** - Job encountered an error (may retry)

### Database Tracking

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

## Retry Policies

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

### Retry Behavior

- **Exponential backoff** between retries
- Each retry increments `retryCount` in the database
- After all retries exhausted, job status set to `failed`
- Failed jobs can be manually retried via the database

### Manual Retry

```typescript
import { updateJobExecution } from '@/lib/db/queries';

// Reset and retry a failed job
await updateJobExecution(failedJobId, {
  status: 'pending',
  error: null,
  retryCount: 0,
});
```

## Job Metadata

Every job includes metadata for tracking and debugging:

```typescript
interface BaseJobMetadata {
  userId?: number; // User who initiated the job
  organizationId?: number; // Organization context
  idempotencyKey?: string; // Prevent duplicate jobs
  createdAt: string; // ISO timestamp
}
```

### Using Metadata

```typescript
await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  { template: 'welcome', to: 'user@example.com', data: {} },
  {
    userId: 123,
    organizationId: 456,
    idempotencyKey: 'unique-operation-id',
  }
);
```

## Error Handling

Jobs can fail for various reasons:

- **Network issues** - External API failures
- **Validation errors** - Invalid payload data
- **Timeout** - Job takes too long to complete
- **Resource limits** - Database connection issues

### Error Information

Failed jobs include error details in the database:

```sql
SELECT job_id, error, retry_count
FROM job_executions
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## Next Steps

- **[Setup Guide](./setup.md)** - Complete setup instructions
- **[Usage Guide](./usage.md)** - Learn how to enqueue and use jobs
- **[Creating Jobs](./creating-jobs.md)** - Add new job types to the system
