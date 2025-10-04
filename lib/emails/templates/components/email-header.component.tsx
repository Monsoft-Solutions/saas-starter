import React from 'react';
import { Section, Text } from '@react-email/components';

import { DEFAULT_BRAND_NAME } from '../constants';

export type EmailHeaderProps = {
  heading: string;
  brandName?: string;
};

/**
 * Renders the consistent header present at the top of transactional emails.
 * Uses Tailwind classes that are automatically inlined by the Tailwind component.
 */
export const EmailHeader = ({
  heading,
  brandName = DEFAULT_BRAND_NAME,
}: EmailHeaderProps) => (
  <Section className="border-b border-border pb-4">
    <Text className="text-primary text-lg font-semibold tracking-tight m-0 mb-2">
      {brandName}
    </Text>
    <Text className="text-2xl font-bold leading-relaxed text-foreground m-0">
      {heading}
    </Text>
  </Section>
);
