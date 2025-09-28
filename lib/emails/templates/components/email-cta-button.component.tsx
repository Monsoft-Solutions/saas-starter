import React from 'react';
import { Button } from '@react-email/components';

import { colors, notionRadius, spacing, typography } from '@/lib/design-system';

const palette = colors.light;

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: palette.primary,
  color: palette['primary-foreground'],
  padding: `${spacing[3]} ${spacing[6]}`,
  borderRadius: notionRadius.button,
  textDecoration: 'none',
  fontWeight: typography.fontWeights.semibold,
  fontSize: typography.fontSizes.base,
} as const;

export type EmailCtaButtonProps = {
  href: string;
  label: string;
};

/**
 * Consistent call-to-action button styled for email clients.
 */
export const EmailCtaButton = ({ href, label }: EmailCtaButtonProps) => (
  <Button href={href} style={buttonStyle}>
    {label}
  </Button>
);
