# Async Operations Migration Plan

**Created:** October 1, 2025
**Status:** Draft
**Priority:** High
**Estimated Effort:** 2-3 days
**Complexity:** Medium

## Executive Summary

Migrate all blocking operations in the SaaS starter to use the QStash async job processing system. This improves performance, reliability, and scalability by offloading time-consuming operations to background jobs. The most critical improvement is refactoring Stripe webhooks to respond immediately instead of blocking.

---

## Identified Blocking Operations

### 1. Stripe Webhook Processing (CRITICAL - Day 1)

**Current State:** Stripe webhooks block while performing:

- Multiple database queries (getOrganizationByStripeCustomerId, getOrganizationOwner, getUserById)
- Database writes (handleSubscriptionChange, logActivity)
- Cache operations (cache invalidation)
- Email sending (300-700ms)

**File:** `app/api/stripe/webhook/route.ts`

**Problems:**

- Webhook can timeout if any operation is slow
- Stripe retries failed webhooks, causing duplicate processing
- Database connection pool pressure
- Poor reliability

**Solution:**

- Webhook endpoint only verifies signature and enqueues job
- All processing happens in background job worker
- Respond to Stripe in <50ms

---

### 2. Email Operations (HIGH - Day 2)

**Current State:** All auth/user operations block for email delivery (200-500ms each)

**Files:**

- `lib/auth/hooks/auth.hook.ts:13` - Welcome email on signup
- `app/(login)/actions.ts:197` - Password changed email
- `app/(login)/actions.ts:256, 265` - Email change (2 emails)
- `app/(login)/actions.ts:332` - Password reset email

**Solution:** Replace with async variants from `lib/emails/enqueue.ts`

---

### 3. Activity Logging (OPTIONAL - Future)

**Current State:** Every user action blocks for DB write (~10-50ms)

**Impact:** Low - database writes are fast, this is lower priority

**Solution:** Create activity log job worker (only if needed for high traffic)

---

## Implementation Plan

### Phase 1: Stripe Webhook Migration (Day 1)

#### 1.1 Create Stripe Webhook Job Schema

**File:** `lib/types/jobs/schemas/stripe-webhook-job.schema.ts`

```typescript
import { z } from 'zod';
import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '../types';

export const StripeWebhookJobPayloadSchema = z.object({
  eventType: z.string(), // 'checkout.session.completed', etc.
  eventId: z.string(),
  eventData: z.record(z.any()), // The Stripe event.data.object
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  ipAddress: z.string().optional(),
});

export const StripeWebhookJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.PROCESS_STRIPE_WEBHOOK),
  payload: StripeWebhookJobPayloadSchema,
});

export type StripeWebhookJobPayload = z.infer<
  typeof StripeWebhookJobPayloadSchema
>;
export type StripeWebhookJob = z.infer<typeof StripeWebhookJobSchema>;
```

---

#### 1.2 Add Stripe Webhook Job Type

**File:** `lib/types/jobs/enums/job-type.enum.ts`

```typescript
export const JOB_TYPES = {
  SEND_EMAIL: 'send-email',
  PROCESS_WEBHOOK: 'process-webhook',
  PROCESS_STRIPE_WEBHOOK: 'process-stripe-webhook', // NEW
  EXPORT_DATA: 'export-data',
  GENERATE_REPORT: 'generate-report',
  CLEANUP_OLD_DATA: 'cleanup-old-data',
} as const;
```

**File:** `lib/jobs/job-registry.ts`

```typescript
[JOB_TYPES.PROCESS_STRIPE_WEBHOOK]: {
  type: JOB_TYPES.PROCESS_STRIPE_WEBHOOK,
  endpoint: '/api/jobs/stripe-webhook',
  retries: 5,
  timeout: 120,
  description: 'Process Stripe webhook events with retries',
},
```

---

#### 1.3 Create Stripe Webhook Job Worker

**File:** `app/api/jobs/stripe-webhook/route.ts`

```typescript
import { createJobWorker } from '@/lib/jobs/job-worker.handler';
import { handleSubscriptionChange } from '@/lib/payments/stripe';
import {
  getOrganizationByStripeCustomerId,
  getOrganizationOwner,
  logActivity,
  getUserById,
} from '@/lib/db/queries';
import { ActivityType } from '@/lib/types';
import {
  sendSubscriptionCreatedEmailAsync,
  sendPaymentFailedEmailAsync,
} from '@/lib/emails/enqueue';
import { env } from '@/lib/env';
import logger from '@/lib/logger/logger.service';
import type { StripeWebhookJobPayload } from '@/lib/types/jobs/schemas/stripe-webhook-job.schema';
import type { BaseJob } from '@/lib/types/jobs/schemas/base-job.schema';
import Stripe from 'stripe';

const stripeWebhookJobHandler = async (
  payload: StripeWebhookJobPayload,
  job: BaseJob
) => {
  const { eventType, eventData, ipAddress } = payload;

  logger.info('[jobs] Processing Stripe webhook job', {
    jobId: job.jobId,
    eventType,
  });

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = eventData as Stripe.Checkout.Session;
      if (session.customer) {
        const organization = await getOrganizationByStripeCustomerId(
          session.customer as string
        );
        if (organization) {
          const ownerId = await getOrganizationOwner(organization.id);
          if (ownerId) {
            await logActivity(
              ownerId,
              ActivityType.SUBSCRIPTION_CREATED,
              ipAddress ?? ''
            );
            const owner = await getUserById(ownerId);
            if (owner) {
              await sendSubscriptionCreatedEmailAsync(
                {
                  to: owner.email,
                  recipientName: owner.name,
                  planName: organization.planName || 'Unknown Plan',
                  amount: session.amount_total
                    ? (session.amount_total / 100).toFixed(2)
                    : '0.00',
                  dashboardUrl: `${env.BASE_URL}/app/general`,
                },
                { userId: ownerId, organizationId: organization.id }
              );
            }
          }
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = eventData as Stripe.Invoice;
      if (invoice.customer) {
        const organization = await getOrganizationByStripeCustomerId(
          invoice.customer as string
        );
        if (organization) {
          const ownerId = await getOrganizationOwner(organization.id);
          if (ownerId) {
            await logActivity(
              ownerId,
              ActivityType.PAYMENT_FAILED,
              ipAddress ?? ''
            );
            const owner = await getUserById(ownerId);
            if (owner) {
              await sendPaymentFailedEmailAsync(
                {
                  to: owner.email,
                  recipientName: owner.name,
                  amountDue: (invoice.amount_due / 100).toFixed(2),
                  paymentDetailsUrl: `${env.BASE_URL}/app/settings/billing`,
                },
                { userId: ownerId, organizationId: organization.id }
              );
            }
          }
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = eventData as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      const organization = await getOrganizationByStripeCustomerId(
        subscription.customer as string
      );
      if (organization) {
        // Invalidate caches
        const { cacheService, CacheKeys } = await import('@/lib/cache');
        await cacheService.delete(
          CacheKeys.organizationSubscription(organization.id)
        );
        await cacheService.delete(
          CacheKeys.stripeCustomer(subscription.customer as string)
        );

        const ownerId = await getOrganizationOwner(organization.id);
        if (ownerId) {
          await logActivity(
            ownerId,
            ActivityType.SUBSCRIPTION_UPDATED,
            ipAddress ?? ''
          );
        }
        // TODO: Send subscription updated email
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = eventData as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      const organization = await getOrganizationByStripeCustomerId(
        subscription.customer as string
      );
      if (organization) {
        // Invalidate caches
        const { cacheService, CacheKeys } = await import('@/lib/cache');
        await cacheService.delete(
          CacheKeys.organizationSubscription(organization.id)
        );
        await cacheService.delete(
          CacheKeys.stripeCustomer(subscription.customer as string)
        );

        const ownerId = await getOrganizationOwner(organization.id);
        if (ownerId) {
          await logActivity(
            ownerId,
            ActivityType.SUBSCRIPTION_DELETED,
            ipAddress ?? ''
          );
        }
        // TODO: Send subscription deleted email
      }
      break;
    }

    default:
      logger.info(`[jobs] Unhandled Stripe webhook event type: ${eventType}`);
  }
};

export const POST = createJobWorker<StripeWebhookJobPayload>(
  stripeWebhookJobHandler
);
```

---

#### 1.4 Refactor Stripe Webhook Endpoint

**File:** `app/api/stripe/webhook/route.ts`

```typescript
import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';
import { env } from '@/lib/env';
import { createApiHandler } from '@/lib/server/api-handler';
import { error as errorResponse } from '@/lib/http/response';
import logger from '@/lib/logger/logger.service';
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/jobs/types';

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

export const POST = createApiHandler(async ({ request }) => {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    logger.error('Stripe webhook missing signature header', {
      url: request.nextUrl?.pathname ?? request.url,
    });
    return errorResponse('Webhook signature header missing.', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;

    logger.error('Stripe webhook signature verification failed', {
      message,
      stack,
    });

    return errorResponse('Webhook signature verification failed.', {
      status: 400,
    });
  }

  // Enqueue job for async processing
  const ipAddress =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

  try {
    await jobDispatcher.enqueue(
      JOB_TYPES.PROCESS_STRIPE_WEBHOOK,
      {
        eventType: event.type,
        eventId: event.id,
        eventData: event.data.object,
        ipAddress: ipAddress || undefined,
      },
      {
        idempotencyKey: event.id, // Prevent duplicate processing
      }
    );

    logger.info('[stripe] Webhook event enqueued for processing', {
      eventType: event.type,
      eventId: event.id,
    });

    return { received: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error('[stripe] Failed to enqueue webhook job', {
      message,
      stack,
      eventType: event.type,
      eventId: event.id,
    });

    return errorResponse('Failed to enqueue webhook processing.', {
      status: 500,
    });
  }
});
```

**Benefits:**

- Webhook responds in <50ms
- No timeout risk
- Automatic retries via QStash
- Idempotent processing via event.id
- Full error tracking

---

### Phase 2: Email Operations Migration (Day 2)

#### 2.1 Migrate Auth Hook Welcome Email

**File:** `lib/auth/hooks/auth.hook.ts:13`

```typescript
// Before
import { sendWelcomeEmail } from '@/lib/emails/dispatchers';

await sendWelcomeEmail({
  to: user.email,
  recipientName: user.name,
  dashboardUrl: '/app/general',
});

// After
import { sendWelcomeEmailAsync } from '@/lib/emails/enqueue';

await sendWelcomeEmailAsync(
  {
    to: user.email,
    recipientName: user.name,
    dashboardUrl: '/app/general',
  },
  { userId: user.id }
);
```

---

#### 2.2 Migrate Password Changed Email

**File:** `app/(login)/actions.ts:197`

```typescript
// Before
import { sendPasswordChangedEmail } from '@/lib/emails/dispatchers';

await sendPasswordChangedEmail({
  to: user.email,
  recipientName: user.name || user.email.split('@')[0],
  changedAt: new Date().toISOString(),
});

// After
import { sendPasswordChangedEmailAsync } from '@/lib/emails/enqueue';

await sendPasswordChangedEmailAsync(
  {
    to: user.email,
    recipientName: user.name || user.email.split('@')[0],
    changedAt: new Date().toISOString(),
  },
  { userId: user.id }
);
```

---

#### 2.3 Migrate Email Change Confirmations

**File:** `app/(login)/actions.ts:256, 265`

```typescript
// Before
import { sendEmailChangeConfirmationEmail } from '@/lib/emails/dispatchers';

await sendEmailChangeConfirmationEmail({
  to: email,
  recipientName: name || email.split('@')[0],
  confirmationUrl,
  newEmail: email,
  oldEmail,
});

await sendEmailChangeConfirmationEmail({
  to: oldEmail,
  recipientName: user.name || oldEmail.split('@')[0],
  confirmationUrl,
  newEmail: email,
  oldEmail,
});

// After
import { sendEmailChangeConfirmationEmailAsync } from '@/lib/emails/enqueue';

await Promise.all([
  sendEmailChangeConfirmationEmailAsync(
    {
      to: email,
      recipientName: name || email.split('@')[0],
      confirmationUrl,
      newEmail: email,
      oldEmail,
    },
    { userId: user.id }
  ),
  sendEmailChangeConfirmationEmailAsync(
    {
      to: oldEmail,
      recipientName: user.name || oldEmail.split('@')[0],
      confirmationUrl,
      newEmail: email,
      oldEmail,
    },
    { userId: user.id }
  ),
]);
```

---

#### 2.4 Migrate Password Reset Email

**File:** `app/(login)/actions.ts:332`

```typescript
// Before
import { sendPasswordResetEmail } from '@/lib/emails/dispatchers';

await sendPasswordResetEmail({
  to: email,
  recipientName: foundUser.name || email.split('@')[0],
  resetUrl,
  expiresInMinutes: 60,
});

// After
import { sendPasswordResetEmailAsync } from '@/lib/emails/enqueue';

await sendPasswordResetEmailAsync(
  {
    to: email,
    recipientName: foundUser.name || email.split('@')[0],
    resetUrl,
    expiresInMinutes: 60,
  },
  { userId: foundUser.id }
);
```

---

### Phase 3: Testing & Validation (Day 3)

#### 3.1 Test Stripe Webhooks

**Test using Stripe CLI:**

```bash
# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

**Validate:**

- Webhook responds immediately (<100ms)
- Job appears in QStash dashboard
- Job processes successfully within 10-30s
- Emails are sent
- Database updated correctly
- Caches invalidated

---

#### 3.2 Test Email Operations

**Test Cases:**

1. Sign up new user → verify welcome email
2. Request password reset → verify reset email
3. Change password → verify confirmation email
4. Change email → verify both emails
5. Complete Stripe checkout → verify subscription email
6. Fail Stripe payment → verify payment failed email

**Expected:**

- User operations respond immediately
- Emails arrive within 10-30 seconds
- No errors in logs or QStash dashboard

---

#### 3.3 Monitor Performance

**Metrics:**

| Operation               | Before     | After     | Improvement   |
| ----------------------- | ---------- | --------- | ------------- |
| Stripe webhook response | 500-900ms  | <100ms    | 80-90% faster |
| Sign-up response        | 800-1200ms | 300-700ms | 40-60% faster |
| Password reset          | 600-900ms  | 200-400ms | 60-70% faster |
| Password change         | 500-800ms  | 200-400ms | 50-70% faster |

---

## Checklist

### Phase 1: Stripe Webhooks (Day 1)

- [ ] Create `lib/types/jobs/schemas/stripe-webhook-job.schema.ts`
- [ ] Add `PROCESS_STRIPE_WEBHOOK` to job types
- [ ] Add job config to registry
- [ ] Create `app/api/jobs/stripe-webhook/route.ts`
- [ ] Refactor `app/api/stripe/webhook/route.ts`
- [ ] Export schema from `lib/types/jobs/schemas/index.ts`
- [ ] Test with Stripe CLI
- [ ] Verify job execution in QStash
- [ ] Confirm emails still work

### Phase 2: Email Operations (Day 2)

- [ ] Migrate auth hook welcome email
- [ ] Migrate password changed email
- [ ] Migrate email change confirmations
- [ ] Migrate password reset email
- [ ] Test all email flows
- [ ] Verify response times improved

### Phase 3: Testing (Day 3)

- [ ] Test all Stripe webhook events
- [ ] Test all email operations
- [ ] Monitor QStash dashboard
- [ ] Check job_executions table
- [ ] Validate performance improvements
- [ ] Update documentation

---

## Performance Impact

### Stripe Webhooks

- **Before:** 500-900ms (blocks Stripe, risk of timeout)
- **After:** <100ms (immediate response)
- **Benefit:** 80-90% faster, zero timeout risk

### Email Operations

- **Before:** 200-700ms added to user actions
- **After:** Immediate response
- **Benefit:** 40-70% faster user experience

---

## Risk Mitigation

### Duplicate Webhook Processing

- **Risk:** Stripe retries failed webhooks
- **Solution:** Use `event.id` as idempotency key in job metadata

### Job Failures

- **Risk:** Job fails and webhook isn't processed
- **Solution:** QStash automatic retry (5 retries with exponential backoff)

### Email Delays

- **Risk:** Users don't receive emails immediately
- **Impact:** Low - transactional emails can tolerate 10-30s delay
- **Monitor:** QStash dashboard + Resend delivery status

---

## Rollback Plan

If issues arise:

1. **Stripe Webhooks:** Revert to synchronous processing temporarily
2. **Emails:** Easy to swap back to sync dispatchers
3. **Monitor:** Watch QStash dashboard and job_executions table for failures

---

## Success Criteria

1. ✅ Stripe webhooks respond in <100ms
2. ✅ All webhook events processed successfully
3. ✅ Email operations respond immediately
4. ✅ All emails delivered within 30 seconds
5. ✅ Job success rate >99%
6. ✅ Zero webhook timeouts

---

## Next Steps

1. Review and approve plan
2. Implement Phase 1 (Stripe webhooks)
3. Test thoroughly with Stripe CLI
4. Implement Phase 2 (email operations)
5. Validate performance improvements
6. Monitor production for 1 week
