---
title: Monitoring & Debugging - Async Job Processing with QStash
description: Debugging, monitoring, and troubleshooting guide for the QStash job processing system
---

# Monitoring & Debugging

Debugging, monitoring, and troubleshooting guide for the QStash job processing system.

## Viewing Job Executions

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
import { getJobExecutionByJobId, updateJobExecution } from '@/lib/db/queries';

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

## QStash Dashboard

Access the QStash dashboard for real-time monitoring:

### Local Development

- QStash CLI runs at `http://localhost:8080`
- No web dashboard for local server
- Monitor via application logs

### Production

- Log in to [Upstash Console](https://console.upstash.com)
- Navigate to QStash section
- View messages, schedules, and delivery logs

## Application Logs

The job system integrates with the Winston logging system:

```typescript
import logger from '@/lib/logger/logger.service';

// View logs in console or log files
// Logs are located in: /logs/
```

### Key Log Patterns

```
[jobs] Enqueueing job { jobId, type, url }
[jobs] Job enqueued successfully { jobId, type }
[jobs] Processing job { jobId, type }
[jobs] Job processed successfully { jobId, type }
[jobs] Job processing failed { jobId, type, error }
```

## Common Failure Scenarios

### 1. Signature Verification Failed

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

### 2. Job Not Processing

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

### 3. Payload Validation Failed

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

### 4. Job Execution Timeout

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

## Debugging Failed Jobs

### Step 1: Check Job Execution Record

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

### Step 2: Review Application Logs

```bash
# View recent job logs
tail -f logs/application-*.log | grep '\[jobs\]'
```

### Step 3: Test Job Handler Directly

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

### Step 4: Manually Retry Failed Job

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

## Monitoring Tools

### Health Check Endpoint

Create a monitoring endpoint for job system health:

```typescript
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

  const failureRate = stats.find((s) => s.status === 'failed')?.count || 0;
  const totalJobs = stats.reduce((sum, s) => sum + s.count, 0);

  return Response.json({
    stats,
    failureRate,
    totalJobs,
    health: failureRate / totalJobs < 0.05 ? 'healthy' : 'unhealthy',
  });
}
```

### Job Metrics Dashboard

Create a dashboard for job metrics:

```typescript
// app/api/admin/job-metrics/route.ts
export async function GET() {
  const last24h = await db
    .select({
      jobType: jobExecutions.jobType,
      status: jobExecutions.status,
      count: sql<number>`count(*)::int`,
      avgDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))`,
    })
    .from(jobExecutions)
    .where(sql`created_at > NOW() - INTERVAL '24 hours'`)
    .groupBy(jobExecutions.jobType, jobExecutions.status);

  return Response.json({ metrics: last24h });
}
```

## Alerting

Set up alerts for production monitoring:

### Alert on Failure Rate

```typescript
// Check failure rate every 5 minutes
const failureRate = await getJobFailureRate();
if (failureRate > 0.05) {
  // 5% failure rate
  await sendAlert('High job failure rate detected', { failureRate });
}
```

### Alert on Stuck Jobs

```typescript
// Check for jobs stuck in processing
const stuckJobs = await db.select().from(jobExecutions).where(sql`
    status = 'processing'
    AND started_at < NOW() - INTERVAL '10 minutes'
  `);

if (stuckJobs.length > 0) {
  await sendAlert('Jobs stuck in processing', { stuckJobs });
}
```

## Performance Monitoring

### Job Duration Tracking

```typescript
// Track job performance
const slowJobs = await db
  .select({
    jobType: jobExecutions.jobType,
    avgDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))`,
    count: sql<number>`count(*)::int`,
  })
  .from(jobExecutions)
  .where(sql`completed_at IS NOT NULL`)
  .groupBy(jobExecutions.jobType)
  .having(sql`AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) > 30`); // Slower than 30s
```

### Queue Depth Monitoring

Monitor QStash queue depth (production only):

```typescript
// In production, you can monitor queue metrics from QStash dashboard
// This would require QStash API integration for automated monitoring
```

## Log Analysis

### Structured Logging

The job system uses structured logging:

```typescript
logger.info('[jobs] Job enqueued', {
  jobId,
  jobType,
  userId: metadata.userId,
  organizationId: metadata.organizationId,
});

logger.error('[jobs] Job failed', {
  jobId,
  jobType,
  error: error.message,
  stack: error.stack,
});
```

### Log Aggregation

Set up log aggregation for better analysis:

```bash
# Example: Send logs to external service
// In logger configuration
transports: [
  new winston.transports.File({ filename: 'logs/application.log' }),
  new winston.transports.Console(),
  // new winston.transports.Http({ host: 'log-aggregator.example.com' }),
],
```

## Troubleshooting Checklist

### Job Not Enqueueing

- [ ] Check QStash client configuration
- [ ] Verify environment variables
- [ ] Test QStash connectivity
- [ ] Check for validation errors

### Job Not Processing

- [ ] Verify job worker endpoint exists
- [ ] Check QStash can reach endpoint
- [ ] Review firewall settings
- [ ] Check endpoint logs

### High Failure Rate

- [ ] Review error messages in database
- [ ] Check external service status
- [ ] Verify payload structure
- [ ] Check for resource constraints

### Poor Performance

- [ ] Analyze job duration metrics
- [ ] Check database query performance
- [ ] Review external API response times
- [ ] Consider job optimization

## Next Steps

- **[Testing](../testing)** - Learn testing strategies for jobs
- **[Deployment](../deployment)** - Production deployment guide
- **[API Reference](../api-reference)** - Complete API documentation
