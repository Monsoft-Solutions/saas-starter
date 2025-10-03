import React from 'react';
import { Section, Text } from '@react-email/components';

// Design system tokens replaced with direct values for email compatibility
import type { TeamInvitationEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

// Color palette for email (light theme)
const palette = {
  foreground: '#37352f',
  'muted-foreground': '#787066',
};

const paragraphStyle = {
  fontSize: '1rem', // 16px
  lineHeight: '1.625',
  color: palette.foreground,
  margin: '0 0 16px 0',
} as const;

const infoStyle = {
  ...paragraphStyle,
  color: palette['muted-foreground'],
} as const;

const listItemStyle = {
  ...paragraphStyle,
  margin: '0 0 8px 0',
} as const;

const ctaSectionStyle = {
  marginTop: '1.25rem', // 20px
  marginBottom: '1.5rem', // 24px
} as const;

const formatExpiry = (expiresAt?: string) => {
  if (!expiresAt) {
    return null;
  }
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    return expiresAt;
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

/**
 * React email component inviting a user to collaborate on a team.
 */
const TeamInvitationTemplate = ({
  recipientName,
  inviterName,
  teamName,
  inviteUrl,
  role,
  supportEmail,
  expiresAt,
}: TeamInvitationEmailProps) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const formattedExpiry = formatExpiry(expiresAt);

  return (
    <EmailLayout
      heading={`${inviterName} invited you to ${teamName}`}
      previewText={`Join ${teamName} on ${DEFAULT_BRAND_NAME} to start collaborating.`}
      supportEmail={supportEmail}
      signature={DEFAULT_BRAND_SIGNATURE}
    >
      <Section>
        <Text style={paragraphStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>
          {inviterName} has invited you to join <strong>{teamName}</strong> as a{' '}
          {role}. Accept below to get access to the team workspace.
        </Text>
      </Section>
      <Section>
        <Text style={listItemStyle}>Team: {teamName}</Text>
        <Text style={listItemStyle}>Role: {role}</Text>
        {formattedExpiry ? (
          <Text style={listItemStyle}>
            Invitation expires: {formattedExpiry}
          </Text>
        ) : null}
      </Section>
      <Section style={ctaSectionStyle}>
        <EmailCtaButton href={inviteUrl} label="Accept invitation" />
      </Section>
      <Section>
        <Text style={infoStyle}>
          Already have an account? Just sign in with the same email address and
          the invitation will be waiting for you.
        </Text>
      </Section>
    </EmailLayout>
  );
};

/**
 * Renders the team invitation template.
 */
export const renderTeamInvitationEmail = async (
  props: TeamInvitationEmailProps
): Promise<RenderedEmail> => renderEmail(<TeamInvitationTemplate {...props} />);
