import React from 'react';
import { Section, Text } from '@react-email/components';

import type { TeamInvitationEmailProps } from '@/lib/types';

import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_SIGNATURE } from './constants';
import { EmailCtaButton } from './components/email-cta-button.component';
import { EmailLayout } from './components/email-layout.component';
import { renderEmail, type RenderedEmail } from './render-email';

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
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
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
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          {greeting}
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-4">
          {inviterName} has invited you to join <strong>{teamName}</strong> as a{' '}
          {role}. Accept below to get access to the team workspace.
        </Text>
      </Section>
      <Section>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-2">
          Team: {teamName}
        </Text>
        <Text className="text-base leading-relaxed text-foreground m-0 mb-2">
          Role: {role}
        </Text>
        {formattedExpiry ? (
          <Text className="text-base leading-relaxed text-foreground m-0 mb-2">
            Invitation expires: {formattedExpiry}
          </Text>
        ) : null}
      </Section>
      <Section className="mt-5 mb-6">
        <EmailCtaButton href={inviteUrl} label="Accept invitation" />
      </Section>
      <Section>
        <Text className="text-base leading-relaxed text-muted-foreground m-0 mb-4">
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
