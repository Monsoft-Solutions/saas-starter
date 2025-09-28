import React from 'react';
import { Section, Text } from '@react-email/components';

import { colors, spacing, typography } from '@/lib/design-system';
import type { WelcomeSignupEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
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

const secondaryParagraphStyle = {
  ...paragraphStyle,
  color: palette['muted-foreground'],
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
 * React email component used to render the welcome sign-up template.
 */
const WelcomeSignupTemplate = ({
  recipientName,
  dashboardUrl,
  supportEmail,
  teamName,
}: WelcomeSignupEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const previewText = teamName
    ? `You're now part of ${teamName}. Let’s get you started.`
    : 'Your new account is ready. Let’s get you started.';

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
        <Text style={paragraphStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>
          Thanks for joining {teamName ?? DEFAULT_BRAND_NAME}! Your workspace is
          ready and waiting. Jump back in any time to pick up where you left
          off.
        </Text>
        <Text style={secondaryParagraphStyle}>
          Explore the dashboard, invite teammates, and connect integrations to
          unlock the full power of the platform.
        </Text>
      </Section>
      <Section style={ctaSectionStyle}>
        <EmailCtaButton href={dashboardUrl} label="Open your dashboard" />
      </Section>
      <Section style={closingStyle}>
        <Text style={paragraphStyle}>We can’t wait to see what you build.</Text>
        <Text style={signatureStyle}>{DEFAULT_BRAND_SIGNATURE}</Text>
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
