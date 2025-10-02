import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';
import type { NotificationEvent } from '@/lib/types/notifications';

/**
 * Create feature released notification event
 *
 * @param userId - User to notify
 * @param featureName - Name of the new feature
 * @param featureDescription - Brief description
 * @param featureUrl - URL to learn more or try the feature
 * @returns Job ID of the enqueued notification
 */
export async function createFeatureReleasedNotification(
  userId: string,
  featureName: string,
  featureDescription: string,
  featureUrl?: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'product.feature_released',
    priority: 'info',
    title: `New Feature: ${featureName}`,
    message: featureDescription,
    metadata: {
      actionUrl: featureUrl || '/features',
      actionLabel: 'Learn More',
      featureName,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'product',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `feature-released-${featureName}-${userId}`,
    }
  );
}

/**
 * Create product announcement notification event
 *
 * @param userId - User to notify
 * @param announcementTitle - Title of the announcement
 * @param announcementMessage - Announcement message
 * @param announcementUrl - Optional URL for more details
 * @returns Job ID of the enqueued notification
 */
export async function createProductAnnouncementNotification(
  userId: string,
  announcementTitle: string,
  announcementMessage: string,
  announcementUrl?: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'product.announcement',
    priority: 'info',
    title: announcementTitle,
    message: announcementMessage,
    metadata: {
      actionUrl: announcementUrl,
      actionLabel: announcementUrl ? 'Read More' : undefined,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'product',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `product-announcement-${userId}-${announcementTitle}`,
    }
  );
}
