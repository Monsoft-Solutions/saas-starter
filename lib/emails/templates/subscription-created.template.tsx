import React from 'react';
import { Section, Text } from '@react-email/components';

import type { SubscriptionCreatedEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

/**
 * React email component used to render the subscription created template.
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
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
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          {greeting}
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          Thank you for subscribing to the {planName} plan for{' '}
          <strong>{amount}</strong>. Your subscription is now active, and you
          have full access to all features included in your plan.
        </Text>
      </Section>
      <Section className="mt-6">
        <EmailCtaButton href={dashboardUrl} label="Go to your dashboard" />
      </Section>
      <Section className="mt-6">
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          We're excited to have you on board. If you have any questions, please
          don't hesitate to contact our support team.
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mt-2">
          {DEFAULT_BRAND_SIGNATURE}
        </Text>
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
