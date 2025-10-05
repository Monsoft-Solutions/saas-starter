import {
  pgTable,
  serial,
  timestamp,
  integer,
  text,
  real,
} from 'drizzle-orm/pg-core';

/**
 * Cached admin dashboard statistics.
 * Updated periodically via cron job or manual refresh.
 */
export const adminStatistics = pgTable('admin_statistics', {
  id: serial('id').primaryKey(),

  // User metrics
  totalUsers: integer('total_users').notNull(),
  activeUsersLast30Days: integer('active_users_last_30_days').notNull(),
  newUsersLast30Days: integer('new_users_last_30_days').notNull(),

  // Organization metrics
  totalOrganizations: integer('total_organizations').notNull(),
  organizationsWithSubscriptions: integer(
    'organizations_with_subscriptions'
  ).notNull(),

  // Subscription metrics
  totalMRR: real('total_mrr').notNull(), // Monthly Recurring Revenue
  totalActiveSubscriptions: integer('total_active_subscriptions').notNull(),
  trialOrganizations: integer('trial_organizations').notNull(),

  // Growth metrics
  userGrowthRate: real('user_growth_rate'), // Percentage
  revenueGrowthRate: real('revenue_growth_rate'), // Percentage
  churnRate: real('churn_rate'), // Percentage

  // Metadata
  calculatedAt: timestamp('calculated_at').notNull().defaultNow(),
  calculationDurationMs: integer('calculation_duration_ms'),
  metadata: text('metadata'), // JSON for additional metrics
});

export type AdminStatistics = typeof adminStatistics.$inferSelect;
export type NewAdminStatistics = typeof adminStatistics.$inferInsert;
