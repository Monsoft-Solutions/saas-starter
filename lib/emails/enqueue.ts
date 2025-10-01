/**
 * Email Enqueue Functions
 *
 * Asynchronous email sending functions that queue emails for background processing
 * via QStash. These functions provide a non-blocking alternative to the direct
 * email dispatchers, allowing for better performance and reliability in high-traffic
 * scenarios.
 *
 * Features:
 * - Non-blocking email queuing for better performance
 * - Automatic retry logic via QStash
 * - Metadata tracking for job attribution
 * - Type-safe email parameters matching dispatcher functions
 *
 * Usage:
 * Use these functions when you need to send emails asynchronously without
 * blocking the current request, such as in API routes or server actions.
 */

import 'server-only';

import { resolveRecipientEmail } from '@/lib/emails/email-recipient.util';
import {
  enqueueEmailJob,
  type EnqueueEmailJobMetadata,
} from '@/lib/jobs/services';
import type { EmailTemplate } from '@/lib/types/jobs/schemas/send-email-job.schema';
import type { ResendRecipientList } from '@/lib/types';
import type {
  EmailChangeConfirmationEmailParams,
  PasswordChangedEmailParams,
  PasswordResetEmailParams,
  PaymentFailedEmailParams,
  SubscriptionCreatedEmailParams,
  TeamInvitationEmailParams,
  WelcomeEmailParams,
} from './dispatchers';

/**
 * Generic email enqueue function that handles the common pattern of
 * extracting recipient email and queuing the job with proper typing
 */
const enqueueEmail = async <Params extends { to: ResendRecipientList }>(
  template: EmailTemplate,
  { to, ...data }: Params,
  metadata: EnqueueEmailJobMetadata = {}
) => {
  const recipientEmail = resolveRecipientEmail(to);

  await enqueueEmailJob(
    {
      template,
      to: recipientEmail,
      data: data as Record<string, unknown>,
    },
    metadata
  );
};

/**
 * Queues a welcome email for asynchronous delivery
 */
export const sendWelcomeEmailAsync = async (
  params: WelcomeEmailParams,
  metadata: EnqueueEmailJobMetadata = {}
) => enqueueEmail('welcome', params, metadata);

/**
 * Queues a password reset email for asynchronous delivery
 */
export const sendPasswordResetEmailAsync = async (
  params: PasswordResetEmailParams,
  metadata: EnqueueEmailJobMetadata = {}
) => enqueueEmail('passwordReset', params, metadata);

/**
 * Queues a password changed notification email for asynchronous delivery
 */
export const sendPasswordChangedEmailAsync = async (
  params: PasswordChangedEmailParams,
  metadata: EnqueueEmailJobMetadata = {}
) => enqueueEmail('passwordChanged', params, metadata);

/**
 * Queues an email change confirmation email for asynchronous delivery
 */
export const sendEmailChangeConfirmationEmailAsync = async (
  params: EmailChangeConfirmationEmailParams,
  metadata: EnqueueEmailJobMetadata = {}
) => enqueueEmail('emailChange', params, metadata);

/**
 * Queues a team invitation email for asynchronous delivery
 */
export const sendTeamInvitationEmailAsync = async (
  params: TeamInvitationEmailParams,
  metadata: EnqueueEmailJobMetadata = {}
) => enqueueEmail('teamInvitation', params, metadata);

/**
 * Queues a subscription created confirmation email for asynchronous delivery
 */
export const sendSubscriptionCreatedEmailAsync = async (
  params: SubscriptionCreatedEmailParams,
  metadata: EnqueueEmailJobMetadata = {}
) => enqueueEmail('subscriptionCreated', params, metadata);

/**
 * Queues a payment failed notification email for asynchronous delivery
 */
export const sendPaymentFailedEmailAsync = async (
  params: PaymentFailedEmailParams,
  metadata: EnqueueEmailJobMetadata = {}
) => enqueueEmail('paymentFailed', params, metadata);
