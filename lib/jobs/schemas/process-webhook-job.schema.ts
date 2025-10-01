/**
 * Process Webhook Job Schema
 *
 * Defines the structure and validation for webhook processing job payloads processed by
 * the webhook worker. This schema ensures type safety and validates webhook operations
 * for asynchronous processing of third-party service events.
 *
 * The schema includes:
 * - Source validation against supported webhook providers
 * - Event type validation for webhook event categorization
 * - Flexible data payload for webhook-specific information
 * - Optional signature validation for webhook authenticity
 * - Integration with base job schema for metadata
 */

import { z } from 'zod';
import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '../../types/jobs';

/**
 * Valid payloads accepted by the webhook worker. Defines the structure for
 * asynchronous webhook processing from third-party services.
 *
 * @param source - Webhook source service (stripe, resend, custom)
 * @param event - Webhook event type identifier
 * @param data - Webhook payload data (flexible object)
 * @param signature - Optional webhook signature for verification
 */
export const ProcessWebhookJobPayloadSchema = z.object({
  source: z.enum(['stripe', 'resend', 'custom']),
  event: z.string(),
  data: z.record(z.any()),
  signature: z.string().optional(),
});

/**
 * Complete webhook job envelope representing the job received by the worker.
 * Extends the base job schema with webhook-specific payload validation.
 */
export const ProcessWebhookJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.PROCESS_WEBHOOK),
  payload: ProcessWebhookJobPayloadSchema,
});

export type ProcessWebhookJobPayload = z.infer<
  typeof ProcessWebhookJobPayloadSchema
>;
export type ProcessWebhookJob = z.infer<typeof ProcessWebhookJobSchema>;
