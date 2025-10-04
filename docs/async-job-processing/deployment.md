---
title: Deployment - Async Job Processing with QStash
description: Production deployment guide for the QStash job processing system
---

# Production Deployment

Production deployment guide for the QStash job processing system.

## Environment Variables Checklist

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

## Database Migrations

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

## Deployment Checklist

### 1. Environment Variables

- [ ] QStash credentials configured
- [ ] Database connection string set
- [ ] BASE_URL matches production domain
- [ ] All secrets properly secured
- [ ] No development credentials in production

### 2. Database Setup

- [ ] `job_executions` table created
- [ ] Indexes created for performance
- [ ] Test queries run successfully
- [ ] Database backups configured

### 3. Job Processing Tests

- [ ] Enqueue a test job in staging
- [ ] Verify job processes successfully
- [ ] Check QStash dashboard for deliveries
- [ ] Confirm logs are written
- [ ] Test webhook processing if applicable

### 4. Monitoring Setup

- [ ] Set up alerts for failed jobs
- [ ] Monitor QStash dashboard
- [ ] Track job execution times
- [ ] Set up log aggregation
- [ ] Configure error tracking (Sentry, etc.)

### 5. Security Considerations

- [ ] QStash signature verification enabled
- [ ] Job endpoints not publicly accessible
- [ ] Sensitive data encrypted in payloads
- [ ] Rate limiting configured
- [ ] Firewall rules updated for QStash IPs

## Monitoring and Alerting

Set up monitoring for production:

### Health Check Endpoint

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

### Alert Conditions

**Alert on:**

- Failed job rate > 5%
- Jobs stuck in `processing` > 10 minutes
- No jobs processed in last hour (if expected)
- Queue depth too high (QStash dashboard)
- Average job duration > threshold

### Monitoring Dashboard

Create a monitoring dashboard with:

- Job success/failure rates
- Average processing times
- Queue depths
- Error trends
- Top failing job types

## Performance Optimization

### Database Indexes

```sql
-- Index for job queries
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_created_at ON job_executions(created_at DESC);
CREATE INDEX idx_job_executions_user_id ON job_executions(user_id);
CREATE INDEX idx_job_executions_organization_id ON job_executions(organization_id);

-- Composite index for common queries
CREATE INDEX idx_job_executions_status_created ON job_executions(status, created_at DESC);
```

### Job Cleanup

Schedule a cleanup job to remove old executions:

```typescript
// Schedule daily at 3 AM
await jobDispatcher.schedule(
  JOB_TYPES.CLEANUP_OLD_DATA,
  '0 3 * * *',
  { retention: 90 } // Keep 90 days of history
);
```

### Connection Pooling

Configure database connection pooling:

```typescript
// In database configuration
export const dbConfig = {
  connectionString: process.env.POSTGRES_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

## Scaling Considerations

### Horizontal Scaling

For high-volume applications:

- Deploy multiple application instances
- QStash automatically distributes jobs
- Use Redis for session storage if needed
- Consider read replicas for analytics

### Job Worker Optimization

```typescript
// In job registry - optimize timeouts and retries
export const JOB_REGISTRY: Record<JobType, JobConfig> = {
  [JOB_TYPES.SEND_EMAIL]: {
    type: JOB_TYPES.SEND_EMAIL,
    endpoint: '/api/jobs/email',
    retries: 3,
    timeout: 30, // May need adjustment based on email provider
    description: 'Send transactional emails via Resend',
  },
};
```

## Security Best Practices

### Environment Variables

- Store secrets in secure environment variable stores
- Never commit credentials to version control
- Use different credentials for different environments
- Rotate credentials regularly

### Network Security

- Restrict job endpoint access
- Use VPC if available
- Configure firewall rules for QStash IPs
- Enable HTTPS everywhere

### Data Protection

- Encrypt sensitive data in job payloads
- Use proper authentication for job endpoints
- Implement rate limiting
- Log access attempts

## Troubleshooting Production Issues

### Common Production Issues

1. **High failure rate**
   - Check external service status (email, payment providers)
   - Review error messages in logs
   - Verify environment variables

2. **Slow job processing**
   - Check database performance
   - Review job timeout settings
   - Monitor resource usage

3. **QStash connectivity issues**
   - Verify QStash credentials
   - Check network connectivity
   - Review QStash dashboard for errors

### Production Debugging

```typescript
// Enable debug logging in production if needed
logger.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
```

### Log Analysis

Set up centralized logging:

```bash
# Example log aggregation setup
// Use Winston transports for log aggregation
transports: [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'logs/combined.log' }),
  // new winston.transports.Http({ host: 'log-aggregator.example.com' }),
],
```

## Backup and Recovery

### Database Backups

- Configure automated database backups
- Test backup restoration procedures
- Store backups securely and redundantly

### Job State Recovery

The job system is resilient to failures:

- Job records persist in database
- Failed jobs can be manually retried
- QStash provides delivery guarantees

## Cost Optimization

### QStash Pricing Considerations

- Monitor message volume
- Optimize job batching where possible
- Use appropriate retry policies
- Consider job scheduling for non-urgent tasks

### Database Cost Optimization

- Archive old job records
- Use appropriate retention policies
- Monitor query performance
- Optimize indexes

## Next Steps

- **[Monitoring](./monitoring.md)** - Set up comprehensive monitoring
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Setup Guide](./setup.md)** - Review setup instructions
