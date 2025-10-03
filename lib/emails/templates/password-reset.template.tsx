import React from 'react';
import { Section, Text } from '@react-email/components';

// Design system tokens replaced with direct values for email compatibility
import type { PasswordResetEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

// Color palette for email (light theme)
const palette = {
  foreground: '#37352f',
  'muted-foreground': '#787066',
  warning: '#cb6040',
};

const paragraphStyle = {
  fontSize: '1rem', // 16px
  lineHeight: '1.625',
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
  marginTop: '1.25rem', // 20px
  marginBottom: '1.5rem', // 24px
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
