import React from 'react';
import { Section, Text } from '@react-email/components';

import { colors, spacing, typography } from '@/lib/design-system';

import { DEFAULT_BRAND_NAME } from '../constants';

const palette = colors.light;

const containerStyle = {
  borderBottom: `1px solid ${palette.border}`,
  paddingBottom: spacing[4],
} as const;

const brandStyle = {
  color: palette.primary,
  fontSize: typography.fontSizes.lg,
  fontWeight: typography.fontWeights.semibold,
  letterSpacing: typography.letterSpacing.tight,
  margin: '0 0 8px 0',
} as const;

const headingStyle = {
  margin: '0',
  fontSize: typography.fontSizes['2xl'],
  fontWeight: typography.fontWeights.bold,
  lineHeight: typography.lineHeights.relaxed,
  color: palette.foreground,
} as const;

export type EmailHeaderProps = {
  heading: string;
  brandName?: string;
};

/**
 * Renders the consistent header present at the top of transactional emails.
 */
export const EmailHeader = ({
  heading,
  brandName = DEFAULT_BRAND_NAME,
}: EmailHeaderProps) => (
  <Section style={containerStyle}>
    <Text style={brandStyle}>{brandName}</Text>
    <Text style={headingStyle}>{heading}</Text>
  </Section>
);
