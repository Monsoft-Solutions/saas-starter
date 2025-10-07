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
import { organization } from './organization.table';
import { user } from './user.table';
import { relations } from 'drizzle-orm';

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
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organization.id, {
      onDelete: 'cascade',
    }),
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

export const jobExecutionsRelations = relations(jobExecutions, ({ one }) => ({
  user: one(user, {
    fields: [jobExecutions.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [jobExecutions.organizationId],
    references: [organization.id],
  }),
}));

export type JobExecution = typeof jobExecutions.$inferSelect;
export type NewJobExecution = typeof jobExecutions.$inferInsert;
