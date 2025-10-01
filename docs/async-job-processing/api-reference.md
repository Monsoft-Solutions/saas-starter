---
title: API Reference - Async Job Processing with QStash
description: Complete API reference for the QStash job processing system
---

# API Reference

Complete API reference for the QStash job processing system.

## JobDispatcher

Primary interface for enqueueing and scheduling jobs.

### `enqueue<T>(type, payload, metadata, options): Promise<string>`

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

### `schedule(type, cron, payload, metadata): Promise<string>`

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

## createJobWorker

Factory function for creating job worker handlers.

### `createJobWorker<T>(handler): NextRequestHandler`

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

## Job Registry Functions

### `getJobConfig(type: JobType): JobConfig`

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

## Database Queries

### `createJobExecution(data): Promise<JobExecution>`

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

### `getJobExecutionByJobId(jobId): Promise<JobExecution | undefined>`

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

### `updateJobExecution(jobId, updates): Promise<void>`

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

## Type Definitions

### `JobType`

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

### `JobConfig`

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

### `BaseJobMetadata`

Metadata attached to all jobs.

```typescript
interface BaseJobMetadata {
  userId?: number;
  organizationId?: number;
  idempotencyKey?: string;
  createdAt: string;
}
```

### `EnqueueJobOptions`

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

### `JobWorkerHandler<T>`

Function type for job handlers.

```typescript
type JobWorkerHandler<T> = (
  payload: T,
  job: BaseJob & { payload: T }
) => Promise<void>;
```

### `BaseJob`

Base job structure.

```typescript
interface BaseJob {
  jobId: string;
  type: string;
  payload: Record<string, unknown>;
  metadata: BaseJobMetadata;
}
```

## Email Job Functions

### `sendWelcomeEmailAsync(payload, metadata): Promise<string>`

Sends a welcome email asynchronously.

**Parameters:**

- `payload: { to: string; recipientName: string }`
- `metadata: { userId: number }`

**Returns:** `Promise<string>` - Job ID

### `sendPasswordResetEmailAsync(payload, metadata): Promise<string>`

Sends a password reset email asynchronously.

**Parameters:**

- `payload: { to: string; recipientName: string; resetUrl: string }`
- `metadata: { userId: number }`

**Returns:** `Promise<string>` - Job ID

### `sendTeamInvitationEmailAsync(payload, metadata): Promise<string>`

Sends a team invitation email asynchronously.

**Parameters:**

- `payload: { to: string; recipientName: string; inviterName: string; organizationName: string; invitationUrl: string }`
- `metadata: { userId: number; organizationId: number }`

**Returns:** `Promise<string>` - Job ID

## Error Types

### `JobError`

Base error class for job-related errors.

```typescript
class JobError extends Error {
  constructor(
    message: string,
    public code: string,
    public jobId?: string
  ) {
    super(message);
    this.name = 'JobError';
  }
}
```

### `JobValidationError`

Error thrown when job payload validation fails.

```typescript
class JobValidationError extends JobError {
  constructor(
    message: string,
    public validationErrors: string[],
    jobId?: string
  ) {
    super(message, 'VALIDATION_ERROR', jobId);
    this.name = 'JobValidationError';
  }
}
```

## Constants

### `JOB_TYPES`

All available job types.

```typescript
export const JOB_TYPES = {
  SEND_EMAIL: 'send-email',
  PROCESS_WEBHOOK: 'process-webhook',
  PROCESS_STRIPE_WEBHOOK: 'process-stripe-webhook',
  EXPORT_DATA: 'export-data',
  GENERATE_REPORT: 'generate-report',
  CLEANUP_OLD_DATA: 'cleanup-old-data',
} as const;
```

### `JOB_STATUSES`

All possible job statuses.

```typescript
export const JOB_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
```

## Next Steps

- **[Setup Guide](../setup)** - Complete setup instructions
- **[Usage Guide](../usage)** - Learn how to use the job system
- **[Creating Jobs](../creating-jobs)** - Add new job types
