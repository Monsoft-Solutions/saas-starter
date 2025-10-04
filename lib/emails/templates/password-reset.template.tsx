import React from 'react';
import { Section, Text } from '@react-email/components';

import type { PasswordResetEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

/**
 * React email component used to render password reset instructions.
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
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
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          {greeting}
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          We received a request to reset your password. Use the secure link
          below to choose a new one.
        </Text>
      </Section>
      <Section className="mt-5 mb-6">
        <EmailCtaButton href={resetUrl} label="Reset password" />
      </Section>
      <Section>
        <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-4">
          For security reasons, this link expires {expiryCopy}. If the link
          stops working, you can always request a new one from the sign-in page.
        </Text>
        <Text className="text-base leading-relaxed text-warning m-0 mb-4">
          Didn't try to reset your password? Secure your account right away or
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
