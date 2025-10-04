import React from 'react';
import { Section, Text } from '@react-email/components';

import type { EmailChangeConfirmationEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

/**
 * React email component guiding users through email change confirmation.
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
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
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          {greeting}
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          We just need a quick confirmation to finish updating your sign-in
          email address.
        </Text>
      </Section>
      <Section>
        <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-2">
          Current email: {oldEmail ?? 'Not provided'}
        </Text>
        <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-2">
          New email: {newEmail}
        </Text>
      </Section>
      <Section className="mt-5 mb-6">
        <EmailCtaButton href={confirmationUrl} label="Confirm email change" />
      </Section>
      <Section>
        <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-4">
          If you didn't request this update, we recommend resetting your
          password and keeping your existing email address on file.
        </Text>
        <Text className="text-base leading-relaxed text-warning m-0 mb-4">
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
