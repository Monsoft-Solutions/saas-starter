import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './user.table';

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(user, {
    fields: [activityLogs.userId],
    references: [user.id],
  }),
}));

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
