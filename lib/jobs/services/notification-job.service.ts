/**
 * Notification Job Service
 *
 * Service for enqueuing notification jobs for asynchronous processing via QStash.
 * Provides a high-level interface for scheduling notification delivery with proper
 * retry configuration and metadata tracking.
 *
 * Features:
 * - Automatic retry configuration (3 retries)
 * - Metadata tracking for job attribution
 * - Integration with QStash job dispatcher
 * - Type-safe notification job payloads
 * - Support for both single and bulk notification creation
 */

import 'server-only';

import { jobDispatcher } from '../job-dispatcher.service';
import { JOB_TYPES } from '../../types/jobs';
import type {
  CreateNotificationJobPayload,
  CreateBulkNotificationJobPayload,
} from '../../types/jobs/schemas/create-notification-job.schema';
import type { BaseJobMetadata } from '../../types/jobs/schemas/base-job.schema';

/**
 * Metadata interface for notification job attribution tracking
 */
export interface EnqueueNotificationJobMetadata
  extends Pick<BaseJobMetadata, 'userId' | 'organizationId'> {}

/**
 * Enqueues a notification job for asynchronous creation. Retries are handled by
 * QStash following the defaults defined in the job registry while allowing
 * callers to attach attribution metadata.
 *
 * @param payload - Notification job payload containing user ID and notification data
 * @param metadata - Optional metadata for job attribution (userId, organizationId)
 * @returns Promise resolving to the enqueued job information
 */
export const enqueueNotificationJob = async (
  payload: CreateNotificationJobPayload,
  metadata: EnqueueNotificationJobMetadata = {}
) => {
  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    payload,
    metadata,
    {
      retries: 3,
      delay: 0,
    }
  );
};

/**
 * Enqueues a bulk notification job for asynchronous creation. Creates notifications
 * for multiple users with the same content.
 *
 * @param payload - Bulk notification job payload containing user IDs and notification data
 * @param metadata - Optional metadata for job attribution (userId, organizationId)
 * @returns Promise resolving to the enqueued job information
 */
export const enqueueBulkNotificationJob = async (
  payload: CreateBulkNotificationJobPayload,
  metadata: EnqueueNotificationJobMetadata = {}
) => {
  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    payload,
    metadata,
    {
      retries: 3,
      delay: 0,
    }
  );
};
