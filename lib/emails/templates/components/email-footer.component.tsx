import React from 'react';
import { Section, Text } from '@react-email/components';

import { colors, spacing, typography } from '@/lib/design-system';

const palette = colors.light;

const containerStyle = {
  borderTop: `1px solid ${palette.border}`,
  paddingTop: spacing[4],
} as const;

const supportStyle = {
  margin: '0',
  fontSize: typography.fontSizes.sm,
  color: palette['muted-foreground'],
  lineHeight: typography.lineHeights.relaxed,
} as const;

const signatureStyle = {
  margin: '12px 0 0 0',
  fontSize: typography.fontSizes.base,
  fontWeight: typography.fontWeights.medium,
  color: palette.foreground,
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
