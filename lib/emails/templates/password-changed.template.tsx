import React from 'react';
import { Section, Text } from '@react-email/components';

// Design system tokens replaced with direct values for email compatibility
import type { PasswordChangedEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
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

const subtleStyle = {
  ...paragraphStyle,
  color: palette['muted-foreground'],
} as const;

const warningStyle = {
  ...paragraphStyle,
  color: palette.warning,
} as const;

const metadataListStyle = {
  ...subtleStyle,
  margin: '0 0 4px 0',
} as const;

const formatChangedAt = (changedAt: string) => {
  const parsed = new Date(changedAt);
  if (Number.isNaN(parsed.getTime())) {
    return changedAt;
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

/**
 * React email component confirming a successful password update.
 */
const PasswordChangedTemplate = ({
  recipientName,
  changedAt,
  ipAddress,
  supportEmail,
}: PasswordChangedEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const formattedChangedAt = formatChangedAt(changedAt);

  return (
    <EmailLayout
      heading={`Your ${DEFAULT_BRAND_NAME} password was updated`}
      previewText="This is a confirmation that your password has changed."
      supportEmail={supportEmail}
      signature={DEFAULT_BRAND_SIGNATURE}
    >
      <Section>
        <Text style={paragraphStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>
          This is a quick note to confirm your password was successfully
          changed. No further action is needed if this was you.
        </Text>
      </Section>
      <Section>
        <Text style={metadataListStyle}>
          • Changed at: {formattedChangedAt}
        </Text>
        {ipAddress ? (
          <Text style={metadataListStyle}>• From IP: {ipAddress}</Text>
        ) : null}
      </Section>
      <Section>
        <Text style={warningStyle}>
          Didn’t make this change? Reset your password immediately and reach out
          so we can secure your account.
        </Text>
        <Text style={subtleStyle}>
          For your records, keep this email as part of your account audit trail.
        </Text>
      </Section>
    </EmailLayout>
  );
};

/**
 * Renders the password changed confirmation template.
 */
export const renderPasswordChangedEmail = async (
  props: PasswordChangedEmailProps
): Promise<RenderedEmail> =>
  renderEmail(<PasswordChangedTemplate {...props} />);
