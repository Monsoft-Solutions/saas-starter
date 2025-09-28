# Stripe Integration Documentation

## Overview

This application includes a comprehensive Stripe integration that handles subscriptions, billing, and customer management. The integration supports multiple billing intervals (monthly/yearly), product metadata for features, webhooks for real-time updates, and a complete checkout flow.

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Architecture Overview](#architecture-overview)
3. [Environment Configuration](#environment-configuration)
4. [Setup Script Usage](#setup-script-usage)
5. [Core Components](#core-components)
6. [Database Schema](#database-schema)
7. [Webhooks](#webhooks)
8. [API Routes](#api-routes)
9. [Frontend Components](#frontend-components)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

## Quick Setup

### 1. Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Required Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...                    # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...                 # Webhook endpoint secret
BASE_URL=http://localhost:3000                  # Your application URL
```

### 2. Set Up Stripe Products

Run the setup script to create products and configure metadata:

```bash
node scripts/setup-stripe-features.js
```

This script will:

- Create "Starter" and "Pro" products if they don't exist
- Set up monthly and yearly pricing for each product
- Configure feature metadata for the pricing page
- Display a summary of created products and pricing

### 3. Configure Webhooks

In your Stripe Dashboard:

1. Go to Developers → Webhooks
2. Add endpoint: `{YOUR_BASE_URL}/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Architecture Overview

The Stripe integration follows a clean architecture pattern:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Server Actions │    │   Stripe API    │
│   Components    │◄───┤   & Routes       │◄───┤   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Database      │    │   Webhooks       │    │   Email         │
│   (PostgreSQL)  │    │   Handler        │    │   Notifications │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Features

- **Subscription Management**: Full lifecycle management with trials
- **Billing Portal**: Customer self-service for plan changes
- **Webhook Processing**: Real-time subscription status updates
- **Product Metadata**: Dynamic feature loading from Stripe
- **Email Notifications**: Automated subscription and payment emails
- **Type Safety**: Full TypeScript support with Zod validation

## Environment Configuration

### Required Variables

| Variable                | Description             | Example                  |
| ----------------------- | ----------------------- | ------------------------ |
| `STRIPE_SECRET_KEY`     | Stripe secret API key   | `sk_test_...`            |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint secret | `whsec_...`              |
| `BASE_URL`              | Application base URL    | `https://yourdomain.com` |

### Environment Validation

The application uses Zod schemas for environment validation in `lib/env.ts`:

```typescript
// Stripe configuration is validated at startup
STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required.'),
STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required.'),
```

## Setup Script Usage

### Running the Script

```bash
# Make sure you have the STRIPE_SECRET_KEY environment variable set
node scripts/setup-stripe-features.js
```

### What the Script Does

The `setup-stripe-features.js` script automates the initial Stripe configuration:

#### 1. Product Creation

- **Starter Product**: $10/month, $100/year (equivalent to ~$8.33/month)
- **Pro Product**: $25/month, $250/year (equivalent to ~$20.83/month)

#### 2. Metadata Configuration

Each product is configured with comprehensive metadata:

```javascript
// Starter Product Metadata
{
  features: JSON.stringify([
    'Unlimited Usage',
    'Unlimited Workspace Members',
    'Email Support',
    'Basic Analytics',
    'Standard Templates'
  ]),
  popular: 'false',
  category: 'starter',
  trial_days: '14'
}

// Pro Product Metadata
{
  features: JSON.stringify([
    'Everything in Starter, and:',
    'Advanced Analytics & Reporting',
    'Priority Support (24/7)',
    'Custom Integrations',
    'Advanced Security Features',
    'Custom Templates',
    'API Access',
    'White-label Options'
  ]),
  popular: 'true',
  category: 'professional',
  trial_days: '14'
}
```

#### 3. Pricing Configuration

- Monthly and yearly pricing for each product
- Default price set to monthly for better UX
- All prices active and ready for checkout

### Script Output

```
🔍 Checking for existing products...
📦 Found existing products: []
⚠️  Starter product not found, creating...
🆕 Creating Starter product...
✅ Created product: Starter (prod_...)
💵 Created monthly price: $10/month (price_...)
💰 Created yearly price: $100/year (price_...)
⚠️  Pro product not found, creating...
🆕 Creating Pro product...
✅ Created product: Pro (prod_...)
💵 Created monthly price: $25/month (price_...)
💰 Created yearly price: $250/year (price_...)
🔄 Updating Starter product metadata...
🔄 Updating Pro product metadata...
✅ Successfully updated product features!
```

## Core Components

### 1. Stripe Client (`lib/payments/stripe.ts`)

The main Stripe integration file that handles:

#### Core Functions

**`createCheckoutSession({ priceId })`**

- Creates Stripe Checkout sessions for subscription purchases
- Handles user authentication requirements
- Configures trial periods and success/cancel URLs
- Sets client reference ID for post-checkout processing

**`createCustomerPortalSession(organization)`**

- Creates billing portal sessions for existing customers
- Configures allowed actions (update, cancel, payment methods)
- Handles product and pricing validation

**`handleSubscriptionChange(subscription)`**

- Processes subscription lifecycle events
- Updates organization records in database
- Handles active, trialing, canceled, and unpaid states

**`getProductsWithPrices()`**

- Fetches all active products with pricing information
- Groups monthly and yearly prices by product
- Extracts and validates features from metadata
- Returns type-safe product data for frontend consumption

#### Metadata Processing

The integration includes sophisticated metadata processing with Zod validation:

```typescript
function parseProductFeatures(metadata: Record<string, string>): string[] {
  // Method 1: Features stored as JSON array
  if (metadata.features) {
    const parsedFeatures = JSON.parse(metadata.features);
    return FeaturesArraySchema.parse(parsedFeatures);
  }

  // Method 2: Comma-separated values
  if (metadata.feature_list) {
    return metadata.feature_list.split(',').map((f) => f.trim());
  }

  // Method 3: Individual feature keys (feature_1, feature_2, etc.)
  // Supports legacy metadata formats
}
```

### 2. Server Actions (`lib/payments/actions.ts`)

Provides form-safe server actions for Stripe operations:

**`checkoutAction(formData)`**

- Server action for checkout form submissions
- Extracts price ID from form data
- Redirects to Stripe Checkout

**`customerPortalAction(formData, organization)`**

- Server action for billing portal access
- Requires organization context
- Redirects to Stripe Customer Portal

### 3. Type Definitions

#### Core Types (`lib/types/payments/`)

**`StripeProductWithPrices`**

```typescript
export type StripeProductWithPrices = {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: StripePrice | null;
  yearlyPrice: StripePrice | null;
  defaultPriceId: string | null;
  features: string[];
  isPopular?: boolean;
};
```

**`StripePrice`**

```typescript
export type StripePrice = {
  id: string;
  unitAmount: number | null;
  currency: string;
  interval: string | null;
  trialPeriodDays: number | null;
};
```

#### Metadata Validation (`lib/types/payments/stripe-metadata.schema.ts`)

```typescript
export const StripeProductMetadataSchema = z
  .object({
    features: z.string().optional(), // JSON array of features
    feature_list: z.string().optional(), // Comma-separated features
    popular: z.enum(['true', 'false']).optional(),
    is_popular: z.enum(['true', 'false']).optional(),
    category: z.string().optional(),
    trial_days: z.string().optional(),
  })
  .catchall(z.string()); // Allow additional metadata
```

## Database Schema

### Organization Table

The `organization` table stores Stripe-related subscription data:

```sql
CREATE TABLE organization (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo TEXT,
  created_at TIMESTAMP NOT NULL,
  metadata TEXT,

  -- Stripe Integration Fields
  stripe_customer_id TEXT UNIQUE,        -- Stripe customer ID
  stripe_subscription_id TEXT UNIQUE,    -- Current subscription ID
  stripe_product_id TEXT,                -- Current product ID
  plan_name TEXT,                        -- Human-readable plan name
  subscription_status TEXT               -- active, trialing, canceled, etc.
);
```

### Database Queries (`lib/db/queries/organization.query.ts`)

**`getOrganizationByStripeCustomerId(customerId)`**

- Retrieves organization by Stripe customer ID
- Used in webhook processing and portal sessions

**`updateOrganizationSubscription(organizationId, subscriptionData)`**

- Updates organization subscription information
- Called from webhooks and checkout completion

**`getOrganizationOwner(organizationId)`**

- Retrieves the owner user ID for an organization
- Used for activity logging and email notifications

## Webhooks

### Webhook Handler (`app/api/stripe/webhook/route.ts`)

The webhook endpoint processes Stripe events in real-time:

#### Supported Events

1. **`checkout.session.completed`**
   - Logs subscription creation activity
   - Sends subscription confirmation email
   - Updates organization with initial subscription data

2. **`customer.subscription.updated`**
   - Updates subscription status in database
   - Logs subscription update activity
   - Handles plan changes and status updates

3. **`customer.subscription.deleted`**
   - Marks subscription as canceled
   - Logs cancellation activity
   - Cleans up subscription data

4. **`invoice.payment_failed`**
   - Logs payment failure activity
   - Sends payment failure notification email
   - Triggers dunning management process

#### Security

- Webhook signature verification using `STRIPE_WEBHOOK_SECRET`
- Request payload validation
- Error handling with appropriate HTTP status codes

#### Activity Logging

All webhook events trigger activity logging for audit purposes:

```typescript
await logActivity(ownerId, ActivityType.SUBSCRIPTION_CREATED, ipAddress ?? '');
```

## API Routes

### 1. Checkout Completion (`app/api/stripe/checkout/route.ts`)

Handles post-checkout processing:

#### Process Flow

1. Retrieves checkout session from Stripe
2. Validates customer and subscription data
3. Updates organization with subscription information
4. Redirects user to dashboard

#### Error Handling

- Invalid session handling
- Missing customer data validation
- Database update error recovery
- User-friendly error redirects

### 2. Webhook Endpoint (`app/api/stripe/webhook/route.ts`)

See [Webhooks](#webhooks) section above.

## Frontend Components

### 1. Pricing Plans (`components/payments/pricing-plans.tsx`)

Dynamic pricing component that loads data from Stripe:

#### Features

- **Dynamic Feature Loading**: Features loaded from Stripe metadata
- **Billing Toggle**: Switch between monthly/yearly pricing
- **Current Plan Detection**: Highlights user's current subscription
- **Fallback Features**: Graceful handling of missing metadata
- **Popular Plan Highlighting**: Based on Stripe metadata

#### Usage

```tsx
import { PricingPlans } from '@/components/payments/pricing-plans';

<PricingPlans
  products={stripeProducts}
  userSubscription={userSubscription}
  defaultInterval="month"
  className="max-w-6xl mx-auto"
/>;
```

### 2. Pricing Card (`components/payments/pricing-card.tsx`)

Individual plan display component:

- **Price Display**: Formatted pricing with currency
- **Feature Lists**: Bulleted feature lists from metadata
- **Action Buttons**: Checkout or portal access based on user state
- **Popular Badges**: Visual indicators for recommended plans

### 3. Server Components (`components/payments/pricing-plans-server.tsx`)

Server-side component that fetches Stripe data:

- **Data Fetching**: Retrieves products and user subscription status
- **Authentication Integration**: Handles authenticated vs. anonymous users
- **Error Boundaries**: Graceful handling of Stripe API errors

## Testing

### Test Data

After running `pnpm db:seed`, use this test user:

- **Email**: `test@test.com`
- **Password**: `admin123`

### Stripe Test Cards

Use Stripe's test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Require 3DS**: `4000 0027 6000 3184`

Use any future expiry date and any 3-digit CVC.

### Testing Webhooks

For local testing, use Stripe CLI:

```bash
# Forward webhooks to local development server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test specific webhook events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

### Test Scenarios

1. **Subscription Creation**
   - Complete checkout flow
   - Verify database updates
   - Check email notifications

2. **Plan Changes**
   - Access billing portal
   - Change subscription plan
   - Verify webhook processing

3. **Subscription Cancellation**
   - Cancel through billing portal
   - Verify status updates
   - Test grace period handling

## Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Failed

**Symptoms**: `400` errors in webhook endpoint
**Causes**:

- Incorrect `STRIPE_WEBHOOK_SECRET`
- Webhook endpoint not configured in Stripe
- Request body parsing issues

**Solutions**:

```bash
# Verify webhook secret matches Stripe dashboard
# Check webhook endpoint URL is correct
# Ensure raw body parsing in Next.js config
```

#### 2. Products Not Loading

**Symptoms**: Empty pricing page
**Causes**:

- No products created in Stripe
- Products marked as inactive
- Missing required metadata

**Solutions**:

```bash
# Run setup script
node scripts/setup-stripe-features.js

# Verify products in Stripe dashboard
# Check product active status
```

#### 3. Checkout Session Creation Failed

**Symptoms**: Redirect errors on pricing page
**Causes**:

- Invalid price IDs
- Stripe API key issues
- User authentication problems

**Solutions**:

```bash
# Verify STRIPE_SECRET_KEY
# Check price IDs in Stripe dashboard
# Verify user authentication flow
```

#### 4. Database Sync Issues

**Symptoms**: Subscription status not updating
**Causes**:

- Webhook events not processing
- Database query errors
- Organization not found

**Solutions**:

```bash
# Check webhook logs
# Verify database schema
# Test webhook endpoint manually
```

### Debug Commands

```bash
# Check Stripe products
node -e "
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
stripe.products.list({ active: true }).then(console.log);
"

# Check webhook endpoints
stripe webhook_endpoints list

# Test webhook delivery
stripe events list --limit 10
```

### Logging

The application logs Stripe-related activities:

- **Checkout sessions**: Success/failure tracking
- **Webhook events**: Event type and processing status
- **Database updates**: Subscription changes
- **Email notifications**: Delivery status

Check your application logs for detailed error information and webhook processing status.

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [BetterAuth Documentation](https://www.better-auth.com)
