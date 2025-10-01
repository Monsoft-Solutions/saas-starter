/**
 * Email Job Worker API Route
 *
 * Handles asynchronous email processing via QStash job queue. This endpoint
 * receives email job payloads and dispatches them to the appropriate email
 * template handlers. Supports all transactional email types including welcome,
 * password reset, team invitations, and subscription notifications.
 *
 * @route POST /api/jobs/email
 * @description Processes queued email jobs with retry logic and error handling
 */

import { createJobWorker } from '@/lib/jobs/job-worker.handler';
import type { BaseJob } from '@/lib/types/jobs/schemas/base-job.schema';
import type { SendEmailJobPayload } from '@/lib/types/jobs/schemas/send-email-job.schema';
import {
  sendEmailChangeConfirmationEmail,
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCreatedEmail,
  sendTeamInvitationEmail,
  sendWelcomeEmail,
  type EmailChangeConfirmationEmailParams,
  type PasswordChangedEmailParams,
  type PasswordResetEmailParams,
  type PaymentFailedEmailParams,
  type SubscriptionCreatedEmailParams,
  type TeamInvitationEmailParams,
  type WelcomeEmailParams,
} from '@/lib/emails/dispatchers';
import logger from '@/lib/logger/logger.service';

/**
 * Email job handler that processes queued email jobs by routing them to the
 * appropriate email dispatcher function based on the template type.
 *
 * @param payload - The email job payload containing template, recipient, and data
 * @param job - The job metadata including job ID and retry information
 */
const emailJobHandler = async (
  payload: SendEmailJobPayload,
  job: BaseJob & { payload: SendEmailJobPayload }
) => {
  const { template, to, data } = payload;

  logger.info('[jobs] Processing email job', {
    jobId: job.jobId,
    template,
    to,
  });

  switch (template) {
    case 'welcome':
      await sendWelcomeEmail({
        to,
        ...(data as Omit<WelcomeEmailParams, 'to'>),
      });
      return;
    case 'passwordReset':
      await sendPasswordResetEmail({
        to,
        ...(data as Omit<PasswordResetEmailParams, 'to'>),
      });
      return;
    case 'passwordChanged':
      await sendPasswordChangedEmail({
        to,
        ...(data as Omit<PasswordChangedEmailParams, 'to'>),
      });
      return;
    case 'emailChange':
      await sendEmailChangeConfirmationEmail({
        to,
        ...(data as Omit<EmailChangeConfirmationEmailParams, 'to'>),
      });
      return;
    case 'teamInvitation':
      await sendTeamInvitationEmail({
        to,
        ...(data as Omit<TeamInvitationEmailParams, 'to'>),
      });
      return;
    case 'subscriptionCreated':
      await sendSubscriptionCreatedEmail({
        to,
        ...(data as Omit<SubscriptionCreatedEmailParams, 'to'>),
      });
      return;
    case 'paymentFailed':
      await sendPaymentFailedEmail({
        to,
        ...(data as Omit<PaymentFailedEmailParams, 'to'>),
      });
      return;
    default: {
      const exhaustiveCheck: never = template;
      throw new Error(`Unknown email template: ${exhaustiveCheck}`);
    }
  }
};

export const POST = createJobWorker<SendEmailJobPayload>(emailJobHandler);
