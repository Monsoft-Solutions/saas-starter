import React from 'react';
import { Section, Text } from '@react-email/components';

import type { PaymentFailedEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

/**
 * React email component used to render the payment failed template.
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
 */
const PaymentFailedTemplate = ({
  recipientName,
  amountDue,
  paymentDetailsUrl,
  supportEmail,
}: PaymentFailedEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const previewText = `We were unable to process your recent payment of ${amountDue}.`;

  return (
    <EmailLayout
      heading="Payment Failed"
      previewText={previewText}
      supportEmail={supportEmail}
      signature={DEFAULT_BRAND_SIGNATURE}
    >
      <Section>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          {greeting}
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          We were unable to process your recent payment of{' '}
          <strong>{amountDue}</strong>. Please update your payment method to
          keep your account in good standing and avoid any interruption in
          service.
        </Text>
      </Section>
      <Section className="mt-6">
        <EmailCtaButton
          href={paymentDetailsUrl}
          label="Update payment details"
        />
      </Section>
      <Section className="mt-6">
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          If you have any questions or need assistance, please contact our
          support team.
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mt-2">
          {DEFAULT_BRAND_SIGNATURE}
        </Text>
      </Section>
    </EmailLayout>
  );
};

/**
 * Renders the payment failed email to HTML and plaintext.
 */
export const renderPaymentFailedEmail = async (
  props: PaymentFailedEmailProps
): Promise<RenderedEmail> => renderEmail(<PaymentFailedTemplate {...props} />);
