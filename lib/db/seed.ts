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
  logger.info('Checking Stripe products and prices...');

  // Check if products already exist
  const existingProducts = await stripe.products.list({ limit: 100 });
  const baseProductExists = existingProducts.data.find(
    (p) => p.name === 'Base'
  );
  const plusProductExists = existingProducts.data.find(
    (p) => p.name === 'Plus'
  );

  if (baseProductExists && plusProductExists) {
    logger.info('Stripe products already exist, skipping creation');
    return;
  }

  // Create Base product if it doesn't exist
  let baseProduct = baseProductExists;
  if (!baseProductExists) {
    logger.info('Creating Base product...');
    baseProduct = await stripe.products.create({
      name: 'Base',
      description: 'Base subscription plan',
    });

    // Check if prices already exist for this product
    const existingPrices = await stripe.prices.list({
      product: baseProduct.id,
      limit: 100,
    });
    const baseMonthlyPriceExists = existingPrices.data.find(
      (p) =>
        p.unit_amount === 800 &&
        p.currency === 'usd' &&
        p.recurring?.interval === 'month'
    );
    const baseAnnualPriceExists = existingPrices.data.find(
      (p) =>
        p.unit_amount === 9600 &&
        p.currency === 'usd' &&
        p.recurring?.interval === 'year'
    );

    if (!baseMonthlyPriceExists) {
      await stripe.prices.create({
        product: baseProduct.id,
        unit_amount: 800, // $8/month in cents
        currency: 'usd',
        recurring: {
          interval: 'month',
          trial_period_days: 7,
        },
      });
      logger.info('Base monthly price created');
    } else {
      logger.info('Base monthly price already exists');
    }

    if (!baseAnnualPriceExists) {
      await stripe.prices.create({
        product: baseProduct.id,
        unit_amount: 9600, // $96/year in cents (12 * $8)
        currency: 'usd',
        recurring: {
          interval: 'year',
          trial_period_days: 7,
        },
      });
      logger.info('Base annual price created');
    } else {
      logger.info('Base annual price already exists');
    }
  }

  // Create Plus product if it doesn't exist
  let plusProduct = plusProductExists;
  if (!plusProductExists) {
    logger.info('Creating Plus product...');
    plusProduct = await stripe.products.create({
      name: 'Plus',
      description: 'Plus subscription plan',
    });

    // Check if prices already exist for this product
    const existingPrices = await stripe.prices.list({
      product: plusProduct.id,
      limit: 100,
    });
    const plusMonthlyPriceExists = existingPrices.data.find(
      (p) =>
        p.unit_amount === 1200 &&
        p.currency === 'usd' &&
        p.recurring?.interval === 'month'
    );
    const plusAnnualPriceExists = existingPrices.data.find(
      (p) =>
        p.unit_amount === 14400 &&
        p.currency === 'usd' &&
        p.recurring?.interval === 'year'
    );

    if (!plusMonthlyPriceExists) {
      await stripe.prices.create({
        product: plusProduct.id,
        unit_amount: 1200, // $12/month in cents
        currency: 'usd',
        recurring: {
          interval: 'month',
          trial_period_days: 7,
        },
      });
      logger.info('Plus monthly price created');
    } else {
      logger.info('Plus monthly price already exists');
    }

    if (!plusAnnualPriceExists) {
      await stripe.prices.create({
        product: plusProduct.id,
        unit_amount: 14400, // $144/year in cents (12 * $12)
        currency: 'usd',
        recurring: {
          interval: 'year',
          trial_period_days: 7,
        },
      });
      logger.info('Plus annual price created');
    } else {
      logger.info('Plus annual price already exists');
    }
  }

  logger.info('Stripe products and prices check completed');
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

  // Create organization for test user
  if (createdUser) {
    const [testOrg] = await db
      .insert(organization)
      .values({
        id: 'test-org-id',
        name: 'Test Organization',
        slug: 'test-organization',
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    if (testOrg) {
      await db
        .insert(member)
        .values({
          id: 'test-member-id',
          organizationId: testOrg.id,
          userId: createdUser.id,
          role: 'owner',
          createdAt: new Date(),
        })
        .onConflictDoNothing();
      logger.info('Test organization created for test user');
    }
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

    // Create organization for super admin
    const [adminOrg] = await db
      .insert(organization)
      .values({
        id: 'admin-org-id',
        name: 'Admin Organization',
        slug: 'admin-organization',
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    if (adminOrg) {
      await db
        .insert(member)
        .values({
          id: 'admin-member-id',
          organizationId: adminOrg.id,
          userId: superAdminUser.id,
          role: 'owner',
          createdAt: new Date(),
        })
        .onConflictDoNothing();
      logger.info('Admin organization created for super admin');
    }

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
      totalOrganizations: 2, // test organization + admin organization
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
