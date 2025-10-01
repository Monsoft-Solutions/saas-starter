/**
 * Email Job Service
 *
 * Service for enqueuing email jobs for asynchronous processing via QStash.
 * Provides a high-level interface for scheduling email delivery with proper
 * retry configuration and metadata tracking.
 *
 * Features:
 * - Automatic retry configuration (3 retries)
 * - Metadata tracking for job attribution
 * - Integration with QStash job dispatcher
 * - Type-safe email job payloads
 */

import 'server-only';

import { jobDispatcher } from '../job-dispatcher.service';
import { JOB_TYPES } from '../../types/jobs';
import type { SendEmailJobPayload } from '../../types/jobs/schemas/send-email-job.schema';
import type { BaseJobMetadata } from '../../types/jobs/schemas/base-job.schema';

/**
 * Metadata interface for email job attribution tracking
 */
export interface EnqueueEmailJobMetadata
  extends Pick<BaseJobMetadata, 'userId' | 'organizationId'> {}

/**
 * Enqueues an email job for asynchronous delivery. Retries are handled by
 * QStash following the defaults defined in the job registry while allowing
 * callers to attach attribution metadata.
 *
 * @param payload - Email job payload containing template, recipient, and data
 * @param metadata - Optional metadata for job attribution (userId, organizationId)
 * @returns Promise resolving to the enqueued job information
 */
export const enqueueEmailJob = async (
  payload: SendEmailJobPayload,
  metadata: EnqueueEmailJobMetadata = {}
) => {
  return jobDispatcher.enqueue(JOB_TYPES.SEND_EMAIL, payload, metadata, {
    retries: 3,
    delay: 0,
  });
};
