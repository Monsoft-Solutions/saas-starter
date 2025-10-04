---
title: Webhook Jobs - Async Job Processing with QStash
description: Processing webhooks asynchronously with Stripe and other webhook sources
---

# Webhook Jobs Deep Dive

Processing webhooks asynchronously with Stripe and other webhook sources.

## Why Async Webhook Processing?

Webhook endpoints must respond quickly to avoid timeouts:

- **Stripe** requires < 3 second response time
- **GitHub** expects < 10 second response time
- **Other providers** have similar requirements

Async processing allows:

- Immediate response to webhook provider
- Complex processing in background
- Automatic retries on failure
- Proper error handling

## Stripe Webhook Processing

Stripe webhooks are processed asynchronously to ensure fast webhook endpoint responses:

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
  await jobDispatcher.enqueue(JOB_TYPES.PROCESS_STRIPE_WEBHOOK, {
    eventType: event.type,
    eventData: event.data.object,
    ipAddress: request.headers.get('x-forwarded-for'),
  });

  // Return 200 immediately to Stripe
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
  });
}
```

### Handled Stripe Events

| Event Type                      | Description               | Action                       |
| ------------------------------- | ------------------------- | ---------------------------- |
| `checkout.session.completed`    | Subscription created      | Update user subscription     |
| `invoice.payment_failed`        | Payment failure           | Notify user, suspend service |
| `customer.subscription.updated` | Subscription changes      | Update subscription details  |
| `customer.subscription.deleted` | Subscription cancellation | Update user status           |

### Stripe Webhook Job Handler

```typescript
const stripeWebhookJobHandler = async (
  payload: StripeWebhookJobPayload,
  job: BaseJob
) => {
  const { eventType, eventData } = payload;

  logger.info('[stripe-webhook] Processing webhook', {
    jobId: job.jobId,
    eventType,
  });

  switch (eventType) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(eventData);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(eventData);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(eventData);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(eventData);
      break;
    default:
      logger.warn('[stripe-webhook] Unhandled event type', {
        jobId: job.jobId,
        eventType,
      });
  }
};
```

## Generic Webhook Processing

For other webhook sources:

```typescript
await jobDispatcher.enqueue(JOB_TYPES.PROCESS_WEBHOOK, {
  source: 'github',
  event: 'push',
  data: webhookPayload,
});
```

### GitHub Webhook Example

```typescript
// app/api/webhooks/github/route.ts
export async function POST(request: Request) {
  const payload = await request.json();
  const signature = request.headers.get('x-hub-signature-256');

  // Verify GitHub signature
  const isValid = await verifyGitHubSignature(payload, signature);

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Enqueue for async processing
  await jobDispatcher.enqueue(JOB_TYPES.PROCESS_WEBHOOK, {
    source: 'github',
    event: request.headers.get('x-github-event'),
    data: payload,
    deliveryId: request.headers.get('x-github-delivery'),
  });

  return new Response('OK');
}
```

### GitHub Webhook Job Handler

```typescript
const githubWebhookJobHandler = async (
  payload: GitHubWebhookJobPayload,
  job: BaseJob
) => {
  const { source, event, data } = payload;

  switch (event) {
    case 'push':
      await handleGitHubPush(data);
      break;
    case 'pull_request':
      await handleGitHubPullRequest(data);
      break;
    case 'issues':
      await handleGitHubIssue(data);
      break;
    default:
      logger.info('[github-webhook] Unhandled event', {
        jobId: job.jobId,
        event,
      });
  }
};
```

## Webhook Job Patterns

### Idempotency for Webhooks

Use webhook IDs for idempotency to prevent duplicate processing:

```typescript
await jobDispatcher.enqueue(JOB_TYPES.PROCESS_WEBHOOK, webhookPayload, {
  userId: user.id,
  organizationId: org.id,
  idempotencyKey: `webhook-${webhookId}`, // Unique per webhook
});
```

### Webhook Retry Logic

```typescript
const webhookJobHandler = async (payload: WebhookJobPayload, job: BaseJob) => {
  try {
    await processWebhook(payload);

    logger.info('[webhook] Processed successfully', {
      jobId: job.jobId,
      source: payload.source,
      event: payload.event,
    });
  } catch (error) {
    logger.error('[webhook] Processing failed', {
      jobId: job.jobId,
      source: payload.source,
      event: payload.event,
      error: error.message,
    });

    // Check if retryable
    if (isRetryableWebhookError(error)) {
      throw error; // Will retry
    } else {
      // Don't retry permanent failures
      logger.error('[webhook] Permanent failure', {
        jobId: job.jobId,
        error: error.message,
      });
    }
  }
};
```

### Webhook Batching

For high-volume webhooks:

```typescript
// Batch multiple webhook events
await jobDispatcher.enqueue(JOB_TYPES.PROCESS_WEBHOOK_BATCH, {
  webhooks: [webhook1, webhook2, webhook3],
  source: 'github',
});
```

## Webhook Security

### Signature Verification

Always verify webhook signatures:

```typescript
// Stripe signature verification
const event = await stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);

// GitHub signature verification
const isValid = await verifyGitHubSignature(payload, signature);
```

### Rate Limiting

Implement rate limiting for webhook endpoints:

```typescript
// In webhook route
const rateLimit = await checkRateLimit(request.ip);
if (rateLimit.exceeded) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### IP Whitelisting

For additional security, whitelist provider IPs:

```typescript
const allowedIPs = [
  '54.187.174.169', // Stripe IP range
  '54.187.205.235',
  // ... more IPs
];

if (!allowedIPs.includes(request.ip)) {
  return new Response('Unauthorized', { status: 403 });
}
```

## Error Handling

### Webhook-Specific Errors

```typescript
const isRetryableWebhookError = (error: any): boolean => {
  // Network errors = retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Provider API errors = may be retryable
  if (error.status >= 500) {
    return true;
  }

  // Client errors = not retryable
  if (error.status >= 400 && error.status < 500) {
    return false;
  }

  return true; // Default to retryable
};
```

### Webhook Timeouts

Handle webhook timeouts gracefully:

```typescript
const webhookJobHandler = async (payload: WebhookJobPayload, job: BaseJob) => {
  const timeout = 25000; // 25 seconds for most providers

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Webhook timeout')), timeout)
  );

  try {
    await Promise.race([processWebhook(payload), timeoutPromise]);
  } catch (error) {
    if (error.message === 'Webhook timeout') {
      logger.error('[webhook] Timeout exceeded', {
        jobId: job.jobId,
      });
    }
    throw error;
  }
};
```

## Testing Webhook Jobs

### Mock Webhook Testing

```typescript
describe('Stripe Webhook Job', () => {
  it('should process subscription created event', async () => {
    const mockStripeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_456',
        },
      },
    };

    const payload = {
      eventType: mockStripeEvent.type,
      eventData: mockStripeEvent.data.object,
    };

    // Mock database calls
    vi.doMock('@/lib/db/queries', () => ({
      updateUserSubscription: vi.fn().mockResolvedValue({}),
    }));

    await expect(
      stripeWebhookJobHandler(payload, mockJob)
    ).resolves.not.toThrow();
  });
});
```

### Integration Testing

```typescript
describe('Webhook Integration', () => {
  it('should process webhook end-to-end', async () => {
    // Send test webhook to your endpoint
    const response = await fetch('/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': generateStripeSignature(testPayload),
      },
      body: JSON.stringify(testPayload),
    });

    expect(response.status).toBe(200);

    // Wait for async processing
    await waitForJobCompletion(webhookJobId);

    // Verify side effects
    const user = await getUserByStripeCustomerId('cus_123');
    expect(user.subscriptionStatus).toBe('active');
  });
});
```

## Monitoring Webhook Jobs

### Webhook-Specific Monitoring

```typescript
// Query webhook job statistics
const webhookStats = await db
  .select({
    source: jobExecutions.payload.source,
    event: jobExecutions.payload.event,
    status: jobExecutions.status,
    count: sql<number>`count(*)::int`,
  })
  .from(jobExecutions)
  .where(sql`job_type IN ('process-webhook', 'process-stripe-webhook')`)
  .groupBy(
    jobExecutions.payload.source,
    jobExecutions.payload.event,
    jobExecutions.status
  );
```

### Webhook Health Checks

```typescript
// Check webhook processing health
const webhookHealth = await db
  .select({
    jobType: jobExecutions.jobType,
    failedCount: sql<number>`COUNT(CASE WHEN status = 'failed' THEN 1 END)`,
    totalCount: sql<number>`COUNT(*)`,
  })
  .from(jobExecutions)
  .where(sql`created_at > NOW() - INTERVAL '1 hour'`)
  .groupBy(jobExecutions.jobType);
```

## Best Practices

### Webhook Job Design

1. **Keep jobs simple** - One responsibility per job
2. **Use proper typing** - Strong TypeScript types for payloads
3. **Handle all events** - Even if you don't process them
4. **Log extensively** - Webhook processing should be observable
5. **Validate signatures** - Always verify webhook authenticity

### Error Handling

1. **Categorize errors** - Temporary vs permanent failures
2. **Implement retries** - For transient failures
3. **Monitor failures** - Alert on high failure rates
4. **Graceful degradation** - Handle partial failures

### Performance

1. **Process asynchronously** - Don't block webhook responses
2. **Batch when possible** - For high-volume scenarios
3. **Monitor processing time** - Ensure jobs complete in time
4. **Scale horizontally** - Use multiple job workers if needed

## Next Steps

- **[Usage Guide](./usage.md)** - Learn how to use webhook jobs
- **[Monitoring](./monitoring.md)** - Set up monitoring and alerting
- **[Testing](./testing.md)** - Test your webhook jobs comprehensively
