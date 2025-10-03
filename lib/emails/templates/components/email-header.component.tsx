import React from 'react';
import { Section, Text } from '@react-email/components';

import { DEFAULT_BRAND_NAME } from '../constants';

const containerStyle = {
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: '16px', // 16px (spacing[4] equivalent)
} as const;

const brandStyle = {
  color: 'var(--color-primary)',
  fontSize: '18px', // lg font size
  fontWeight: '600', // semibold
  letterSpacing: '-0.025em', // tight letter spacing
  margin: '0 0 8px 0',
} as const;

const headingStyle = {
  margin: '0',
  fontSize: '24px', // 2xl font size
  fontWeight: '700', // bold
  lineHeight: '1.6', // relaxed line height
  color: 'var(--color-foreground)',
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
