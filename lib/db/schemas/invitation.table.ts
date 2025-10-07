import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { organization } from './organization.table';
import { user } from './user.table';
import { sql } from 'drizzle-orm';

export const invitation = pgTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role'),
    status: text('status').default('pending').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    {
      orgIdx: index('idx_invitation_org').on(table.organizationId),
      orgEmailPendingIdx: index('idx_invitation_org_email_pending')
        .on(table.organizationId, sql`lower(${table.email})`)
        .where(sql`${table.status} = 'pending'`),
      expiresAtIdx: index('idx_invitation_expires_at').on(table.expiresAt),
    },
  ]
);
