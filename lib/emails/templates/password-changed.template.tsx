import React from 'react';
import { Section, Text } from '@react-email/components';

import type { PasswordChangedEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

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
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
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
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          {greeting}
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          This is a quick note to confirm your password was successfully
          changed. No further action is needed if this was you.
        </Text>
      </Section>
      <Section>
        <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-1">
          • Changed at: {formattedChangedAt}
        </Text>
        {ipAddress ? (
          <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-1">
            • From IP: {ipAddress}
          </Text>
        ) : null}
      </Section>
      <Section>
        <Text className="text-base leading-relaxed text-warning m-0 mb-4">
          Didn't make this change? Reset your password immediately and reach out
          so we can secure your account.
        </Text>
        <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-4">
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
