import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './user.table';
import { organization } from './organization.table';
import { relations } from 'drizzle-orm';

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id').references(
    () => organization.id,
    { onDelete: 'set null' }
  ),
  // Better Auth admin plugin field for impersonation
  impersonatedBy: text('impersonated_by').references(() => user.id, {
    onDelete: 'set null',
  }),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [session.activeOrganizationId],
    references: [organization.id],
  }),
}));
