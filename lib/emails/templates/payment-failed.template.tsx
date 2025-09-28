import React from 'react';
import { Section, Text } from '@react-email/components';

import { colors, spacing, typography } from '@/lib/design-system';
import type { PaymentFailedEmailProps } from '@/lib/types';

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

const ctaSectionStyle = {
  marginTop: spacing[6],
} as const;

const closingStyle = {
  ...paragraphStyle,
  marginTop: spacing[6],
} as const;

const signatureStyle = {
  ...paragraphStyle,
  marginTop: spacing[2],
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
