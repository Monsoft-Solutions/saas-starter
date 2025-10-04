import React from 'react';
import { Section, Text } from '@react-email/components';

export type EmailFooterProps = {
  supportEmail?: string;
  signature: string;
};

/**
 * Footer that gently points recipients toward support if they need help.
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
 */
export const EmailFooter = ({ supportEmail, signature }: EmailFooterProps) => (
  <Section className="border-t border-border pt-4">
    <Text className="text-base font-medium text-foreground mt-3 mb-0">
      {signature}
    </Text>
    {supportEmail ? (
      <Text className="text-sm text-muted-foreground leading-relaxed m-0">
        Need a hand? Reach us at{' '}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </Text>
    ) : null}
  </Section>
);
