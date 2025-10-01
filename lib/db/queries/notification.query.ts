import { and, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { notifications } from '../schemas';
import { cacheService, CacheKeys } from '@/lib/cache';
import type { Notification } from '@/lib/types/notifications';

/**
 * Get notifications for a user with pagination
 *
 * @param userId - User ID
 * @param limit - Number of notifications to fetch (default: 20)
 * @param offset - Number of notifications to skip (default: 0)
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Notification[]> {
  return cacheService.getOrSet(
    CacheKeys.userNotifications(userId, limit, offset),
    async () => {
      return db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isDismissed, false)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);
    },
    { ttl: 60 } // Cache for 1 minute
  );
}

/**
 * Get unread notification count for a user
 *
 * @param userId - User ID
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return cacheService.getOrSet(
    CacheKeys.userUnreadNotifications(userId),
    async () => {
      const result = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
            eq(notifications.isDismissed, false)
          )
        );

      return result[0]?.count ?? 0;
    },
    { ttl: 30 } // Cache for 30 seconds
  );
}

/**
 * Get a single notification by ID
 *
 * @param notificationId - Notification ID
 */
export async function getNotificationById(
  notificationId: number
): Promise<Notification | null> {
  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Mark a notification as read
 *
 * @param notificationId - Notification ID
 * @param userId - User ID (for verification)
 */
export async function markAsRead(
  notificationId: number,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );

  // Invalidate cache
  await invalidateUserNotificationCache(userId);
}

/**
 * Mark multiple notifications as read
 *
 * @param notificationIds - Array of notification IDs
 * @param userId - User ID (for verification)
 */
export async function markMultipleAsRead(
  notificationIds: number[],
  userId: string
): Promise<void> {
  if (notificationIds.length === 0) return;

  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        sql`${notifications.id} = ANY(${notificationIds})`,
        eq(notifications.userId, userId)
      )
    );

  // Invalidate cache
  await invalidateUserNotificationCache(userId);
}

/**
 * Mark all notifications as read for a user
 *
 * @param userId - User ID
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  // Invalidate cache
  await invalidateUserNotificationCache(userId);
}

/**
 * Dismiss a notification
 *
 * @param notificationId - Notification ID
 * @param userId - User ID (for verification)
 */
export async function dismissNotification(
  notificationId: number,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isDismissed: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );

  // Invalidate cache
  await invalidateUserNotificationCache(userId);
}

/**
 * Delete expired notifications (used by cleanup job)
 */
export async function deleteExpiredNotifications(): Promise<number> {
  const result = await db
    .delete(notifications)
    .where(
      and(
        sql`${notifications.expiresAt} IS NOT NULL`,
        sql`${notifications.expiresAt} < NOW()`
      )
    );

  // Count deleted rows - note: Drizzle returns array for delete
  return Array.isArray(result) ? result.length : 0;
}

/**
 * Invalidate all notification-related cache for a user
 *
 * @param userId - User ID
 */
export async function invalidateUserNotificationCache(
  userId: string
): Promise<void> {
  await cacheService.invalidatePattern(
    CacheKeys.userNotificationPattern(userId)
  );
}
