import React from 'react';
import { Section, Text } from '@react-email/components';

import { colors, spacing, typography } from '@/lib/design-system';
import type { PasswordResetEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

const palette = colors.light;

const paragraphStyle = {
  fontSize: typography.fontSizes.base,
  lineHeight: typography.lineHeights.relaxed,
  color: palette.foreground,
  margin: '0 0 16px 0',
} as const;

const warningStyle = {
  ...paragraphStyle,
  color: palette.warning,
} as const;

const infoStyle = {
  ...paragraphStyle,
  color: palette['muted-foreground'],
} as const;

const ctaSectionStyle = {
  marginTop: spacing[5],
  marginBottom: spacing[6],
} as const;

/**
 * React email component used to render password reset instructions.
 */
const PasswordResetTemplate = ({
  recipientName,
  resetUrl,
  expiresInMinutes,
  supportEmail,
}: PasswordResetEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const expiryCopy =
    expiresInMinutes === 1
      ? 'in the next minute'
      : `within the next ${expiresInMinutes} minutes`;

  return (
    <EmailLayout
      heading={`Reset your ${DEFAULT_BRAND_NAME} password`}
      previewText={`Use this link to reset your password ${expiryCopy}.`}
      supportEmail={supportEmail}
      signature={DEFAULT_BRAND_SIGNATURE}
    >
      <Section>
        <Text style={paragraphStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>
          We received a request to reset your password. Use the secure link
          below to choose a new one.
        </Text>
      </Section>
      <Section style={ctaSectionStyle}>
        <EmailCtaButton href={resetUrl} label="Reset password" />
      </Section>
      <Section>
        <Text style={infoStyle}>
          For security reasons, this link expires {expiryCopy}. If the link
          stops working, you can always request a new one from the sign-in page.
        </Text>
        <Text style={warningStyle}>
          Didn’t try to reset your password? Secure your account right away or
          let our team know.
        </Text>
      </Section>
    </EmailLayout>
  );
};

/**
 * Renders the password reset email to HTML and plaintext.
 */
export const renderPasswordResetEmail = async (
  props: PasswordResetEmailProps
): Promise<RenderedEmail> => renderEmail(<PasswordResetTemplate {...props} />);
