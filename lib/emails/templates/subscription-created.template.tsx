import React from 'react';
import { Section, Text } from '@react-email/components';

// Design system tokens replaced with direct values for email compatibility
import type { SubscriptionCreatedEmailProps } from '@/lib/types';

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
 * React email component used to render the subscription created template.
 */
const SubscriptionCreatedTemplate = ({
  recipientName,
  planName,
  amount,
  dashboardUrl,
  supportEmail,
}: SubscriptionCreatedEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const previewText = `Your subscription to the ${planName} plan is now active.`;

  return (
    <EmailLayout
      heading="Subscription Confirmation"
      previewText={previewText}
      supportEmail={supportEmail}
      signature={DEFAULT_BRAND_SIGNATURE}
    >
      <Section>
        <Text style={paragraphStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>
          Thank you for subscribing to the {planName} plan for{' '}
          <strong>{amount}</strong>. Your subscription is now active, and you
          have full access to all features included in your plan.
        </Text>
      </Section>
      <Section style={ctaSectionStyle}>
        <EmailCtaButton href={dashboardUrl} label="Go to your dashboard" />
      </Section>
      <Section style={closingStyle}>
        <Text style={paragraphStyle}>
          We're excited to have you on board. If you have any questions, please
          don't hesitate to contact our support team.
        </Text>
        <Text style={signatureStyle}>{DEFAULT_BRAND_SIGNATURE}</Text>
      </Section>
    </EmailLayout>
  );
};

/**
 * Renders the subscription created email to HTML and plaintext.
 */
export const renderSubscriptionCreatedEmail = async (
  props: SubscriptionCreatedEmailProps
): Promise<RenderedEmail> =>
  renderEmail(<SubscriptionCreatedTemplate {...props} />);
