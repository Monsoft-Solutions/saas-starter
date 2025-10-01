/**
 * Send Email Job Schema
 *
 * Defines the structure and validation for email job payloads processed by
 * the email worker. This schema ensures type safety and validates that only
 * supported email templates can be queued for processing.
 *
 * The schema includes:
 * - Template validation against known email types
 * - Email address validation for recipients
 * - Flexible data payload for template-specific parameters
 * - Integration with base job schema for metadata
 */

import { z } from 'zod';

import { BaseJobSchema } from './base-job.schema';
import { JOB_TYPES } from '..';

/**
 * Supported email templates that can be processed by the email worker
 */
const EMAIL_TEMPLATES = [
  'welcome',
  'passwordReset',
  'passwordChanged',
  'emailChange',
  'teamInvitation',
  'subscriptionCreated',
  'paymentFailed',
] as const;

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

/**
 * Valid payloads accepted by the email worker. Templates map directly to the
 * existing dispatcher functions, ensuring runtime payloads stay aligned with
 * the available transactional emails.
 *
 * @param template - Email template type (must be one of EMAIL_TEMPLATES)
 * @param to - Recipient email address (validated as email format)
 * @param data - Template-specific data payload (flexible object)
 */
export const SendEmailJobPayloadSchema = z.object({
  template: z.enum(EMAIL_TEMPLATES),
  to: z.string().email(),
  data: z.record(z.unknown()),
});

/**
 * Complete job envelope representing the email job received by the worker.
 * Extends the base job schema with email-specific payload validation.
 */
export const SendEmailJobSchema = BaseJobSchema.extend({
  type: z.literal(JOB_TYPES.SEND_EMAIL),
  payload: SendEmailJobPayloadSchema,
});

export type SendEmailJobPayload = z.infer<typeof SendEmailJobPayloadSchema>;
export type SendEmailJob = z.infer<typeof SendEmailJobSchema>;
