import React from 'react';
import { Button } from '@react-email/components';

export type EmailCtaButtonProps = {
  href: string;
  label: string;
};

/**
 * Consistent call-to-action button styled for email clients.
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
 */
export const EmailCtaButton = ({ href, label }: EmailCtaButtonProps) => (
  <Button
    href={href}
    className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md no-underline font-semibold text-base"
  >
    {label}
  </Button>
);
