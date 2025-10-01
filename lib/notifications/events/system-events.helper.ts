import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';
import type { NotificationEvent } from '@/lib/types/notifications';

/**
 * Create system maintenance notification event
 *
 * @param userId - User to notify
 * @param startTime - Maintenance start time
 * @param duration - Expected duration (e.g., "2 hours")
 * @returns Job ID of the enqueued notification
 */
export async function createSystemMaintenanceNotification(
  userId: string,
  startTime: Date,
  duration: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'system.maintenance',
    priority: 'important',
    title: 'Scheduled Maintenance',
    message: `System maintenance is scheduled for ${startTime.toLocaleString()}. Expected duration: ${duration}.`,
    metadata: {
      startTime: startTime.toISOString(),
      duration,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'system',
      expiresAt: new Date(startTime.getTime() + 24 * 60 * 60 * 1000), // Expires 24h after maintenance
    },
    {
      idempotencyKey: `system-maintenance-${userId}-${startTime.getTime()}`,
    }
  );
}

/**
 * Create system update notification event
 *
 * @param userId - User to notify
 * @param updateTitle - Title of the update
 * @param updateSummary - Brief summary of changes
 * @returns Job ID of the enqueued notification
 */
export async function createSystemUpdateNotification(
  userId: string,
  updateTitle: string,
  updateSummary: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'system.update',
    priority: 'info',
    title: updateTitle,
    message: updateSummary,
    metadata: {
      actionUrl: '/changelog',
      actionLabel: 'View Details',
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'system',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `system-update-${userId}-${Date.now()}`,
    }
  );
}
