import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Persists the lifecycle of background jobs so we can power dashboards,
 * retries, and operational tooling without querying QStash directly.
 */
export const jobExecutions = pgTable('job_executions', {
  id: serial('id').primaryKey(),
  jobId: varchar('job_id', { length: 255 }).notNull().unique(),
  jobType: varchar('job_type', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  payload: jsonb('payload').notNull(),
  result: jsonb('result'),
  error: text('error'),
  retryCount: integer('retry_count').default(0).notNull(),
  userId: integer('user_id'),
  organizationId: integer('organization_id'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type JobExecution = typeof jobExecutions.$inferSelect;
export type NewJobExecution = typeof jobExecutions.$inferInsert;
