# Stripe Subscription Enhancements Implementation Plan

**Created:** September 30, 2025  
**Status:** Draft  
**Priority:** High

## Executive Summary

This plan enhances the Stripe subscription handling system to provide comprehensive lifecycle management, robust email notifications, and improved payment failure handling. The implementation follows Stripe best practices and ensures customers are properly informed about all subscription events.

## Current State Analysis

### ✅ Implemented Features

- Basic webhook handling for core events
- Subscription created email notifications
- Payment failed email notifications
- Subscription cancellation at period end (via Billing Portal)
- Webhook signature verification
- Activity logging for key events

### ❌ Missing Critical Features

1. **Email Notifications:**
   - Subscription updated/upgraded
   - Subscription canceled/deleted confirmation
   - Payment succeeded confirmation
   - Trial ending warnings
   - Renewal reminders
   - Subscription reactivated

2. **Webhook Events:**
   - `invoice.payment_succeeded`
   - `customer.subscription.trial_will_end`
   - `invoice.upcoming`
   - `invoice.payment_action_required`
   - `payment_intent.payment_failed`

3. **Status Handling:**
   - `past_due` subscriptions
   - `incomplete` subscriptions
   - `incomplete_expired` subscriptions

4. **System Resilience:**
   - Webhook event idempotency
   - Better error handling and retry logic
   - Webhook event logging for debugging

## Best Practices from Research

### 1. Subscription Lifecycle Events to Handle

| Event                                  | Purpose                | Action Required          |
| -------------------------------------- | ---------------------- | ------------------------ |
| `checkout.session.completed`           | Initial subscription   | ✅ Implemented           |
| `customer.subscription.created`        | Subscription activated | Send welcome email       |
| `customer.subscription.updated`        | Plan/status change     | Send update notification |
| `customer.subscription.deleted`        | Cancellation complete  | Send goodbye email       |
| `customer.subscription.trial_will_end` | Trial ending soon      | Send trial reminder      |
| `invoice.payment_succeeded`            | Successful payment     | Send receipt             |
| `invoice.payment_failed`               | Payment failure        | ✅ Implemented           |
| `invoice.payment_action_required`      | SCA required           | Send action email        |
| `invoice.upcoming`                     | Upcoming renewal       | Send reminder            |

### 2. Dunning Management Strategy

**Grace Period Approach:**

- Day 0: Payment fails → Send first notification
- Day 3: Send second reminder if still unpaid
- Day 7: Send final warning
- Day 14: Subscription canceled if unpaid

**Smart Retry Configuration:**

- Stripe automatically retries failed payments
- Monitor `past_due` status
- Provide clear payment update instructions

### 3. Subscription Cancellation Flow

**Immediate vs. Period End:**

- ✅ Already configured: `cancel_at_period_end: true`
- User retains access until period ends
- Can reactivate before period end
- Send confirmation with end date

## Implementation Plan

### Phase 1: Webhook Event Idempotency & Logging

**Objective:** Ensure webhooks are processed reliably without duplicates

#### 1.1 Create Webhook Event Log Table

**File:** `lib/db/schemas/stripe-webhook-event.table.ts`

```typescript
import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: text('id').primaryKey(), // Stripe event ID
  type: text('type').notNull(),
  data: jsonb('data').notNull(),
  processed: boolean('processed').default(false),
  processingError: text('processing_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});
```

#### 1.2 Create Event Processing Service

**File:** `lib/payments/webhook-event.service.ts`

```typescript
/**
 * Handles idempotent webhook event processing
 */
export async function processWebhookEvent(
  event: Stripe.Event,
  handler: () => Promise<void>
): Promise<boolean> {
  // Check if event already processed
  const existingEvent = await getWebhookEvent(event.id);

  if (existingEvent?.processed) {
    console.info(`Webhook event ${event.id} already processed, skipping`);
    return false;
  }

  try {
    // Store event
    await storeWebhookEvent(event);

    // Process event
    await handler();

    // Mark as processed
    await markEventProcessed(event.id);

    return true;
  } catch (error) {
    await markEventFailed(event.id, error);
    throw error;
  }
}
```

### Phase 2: New Activity Types & Email Templates

#### 2.1 Add New Activity Types

**File:** `lib/types/activity-log/activity-type.enum.ts`

```typescript
export enum ActivityType {
  // ... existing types
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED', // Different from DELETED
  SUBSCRIPTION_REACTIVATED = 'SUBSCRIPTION_REACTIVATED',
  SUBSCRIPTION_TRIAL_ENDING = 'SUBSCRIPTION_TRIAL_ENDING',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  PAYMENT_ACTION_REQUIRED = 'PAYMENT_ACTION_REQUIRED',
}
```

#### 2.2 Create Email Templates

##### A. Payment Succeeded Email

**File:** `lib/emails/templates/payment-succeeded.template.tsx`

```typescript
export type PaymentSucceededEmailProps = {
  recipientName: string;
  amount: string;
  currency: string;
  planName: string;
  nextBillingDate: string;
  invoiceUrl: string;
  dashboardUrl: string;
  supportEmail: string;
};

export async function renderPaymentSucceededEmail(
  props: PaymentSucceededEmailProps
) {
  // Email template with payment confirmation and invoice link
}
```

##### B. Subscription Canceled Email

**File:** `lib/emails/templates/subscription-canceled.template.tsx`

```typescript
export type SubscriptionCanceledEmailProps = {
  recipientName: string;
  planName: string;
  endDate: string; // When access ends
  reactivateUrl: string;
  feedbackUrl?: string;
  supportEmail: string;
};

export async function renderSubscriptionCanceledEmail(
  props: SubscriptionCanceledEmailProps
) {
  // Email template with cancellation confirmation and reactivation option
}
```

##### C. Subscription Updated Email

**File:** `lib/emails/templates/subscription-updated.template.tsx`

```typescript
export type SubscriptionUpdatedEmailProps = {
  recipientName: string;
  oldPlanName: string;
  newPlanName: string;
  changeType: 'upgrade' | 'downgrade' | 'plan_change';
  effectiveDate: string;
  proratedAmount?: string;
  dashboardUrl: string;
  supportEmail: string;
};

export async function renderSubscriptionUpdatedEmail(
  props: SubscriptionUpdatedEmailProps
) {
  // Email template for plan changes
}
```

##### D. Trial Ending Email

**File:** `lib/emails/templates/trial-ending.template.tsx`

```typescript
export type TrialEndingEmailProps = {
  recipientName: string;
  planName: string;
  trialEndDate: string;
  daysRemaining: number;
  nextBillingAmount: string;
  paymentMethodUrl: string;
  supportEmail: string;
};

export async function renderTrialEndingEmail(props: TrialEndingEmailProps) {
  // Email template for trial ending reminder
}
```

##### E. Payment Action Required Email

**File:** `lib/emails/templates/payment-action-required.template.tsx`

```typescript
export type PaymentActionRequiredEmailProps = {
  recipientName: string;
  amount: string;
  planName: string;
  actionUrl: string; // Stripe payment confirmation URL
  deadline?: string;
  supportEmail: string;
};

export async function renderPaymentActionRequiredEmail(
  props: PaymentActionRequiredEmailProps
) {
  // Email template for SCA authentication required
}
```

##### F. Upcoming Renewal Email

**File:** `lib/emails/templates/subscription-renewal-reminder.template.tsx`

```typescript
export type SubscriptionRenewalReminderEmailProps = {
  recipientName: string;
  planName: string;
  renewalDate: string;
  amount: string;
  currency: string;
  manageSubscriptionUrl: string;
  supportEmail: string;
};

export async function renderSubscriptionRenewalReminderEmail(
  props: SubscriptionRenewalReminderEmailProps
) {
  // Email template for upcoming renewal
}
```

#### 2.3 Create Email Dispatchers

**File:** `lib/emails/dispatchers.ts` (extend existing)

```typescript
// Add new email dispatcher functions:

export const sendPaymentSucceededEmail = async ({
  to,
  supportEmail,
  ...props
}: PaymentSucceededEmailParams) => {
  // Implementation with idempotency check
};

export const sendSubscriptionCanceledEmail = async ({
  to,
  supportEmail,
  ...props
}: SubscriptionCanceledEmailParams) => {
  // Implementation with idempotency check
};

export const sendSubscriptionUpdatedEmail = async ({
  to,
  supportEmail,
  ...props
}: SubscriptionUpdatedEmailParams) => {
  // Implementation with idempotency check
};

export const sendTrialEndingEmail = async ({
  to,
  supportEmail,
  ...props
}: TrialEndingEmailParams) => {
  // Implementation with idempotency check
};

export const sendPaymentActionRequiredEmail = async ({
  to,
  supportEmail,
  ...props
}: PaymentActionRequiredEmailParams) => {
  // Implementation with idempotency check
};

export const sendSubscriptionRenewalReminderEmail = async ({
  to,
  supportEmail,
  ...props
}: SubscriptionRenewalReminderEmailParams) => {
  // Implementation with idempotency check
};
```

### Phase 3: Enhanced Webhook Handlers

#### 3.1 Update Webhook Route

**File:** `app/api/stripe/webhook/route.ts`

Add new webhook event handlers:

```typescript
// 1. Payment Succeeded
case 'invoice.payment_succeeded': {
  const invoice = event.data.object as Stripe.Invoice;

  await processWebhookEvent(event, async () => {
    const organization = await getOrganizationByStripeCustomerId(
      invoice.customer as string
    );

    if (organization) {
      const ownerId = await getOrganizationOwner(organization.id);
      if (ownerId) {
        await logActivity(
          ActivityType.PAYMENT_SUCCEEDED,
        );

        const owner = await getUserById(ownerId);
        if (owner) {
          await sendPaymentSucceededEmail({
            to: owner.email,
            recipientName: owner.name,
            amount: (invoice.amount_paid / 100).toFixed(2),
            currency: invoice.currency.toUpperCase(),
            planName: organization.planName || 'Unknown',
            nextBillingDate: new Date(
              invoice.period_end * 1000
            ).toLocaleDateString(),
            invoiceUrl: invoice.hosted_invoice_url || '',
            dashboardUrl: `${env.BASE_URL}/app/settings/billing`,
          });
        }
      }
    }
  });
  break;
}

// 2. Trial Will End
case 'customer.subscription.trial_will_end': {
  const subscription = event.data.object as Stripe.Subscription;

  await processWebhookEvent(event, async () => {
    const organization = await getOrganizationByStripeCustomerId(
      subscription.customer as string
    );

    if (organization) {
      const ownerId = await getOrganizationOwner(organization.id);
      if (ownerId) {
        await logActivity(
          ownerId,
          ActivityType.SUBSCRIPTION_TRIAL_ENDING,
          ipAddress ?? ''
        );

        const owner = await getUserById(ownerId);
        const trialEnd = new Date(subscription.trial_end! * 1000);
        const daysRemaining = Math.ceil(
          (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (owner) {
          await sendTrialEndingEmail({
            to: owner.email,
            recipientName: owner.name,
            planName: organization.planName || 'Unknown',
            trialEndDate: trialEnd.toLocaleDateString(),
            daysRemaining,
            nextBillingAmount: subscription.items.data[0]?.price.unit_amount
              ? (subscription.items.data[0].price.unit_amount / 100).toFixed(2)
              : '0.00',
            paymentMethodUrl: `${env.BASE_URL}/app/settings/billing`,
          });
        }
      }
    }
  });
  break;
}

// 3. Payment Action Required (SCA)
case 'invoice.payment_action_required': {
  const invoice = event.data.object as Stripe.Invoice;

  await processWebhookEvent(event, async () => {
    const organization = await getOrganizationByStripeCustomerId(
      invoice.customer as string
    );

    if (organization) {
      const ownerId = await getOrganizationOwner(organization.id);
      if (ownerId) {
        await logActivity(
          ActivityType.PAYMENT_ACTION_REQUIRED,
        );

        const owner = await getUserById(ownerId);
        if (owner && invoice.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            invoice.payment_intent as string
          );

          await sendPaymentActionRequiredEmail({
            to: owner.email,
            recipientName: owner.name,
            amount: (invoice.amount_due / 100).toFixed(2),
            planName: organization.planName || 'Unknown',
            actionUrl: paymentIntent.next_action?.redirect_to_url?.url || '',
          });
        }
      }
    }
  });
  break;
}

// 4. Upcoming Invoice (Renewal Reminder)
case 'invoice.upcoming': {
  const invoice = event.data.object as Stripe.Invoice;

  await processWebhookEvent(event, async () => {
    const organization = await getOrganizationByStripeCustomerId(
      invoice.customer as string
    );

    if (organization) {
      const ownerId = await getOrganizationOwner(organization.id);
      if (ownerId) {
        const owner = await getUserById(ownerId);
        if (owner) {
          await sendSubscriptionRenewalReminderEmail({
            to: owner.email,
            recipientName: owner.name,
            planName: organization.planName || 'Unknown',
            renewalDate: new Date(invoice.period_end * 1000).toLocaleDateString(),
            amount: (invoice.amount_due / 100).toFixed(2),
            currency: invoice.currency.toUpperCase(),
            manageSubscriptionUrl: `${env.BASE_URL}/app/settings/billing`,
          });
        }
      }
    }
  });
  break;
}

// 5. Enhanced Subscription Updated Handler
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;
  const previousAttributes = event.data.previous_attributes as any;

  await processWebhookEvent(event, async () => {
    await handleSubscriptionChange(subscription);

    const organization = await getOrganizationByStripeCustomerId(
      subscription.customer as string
    );

    if (organization) {
      const ownerId = await getOrganizationOwner(organization.id);
      if (ownerId) {
        await logActivity(
          ownerId,
          ActivityType.SUBSCRIPTION_UPDATED,
          ipAddress ?? ''
        );

        // Check if plan changed
        if (previousAttributes?.items) {
          const owner = await getUserById(ownerId);
          if (owner) {
            const oldPrice = previousAttributes.items.data[0]?.price;
            const newPrice = subscription.items.data[0]?.price;

            const oldAmount = oldPrice?.unit_amount || 0;
            const newAmount = newPrice?.unit_amount || 0;

            const changeType =
              newAmount > oldAmount ? 'upgrade' :
              newAmount < oldAmount ? 'downgrade' :
              'plan_change';

            await sendSubscriptionUpdatedEmail({
              to: owner.email,
              recipientName: owner.name,
              oldPlanName: previousAttributes.items.data[0]?.plan?.product?.name || 'Previous Plan',
              newPlanName: organization.planName || 'New Plan',
              changeType,
              effectiveDate: new Date().toLocaleDateString(),
              dashboardUrl: `${env.BASE_URL}/app/settings/billing`,
            });
          }
        }

        // Check if subscription was set to cancel at period end
        if (
          !previousAttributes?.cancel_at_period_end &&
          subscription.cancel_at_period_end
        ) {
          const owner = await getUserById(ownerId);
          if (owner) {
            await logActivity(
              ownerId,
              ActivityType.SUBSCRIPTION_CANCELED,
              ipAddress ?? ''
            );

            await sendSubscriptionCanceledEmail({
              to: owner.email,
              recipientName: owner.name,
              planName: organization.planName || 'Unknown',
              endDate: new Date(
                subscription.cancel_at! * 1000
              ).toLocaleDateString(),
              reactivateUrl: `${env.BASE_URL}/app/settings/billing`,
            });
          }
        }

        // Check if subscription was reactivated
        if (
          previousAttributes?.cancel_at_period_end &&
          !subscription.cancel_at_period_end
        ) {
          await logActivity(
            ownerId,
            ActivityType.SUBSCRIPTION_REACTIVATED,
            ipAddress ?? ''
          );
        }
      }
    }
  });
  break;
}

// 6. Enhanced Subscription Deleted Handler
case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription;

  await processWebhookEvent(event, async () => {
    await handleSubscriptionChange(subscription);

    const organization = await getOrganizationByStripeCustomerId(
      subscription.customer as string
    );

    if (organization) {
      const ownerId = await getOrganizationOwner(organization.id);
      if (ownerId) {
        await logActivity(
          ownerId,
          ActivityType.SUBSCRIPTION_DELETED,
          ipAddress ?? ''
        );

        const owner = await getUserById(ownerId);
        if (owner) {
          // Only send if not already notified via cancel_at_period_end
          if (!subscription.cancel_at_period_end) {
            await sendSubscriptionCanceledEmail({
              to: owner.email,
              recipientName: owner.name,
              planName: organization.planName || 'Unknown',
              endDate: new Date().toLocaleDateString(),
              reactivateUrl: `${env.BASE_URL}/pricing`,
            });
          }
        }
      }
    }
  });
  break;
}
```

### Phase 4: Improved Subscription Status Handling

#### 4.1 Update handleSubscriptionChange Function

**File:** `lib/payments/stripe.ts`

```typescript
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const organization = await getOrganizationByStripeCustomerId(customerId);

  if (!organization) {
    console.error('Organization not found for Stripe customer:', customerId);
    return;
  }

  // Active or trialing subscriptions
  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    const product = plan?.product;
    const productId =
      typeof product === 'string' ? product : (product?.id ?? null);
    const productName =
      typeof product === 'object' && product !== null && 'name' in product
        ? product.name
        : null;

    await updateOrganizationSubscription(organization.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: productId,
      planName: productName,
      subscriptionStatus: status,
    });
  }
  // Past due - keep subscription active but flag it
  else if (status === 'past_due') {
    await updateOrganizationSubscription(organization.id, {
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: status,
      // Keep product info - user still has access during grace period
    });
  }
  // Incomplete - subscription created but payment failed
  else if (status === 'incomplete') {
    await updateOrganizationSubscription(organization.id, {
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: status,
    });
  }
  // Canceled, unpaid, or incomplete_expired
  else if (
    status === 'canceled' ||
    status === 'unpaid' ||
    status === 'incomplete_expired'
  ) {
    await updateOrganizationSubscription(organization.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status,
    });
  }
}
```

### Phase 5: Database Migrations

#### 5.1 Create Webhook Events Table Migration

**File:** `lib/db/schemas/stripe-webhook-event.table.ts`

Create the table schema and run migration:

```bash
pnpm db:generate
pnpm db:migrate
```

### Phase 6: Testing & Validation

#### 6.1 Webhook Testing with Stripe CLI

```bash
# Test each webhook event
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger invoice.payment_action_required
stripe trigger customer.subscription.trial_will_end
```

#### 6.2 Email Template Preview

Create email preview page to view all new templates:

```bash
pnpm preview-emails
```

#### 6.3 Unit Tests

**File:** `tests/payments/stripe-webhooks.test.ts`

```typescript
describe('Stripe Webhook Handlers', () => {
  it('should handle payment succeeded event', async () => {
    // Test implementation
  });

  it('should handle trial ending event', async () => {
    // Test implementation
  });

  it('should prevent duplicate webhook processing', async () => {
    // Test idempotency
  });

  // ... more tests
});
```

## Implementation Checklist

### Phase 1: Foundation

- [ ] Create webhook events table schema
- [ ] Implement webhook event service with idempotency
- [ ] Add database queries for event storage
- [ ] Run database migration

### Phase 2: Email System

- [ ] Add new activity types to enum
- [ ] Create payment succeeded email template
- [ ] Create subscription canceled email template
- [ ] Create subscription updated email template
- [ ] Create trial ending email template
- [ ] Create payment action required email template
- [ ] Create renewal reminder email template
- [ ] Add email dispatchers for all new templates
- [ ] Add TypeScript types for all email props

### Phase 3: Webhook Enhancement

- [ ] Add `invoice.payment_succeeded` handler
- [ ] Add `customer.subscription.trial_will_end` handler
- [ ] Add `invoice.payment_action_required` handler
- [ ] Add `invoice.upcoming` handler
- [ ] Enhance `customer.subscription.updated` handler
- [ ] Enhance `customer.subscription.deleted` handler
- [ ] Integrate idempotency in all handlers

### Phase 4: Status Handling

- [ ] Update `handleSubscriptionChange` for all statuses
- [ ] Handle `past_due` status
- [ ] Handle `incomplete` status
- [ ] Handle `incomplete_expired` status

### Phase 5: Testing

- [ ] Test all webhook events with Stripe CLI
- [ ] Preview all email templates
- [ ] Write unit tests for webhook handlers
- [ ] Test idempotency logic
- [ ] Test error handling

### Phase 6: Documentation

- [ ] Update webhook documentation
- [ ] Document email templates
- [ ] Add troubleshooting guide
- [ ] Update README with new features

## Success Metrics

1. **Email Delivery Rate:** > 99%
2. **Webhook Processing Success Rate:** > 99.9%
3. **Zero Duplicate Events:** Via idempotency
4. **Customer Satisfaction:** Improved clarity on subscription status
5. **Reduced Support Tickets:** Better automated communication

## Rollout Strategy

1. **Development:** Implement all features in dev environment
2. **Staging:** Test with Stripe test mode
3. **Production Soft Launch:** Enable for new subscriptions only
4. **Full Production:** Enable for all subscriptions after 1 week
5. **Monitoring:** Watch error rates and email deliverability

## Risk Mitigation

| Risk                 | Mitigation                                              |
| -------------------- | ------------------------------------------------------- |
| Duplicate emails     | Implement email idempotency with cache                  |
| Webhook failures     | Add retry logic and error logging                       |
| Missing events       | Subscribe to all recommended events in Stripe dashboard |
| Email deliverability | Use Resend with proper SPF/DKIM setup                   |
| Database bottlenecks | Index webhook events table on `id` and `processed`      |

## Future Enhancements

1. **Advanced Dunning:** Multi-step email sequences
2. **Subscription Analytics:** Track MRR, churn, LTV
3. **Custom Billing Portal:** In-app subscription management
4. **Webhook Dashboard:** Admin UI to view webhook logs
5. **A/B Testing:** Test different email templates
6. **Multi-currency Support:** Handle international payments
7. **Invoice Customization:** Custom invoice templates
8. **Tax Calculation:** Integrate Stripe Tax

## Resources

- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe Billing Lifecycle](https://stripe.com/docs/billing/subscriptions/overview)
- [Next.js Stripe Integration](https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=elements)
- [Email Best Practices for SaaS](https://www.resend.com/guides/email-best-practices)

## Conclusion

This implementation plan provides a comprehensive enhancement to the Stripe subscription system, ensuring customers are properly informed at every stage of their subscription lifecycle. The focus on idempotency, error handling, and customer communication will significantly improve the user experience and reduce operational overhead.
