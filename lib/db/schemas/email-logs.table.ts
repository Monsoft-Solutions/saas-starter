import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Enum for email delivery status.
 * @enum {string}
 */
export const emailStatusEnum = pgEnum('email_status', [
  'sent',
  'delivered',
  'bounced',
  'complained',
  'failed',
]);

/**
 * Drizzle schema for email logs.
 * @table email_logs
 */
export const emailLogs = pgTable('email_logs', {
  /**
   * Unique identifier for the email log entry.
   * @type {string}
   */
  id: uuid('id').primaryKey().defaultRandom(),
  /**
   * The ID of the email from the email provider (e.g., Resend).
   * @type {string}
   */
  emailId: text('email_id').unique(),
  /**
   * The recipient's email address.
   * @type {string}
   */
  recipient: text('recipient').notNull(),
  /**
   * The type of email template used.
   * @type {string}
   */
  templateType: text('template_type'),
  /**
   * The subject of the email.
   * @type {string}
   */
  subject: text('subject').notNull(),
  /**
   * The delivery status of the email.
   * @type {emailStatusEnum}
   */
  status: emailStatusEnum('status').default('sent'),
  /**
   * The email provider used to send the email (e.g., 'resend').
   * @type {string}
   */
  provider: text('provider'),
  /**
   * Additional metadata related to the email.
   * @type {object}
   */
  metadata: jsonb('metadata'),
  /**
   * The timestamp when the email was sent.
   * @type {Date}
   */
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  /**
   * The timestamp when the email was delivered.
   * @type {Date | null}
   */
  deliveredAt: timestamp('delivered_at'),
  /**
   * The timestamp when the email failed to send.
   * @type {Date | null}
   */
  failedAt: timestamp('failed_at'),
  /**
   * The error message if the email failed to send.
   * @type {string | null}
   */
  errorMessage: text('error_message'),
});

export type EmailLog = typeof emailLogs.$inferSelect;
