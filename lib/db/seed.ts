import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { user, account, organization, member } from './schemas';
import logger from '../logger/logger.service';
// BetterAuth handles password hashing internally

async function createStripeProducts() {
  logger.info('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  logger.info('Stripe products and prices created successfully');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';

  const [createdUser] = await db
    .insert(user)
    .values([
      {
        id: 'test-user-id',
        name: 'Test User',
        email: email,
      },
    ])
    .returning();

  // Create account record with password - BetterAuth will handle hashing
  await db.insert(account).values([
    {
      id: 'test-account-id',
      accountId: 'test-account',
      providerId: 'credential',
      userId: createdUser.id,
      password: password, // BetterAuth will hash during authentication
    },
  ]);

  logger.info('Initial user created');

  const [org] = await db
    .insert(organization)
    .values({
      id: 'test-org-id',
      name: 'Test Organization',
      slug: 'test-organization',
      createdAt: new Date(),
    })
    .returning();

  await db.insert(member).values({
    id: 'test-member-id',
    organizationId: org.id,
    userId: createdUser.id,
    role: 'owner',
    createdAt: new Date(),
  });

  await createStripeProducts();
}

seed()
  .catch((error) => {
    logger.error('Seed process failed', { error });
    process.exit(1);
  })
  .finally(() => {
    logger.info('Seed process finished. Exiting...');
    process.exit(0);
  });
