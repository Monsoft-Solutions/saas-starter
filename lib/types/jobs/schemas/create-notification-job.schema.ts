/**
 * Create Notification Job Schema
 *
 * Defines the structure and validation for notification job payloads processed
 * by the notification worker. Enables asynchronous notification creation for
 * non-critical notifications.
 *
 * The schema includes:
 * - Notification event validation (type, title, message, etc.)
 * - Integration with base job schema for metadata
 * - Support for bulk notification creation
 */

import { z } from 'zod';

import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '..';
import { notificationEventSchema } from '@/lib/types/notifications';

/**
 * Valid payload for creating a single notification
 * Uses the existing notificationEventSchema for consistency
 */
export const CreateNotificationJobPayloadSchema = notificationEventSchema;

/**
 * Valid payload for creating notifications for multiple users
 */
export const CreateBulkNotificationJobPayloadSchema = z.object({
  userIds: z
    .array(z.string().min(1))
    .min(1, 'At least one user ID is required'),
  event: notificationEventSchema.omit({ userId: true }),
});

/**
 * Union type for both single and bulk notification creation
 */
export const NotificationJobPayloadSchema = z.union([
  CreateNotificationJobPayloadSchema,
  CreateBulkNotificationJobPayloadSchema,
]);

/**
 * Complete job envelope representing the notification job received by the worker.
 * Extends the base job schema with notification-specific payload validation.
 */
export const CreateNotificationJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.CREATE_NOTIFICATION),
  payload: NotificationJobPayloadSchema,
});

export type CreateNotificationJobPayload = z.infer<
  typeof CreateNotificationJobPayloadSchema
>;
export type CreateBulkNotificationJobPayload = z.infer<
  typeof CreateBulkNotificationJobPayloadSchema
>;
export type NotificationJobPayload = z.infer<
  typeof NotificationJobPayloadSchema
>;
export type CreateNotificationJob = z.infer<typeof CreateNotificationJobSchema>;
