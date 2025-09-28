# Stripe Setup Script Guide

## Overview

The `setup-stripe-features.js` script automates the initial configuration of your Stripe account for this SaaS application. It creates the necessary products, pricing plans, and metadata required for the application to function properly.

## Prerequisites

Before running the script, ensure you have:

1. **Stripe Account**: Active Stripe account (test or live mode)
2. **API Keys**: Stripe secret key configured in environment
3. **Environment Setup**: `.env` file with required variables

## Required Environment Variables

```bash
# Required for script execution
STRIPE_SECRET_KEY=sk_test_...    # Your Stripe secret key (test or live)

# Optional - used for validation
BASE_URL=http://localhost:3000   # Your application URL
```

## Script Location

```
scripts/setup-stripe-features.js
```

## Running the Script

### Command Line Execution

```bash
# From the project root directory
node scripts/setup-stripe-features.js
```

### NPM Script (Optional)

You can add this to your `package.json`:

```json
{
  "scripts": {
    "stripe:setup": "node scripts/setup-stripe-features.js"
  }
}
```

Then run:

```bash
npm run stripe:setup
# or
pnpm stripe:setup
```

## What the Script Does

### 1. Environment Validation

The script first validates that all required environment variables are present:

```javascript
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}
```

### 2. Product Detection

Checks for existing products in your Stripe account:

```javascript
// Lists existing products
const products = await stripe.products.list({
  active: true,
  limit: 10,
});

// Searches for "Starter" and "Pro" products
let starterProduct = products.data.find(
  (p) => p.name.toLowerCase() === 'starter'
);
let proProduct = products.data.find((p) => p.name.toLowerCase() === 'pro');
```

### 3. Product Creation (If Missing)

Creates products with the following configuration:

#### Starter Product

```javascript
{
  name: 'Starter',
  description: 'Perfect for individuals and small teams getting started',
  pricing: {
    monthly: 1000,  // $10.00 in cents
    yearly: 10000,  // $100.00 in cents (~$8.33/month)
  }
}
```

#### Pro Product

```javascript
{
  name: 'Pro',
  description: 'Advanced features for growing teams and businesses',
  pricing: {
    monthly: 2500,  // $25.00 in cents
    yearly: 25000,  // $250.00 in cents (~$20.83/month)
  }
}
```

### 4. Price Creation

For each product, creates both monthly and yearly pricing:

- **Monthly Price**: Regular subscription pricing
- **Yearly Price**: Annual subscription with discount
- **Default Price**: Monthly price set as default

### 5. Metadata Configuration

Adds comprehensive metadata to each product:

#### Starter Product Metadata

```javascript
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
```

#### Pro Product Metadata

```javascript
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

## Script Output

### Successful Execution

```
🔄 Setting up Stripe product features...
🔍 Checking for existing products...
📦 Found existing products: []
⚠️  Starter product not found, creating...
🆕 Creating Starter product...
✅ Created product: Starter (prod_ABC123)
💵 Created monthly price: $10/month (price_DEF456)
💰 Created yearly price: $100/year (price_GHI789)
⚠️  Pro product not found, creating...
🆕 Creating Pro product...
✅ Created product: Pro (prod_JKL012)
💵 Created monthly price: $25/month (price_MNO345)
💰 Created yearly price: $250/year (price_PQR678)
🔄 Updating Starter product metadata...
🔄 Updating Pro product metadata...
✅ Successfully updated product features!
📊 Product summaries:

🟦 Starter Plan:
   Product ID: prod_ABC123
   Description: Perfect for individuals and small teams getting started
   Features: Unlimited Usage, Unlimited Workspace Members, Email Support, Basic Analytics, Standard Templates
   Popular: false
   Pricing:
     • $10/month (price_DEF456)
     • $100/year (price_GHI789)

🟨 Pro Plan:
   Product ID: prod_JKL012
   Description: Advanced features for growing teams and businesses
   Features: Everything in Starter, and:, Advanced Analytics & Reporting, Priority Support (24/7), Custom Integrations, Advanced Security Features, Custom Templates, API Access, White-label Options
   Popular: true
   Pricing:
     • $25/month (price_MNO345)
     • $250/year (price_PQR678)

🎉 Setup complete! Your pricing page will now load features and pricing dynamically from Stripe.

📋 Next steps:
   • Test your pricing page at /pricing
   • Verify checkout flows with Stripe test cards
   • Configure webhooks for subscription management
   • Set up billing portal for customer self-service
```

### If Products Already Exist

```
🔄 Setting up Stripe product features...
🔍 Checking for existing products...
📦 Found existing products: Starter (prod_ABC123), Pro (prod_JKL012)
✅ Starter product already exists
✅ Pro product already exists
🔄 Updating Starter product metadata...
🔄 Updating Pro product metadata...
✅ Successfully updated product features!
```

## Script Configuration

### Modifying Pricing

To change the default pricing, edit the `PRODUCT_CONFIG` object:

```javascript
const PRODUCT_CONFIG = {
  starter: {
    name: 'Starter',
    description: 'Perfect for individuals and small teams getting started',
    pricing: {
      monthly: 1500, // Change to $15.00
      yearly: 15000, // Change to $150.00/year
    },
  },
  pro: {
    name: 'Pro',
    description: 'Advanced features for growing teams and businesses',
    pricing: {
      monthly: 3000, // Change to $30.00
      yearly: 30000, // Change to $300.00/year
    },
  },
};
```

### Modifying Features

Edit the metadata sections in the `setupProductFeatures()` function:

```javascript
// Update Starter features
await stripe.products.update(starterProduct.id, {
  metadata: {
    features: JSON.stringify([
      'Custom Feature 1',
      'Custom Feature 2',
      'Custom Feature 3',
    ]),
    popular: 'false',
    category: 'starter',
    trial_days: '7', // Change trial period
  },
});
```

## Error Handling

### Common Errors

#### Missing Environment Variable

```
❌ STRIPE_SECRET_KEY environment variable is required
```

**Solution**: Add `STRIPE_SECRET_KEY` to your `.env` file

#### Invalid API Key

```
❌ Error setting up product features: Invalid API Key provided: sk_test_***
```

**Solution**: Verify your Stripe API key is correct

#### Network Issues

```
❌ Error setting up product features: connect ECONNREFUSED
```

**Solution**: Check your internet connection and Stripe service status

#### Permission Issues

```
❌ Error setting up product features: You do not have permission to access this resource
```

**Solution**: Verify your Stripe account has the necessary permissions

## Verification

After running the script, verify the setup:

### 1. Stripe Dashboard

- Go to Products section in Stripe Dashboard
- Verify "Starter" and "Pro" products exist
- Check that each product has monthly and yearly prices
- Verify metadata is correctly set

### 2. Application Pricing Page

- Visit `/pricing` in your application
- Verify products load correctly
- Check that features display properly
- Test billing interval toggle

### 3. Checkout Flow

- Test checkout with Stripe test cards
- Verify webhooks receive events
- Check database updates occur

## Re-running the Script

The script is **idempotent** - it can be safely run multiple times:

- **Existing products**: Updates metadata only
- **Missing products**: Creates them with full configuration
- **Existing prices**: Preserves existing pricing
- **Metadata**: Always updates to match script configuration

## Customization

### Adding New Products

To add additional products, extend the `PRODUCT_CONFIG`:

```javascript
const PRODUCT_CONFIG = {
  starter: {
    /* existing config */
  },
  pro: {
    /* existing config */
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    pricing: {
      monthly: 10000, // $100.00
      yearly: 100000, // $1000.00/year
    },
  },
};
```

Then add creation logic in the `ensureProductsExist()` function.

### Custom Metadata Fields

Add custom metadata by extending the product update calls:

```javascript
await stripe.products.update(productId, {
  metadata: {
    features: JSON.stringify(features),
    popular: 'true',
    category: 'professional',
    trial_days: '14',
    // Custom fields
    max_users: '50',
    storage_limit: '100GB',
    api_rate_limit: '10000',
  },
});
```

## Troubleshooting

### Script Hangs or Times Out

1. **Check Network**: Ensure stable internet connection
2. **Verify API Key**: Test API key in Stripe Dashboard
3. **Check Limits**: Verify account isn't hitting rate limits

### Products Created But Features Missing

1. **Check Metadata**: Verify metadata was saved in Stripe Dashboard
2. **Check Application**: Ensure application code reads metadata correctly
3. **Clear Cache**: Clear any application caches

### Price Mismatches

1. **Check Currency**: Ensure all prices use same currency
2. **Verify Amounts**: Check amounts are in cents (not dollars)
3. **Active Status**: Ensure prices are marked as active

For additional help, check the [main Stripe integration documentation](./stripe-integration.md) or contact support.
