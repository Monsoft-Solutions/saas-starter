import React from 'react';
import { Button } from '@react-email/components';

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-primary-foreground)',
  padding: '12px 24px', // 12px top/bottom, 24px left/right
  borderRadius: '6px', // 6px (notionRadius.button equivalent)
  textDecoration: 'none',
  fontWeight: '600', // semibold
  fontSize: '16px', // base font size
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
