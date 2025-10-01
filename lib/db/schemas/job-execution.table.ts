import {
  index,
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
export const jobExecutions = pgTable(
  'job_executions',
  {
    id: serial('id').primaryKey(),
    jobId: text('job_id').notNull().unique(),
    jobType: varchar('job_type', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    payload: jsonb('payload').notNull(),
    result: jsonb('result'),
    error: text('error'),
    retryCount: integer('retry_count').default(0).notNull(),
    userId: text('user_id'),
    organizationId: text('organization_id'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    {
      jobTypeIdx: index('job_executions_job_type_idx').on(table.jobType),
      statusIdx: index('job_executions_status_idx').on(table.status),
      userIdIdx: index('job_executions_user_id_idx').on(table.userId),
      organizationIdIdx: index('job_executions_organization_id_idx').on(
        table.organizationId
      ),
      createdAtIdx: index('job_executions_created_at_idx').on(table.createdAt),
    },
  ]
);

export type JobExecution = typeof jobExecutions.$inferSelect;
export type NewJobExecution = typeof jobExecutions.$inferInsert;
