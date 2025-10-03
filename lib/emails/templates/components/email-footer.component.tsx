import React from 'react';
import { Section, Text } from '@react-email/components';

const containerStyle = {
  borderTop: '1px solid var(--color-border)',
  paddingTop: '16px', // 16px (spacing[4] equivalent)
} as const;

const supportStyle = {
  margin: '0',
  fontSize: '14px', // small font size
  color: 'var(--color-muted-foreground)',
  lineHeight: '1.6', // relaxed line height
} as const;

const signatureStyle = {
  margin: '12px 0 0 0',
  fontSize: '16px', // base font size
  fontWeight: '500', // medium font weight
  color: 'var(--color-foreground)',
} as const;

export type EmailFooterProps = {
  supportEmail?: string;
  signature: string;
};

/**
 * Footer that gently points recipients toward support if they need help.
 */
export const EmailFooter = ({ supportEmail, signature }: EmailFooterProps) => (
  <Section style={containerStyle}>
    <Text style={signatureStyle}>{signature}</Text>
    {supportEmail ? (
      <Text style={supportStyle}>
        Need a hand? Reach us at{' '}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </Text>
    ) : null}
  </Section>
);
