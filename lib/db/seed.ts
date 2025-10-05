import Stripe from 'stripe';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schemas';
import {
  user,
  account,
  organization,
  member,
  adminStatistics,
} from './schemas';
import logger from '../logger/logger.service';
import { env } from '../env';
import { hashPassword } from 'better-auth/crypto';

// Create separate DB instance for seeding (avoiding server-only import)
const client = postgres(env.POSTGRES_URL);
const db = drizzle(client, { schema, logger: false });

// Create Stripe client directly for seeding
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

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

  // Hash password using Better Auth's crypto utility
  const hashedPassword = await hashPassword(password);

  const [createdUser] = await db
    .insert(user)
    .values([
      {
        id: 'test-user-id',
        name: 'Test User',
        email: email,
      },
    ])
    .onConflictDoNothing()
    .returning();

  // Create account record with hashed password
  if (createdUser) {
    await db
      .insert(account)
      .values([
        {
          id: 'test-account-id',
          accountId: 'test-account',
          providerId: 'credential',
          userId: createdUser.id,
          password: hashedPassword,
        },
      ])
      .onConflictDoNothing();
    logger.info('Initial user created');
  } else {
    logger.info('Initial user already exists, skipping');
  }

  const [org] = await db
    .insert(organization)
    .values({
      id: 'test-org-id',
      name: 'Test Organization',
      slug: 'test-organization',
      createdAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (org) {
    await db
      .insert(member)
      .values({
        id: 'test-member-id',
        organizationId: org.id,
        userId: createdUser?.id || 'test-user-id',
        role: 'owner',
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }

  // Create super-admin user
  const superAdminEmail = 'admin@test.com';
  const superAdminPassword = 'admin123';

  // Hash super-admin password using Better Auth's crypto utility
  const hashedSuperAdminPassword = await hashPassword(superAdminPassword);

  const [superAdminUser] = await db
    .insert(user)
    .values({
      id: 'super-admin-user-id',
      name: 'Super Admin',
      email: superAdminEmail,
      emailVerified: true,
      role: 'super-admin', // Better Auth admin plugin field
    })
    .onConflictDoNothing()
    .returning();

  // Create account record for super-admin with hashed password
  if (superAdminUser) {
    await db
      .insert(account)
      .values({
        id: 'super-admin-account-id',
        accountId: 'super-admin-account',
        providerId: 'credential',
        userId: superAdminUser.id,
        password: hashedSuperAdminPassword,
      })
      .onConflictDoNothing();

    logger.info('Super admin user created', {
      email: superAdminEmail,
      userId: superAdminUser.id,
    });
  } else {
    logger.info('Super admin user already exists, skipping');
  }

  // Seed initial admin statistics (only once)
  const existingStats = await db.select().from(adminStatistics).limit(1);
  if (existingStats.length === 0) {
    await db.insert(adminStatistics).values({
      totalUsers: 2, // test user + super admin
      activeUsersLast30Days: 0,
      newUsersLast30Days: 2,
      totalOrganizations: 1,
      organizationsWithSubscriptions: 0,
      totalMRR: 0,
      totalActiveSubscriptions: 0,
      trialOrganizations: 0,
      calculatedAt: new Date(),
    });
    logger.info('Initial admin statistics seeded');
  } else {
    logger.info('Admin statistics already exist, skipping');
  }

  await createStripeProducts();
}

seed()
  .catch((error) => {
    logger.error('Seed process failed', { error });
    console.error('Full error:', error);
    process.exit(1);
  })
  .finally(() => {
    logger.info('Seed process finished. Exiting...');
    process.exit(0);
  });
