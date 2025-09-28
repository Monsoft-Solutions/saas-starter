import React from 'react';
import { Section, Text } from '@react-email/components';

import { colors, spacing, typography } from '@/lib/design-system';
import type { EmailChangeConfirmationEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_SIGNATURE } from './constants';
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

const infoStyle = {
  ...paragraphStyle,
  color: palette['muted-foreground'],
} as const;

const warningStyle = {
  ...paragraphStyle,
  color: palette.warning,
} as const;

const listItemStyle = {
  ...infoStyle,
  margin: '0 0 8px 0',
} as const;

const ctaSectionStyle = {
  marginTop: spacing[5],
  marginBottom: spacing[6],
} as const;

/**
 * React email component guiding users through email change confirmation.
 */
const EmailChangeConfirmationTemplate = ({
  recipientName,
  confirmationUrl,
  newEmail,
  oldEmail,
  supportEmail,
}: EmailChangeConfirmationEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';

  return (
    <EmailLayout
      heading="Confirm your email update"
      previewText="Approve the change to finish updating your sign-in email."
      supportEmail={supportEmail}
      signature={DEFAULT_BRAND_SIGNATURE}
    >
      <Section>
        <Text style={paragraphStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>
          We just need a quick confirmation to finish updating your sign-in
          email address.
        </Text>
      </Section>
      <Section>
        <Text style={listItemStyle}>
          Current email: {oldEmail ?? 'Not provided'}
        </Text>
        <Text style={listItemStyle}>New email: {newEmail}</Text>
      </Section>
      <Section style={ctaSectionStyle}>
        <EmailCtaButton href={confirmationUrl} label="Confirm email change" />
      </Section>
      <Section>
        <Text style={infoStyle}>
          If you didn’t request this update, we recommend resetting your
          password and keeping your existing email address on file.
        </Text>
        <Text style={warningStyle}>
          The change will not take effect until you confirm. Ignore this message
          if you prefer to keep your current details.
        </Text>
      </Section>
    </EmailLayout>
  );
};

/**
 * Renders the email change confirmation template.
 */
export const renderEmailChangeConfirmationEmail = async (
  props: EmailChangeConfirmationEmailProps
): Promise<RenderedEmail> =>
  renderEmail(<EmailChangeConfirmationTemplate {...props} />);
