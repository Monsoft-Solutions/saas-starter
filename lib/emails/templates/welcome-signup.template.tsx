import React from 'react';
import { Section, Text } from '@react-email/components';

import type { WelcomeSignupEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

/**
 * React email component used to render the welcome sign-up template.
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
 */
const WelcomeSignupTemplate = ({
  recipientName,
  dashboardUrl,
  supportEmail,
  teamName,
}: WelcomeSignupEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const previewText = teamName
    ? `You're now part of ${teamName}. Let's get you started.`
    : `Your new account is ready. Let's get you started.`;

  return (
    <EmailLayout
      heading={
        teamName ? `Welcome to ${teamName}` : `Welcome to ${DEFAULT_BRAND_NAME}`
      }
      previewText={previewText}
      supportEmail={supportEmail}
      signature={DEFAULT_BRAND_SIGNATURE}
    >
      <Section>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          {greeting}
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          Thanks for joining {teamName ?? DEFAULT_BRAND_NAME}! Your workspace is
          ready and waiting. Jump back in any time to pick up where you left
          off.
        </Text>
        <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-4">
          Explore the dashboard, invite teammates, and connect integrations to
          unlock the full power of the platform.
        </Text>
      </Section>
      <Section className="mt-6">
        <EmailCtaButton href={dashboardUrl} label="Open your dashboard" />
      </Section>
      <Section className="mt-6">
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          We can't wait to see what you build.
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mt-2">
          {DEFAULT_BRAND_SIGNATURE}
        </Text>
      </Section>
    </EmailLayout>
  );
};

/**
 * Renders the welcome sign-up email to HTML and plaintext.
 */
export const renderWelcomeSignupEmail = async (
  props: WelcomeSignupEmailProps
): Promise<RenderedEmail> => renderEmail(<WelcomeSignupTemplate {...props} />);
