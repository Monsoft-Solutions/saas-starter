import 'server-only';

import { Resend } from 'resend';

import { env } from '@/lib/env';
import {
  ResendEmailPayload,
  ResendRecipient,
  ResendRecipientList,
} from '@/lib/types';
import { logSentEmail } from './logger';
import logger from '@/lib/logger/logger.service';

/**
 * Error wrapper to ensure consumers can consistently handle Resend failures.
 */
export class ResendEmailError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ResendEmailError';
  }
}

/**
 * Shared Resend client configured with the project API key.
 */
const resend = new Resend(env.RESEND_API_KEY);

/**
 * Default reply-to that favours explicit config while allowing supporter fallbacks.
 */
const defaultReplyTo = env.RESEND_REPLY_TO ?? env.APP_SUPPORT_EMAIL;

/**
 * Formats a recipient into an RFC 5322 compatible string for Resend.
 */
const formatRecipient = (recipient: ResendRecipient): string =>
  typeof recipient === 'string'
    ? recipient
    : recipient.name
      ? `${recipient.name} <${recipient.email}>`
      : recipient.email;

/**
 * Normalises single or multiple recipients into the shapes Resend expects.
 */
const normaliseRecipients = (
  recipients?: ResendRecipientList
): string | string[] | undefined => {
  if (!recipients) {
    return undefined;
  }

  return Array.isArray(recipients)
    ? recipients.map(formatRecipient)
    : formatRecipient(recipients);
};

/** Flag to toggle verbose logging in non-production environments. */
const isDevelopment = env.NODE_ENV !== 'production';

/**
 * Sends a transactional email via Resend while applying project-wide defaults.
 */
export const sendEmail = async (payload: ResendEmailPayload) => {
  const from = payload.from ?? env.RESEND_FROM_EMAIL;
  const to = normaliseRecipients(payload.to);
  const replyTo = normaliseRecipients(payload.replyTo ?? defaultReplyTo);
  const cc = normaliseRecipients(payload.cc);
  const bcc = normaliseRecipients(payload.bcc);

  if (!to) {
    throw new ResendEmailError(
      'Email payload requires at least one recipient.'
    );
  }

  if (isDevelopment) {
    logger.info('[resend] dispatching email', {
      subject: payload.subject,
      to,
      from,
      replyTo,
      cc,
      bcc,
      tags: payload.tags,
      scheduledAt: payload.scheduledAt,
    });
  }

  const response = await resend.emails.send({
    ...payload,
    from,
    to,
    replyTo,
    cc,
    bcc,
  });

  if (response.error) {
    logger.error('[resend] email send failed', {
      message: response.error.message,
      code: response.error.name,
    });
    throw new ResendEmailError('Failed to send email via Resend', {
      cause: response.error,
    });
  }

  if (!response.data) {
    throw new ResendEmailError('Resend response did not include an email id.');
  }

  if (isDevelopment) {
    logger.info('[resend] email dispatched', response.data);
  }

  // Log the email to the database
  await logSentEmail({
    emailId: response.data.id,
    recipient: Array.isArray(to) ? to.join(', ') : to,
    subject: payload.subject,
    templateType: payload.templateType || null,
    provider: 'resend',
    status: 'sent',
    sentAt: new Date(),
    metadata: {},
    deliveredAt: null,
    failedAt: null,
    errorMessage: null,
  });

  return response.data;
};
