/**
 * Notification Job Worker API Route
 *
 * Handles asynchronous notification creation via QStash job queue. This endpoint
 * receives notification job payloads and creates notifications for users.
 * Supports both single and bulk notification creation.
 *
 * @route POST /api/jobs/notifications
 * @description Processes queued notification jobs with retry logic and error handling
 */

import { createJobWorker } from '@/lib/jobs/job-worker.handler';
import type { BaseJob } from '@/lib/types/jobs/schemas/base-job.schema';
import type {
  NotificationJobPayload,
  CreateBulkNotificationJobPayload,
} from '@/lib/types/jobs/schemas/create-notification-job.schema';
import {
  createNotification,
  createNotificationsForUsers,
} from '@/lib/notifications/notification.service';
import logger from '@/lib/logger/logger.service';

/**
 * Type guard to check if payload is bulk notification
 */
function isBulkNotificationPayload(
  payload: NotificationJobPayload
): payload is CreateBulkNotificationJobPayload {
  return 'userIds' in payload && 'event' in payload;
}

/**
 * Notification job handler that processes queued notification jobs by creating
 * notifications for one or more users.
 *
 * @param payload - The notification job payload (single or bulk)
 * @param job - The job metadata including job ID and retry information
 */
const notificationJobHandler = async (
  payload: NotificationJobPayload,
  job: BaseJob & { payload: NotificationJobPayload }
) => {
  logger.info('[jobs] Processing notification job', {
    jobId: job.jobId,
    isBulk: isBulkNotificationPayload(payload),
  });

  if (isBulkNotificationPayload(payload)) {
    // Handle bulk notification creation
    const { userIds, event } = payload;

    logger.info('[jobs] Creating bulk notifications', {
      jobId: job.jobId,
      userCount: userIds.length,
      type: event.type,
    });

    await createNotificationsForUsers(userIds, event);

    logger.info('[jobs] Bulk notifications created successfully', {
      jobId: job.jobId,
      userCount: userIds.length,
    });
  } else {
    // Handle single notification creation
    logger.info('[jobs] Creating single notification', {
      jobId: job.jobId,
      userId: payload.userId,
      type: payload.type,
    });

    await createNotification(payload);

    logger.info('[jobs] Single notification created successfully', {
      jobId: job.jobId,
      userId: payload.userId,
    });
  }
};

export const POST = createJobWorker<NotificationJobPayload>(
  notificationJobHandler
);
