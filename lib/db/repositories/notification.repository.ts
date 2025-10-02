import 'server-only';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { notifications } from '../schemas';
import type { NewNotification } from '../schemas';
import type {
  Notification,
  NotificationCategory,
  NotificationType,
} from '@/lib/types/notifications';

/**
 * Notification Repository
 *
 * Data access layer for notification operations.
 * Provides low-level database operations for the notification service.
 */

/**
 * Create a new notification
 *
 * @param data - Notification data
 */
export async function createNotification(
  data: NewNotification
): Promise<Notification> {
  const result = await db.insert(notifications).values(data).returning();

  return result[0];
}

/**
 * Create multiple notifications in bulk
 *
 * @param data - Array of notification data
 */
export async function createNotificationsBulk(
  data: NewNotification[]
): Promise<Notification[]> {
  if (data.length === 0) return [];

  const result = await db.insert(notifications).values(data).returning();

  return result;
}

/**
 * Delete a notification by ID
 *
 * @param notificationId - Notification ID
 * @param userId - User ID (for verification)
 */
export async function deleteNotification(
  notificationId: number,
  userId: string
): Promise<void> {
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

/**
 * Get notification statistics for a user
 *
 * @param userId - User ID
 */
export async function getNotificationStats(userId: string): Promise<{
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<string, number>;
}> {
  const baseFilter = and(
    eq(notifications.userId, userId),
    eq(notifications.isDismissed, false)
  );

  const [[{ total }], [{ unread }], categoryRows, priorityRows] =
    await Promise.all([
      // Total count
      db.select({ total: count() }).from(notifications).where(baseFilter),

      // Unread count
      db
        .select({ unread: count() })
        .from(notifications)
        .where(and(baseFilter, eq(notifications.isRead, false))),

      // By category
      db
        .select({
          category: notifications.category,
          count: count(),
        })
        .from(notifications)
        .where(baseFilter)
        .groupBy(notifications.category),

      // By priority
      db
        .select({
          priority: notifications.priority,
          count: count(),
        })
        .from(notifications)
        .where(baseFilter)
        .groupBy(notifications.priority),
    ]);

  const byCategory = categoryRows.reduce(
    (acc, row) => {
      acc[row.category] = Number(row.count);
      return acc;
    },
    {} as Record<NotificationCategory, number>
  );

  const byPriority = priorityRows.reduce(
    (acc, row) => {
      acc[row.priority] = Number(row.count);
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total: Number(total),
    unread: Number(unread),
    byCategory,
    byPriority,
  };
}

/**
 * Get notifications by type
 *
 * @param userId - User ID
 * @param type - Notification type
 * @param limit - Number of notifications to fetch
 */
export async function getNotificationsByType(
  userId: string,
  type: NotificationType,
  limit: number = 10
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, type),
        eq(notifications.isDismissed, false)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Get notifications by category
 *
 * @param userId - User ID
 * @param category - Notification category
 * @param limit - Number of notifications to fetch
 */
export async function getNotificationsByCategory(
  userId: string,
  category: NotificationCategory,
  limit: number = 10
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.category, category),
        eq(notifications.isDismissed, false)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
