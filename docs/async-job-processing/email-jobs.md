---
title: Email Jobs - Async Job Processing with QStash
description: Deep dive into email jobs, async vs sync sending, and best practices for transactional emails
---

# Email Jobs Deep Dive

Deep dive into email jobs, async vs sync sending, and best practices for transactional emails.

## Async vs Sync Email Sending

The application provides two approaches for sending emails:

### Synchronous (Direct)

```typescript
import { sendWelcomeEmail } from '@/lib/emails/dispatchers';

// Blocks until email is sent
await sendWelcomeEmail({
  to: 'user@example.com',
  recipientName: 'John Doe',
});
```

### Asynchronous (Job Queue)

```typescript
import { sendWelcomeEmailAsync } from '@/lib/emails/enqueue';

// Returns immediately, email sent in background
await sendWelcomeEmailAsync(
  {
    to: 'user@example.com',
    recipientName: 'John Doe',
  },
  { userId: 123 }
);
```

## When to Use Async Email Jobs

### Use Async Email Jobs When

- **API Performance** - Sending emails from API routes that need fast response times
- **Batch Operations** - Sending multiple emails in a batch operation
- **Non-Critical Delivery** - Email delivery is not critical to the user experience
- **Automatic Retries** - You want automatic retries on failure
- **High Volume** - Sending many emails that might overwhelm email providers

### Use Sync Email Sending When

- **Critical Feedback** - Email delivery needs to be confirmed before proceeding
- **Development Debugging** - Debugging email issues in development
- **Security Emails** - Sending critical security-related emails where immediate feedback is needed
- **User Experience** - Email is part of a critical user flow that requires immediate confirmation

## Email Job Implementation

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
    case 'teamInvitation':
      await sendTeamInvitationEmail({ to, ...data });
      return;
    // ... other templates
  }
};
```

### Supported Email Templates

| Template              | Description                  | Use Case              |
| --------------------- | ---------------------------- | --------------------- |
| `welcome`             | Welcome new users            | User registration     |
| `passwordReset`       | Password reset link          | Forgot password flow  |
| `passwordChanged`     | Password change confirmation | Security notification |
| `emailChange`         | Email change confirmation    | Profile updates       |
| `teamInvitation`      | Team member invitation       | Team management       |
| `subscriptionCreated` | Subscription confirmation    | Billing events        |
| `paymentFailed`       | Payment failure notification | Billing issues        |

## Migration Guide: Converting to Async Emails

### Before (Synchronous)

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

### After (Asynchronous)

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
    organizationId: org.id,
  }
);
```

## Email Job Patterns

### Batch Email Sending

For sending multiple emails:

```typescript
// Instead of multiple separate jobs (less efficient)
await Promise.all([
  sendWelcomeEmailAsync(user1Data),
  sendWelcomeEmailAsync(user2Data),
  sendWelcomeEmailAsync(user3Data),
]);

// Use a single batch job (more efficient)
await jobDispatcher.enqueue(JOB_TYPES.SEND_BATCH_EMAIL, {
  emails: [user1Data, user2Data, user3Data],
});
```

### Conditional Email Sending

```typescript
// Only send email if user has opted in
if (user.emailNotificationsEnabled) {
  await sendWelcomeEmailAsync(
    {
      to: user.email,
      recipientName: user.name,
    },
    { userId: user.id }
  );
}
```

### Email with Attachments

For emails that need file attachments:

```typescript
await sendReportEmailAsync(
  {
    to: 'user@example.com',
    recipientName: 'John Doe',
    reportData: reportContent,
    attachment: {
      filename: 'report.pdf',
      content: pdfBuffer,
    },
  },
  { userId: user.id }
);
```

## Error Handling and Retry Logic

### Email-Specific Error Handling

```typescript
const emailJobHandler = async (payload: SendEmailJobPayload, job: BaseJob) => {
  try {
    await sendEmail(payload);

    logger.info('[jobs] Email sent successfully', {
      jobId: job.jobId,
      template: payload.template,
      to: payload.to,
    });
  } catch (error) {
    logger.error('[jobs] Email sending failed', {
      jobId: job.jobId,
      template: payload.template,
      to: payload.to,
      error: error.message,
    });

    // Check if it's a temporary failure
    if (isTemporaryEmailError(error)) {
      throw error; // Will retry
    } else {
      // Permanent failure - don't retry
      logger.error('[jobs] Permanent email failure', {
        jobId: job.jobId,
        error: error.message,
      });
      throw error;
    }
  }
};
```

### Temporary vs Permanent Failures

```typescript
const isTemporaryEmailError = (error: any): boolean => {
  // Network timeouts, rate limits = temporary
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Invalid email address = permanent
  if (error.message?.includes('Invalid email')) {
    return false;
  }

  // Default to temporary for safety
  return true;
};
```

## Email Job Best Practices

### Template Data Validation

Always validate email template data:

```typescript
const sendWelcomeEmailAsync = async (
  payload: {
    to: string;
    recipientName: string;
  },
  metadata: { userId: number }
) => {
  // Validate payload
  const validatedPayload = WelcomeEmailPayloadSchema.parse(payload);

  return jobDispatcher.enqueue(
    JOB_TYPES.SEND_EMAIL,
    {
      template: 'welcome',
      to: validatedPayload.to,
      data: { recipientName: validatedPayload.recipientName },
    },
    metadata
  );
};
```

### Rate Limiting

Implement rate limiting for email jobs:

```typescript
// In job registry
export const JOB_REGISTRY: Record<JobType, JobConfig> = {
  [JOB_TYPES.SEND_EMAIL]: {
    type: JOB_TYPES.SEND_EMAIL,
    endpoint: '/api/jobs/email',
    retries: 3,
    timeout: 30,
    description: 'Send transactional emails via Resend',
    // Consider rate limiting at job level
  },
};
```

### Email Provider Integration

The system integrates with Resend for email delivery:

```typescript
// lib/emails/dispatchers/index.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (data: WelcomeEmailData) => {
  const { to, recipientName } = data;

  await resend.emails.send({
    from: 'Your App <noreply@yourapp.com>',
    to: [to],
    subject: `Welcome to Your App, ${recipientName}!`,
    html: welcomeEmailTemplate({ recipientName }),
  });
};
```

## Monitoring Email Jobs

### Email-Specific Monitoring

```typescript
// Query email job statistics
const emailStats = await db
  .select({
    template: jobExecutions.payload.template,
    status: jobExecutions.status,
    count: sql<number>`count(*)::int`,
    avgDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))`,
  })
  .from(jobExecutions)
  .where(sql`job_type = 'send-email'`)
  .groupBy(jobExecutions.payload.template, jobExecutions.status);
```

### Email Delivery Tracking

Track email delivery status:

```typescript
// In email dispatcher
const result = await resend.emails.send({
  from: 'Your App <noreply@yourapp.com>',
  to: [to],
  subject: subject,
  html: html,
});

// Log delivery tracking
logger.info('[emails] Email queued for delivery', {
  emailId: result.data?.id,
  to,
  template,
});
```

## Testing Email Jobs

### Unit Testing Email Functions

```typescript
describe('Email Job Handler', () => {
  it('should send welcome email successfully', async () => {
    const mockResend = {
      emails: {
        send: vi.fn().mockResolvedValue({ data: { id: 'email-id' } }),
      },
    };

    vi.doMock('resend', () => ({ Resend: vi.fn(() => mockResend) }));

    const payload = {
      template: 'welcome',
      to: 'test@example.com',
      data: { recipientName: 'Test User' },
    };

    // Test the job handler
    await expect(emailJobHandler(payload, mockJob)).resolves.not.toThrow();
  });
});
```

### Integration Testing

```typescript
describe('Email Job Integration', () => {
  it('should process email job end-to-end', async () => {
    // Enqueue email job
    const jobId = await jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, {
      template: 'welcome',
      to: 'test@example.com',
      data: { recipientName: 'Test User' },
    });

    // Wait for processing
    await waitForJobCompletion(jobId);

    // Verify email was sent
    const execution = await getJobExecutionByJobId(jobId);
    expect(execution.status).toBe('completed');
  });
});
```

## Next Steps

- **[Usage Guide](../usage)** - Learn how to use email jobs
- **[Webhook Jobs](../webhook-jobs)** - Process webhooks asynchronously
- **[Testing](../testing)** - Test your email jobs comprehensively
