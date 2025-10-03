import React from 'react';
import { Section, Text } from '@react-email/components';

// Design system tokens replaced with direct values for email compatibility
import type { PaymentFailedEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

// Color palette for email (light theme)
const palette = {
  foreground: '#37352f',
};

const paragraphStyle = {
  fontSize: '1rem', // 16px
  lineHeight: '1.625',
  color: palette.foreground,
  margin: '0 0 16px 0',
} as const;

const ctaSectionStyle = {
  marginTop: '1.5rem', // 24px
} as const;

const closingStyle = {
  ...paragraphStyle,
  marginTop: '1.5rem', // 24px
} as const;

const signatureStyle = {
  ...paragraphStyle,
  marginTop: '0.5rem', // 8px
} as const;

/**
 * React email component used to render the payment failed template.
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
        <Text style={paragraphStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>
          We were unable to process your recent payment of{' '}
          <strong>{amountDue}</strong>. Please update your payment method to
          keep your account in good standing and avoid any interruption in
          service.
        </Text>
      </Section>
      <Section style={ctaSectionStyle}>
        <EmailCtaButton
          href={paymentDetailsUrl}
          label="Update payment details"
        />
      </Section>
      <Section style={closingStyle}>
        <Text style={paragraphStyle}>
          If you have any questions or need assistance, please contact our
          support team.
        </Text>
        <Text style={signatureStyle}>{DEFAULT_BRAND_SIGNATURE}</Text>
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
