---
title: Creating Jobs - Async Job Processing with QStash
description: Step-by-step guide for adding new job types to the QStash job processing system
---

# Creating New Job Types

Step-by-step guide for adding new job types to the QStash job processing system.

## Overview

Follow these steps to add a new job type to the system:

1. Define Job Type
2. Create Job Schema
3. Register Job Configuration
4. Create Job Worker
5. Create Service Function (Optional)
6. Write Tests
7. Use Your New Job

## Step 1: Define Job Type

Add to `/lib/types/jobs/enums/job-type.enum.ts`:

```typescript
export const JOB_TYPES = {
  // ... existing types
  SEND_SMS: 'send-sms', // New type
} as const;
```

## Step 2: Create Job Schema

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

## Step 3: Register Job Configuration

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

## Step 4: Create Job Worker

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

## Step 5: Create Service Function (Optional)

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

## Step 6: Write Tests

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

## Step 7: Use Your New Job

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

## Advanced Job Patterns

### Complex Payload Validation

For complex jobs, create detailed schemas:

```typescript
export const SendBulkEmailJobPayloadSchema = z.object({
  recipients: z
    .array(
      z.object({
        to: z.string().email(),
        recipientName: z.string(),
        customData: z.record(z.unknown()).optional(),
      })
    )
    .min(1)
    .max(100),
  template: z.enum(['newsletter', 'product-update']),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export const SendBulkEmailJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.SEND_BULK_EMAIL),
  payload: SendBulkEmailJobPayloadSchema,
});
```

### Job Dependencies

For jobs that depend on other jobs:

```typescript
// Process payment first, then send confirmation email
const paymentJobId = await jobDispatcher.enqueue(
  JOB_TYPES.PROCESS_PAYMENT,
  paymentPayload
);

// Use the payment job ID as idempotency key for email
await jobDispatcher.enqueue(
  JOB_TYPES.SEND_EMAIL,
  emailPayload,
  { userId: user.id },
  {
    retries: 3,
    // Delay email until payment is processed
    delay: 5000,
  }
);
```

### Conditional Job Execution

```typescript
const shouldSendEmail = await checkSomeCondition();

if (shouldSendEmail) {
  await jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, emailPayload);
} else {
  logger.info('Skipping email job - condition not met');
}
```

## Best Practices

### Error Handling

Always handle errors gracefully in job workers:

```typescript
const myJobHandler = async (payload: MyPayload, job: BaseJob) => {
  try {
    // Your job logic here
    await doSomeWork(payload);

    logger.info('[jobs] Job completed successfully', {
      jobId: job.jobId,
    });
  } catch (error) {
    logger.error('[jobs] Job failed', {
      jobId: job.jobId,
      error: error.message,
    });

    // Re-throw to mark job as failed
    throw error;
  }
};
```

### Logging

Include relevant context in logs:

```typescript
logger.info('[jobs] Processing complex job', {
  jobId: job.jobId,
  payloadSize: JSON.stringify(payload).length,
  userId: job.metadata.userId,
  organizationId: job.metadata.organizationId,
});
```

### Validation

Validate payloads before processing:

```typescript
const myJobHandler = async (payload: MyPayload, job: BaseJob) => {
  // Validate payload
  const result = MyJobPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid payload: ${result.error.message}`);
  }

  const validatedPayload = result.data;

  // Process validated payload
  await processJob(validatedPayload);
};
```

## Troubleshooting New Jobs

### Common Issues

1. **Job not processing**
   - Check endpoint URL in registry
   - Verify QStash can reach your endpoint
   - Check firewall settings

2. **Payload validation errors**
   - Ensure schema matches payload structure
   - Check for required vs optional fields
   - Validate data types

3. **Timeout errors**
   - Increase timeout in job registry
   - Optimize job logic
   - Consider breaking into smaller jobs

### Debugging Steps

1. Test job handler directly
2. Check application logs
3. Verify QStash signature verification
4. Test with simplified payload

## Next Steps

- **[Usage Guide](../usage)** - Learn how to use your new job type
- **[Testing](../testing)** - Write comprehensive tests for your job
- **[Monitoring](../monitoring)** - Set up monitoring and alerting
