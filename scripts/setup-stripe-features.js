#!/usr/bin/env node

/**
 * Script to set up Stripe products and pricing plans with features metadata
 *
 * This script will:
 * - Check for existing Starter and Pro products in Stripe
 * - Create products with both monthly and yearly pricing if they don't exist
 * - Update products with comprehensive features metadata
 * - Display detailed summary of all products and pricing
 *
 * Run with: node scripts/setup-stripe-features.js
 *
 * Requires: STRIPE_SECRET_KEY environment variable
 */

require('dotenv').config();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Default pricing configuration for products
 */
const PRODUCT_CONFIG = {
  starter: {
    name: 'Starter',
    description: 'Perfect for individuals and small teams getting started',
    pricing: {
      monthly: 1000, // $10.00 in cents
      yearly: 10000, // $100.00 in cents (equivalent to ~$8.33/month)
    },
  },
  pro: {
    name: 'Pro',
    description: 'Advanced features for growing teams and businesses',
    pricing: {
      monthly: 2500, // $25.00 in cents
      yearly: 25000, // $250.00 in cents (equivalent to ~$20.83/month)
    },
  },
};

/**
 * Creates a product with both monthly and yearly pricing
 */
async function createProductWithPricing(productKey, config) {
  console.log(`🆕 Creating ${config.name} product...`);

  // Create the product
  const product = await stripe.products.create({
    name: config.name,
    description: config.description,
    active: true,
  });

  console.log(`✅ Created product: ${config.name} (${product.id})`);

  // Create monthly price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: config.pricing.monthly,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    active: true,
  });

  console.log(
    `💵 Created monthly price: $${config.pricing.monthly / 100}/month (${monthlyPrice.id})`
  );

  // Create yearly price
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: config.pricing.yearly,
    currency: 'usd',
    recurring: {
      interval: 'year',
    },
    active: true,
  });

  console.log(
    `💰 Created yearly price: $${config.pricing.yearly / 100}/year (${yearlyPrice.id})`
  );

  // Set monthly price as default
  await stripe.products.update(product.id, {
    default_price: monthlyPrice.id,
  });

  return product;
}

/**
 * Ensures products exist, creating them if necessary
 */
async function ensureProductsExist() {
  console.log('🔍 Checking for existing products...');

  // List existing products
  const products = await stripe.products.list({
    active: true,
    limit: 10,
  });

  console.log(
    '📦 Found existing products:',
    products.data.map((p) => `${p.name} (${p.id})`)
  );

  // Find Starter and Pro products
  let starterProduct = products.data.find(
    (p) => p.name.toLowerCase() === 'starter'
  );
  let proProduct = products.data.find((p) => p.name.toLowerCase() === 'pro');

  // Create missing products
  if (!starterProduct) {
    console.log('⚠️  Starter product not found, creating...');
    starterProduct = await createProductWithPricing(
      'starter',
      PRODUCT_CONFIG.starter
    );
  } else {
    console.log('✅ Starter product already exists');
  }

  if (!proProduct) {
    console.log('⚠️  Pro product not found, creating...');
    proProduct = await createProductWithPricing('pro', PRODUCT_CONFIG.pro);
  } else {
    console.log('✅ Pro product already exists');
  }

  return { starterProduct, proProduct };
}

async function setupProductFeatures() {
  console.log('🔄 Setting up Stripe product features...');

  try {
    // Ensure products exist, create if missing
    const { starterProduct, proProduct } = await ensureProductsExist();

    // Update Starter product with features
    console.log('🔄 Updating Starter product metadata...');
    await stripe.products.update(starterProduct.id, {
      metadata: {
        features: JSON.stringify([
          'Unlimited Usage',
          'Unlimited Workspace Members',
          'Email Support',
          'Basic Analytics',
          'Standard Templates',
        ]),
        popular: 'false',
        category: 'starter',
        trial_days: '14',
      },
    });

    // Update Pro product with features
    console.log('🔄 Updating Pro product metadata...');
    await stripe.products.update(proProduct.id, {
      metadata: {
        features: JSON.stringify([
          'Everything in Starter, and:',
          'Advanced Analytics & Reporting',
          'Priority Support (24/7)',
          'Custom Integrations',
          'Advanced Security Features',
          'Custom Templates',
          'API Access',
          'White-label Options',
        ]),
        popular: 'true',
        category: 'professional',
        trial_days: '14',
      },
    });

    console.log('✅ Successfully updated product features!');
    console.log('📊 Product summaries:');

    // Fetch updated products to verify
    const updatedStarter = await stripe.products.retrieve(starterProduct.id);
    const updatedPro = await stripe.products.retrieve(proProduct.id);

    // Get pricing information for each product
    const starterPrices = await stripe.prices.list({
      product: starterProduct.id,
      active: true,
    });
    const proPrices = await stripe.prices.list({
      product: proProduct.id,
      active: true,
    });

    console.log('\n🟦 Starter Plan:');
    console.log(`   Product ID: ${updatedStarter.id}`);
    console.log(`   Description: ${updatedStarter.description}`);
    console.log(
      `   Features: ${JSON.parse(updatedStarter.metadata.features).join(', ')}`
    );
    console.log(`   Popular: ${updatedStarter.metadata.popular}`);
    console.log(`   Pricing:`);
    starterPrices.data.forEach((price) => {
      const amount = price.unit_amount / 100;
      const interval = price.recurring?.interval || 'one-time';
      console.log(`     • $${amount}/${interval} (${price.id})`);
    });

    console.log('\n🟨 Pro Plan:');
    console.log(`   Product ID: ${updatedPro.id}`);
    console.log(`   Description: ${updatedPro.description}`);
    console.log(
      `   Features: ${JSON.parse(updatedPro.metadata.features).join(', ')}`
    );
    console.log(`   Popular: ${updatedPro.metadata.popular}`);
    console.log(`   Pricing:`);
    proPrices.data.forEach((price) => {
      const amount = price.unit_amount / 100;
      const interval = price.recurring?.interval || 'one-time';
      console.log(`     • $${amount}/${interval} (${price.id})`);
    });

    console.log(
      '\n🎉 Setup complete! Your pricing page will now load features and pricing dynamically from Stripe.'
    );
    console.log('\n📋 Next steps:');
    console.log('   • Test your pricing page at /pricing');
    console.log('   • Verify checkout flows with Stripe test cards');
    console.log('   • Configure webhooks for subscription management');
    console.log('   • Set up billing portal for customer self-service');
  } catch (error) {
    console.error('❌ Error setting up product features:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupProductFeatures().catch(console.error);
