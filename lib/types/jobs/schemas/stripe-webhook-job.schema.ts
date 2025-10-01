import { z } from 'zod';
import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '../enums/job-type.enum';

/**
 * Payload schema for Stripe webhook job processing. Captures the essential
 * event data needed to handle subscription changes, payments, and customer updates
 * without blocking the webhook endpoint response.
 */
export const StripeWebhookJobPayloadSchema = z.object({
  eventType: z.string(),
  eventId: z.string(),
  eventData: z.record(z.any()),
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  ipAddress: z.string().optional(),
});

/**
 * Complete Stripe webhook job schema including base job properties.
 * Used for validating incoming webhook job payloads in the worker handler.
 */
export const StripeWebhookJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.PROCESS_STRIPE_WEBHOOK),
  payload: StripeWebhookJobPayloadSchema,
});

export type StripeWebhookJobPayload = z.infer<
  typeof StripeWebhookJobPayloadSchema
>;
export type StripeWebhookJob = z.infer<typeof StripeWebhookJobSchema>;
