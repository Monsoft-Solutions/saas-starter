import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  type NotificationMetadata,
} from '@/lib/types/notifications';

/**
 * PostgreSQL enums derived from TypeScript constants.
 * Single source of truth ensures consistency across DB, types, and validation.
 */
export const notificationPriorityEnum = pgEnum(
  'notification_priority',
  NOTIFICATION_PRIORITIES
);

export const notificationCategoryEnum = pgEnum(
  'notification_category',
  NOTIFICATION_CATEGORIES
);

export const notificationTypeEnum = pgEnum(
  'notification_type',
  NOTIFICATION_TYPES
);

/**
 * Notifications table.
 * Stores in-app notifications for users with categorization and priority.
 */
export const notifications = pgTable(
  'notifications',
  {
    /** Auto-incrementing ID */
    id: serial('id').primaryKey(),
    /** User who receives this notification */
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    // Content (using pgEnum for type safety)
    /** Specific notification type (e.g., 'billing.payment_failed') */
    type: notificationTypeEnum('type').notNull(),
    /** High-level category (e.g., 'billing', 'security') */
    category: notificationCategoryEnum('category').notNull(),
    /** Priority level (critical, important, info) */
    priority: notificationPriorityEnum('priority').notNull().default('info'),
    /** Short notification title */
    title: text('title').notNull(),
    /** Detailed notification message */
    message: text('message').notNull(),
    /** Additional contextual metadata (action URLs, actor info, etc.) */
    metadata: jsonb('metadata').$type<NotificationMetadata>(),

    // State management
    /** Whether the notification has been read */
    isRead: boolean('is_read').notNull().default(false),
    /** Timestamp when the notification was marked as read */
    readAt: timestamp('read_at'),
    /** Whether the notification has been dismissed */
    isDismissed: boolean('is_dismissed').notNull().default(false),

    // Timestamps
    /** When the notification was created */
    createdAt: timestamp('created_at').notNull().defaultNow(),
    /** When the notification should expire and be auto-deleted */
    expiresAt: timestamp('expires_at'),
  },
  (table) => ({
    /**
     * Optimized indexes for common queries.
     */
    // Index for fetching user's notifications sorted by creation time
    userCreatedIdx: index('idx_notifications_user_created').on(
      table.userId,
      table.createdAt.desc()
    ),
    // Partial index for unread notifications (faster unread count queries)
    userUnreadIdx: index('idx_notifications_user_unread')
      .on(table.userId, table.isRead)
      .where(sql`${table.isRead} = false`),
    // Partial index for cleanup job to delete expired notifications
    expiresIdx: index('idx_notifications_expires')
      .on(table.expiresAt)
      .where(sql`${table.expiresAt} IS NOT NULL`),
  })
);

/**
 * Type inference for select operations.
 */
export type Notification = typeof notifications.$inferSelect;

/**
 * Type inference for insert operations.
 */
export type NewNotification = typeof notifications.$inferInsert;
