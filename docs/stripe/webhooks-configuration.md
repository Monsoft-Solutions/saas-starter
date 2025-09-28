# Stripe Webhooks Configuration

## Overview

Webhooks are HTTP callbacks that Stripe sends to your application when events occur in your Stripe account. This documentation covers the webhook implementation in the SaaS application, including setup, event handling, and troubleshooting.

## Webhook Endpoint

The application handles Stripe webhooks at:

```
POST /api/stripe/webhook
```

**Implementation**: `app/api/stripe/webhook/route.ts`

## Webhook Setup

### 1. Stripe Dashboard Configuration

1. **Navigate to Webhooks**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to Developers → Webhooks

2. **Add Endpoint**:
   - Click "Add endpoint"
   - URL: `{YOUR_DOMAIN}/api/stripe/webhook`
   - Description: "SaaS Application Webhooks"

3. **Select Events**:

   ```
   checkout.session.completed
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_failed
   ```

4. **Get Webhook Secret**:
   - After creating the endpoint, click to reveal the signing secret
   - Add to your environment variables as `STRIPE_WEBHOOK_SECRET`

### 2. Environment Configuration

Add the webhook secret to your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 3. Local Development Setup

For local testing, use the Stripe CLI:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhooks to local development server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# The CLI will output a webhook signing secret for local testing
# Add this to your .env file temporarily
```

## Supported Events

### 1. `checkout.session.completed`

Triggered when a customer completes a checkout session.

**Purpose**:

- Record subscription creation
- Send welcome email
- Log user activity

**Implementation**:

```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.customer) {
    const organization = await getOrganizationByStripeCustomerId(
      session.customer as string
    );

    if (organization) {
      // Log activity
      await logActivity(
        ownerId,
        ActivityType.SUBSCRIPTION_CREATED,
        ipAddress ?? ''
      );

      // Send confirmation email
      await sendSubscriptionCreatedEmail({
        to: owner.email,
        recipientName: owner.name,
        planName: organization.planName || 'Unknown Plan',
        amount: (session.amount_total / 100).toFixed(2),
        dashboardUrl: `${env.BASE_URL}/app/general`,
      });
    }
  }
  break;
}
```

**Data Flow**:

1. Customer completes checkout
2. Stripe sends webhook event
3. Application logs subscription creation
4. Welcome email sent to customer
5. User can access their dashboard

### 2. `customer.subscription.updated`

Triggered when subscription details change (plan, status, etc.).

**Purpose**:

- Update subscription status in database
- Handle plan changes
- Log subscription modifications

**Implementation**:

```typescript
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;

  // Update subscription in database
  await handleSubscriptionChange(subscription);

  // Log activity
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
    }
  }
  break;
}
```

**Triggers**:

- Plan changes (upgrade/downgrade)
- Billing cycle changes
- Trial period modifications
- Subscription status changes

### 3. `customer.subscription.deleted`

Triggered when a subscription is canceled.

**Purpose**:

- Update subscription status to canceled
- Preserve organization data for grace period
- Log cancellation activity

**Implementation**:

```typescript
case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription;

  // Update subscription status
  await handleSubscriptionChange(subscription);

  // Log cancellation
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
    }
  }
  break;
}
```

**Behavior**:

- Sets subscription status to 'canceled'
- Clears active subscription data
- Maintains organization record for potential reactivation

### 4. `invoice.payment_failed`

Triggered when a subscription payment fails.

**Purpose**:

- Notify customer of payment failure
- Log payment issues
- Trigger dunning management

**Implementation**:

```typescript
case 'invoice.payment_failed': {
  const invoice = event.data.object as Stripe.Invoice;

  if (invoice.customer) {
    const organization = await getOrganizationByStripeCustomerId(
      invoice.customer as string
    );

    if (organization) {
      // Log payment failure
      await logActivity(
        ownerId,
        ActivityType.PAYMENT_FAILED,
        ipAddress ?? ''
      );

      // Send payment failure notification
      await sendPaymentFailedEmail({
        to: owner.email,
        recipientName: owner.name,
        amountDue: (invoice.amount_due / 100).toFixed(2),
        paymentDetailsUrl: `${env.BASE_URL}/app/settings/billing`,
      });
    }
  }
  break;
}
```

**Customer Impact**:

- Receives immediate notification
- Directed to update payment method
- Grace period before service suspension

## Webhook Security

### Signature Verification

The application verifies webhook signatures to ensure requests come from Stripe:

```typescript
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  // Process verified event...
}
```

### Best Practices

1. **Always verify signatures**: Never process unverified webhooks
2. **Idempotent processing**: Handle duplicate events gracefully
3. **Quick responses**: Return 200 status quickly to avoid retries
4. **Error handling**: Log errors but don't expose internal details
5. **Rate limiting**: Consider implementing rate limiting for webhook endpoints

## Database Updates

### Subscription State Management

The `handleSubscriptionChange` function manages subscription state transitions:

```typescript
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  const organization = await getOrganizationByStripeCustomerId(customerId);

  if (!organization) {
    console.error('Organization not found for Stripe customer:', customerId);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    // Update with active subscription data
    const plan = subscription.items.data[0]?.plan;
    const product = plan?.product;

    await updateOrganizationSubscription(organization.id, {
      stripeSubscriptionId: subscription.id,
      stripeProductId: typeof product === 'string' ? product : product?.id,
      planName: typeof product === 'object' ? product.name : null,
      subscriptionStatus: status,
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    // Clear subscription data but preserve organization
    await updateOrganizationSubscription(organization.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status,
    });
  }
}
```

### Activity Logging

All webhook events generate activity logs for audit purposes:

```typescript
await logActivity(
  userId,
  ActivityType.SUBSCRIPTION_CREATED, // or UPDATED, DELETED, PAYMENT_FAILED
  ipAddress ?? ''
);
```

Activity types:

- `SUBSCRIPTION_CREATED`: New subscription started
- `SUBSCRIPTION_UPDATED`: Plan or status changed
- `SUBSCRIPTION_DELETED`: Subscription canceled
- `PAYMENT_FAILED`: Payment processing failed

## Email Notifications

### Subscription Created Email

Sent when a customer completes their first subscription:

```typescript
await sendSubscriptionCreatedEmail({
  to: owner.email,
  recipientName: owner.name,
  planName: organization.planName || 'Unknown Plan',
  amount: (session.amount_total / 100).toFixed(2),
  dashboardUrl: `${env.BASE_URL}/app/general`,
});
```

**Template**: `lib/emails/templates/subscription-created.email.tsx`

### Payment Failed Email

Sent when a subscription payment fails:

```typescript
await sendPaymentFailedEmail({
  to: owner.email,
  recipientName: owner.name,
  amountDue: (invoice.amount_due / 100).toFixed(2),
  paymentDetailsUrl: `${env.BASE_URL}/app/settings/billing`,
});
```

**Template**: `lib/emails/templates/payment-failed.email.tsx`

## Testing Webhooks

### Local Testing with Stripe CLI

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed

# Test with specific parameters
stripe trigger checkout.session.completed --override checkout_session:customer=cus_test123
```

### Manual Testing

1. **Complete a test checkout**: Use test payment methods
2. **Change subscription**: Through billing portal
3. **Cancel subscription**: Through billing portal
4. **Simulate payment failure**: Use declined test cards

### Webhook Event Logs

Monitor webhook delivery in:

- **Stripe Dashboard**: Developers → Webhooks → [Your Endpoint] → Events
- **Application Logs**: Check server logs for processing details
- **Database Changes**: Verify subscription status updates

## Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving Events

**Symptoms**: No events showing in logs
**Causes**:

- Incorrect webhook URL
- Firewall blocking requests
- Application not running

**Solutions**:

```bash
# Test webhook endpoint directly
curl -X POST https://yourdomain.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check webhook URL in Stripe dashboard
# Verify application is running and accessible
```

#### 2. Signature Verification Failed

**Symptoms**: 400 errors with signature verification message
**Causes**:

- Wrong webhook secret
- Modified request body
- Incorrect Content-Type

**Solutions**:

```bash
# Verify webhook secret matches dashboard
echo $STRIPE_WEBHOOK_SECRET

# Check webhook endpoint logs
# Ensure raw body parsing in Next.js
```

#### 3. Database Updates Not Occurring

**Symptoms**: Webhooks processed but subscription status not updated
**Causes**:

- Database connection issues
- Organization not found
- Transaction rollbacks

**Solutions**:

```bash
# Check database connectivity
# Verify organization exists with correct Stripe customer ID
# Review database transaction logs
```

#### 4. Duplicate Event Processing

**Symptoms**: Multiple activity logs for same event
**Causes**:

- Webhook retries
- Application restarts during processing
- Network timeouts

**Solutions**:

- Implement idempotency keys
- Add event ID tracking
- Quick response times

### Debug Commands

```bash
# List recent webhook events
stripe events list --limit 10

# Get specific event details
stripe events retrieve evt_1234567890

# Test webhook endpoint
stripe webhook-endpoints list

# Check webhook secret
stripe webhook-endpoints retrieve we_1234567890
```

### Monitoring

Set up monitoring for:

- **Webhook delivery success rate**
- **Processing time per event**
- **Database update failures**
- **Email delivery failures**

Monitor these metrics to ensure reliable webhook processing and quick issue detection.

## Future Enhancements

Consider implementing:

- **Idempotency keys**: Prevent duplicate processing
- **Event queuing**: Handle high-volume events
- **Retry logic**: For failed processing
- **Analytics**: Track subscription metrics
- **Alerting**: For critical webhook failures
