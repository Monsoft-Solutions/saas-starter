---
title: Testing - Async Job Processing with QStash
description: Testing strategies and examples for the QStash job processing system
---

# Testing

Testing strategies and examples for the QStash job processing system.

## Unit Testing Job Services

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
      createJobExecution: mockCreateJobExecution,
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

## Integration Testing Job Workers

Test complete job processing flow:

```typescript
// tests/jobs/email-job.worker.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/jobs/email/route';

describe('Email Job Worker', () => {
  it('should process welcome email job', async () => {
    const mockRequest = {
      text: () =>
        Promise.resolve(
          JSON.stringify({
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
          })
        ),
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

## Mocking QStash in Tests

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

## Testing Job Handlers

### Testing Email Job Handler

```typescript
describe('Email Job Handler', () => {
  beforeEach(() => {
    vi.doMock('@/lib/emails/dispatchers', () => ({
      sendWelcomeEmail: vi.fn().mockResolvedValue({}),
    }));
  });

  it('should send welcome email successfully', async () => {
    const payload = {
      template: 'welcome',
      to: 'test@example.com',
      data: { recipientName: 'Test User' },
    };

    const mockJob = {
      jobId: 'test-job',
      type: 'send-email',
      payload,
      metadata: { createdAt: new Date().toISOString() },
    };

    await expect(emailJobHandler(payload, mockJob)).resolves.not.toThrow();

    const { sendWelcomeEmail } = await import('@/lib/emails/dispatchers');
    expect(sendWelcomeEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      recipientName: 'Test User',
    });
  });

  it('should handle email sending errors', async () => {
    const { sendWelcomeEmail } = await import('@/lib/emails/dispatchers');
    sendWelcomeEmail.mockRejectedValueOnce(new Error('Email service down'));

    const payload = {
      template: 'welcome',
      to: 'test@example.com',
      data: { recipientName: 'Test User' },
    };

    const mockJob = {
      jobId: 'test-job',
      type: 'send-email',
      payload,
      metadata: { createdAt: new Date().toISOString() },
    };

    await expect(emailJobHandler(payload, mockJob)).rejects.toThrow(
      'Email service down'
    );
  });
});
```

### Testing Webhook Job Handler

```typescript
describe('Stripe Webhook Job Handler', () => {
  it('should process subscription created event', async () => {
    const mockEventData = {
      customer: 'cus_123',
      subscription: 'sub_456',
    };

    const payload = {
      eventType: 'checkout.session.completed',
      eventData: mockEventData,
    };

    // Mock database operations
    vi.doMock('@/lib/db/queries', () => ({
      updateUserSubscription: vi.fn().mockResolvedValue({}),
    }));

    const mockJob = {
      jobId: 'test-job',
      type: 'process-stripe-webhook',
      payload,
      metadata: { createdAt: new Date().toISOString() },
    };

    await expect(
      stripeWebhookJobHandler(payload, mockJob)
    ).resolves.not.toThrow();

    const { updateUserSubscription } = await import('@/lib/db/queries');
    expect(updateUserSubscription).toHaveBeenCalledWith(
      'cus_123',
      expect.any(Object)
    );
  });
});
```

## End-to-End Testing

### Testing Complete Job Flow

```typescript
describe('Job E2E Flow', () => {
  it('should process job from enqueue to completion', async () => {
    // Enqueue a job
    const jobId = await jobDispatcher.enqueue(
      JOB_TYPES.SEND_EMAIL,
      {
        template: 'welcome',
        to: 'test@example.com',
        data: { recipientName: 'Test User' },
      },
      { userId: 123 }
    );

    // Verify job was recorded in database
    const execution = await getJobExecutionByJobId(jobId);
    expect(execution).toBeDefined();
    expect(execution.status).toBe('pending');

    // Simulate QStash delivery (in real tests, this would be more complex)
    const mockRequest = {
      text: () => Promise.resolve(JSON.stringify(execution)),
      headers: {
        get: (name: string) =>
          name === 'Upstash-Signature' ? 'valid-signature' : null,
      },
      url: 'http://localhost:3000/api/jobs/email',
    };

    // Process the job
    const response = await POST(mockRequest as any);
    expect(response.status).toBe(200);

    // Verify job completion
    const completedExecution = await getJobExecutionByJobId(jobId);
    expect(completedExecution.status).toBe('completed');
  });
});
```

## Test Utilities

### Job Test Helpers

```typescript
// tests/helpers/job-test-helpers.ts
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { getJobExecutionByJobId } from '@/lib/db/queries';

export const waitForJobCompletion = async (jobId: string, timeout = 5000) => {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const execution = await getJobExecutionByJobId(jobId);

    if (execution?.status === 'completed') {
      return execution;
    }

    if (execution?.status === 'failed') {
      throw new Error(`Job failed: ${execution.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('Job completion timeout');
};

export const createTestJob = async (jobType: string, payload: any) => {
  return jobDispatcher.enqueue(jobType as any, payload, { userId: 1 });
};
```

### Mock Factories

```typescript
// tests/factories/job-factories.ts
export const createMockJobExecution = (overrides = {}) => ({
  id: 1,
  jobId: 'test-job-id',
  jobType: 'send-email',
  status: 'pending',
  payload: {
    template: 'welcome',
    to: 'test@example.com',
    data: { recipientName: 'Test User' },
  },
  result: null,
  error: null,
  retryCount: 0,
  userId: 1,
  organizationId: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockQStashResponse = () => ({
  messageId: 'msg_123',
  url: 'https://qstash.upstash.io/v1/messages/msg_123',
});
```

## Test Coverage

Run tests with coverage:

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run specific test file
pnpm vitest tests/jobs/job-dispatcher.service.test.ts

# Run tests for specific job type
pnpm vitest tests/jobs/email
```

## Testing Best Practices

### Test Organization

Organize tests by job type:

```
tests/
  jobs/
    job-dispatcher.service.test.ts    # Core dispatcher tests
    email/
      email-job.worker.test.ts        # Email job worker tests
      email-job.service.test.ts       # Email service tests
    webhook/
      stripe-webhook.worker.test.ts   # Stripe webhook tests
      github-webhook.worker.test.ts   # GitHub webhook tests
```

### Test Isolation

Ensure tests don't interfere with each other:

```typescript
describe('Email Job Worker', () => {
  beforeEach(() => {
    // Clear any test data
    vi.clearAllMocks();

    // Reset database state if needed
    // await resetTestDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    // await cleanupTestJobs();
  });
});
```

### Realistic Test Data

Use realistic test data:

```typescript
const createRealisticEmailPayload = () => ({
  template: 'welcome',
  to: 'john.doe@example.com',
  data: {
    recipientName: 'John Doe',
    companyName: 'Acme Corp',
    loginUrl: 'https://app.example.com/login',
  },
});

const createRealisticStripeEvent = () => ({
  eventType: 'checkout.session.completed',
  eventData: {
    customer: 'cus_real_customer_id',
    subscription: 'sub_real_subscription_id',
    amount_total: 2999,
    currency: 'usd',
  },
});
```

## Advanced Testing Patterns

### Testing Job Retries

```typescript
describe('Job Retry Logic', () => {
  it('should retry failed jobs', async () => {
    let attemptCount = 0;
    const mockHandler = vi.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Temporary failure');
      }
      return Promise.resolve();
    });

    // Mock QStash to retry on failure
    vi.doMock('@/lib/jobs/qstash.client', () => ({
      qstash: {
        publishJSON: vi.fn().mockImplementation(() => {
          if (attemptCount < 3) {
            throw new Error('Network error');
          }
          return Promise.resolve({ messageId: 'msg_123' });
        }),
      },
    }));

    // This would test the retry mechanism
    // In practice, this requires more complex setup
  });
});
```

### Testing Job Timeouts

```typescript
describe('Job Timeout Handling', () => {
  it('should handle job timeouts', async () => {
    const slowJobHandler = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 35000)) // 35 seconds
    );

    // Mock a job registry with 30 second timeout
    const timeoutConfig = { timeout: 30 };

    // Test that timeout is enforced
    await expect(slowJobHandler()).rejects.toThrow('Timeout');
  });
});
```

## Integration with Test Database

### Database Test Setup

```typescript
// tests/setup.ts
import { setupTestDatabase, teardownTestDatabase } from './helpers/database';

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});
```

### Test Database Helpers

```typescript
// tests/helpers/database.ts
export const setupTestDatabase = async () => {
  // Set up test database
  // Create tables, seed test data
};

export const teardownTestDatabase = async () => {
  // Clean up test database
  // Drop tables, reset sequences
};

export const resetTestDatabase = async () => {
  // Reset database to clean state between tests
};
```

## Next Steps

- **[Creating Jobs](../creating-jobs)** - Learn how to create new job types
- **[Deployment](../deployment)** - Production deployment guide
- **[Monitoring](../monitoring)** - Monitor your job system in production
