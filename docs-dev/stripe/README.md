# Stripe Integration Documentation

## Overview

This directory contains comprehensive documentation for the Stripe integration in the SaaS application. The integration provides a complete subscription management system with checkout, billing portal, webhooks, and automated email notifications.

## 🚀 Quick Start

1. **Set up environment variables**:

   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   BASE_URL=http://localhost:3000
   ```

2. **Run the setup script**:

   ```bash
   node scripts/setup-stripe-features.js
   ```

3. **Configure webhooks** in Stripe Dashboard:
   - Endpoint: `{YOUR_BASE_URL}/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

4. **Test the integration**:
   - Visit `/pricing` to see pricing plans
   - Complete test checkout with card `4242 4242 4242 4242`
   - Access billing portal from `/app/billing`

## 📚 Documentation Structure

### [Stripe Integration Overview](./stripe-integration.md)

**Main documentation file** covering the complete Stripe integration architecture, setup, and implementation details.

**Covers**:

- Architecture overview and design patterns
- Environment configuration and validation
- Core components and functions
- Database schema and queries
- Type definitions and validation
- Frontend components integration
- Testing strategies and troubleshooting

**Best for**: Understanding the overall system, getting started, architecture decisions

---

### [Setup Script Guide](./setup-script-guide.md)

**Detailed guide** for using the `setup-stripe-features.js` script to configure your Stripe account.

**Covers**:

- Script prerequisites and requirements
- Step-by-step execution instructions
- Product and pricing configuration
- Metadata setup for features
- Customization options
- Error handling and troubleshooting

**Best for**: Initial Stripe account setup, product configuration, script customization

---

### [Webhooks Configuration](./webhooks-configuration.md)

**Comprehensive guide** to Stripe webhooks implementation and configuration.

**Covers**:

- Webhook endpoint setup and security
- Supported event types and handlers
- Database synchronization
- Email notification triggers
- Local development with Stripe CLI
- Testing and debugging webhooks

**Best for**: Understanding real-time updates, webhook debugging, event handling

---

### [Checkout and Billing Portal](./checkout-and-billing-portal.md)

**In-depth coverage** of subscription flows and customer self-service features.

**Covers**:

- Stripe Checkout implementation
- Customer portal configuration
- Authentication and security
- Error handling and recovery
- Testing scenarios
- Customization options

**Best for**: Subscription flow implementation, customer experience, portal customization

## 🏗 Implementation Overview

### Core Architecture

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

### Key Files and Directories

```
├── scripts/
│   └── setup-stripe-features.js          # Initial Stripe setup script
├── lib/
│   ├── payments/
│   │   ├── stripe.ts                     # Core Stripe client and functions
│   │   └── actions.ts                    # Server actions for forms
│   ├── types/payments/                   # TypeScript type definitions
│   │   ├── stripe-metadata.schema.ts     # Zod validation schemas
│   │   └── stripe-product-with-prices.type.ts
│   └── db/
│       ├── schemas/organization.table.ts  # Database schema
│       └── queries/organization.query.ts  # Database queries
├── app/api/stripe/
│   ├── webhook/route.ts                  # Webhook event handler
│   └── checkout/route.ts                 # Post-checkout processing
├── components/payments/                  # Frontend pricing components
│   ├── pricing-plans.tsx
│   ├── pricing-card.tsx
│   └── pricing-plans-server.tsx
└── app/(app)/app/billing/               # Billing management page
    └── page.tsx
```

## 🎯 Features

### ✅ Implemented

- **Product Management**: Dynamic loading from Stripe with metadata
- **Subscription Checkout**: Complete checkout flow with trials
- **Billing Portal**: Customer self-service for plan changes
- **Webhook Processing**: Real-time subscription updates
- **Email Notifications**: Automated subscription and payment emails
- **Type Safety**: Full TypeScript support with Zod validation
- **Database Sync**: Real-time subscription status tracking
- **Activity Logging**: Audit trail for all subscription events
- **Error Handling**: Comprehensive error recovery and user feedback

### 🔧 Technical Features

- **Metadata-Driven Features**: Pricing page features loaded from Stripe
- **Multi-Interval Pricing**: Monthly and yearly billing options
- **Trial Periods**: 14-day free trials for all plans
- **Promotion Codes**: Discount code support in checkout
- **Prorated Billing**: Automatic proration for plan changes
- **Cancellation Management**: Grace period handling
- **Payment Recovery**: Failed payment notifications and retry logic

## 🧪 Testing

### Test Environment

After setting up the integration:

1. **Test User**: `test@test.com` / `admin123` (from `pnpm db:seed`)
2. **Test Cards**: Use Stripe test cards like `4242 4242 4242 4242`
3. **Local Webhooks**: Use Stripe CLI for local webhook testing

### Test Scenarios

```bash
# 1. Complete subscription flow
Visit /pricing → Select plan → Complete checkout → Verify dashboard access

# 2. Billing portal features
Visit /app/billing → Manage Billing → Change plan → Verify updates

# 3. Webhook processing
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated

# 4. Email notifications
Complete checkout → Check for welcome email
Trigger payment failure → Check for notification email
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...              # Stripe secret API key
STRIPE_WEBHOOK_SECRET=whsec_...           # Webhook signing secret

# Application URLs
BASE_URL=http://localhost:3000            # Application base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # Public base URL

# Database
POSTGRES_URL=postgresql://...             # PostgreSQL connection string

# Email (for notifications)
RESEND_API_KEY=re_...                     # Resend API key
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Sender email address
```

### Stripe Dashboard Setup

1. **Products**: Use setup script or create manually
2. **Webhooks**: Configure endpoint with required events
3. **Customer Portal**: Automatically configured by application
4. **Tax Settings**: Configure as needed for your business

## 🚨 Troubleshooting

### Common Issues

| Issue                | Symptoms                         | Solution                                    |
| -------------------- | -------------------------------- | ------------------------------------------- |
| Products not loading | Empty pricing page               | Run setup script, check Stripe API keys     |
| Webhook failures     | Subscription status not updating | Verify webhook secret, check endpoint URL   |
| Checkout errors      | Payment button not working       | Check price IDs, verify user authentication |
| Email not sending    | No notification emails           | Verify Resend configuration                 |

### Debug Commands

```bash
# Test Stripe connection
node -e "const Stripe = require('stripe'); const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); stripe.products.list().then(console.log);"

# Check webhook events
stripe events list --limit 5

# Test webhook delivery
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 📈 Monitoring

Monitor these key metrics:

- **Subscription conversion rate**: Pricing page visits to subscriptions
- **Checkout abandonment**: Users who start but don't complete checkout
- **Plan distribution**: Which plans are most popular
- **Churn rate**: Subscription cancellations over time
- **Webhook delivery**: Success rate of webhook processing
- **Payment failures**: Failed payment frequency and recovery

## 🔄 Maintenance

### Regular Tasks

- **Monitor webhook delivery**: Check Stripe dashboard for failed webhooks
- **Review subscription metrics**: Track growth and churn
- **Update product features**: Modify metadata as features evolve
- **Test payment flows**: Regular checkout and portal testing
- **Review error logs**: Check for integration issues

### Updates and Migrations

- **Stripe API versions**: Keep up with Stripe API updates
- **Product changes**: Use setup script for new products
- **Schema migrations**: Update database as needed
- **Type definitions**: Keep TypeScript types current

## 🤝 Support

For issues with the Stripe integration:

1. **Check logs**: Application and webhook delivery logs
2. **Review documentation**: Start with the relevant doc section
3. **Test scenarios**: Use the testing guides in each doc
4. **Stripe Dashboard**: Check for API errors and webhook status
5. **Contact support**: Include error logs and reproduction steps

## 📝 Contributing

When modifying the Stripe integration:

1. **Update documentation**: Keep docs current with code changes
2. **Test thoroughly**: Verify all flows still work
3. **Type safety**: Maintain TypeScript coverage
4. **Error handling**: Ensure graceful failure handling
5. **Security**: Follow security best practices for payment data

---

**Last Updated**: September 28, 2025
**Integration Version**: Stripe API 2025-08-27.basil
**Application Framework**: Next.js 15 with App Router
