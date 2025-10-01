/**
 * Email Dispatchers
 *
 * High-level email sending functions that handle transactional emails with
 * built-in idempotency, template rendering, and error handling. Each dispatcher
 * function corresponds to a specific email template and includes duplicate
 * prevention to avoid sending the same email multiple times.
 *
 * Features:
 * - Automatic idempotency checking to prevent duplicate sends
 * - Template rendering with proper data validation
 * - Support email fallback handling
 * - Comprehensive logging for debugging
 * - Type-safe email parameters
 */

import 'server-only';

import { env } from '@/lib/env';
import { sendEmail } from '@/lib/emails/resend.client';
import { resolveRecipientEmail } from '@/lib/emails/email-recipient.util';
import {
  markEmailAsSent,
  wasEmailSentRecently,
} from '@/lib/emails/email-idempotency.service';
import logger from '@/lib/logger/logger.service';

import {
  renderEmailChangeConfirmationEmail,
  renderPasswordChangedEmail,
  renderPasswordResetEmail,
  renderSubscriptionCreatedEmail,
  renderPaymentFailedEmail,
  renderTeamInvitationEmail,
  renderWelcomeSignupEmail,
  DEFAULT_BRAND_NAME,
} from '@/lib/emails/templates';
import type {
  EmailChangeConfirmationEmailProps,
  PasswordChangedEmailProps,
  PasswordResetEmailProps,
  SubscriptionCreatedEmailProps,
  PaymentFailedEmailProps,
  ResendRecipientList,
  TeamInvitationEmailProps,
  WelcomeSignupEmailProps,
} from '@/lib/types';

/**
 * Template tags for email categorization in Resend dashboard
 */
const TEMPLATE_TAGS = {
  welcome: 'welcome-signup',
  passwordReset: 'password-reset',
  passwordChanged: 'password-changed',
  emailChange: 'email-change-confirmation',
  teamInvitation: 'team-invitation',
  subscriptionCreated: 'subscription-created',
  paymentFailed: 'payment-failed',
} as const;

const supportEmailFallback = env.APP_SUPPORT_EMAIL ?? env.RESEND_REPLY_TO;

/**
 * Builds support email address with fallback to environment defaults
 */
const buildSupportEmail = (requested?: string) =>
  requested ?? supportEmailFallback;

/**
 * Creates Resend tags for email categorization and analytics
 */
const buildTags = (template: keyof typeof TEMPLATE_TAGS) => [
  { name: 'template', value: TEMPLATE_TAGS[template] },
];

/**
 * Ensures support email is always present in email props with fallback
 */
const ensureSupportEmail = <T extends { supportEmail?: string }>(
  props: T
): Omit<T, 'supportEmail'> & { supportEmail: string } => ({
  ...props,
  supportEmail: buildSupportEmail(props.supportEmail) || '',
});

type EmailTemplateName = keyof typeof TEMPLATE_TAGS;

/**
 * Checks if an email should be skipped due to recent duplicate sending
 * to prevent spam and ensure idempotency
 */
const shouldSkipEmailDispatch = async (
  template: EmailTemplateName,
  recipientEmail: string,
  context?: string,
  logContext: Record<string, unknown> = {}
): Promise<boolean> => {
  const alreadySent = await wasEmailSentRecently(
    template,
    recipientEmail,
    context
  );

  if (alreadySent) {
    logger.info('[email] Skipping duplicate email send', {
      template,
      recipient: recipientEmail,
      context,
      ...logContext,
    });
  }

  return alreadySent;
};

/**
 * Marks an email as sent in the idempotency cache to prevent duplicates
 */
const markEmailDispatched = async (
  template: EmailTemplateName,
  recipientEmail: string,
  context?: string
): Promise<void> => {
  await markEmailAsSent(template, recipientEmail, context);
};

export type WelcomeEmailParams = {
  to: ResendRecipientList;
} & Omit<WelcomeSignupEmailProps, 'supportEmail'> & {
    supportEmail?: string;
  };

/**
 * Sends the post sign-up welcome email with getting started guidance.
 */
export const sendWelcomeEmail = async ({
  to,
  supportEmail,
  ...props
}: WelcomeEmailParams) => {
  const recipientEmail = resolveRecipientEmail(to);

  if (
    await shouldSkipEmailDispatch('welcome', recipientEmail, undefined, {
      teamName: props.teamName,
    })
  ) {
    return;
  }

  const payload = ensureSupportEmail({ ...props, supportEmail });
  const rendered = await renderWelcomeSignupEmail(payload);
  const subject = props.teamName
    ? `Welcome to ${props.teamName}`
    : `Welcome to ${DEFAULT_BRAND_NAME}`;

  await sendEmail({
    to,
    subject,
    html: rendered.html,
    text: rendered.text,
    tags: buildTags('welcome'),
  });

  await markEmailDispatched('welcome', recipientEmail);
};

export type PasswordResetEmailParams = {
  to: ResendRecipientList;
} & Omit<PasswordResetEmailProps, 'supportEmail'> & {
    supportEmail?: string;
  };

/**
 * Sends a password reset email containing the time-limited recovery link.
 */
export const sendPasswordResetEmail = async ({
  to,
  supportEmail,
  ...props
}: PasswordResetEmailParams) => {
  const recipientEmail = resolveRecipientEmail(to);

  if (await shouldSkipEmailDispatch('passwordReset', recipientEmail)) {
    return;
  }

  const payload = ensureSupportEmail({ ...props, supportEmail });
  const rendered = await renderPasswordResetEmail(payload);

  await sendEmail({
    to,
    subject: 'Password reset instructions',
    html: rendered.html,
    text: rendered.text,
    tags: buildTags('passwordReset'),
  });

  await markEmailDispatched('passwordReset', recipientEmail);
};

export type PasswordChangedEmailParams = {
  to: ResendRecipientList;
} & Omit<PasswordChangedEmailProps, 'supportEmail'> & {
    supportEmail?: string;
  };

/**
 * Sends an audit notification confirming a password change.
 */
export const sendPasswordChangedEmail = async ({
  to,
  supportEmail,
  ...props
}: PasswordChangedEmailParams) => {
  const recipientEmail = resolveRecipientEmail(to);

  if (await shouldSkipEmailDispatch('passwordChanged', recipientEmail)) {
    return;
  }

  const payload = ensureSupportEmail({ ...props, supportEmail });
  const rendered = await renderPasswordChangedEmail(payload);

  await sendEmail({
    to,
    subject: 'Your password was updated',
    html: rendered.html,
    text: rendered.text,
    tags: buildTags('passwordChanged'),
  });

  await markEmailDispatched('passwordChanged', recipientEmail);
};

export type EmailChangeConfirmationEmailParams = {
  to: ResendRecipientList;
} & Omit<EmailChangeConfirmationEmailProps, 'supportEmail'> & {
    supportEmail?: string;
  };

/**
 * Sends an email change confirmation requiring the user to approve the switch.
 */
export const sendEmailChangeConfirmationEmail = async ({
  to,
  supportEmail,
  ...props
}: EmailChangeConfirmationEmailParams) => {
  const recipientEmail = resolveRecipientEmail(to);

  if (
    await shouldSkipEmailDispatch(
      'emailChange',
      recipientEmail,
      props.newEmail,
      { newEmail: props.newEmail }
    )
  ) {
    return;
  }

  const payload = ensureSupportEmail({ ...props, supportEmail });
  const rendered = await renderEmailChangeConfirmationEmail(payload);

  await sendEmail({
    to,
    subject: 'Confirm your email change',
    html: rendered.html,
    text: rendered.text,
    tags: buildTags('emailChange'),
  });

  await markEmailDispatched('emailChange', recipientEmail, props.newEmail);
};

export type TeamInvitationEmailParams = {
  to: ResendRecipientList;
} & Omit<TeamInvitationEmailProps, 'supportEmail'> & {
    supportEmail?: string;
  };

/**
 * Sends a collaborative team invitation with accept instructions.
 */
export const sendTeamInvitationEmail = async ({
  to,
  supportEmail,
  ...props
}: TeamInvitationEmailParams) => {
  const recipientEmail = resolveRecipientEmail(to);

  if (
    await shouldSkipEmailDispatch(
      'teamInvitation',
      recipientEmail,
      props.teamName,
      { teamName: props.teamName }
    )
  ) {
    return;
  }

  const payload = ensureSupportEmail({ ...props, supportEmail });
  const rendered = await renderTeamInvitationEmail(payload);
  const subject = `${props.inviterName} invited you to ${props.teamName}`;

  await sendEmail({
    to,
    subject,
    html: rendered.html,
    text: rendered.text,
    tags: buildTags('teamInvitation'),
  });

  await markEmailDispatched('teamInvitation', recipientEmail, props.teamName);
};

export type SubscriptionCreatedEmailParams = {
  to: ResendRecipientList;
} & Omit<SubscriptionCreatedEmailProps, 'supportEmail'> & {
    supportEmail?: string;
  };

/**
 * Sends a subscription confirmation email after a successful checkout.
 */
export const sendSubscriptionCreatedEmail = async ({
  to,
  supportEmail,
  ...props
}: SubscriptionCreatedEmailParams) => {
  const recipientEmail = resolveRecipientEmail(to);

  if (
    await shouldSkipEmailDispatch(
      'subscriptionCreated',
      recipientEmail,
      props.planName,
      { planName: props.planName }
    )
  ) {
    return;
  }

  const payload = ensureSupportEmail({ ...props, supportEmail });
  const rendered = await renderSubscriptionCreatedEmail(payload);
  const subject = `Your subscription to ${props.planName} is active`;

  await sendEmail({
    to,
    subject,
    html: rendered.html,
    text: rendered.text,
    tags: buildTags('subscriptionCreated'),
  });

  await markEmailDispatched(
    'subscriptionCreated',
    recipientEmail,
    props.planName
  );
};

export type PaymentFailedEmailParams = {
  to: ResendRecipientList;
} & Omit<PaymentFailedEmailProps, 'supportEmail'> & {
    supportEmail?: string;
  };

/**
 * Sends a payment failure notification with instructions to update payment details.
 */
export const sendPaymentFailedEmail = async ({
  to,
  supportEmail,
  ...props
}: PaymentFailedEmailParams) => {
  const recipientEmail = resolveRecipientEmail(to);

  if (await shouldSkipEmailDispatch('paymentFailed', recipientEmail)) {
    return;
  }

  const payload = ensureSupportEmail({ ...props, supportEmail });
  const rendered = await renderPaymentFailedEmail(payload);
  const subject = 'Your recent payment failed';

  await sendEmail({
    to,
    subject,
    html: rendered.html,
    text: rendered.text,
    tags: buildTags('paymentFailed'),
  });

  await markEmailDispatched('paymentFailed', recipientEmail);
};
