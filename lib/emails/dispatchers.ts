import 'server-only';

import { env } from '@/lib/env';
import { sendEmail } from '@/lib/emails/resend.client';
import logger from '@/lib/logger/logger.service';
import { cacheService } from '@/lib/cache/cache.service';
import { CacheKeys } from '@/lib/cache/cache-keys.util';

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

const CACHE_TTL = 5 * 60; // 5 minutes in seconds

/**
 * Check if email was recently sent to prevent duplicates
 */
const checkEmailCache = async (
  template: string,
  to: string,
  extraData?: string
): Promise<boolean> => {
  const key = CacheKeys.email(template, to, extraData);
  return await cacheService.has(key);
};

/**
 * Mark email as sent in cache
 */
const markEmailSent = async (
  template: string,
  to: string,
  extraData?: string,
  ttl?: number
): Promise<void> => {
  const key = CacheKeys.email(template, to, extraData);
  await cacheService.set(key, Date.now(), { ttl: ttl ?? CACHE_TTL });
};

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

const buildSupportEmail = (requested?: string) =>
  requested ?? supportEmailFallback;

const buildTags = (template: keyof typeof TEMPLATE_TAGS) => [
  { name: 'template', value: TEMPLATE_TAGS[template] },
];

const ensureSupportEmail = <T extends { supportEmail?: string }>(
  props: T
): Omit<T, 'supportEmail'> & { supportEmail: string } => ({
  ...props,
  supportEmail: buildSupportEmail(props.supportEmail) || '',
});

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
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  if (typeof recipientEmail === 'string') {
    if (await checkEmailCache('welcome', recipientEmail)) {
      logger.info('[email] Skipping duplicate welcome email', {
        recipient: recipientEmail,
      });
      return;
    }
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

  if (typeof recipientEmail === 'string') {
    await markEmailSent('welcome', recipientEmail);
  }
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
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  if (typeof recipientEmail === 'string') {
    if (await checkEmailCache('passwordReset', recipientEmail)) {
      logger.info('[email] Skipping duplicate password reset email', {
        recipient: recipientEmail,
      });
      return;
    }
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

  if (typeof recipientEmail === 'string') {
    await markEmailSent('passwordReset', recipientEmail, undefined, 60); // 2 minutes
  }
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
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  if (typeof recipientEmail === 'string') {
    if (await checkEmailCache('passwordChanged', recipientEmail)) {
      logger.info('[email] Skipping duplicate password changed email', {
        recipient: recipientEmail,
      });
      return;
    }
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

  if (typeof recipientEmail === 'string') {
    await markEmailSent('passwordChanged', recipientEmail);
  }
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
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  if (typeof recipientEmail === 'string') {
    if (await checkEmailCache('emailChange', recipientEmail, props.newEmail)) {
      logger.info('[email] Skipping duplicate email change confirmation', {
        recipient: recipientEmail,
      });
      return;
    }
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

  if (typeof recipientEmail === 'string') {
    await markEmailSent('emailChange', recipientEmail, props.newEmail);
  }
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
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  if (typeof recipientEmail === 'string') {
    if (
      await checkEmailCache('teamInvitation', recipientEmail, props.teamName)
    ) {
      logger.info('[email] Skipping duplicate team invitation', {
        recipient: recipientEmail,
      });
      return;
    }
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

  if (typeof recipientEmail === 'string') {
    await markEmailSent('teamInvitation', recipientEmail, props.teamName);
  }
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
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  if (typeof recipientEmail === 'string') {
    if (
      await checkEmailCache(
        'subscriptionCreated',
        recipientEmail,
        props.planName
      )
    ) {
      logger.info('[email] Skipping duplicate subscription created email', {
        recipient: recipientEmail,
      });
      return;
    }
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

  if (typeof recipientEmail === 'string') {
    await markEmailSent('subscriptionCreated', recipientEmail, props.planName);
  }
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
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  if (typeof recipientEmail === 'string') {
    if (await checkEmailCache('paymentFailed', recipientEmail)) {
      logger.info('[email] Skipping duplicate payment failed email', {
        recipient: recipientEmail,
      });
      return;
    }
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

  if (typeof recipientEmail === 'string') {
    await markEmailSent('paymentFailed', recipientEmail);
  }
};
